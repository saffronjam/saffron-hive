package graph

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestMutationSetTargetState(t *testing.T) {
	env := newTestEnv(t)
	now := time.Now().Truncate(time.Second)

	env.stateReader.addDevice(device.Device{ID: "d1", FriendlyName: "Light 1", Source: device.SourceZigbee2MQTT, Type: device.Light, Available: true, LastSeen: now})
	env.stateReader.setDeviceState("d1", &device.DeviceState{On: device.Ptr(false), Brightness: device.Ptr(0)})

	ch := env.bus.Subscribe(eventbus.EventCommandRequested)
	defer env.bus.Unsubscribe(ch)

	resp := env.query(t, `mutation { setTargetState(targetType: DEVICE, targetId: "d1", state: {brightness: 200}) }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	select {
	case evt := <-ch:
		if evt.Type != eventbus.EventCommandRequested {
			t.Fatalf("expected EventCommandRequested, got %s", evt.Type)
		}
		cmd, ok := evt.Payload.(device.Command)
		if !ok {
			t.Fatalf("payload is not Command: %T", evt.Payload)
		}
		if cmd.Brightness == nil || *cmd.Brightness != 200 {
			t.Errorf("expected brightness 200, got %v", cmd.Brightness)
		}
		if cmd.Origin.Kind != device.OriginKindUser {
			t.Errorf("expected user origin, got %+v", cmd.Origin)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for event")
	}
}

func TestMutationSetTargetStateRejectsHub(t *testing.T) {
	env := newTestEnv(t)
	env.stateReader.addDevice(device.Device{ID: "coord", FriendlyName: "Coordinator", Source: device.SourceZigbee2MQTT, Type: device.Hub, Available: true})

	resp := env.query(t, `mutation { setTargetState(targetType: DEVICE, targetId: "coord", state: {on: true}) }`, nil)
	if len(resp.Errors) == 0 {
		t.Fatal("commanding a hub must fail")
	}
	if !strings.Contains(resp.Errors[0].Message, "hub") {
		t.Fatalf("error should name the hub restriction, got %q", resp.Errors[0].Message)
	}
}

func TestMutationUpdateDeviceUsesStoreMetadata(t *testing.T) {
	env := newTestEnv(t)
	now := time.Now().Truncate(time.Second)
	env.stateReader.addDevice(device.Device{
		ID:           "ac",
		FriendlyName: "Cloud Name",
		Source:       "tuya",
		Type:         device.Plug,
		Capabilities: []device.Capability{{Name: device.CapOnOff, Access: 3}},
		Available:    true,
		LastSeen:     now,
	})
	env.store.putDevice(device.Device{
		ID:           "ac",
		FriendlyName: "Mobile Air Conditioner",
		Source:       "tuya",
		Type:         device.Plug,
		Capabilities: []device.Capability{{Name: device.CapOnOff, Access: 3}},
		Available:    true,
		LastSeen:     now,
	})

	resp := env.query(t, `mutation($id: ID!, $input: UpdateDeviceInput!) {
		updateDevice(id: $id, input: $input) { id name roles { controlledLoad contact } }
	}`, map[string]any{
		"id":    "ac",
		"input": map[string]any{"name": "AC", "roles": map[string]any{"controlledLoad": "LIGHT"}},
	})
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}
	var data struct {
		UpdateDevice struct {
			ID    string `json:"id"`
			Name  string `json:"name"`
			Roles struct {
				ControlledLoad string  `json:"controlledLoad"`
				Contact        *string `json:"contact"`
			} `json:"roles"`
		} `json:"updateDevice"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if data.UpdateDevice.Name != "AC" {
		t.Fatalf("got mutation name %q, want AC", data.UpdateDevice.Name)
	}
	if data.UpdateDevice.Roles.ControlledLoad != "LIGHT" || data.UpdateDevice.Roles.Contact != nil {
		t.Fatalf("got mutation roles %#v, want LIGHT controlled load", data.UpdateDevice.Roles)
	}

	resp = env.query(t, `query { devices { id name roles { controlledLoad contact } } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}
	var listData struct {
		Devices []struct {
			ID    string `json:"id"`
			Name  string `json:"name"`
			Roles struct {
				ControlledLoad string `json:"controlledLoad"`
			} `json:"roles"`
		} `json:"devices"`
	}
	if err := json.Unmarshal(resp.Data, &listData); err != nil {
		t.Fatalf("unmarshal list: %v", err)
	}
	if len(listData.Devices) != 1 || listData.Devices[0].Name != "AC" {
		t.Fatalf("got devices %#v, want AC", listData.Devices)
	}
	if listData.Devices[0].Roles.ControlledLoad != "LIGHT" {
		t.Fatalf("got devices %#v, want LIGHT controlled load role", listData.Devices)
	}
}

func TestMutationUpdateDeviceRejectsInapplicableRole(t *testing.T) {
	env := newTestEnv(t)
	d := device.Device{ID: "ac", FriendlyName: "AC", Type: device.Climate}
	env.stateReader.addDevice(d)
	env.store.putDevice(d)

	resp := env.query(t, `mutation($id: ID!, $input: UpdateDeviceInput!) {
		updateDevice(id: $id, input: $input) { id }
	}`, map[string]any{
		"id":    "ac",
		"input": map[string]any{"roles": map[string]any{"controlledLoad": "LIGHT"}},
	})
	if len(resp.Errors) == 0 {
		t.Fatal("expected an inapplicable controlled-load role to fail")
	}
}

func TestQueryDeviceUsesLiveAvailability(t *testing.T) {
	env := newTestEnv(t)
	now := time.Now().Truncate(time.Second)
	env.stateReader.addDevice(device.Device{
		ID:           "ac",
		FriendlyName: "Cloud Name",
		Source:       "tuya",
		Type:         device.Climate,
		Available:    true,
		LastSeen:     now,
	})
	env.store.putDevice(device.Device{
		ID:           "ac",
		FriendlyName: "AC",
		Source:       "tuya",
		Type:         device.Climate,
		Available:    false,
		LastSeen:     time.Time{},
	})

	resp := env.query(t, `query { device(id: "ac") { id friendlyName available lastSeen } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}
	var data struct {
		Device struct {
			ID           string    `json:"id"`
			FriendlyName string    `json:"friendlyName"`
			Available    bool      `json:"available"`
			LastSeen     time.Time `json:"lastSeen"`
		} `json:"device"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if data.Device.FriendlyName != "AC" {
		t.Fatalf("got friendlyName %q, want AC", data.Device.FriendlyName)
	}
	if !data.Device.Available {
		t.Fatal("expected live availability true")
	}
	if !data.Device.LastSeen.Equal(now) {
		t.Fatalf("got lastSeen %s, want %s", data.Device.LastSeen, now)
	}
}

func TestMutationApplyScene(t *testing.T) {
	env := newTestEnv(t)
	env.store.scenes["scene1"] = store.Scene{ID: "scene1", Name: "Evening"}

	resp := env.query(t, `mutation { applyScene(sceneId: "scene1") { id name } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		ApplyScene struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"applyScene"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if data.ApplyScene.Name != "Evening" {
		t.Errorf("expected name Evening, got %s", data.ApplyScene.Name)
	}

	if got := env.sceneRunner.appliedScenes(); len(got) != 1 || got[0] != "scene1" {
		t.Fatalf("applied scenes = %v, want [scene1]", got)
	}
}

func TestMutationCreateScene(t *testing.T) {
	env := newTestEnv(t)
	env.stateReader.addDevice(device.Device{ID: "d1", Type: device.Light})
	env.stateReader.addDevice(device.Device{ID: "d2", Type: device.Light})

	resp := env.query(t, `mutation($input: CreateSceneInput!) { createScene(input: $input) { id name targets { targetType targetId } lighting { overrides { deviceId kind state { on brightness } } } } }`,
		map[string]any{
			"input": map[string]any{
				"name": "Movie Night",
				"definition": map[string]any{
					"targets": []map[string]any{
						{"targetType": "device", "targetId": "d1"},
						{"targetType": "device", "targetId": "d2"},
					},
					"lighting": map[string]any{
						"overrides": []map[string]any{
							{"deviceId": "d1", "kind": "state", "state": map[string]any{"on": true, "brightness": 180}},
							{"deviceId": "d2", "kind": "state", "state": map[string]any{"on": true, "brightness": 180}},
						},
					},
					"supportingStates": []map[string]any{},
				},
			},
		})
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		CreateScene struct {
			ID      string `json:"id"`
			Name    string `json:"name"`
			Targets []struct {
				TargetType string `json:"targetType"`
				TargetID   string `json:"targetId"`
			} `json:"targets"`
			Lighting struct {
				Overrides []struct {
					DeviceID   string `json:"deviceId"`
					On         *bool  `json:"on"`
					Brightness *int   `json:"brightness"`
					State      struct {
						On         *bool `json:"on"`
						Brightness *int  `json:"brightness"`
					} `json:"state"`
				} `json:"overrides"`
			} `json:"lighting"`
		} `json:"createScene"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if data.CreateScene.Name != "Movie Night" {
		t.Errorf("expected name Movie Night, got %s", data.CreateScene.Name)
	}
	if len(data.CreateScene.Targets) != 2 {
		t.Errorf("expected 2 targets, got %d", len(data.CreateScene.Targets))
	}
	if len(data.CreateScene.Lighting.Overrides) != 2 || data.CreateScene.Lighting.Overrides[0].State.On == nil || !*data.CreateScene.Lighting.Overrides[0].State.On || data.CreateScene.Lighting.Overrides[0].State.Brightness == nil || *data.CreateScene.Lighting.Overrides[0].State.Brightness != 180 {
		t.Errorf("unexpected lighting overrides: %+v", data.CreateScene.Lighting)
	}
	if !env.store.createSceneCalled {
		t.Error("expected CreateScene to be called on store")
	}
}

func TestMutationUpdateScene(t *testing.T) {
	env := newTestEnv(t)
	env.stateReader.addDevice(device.Device{ID: "d1", Type: device.Light})
	env.stateReader.addDevice(device.Device{ID: "d2", Type: device.Light})
	env.store.scenes["s1"] = store.Scene{ID: "s1", Name: "Old Name", Definition: store.SceneDefinition{Targets: []store.SceneTarget{{Type: device.TargetDevice, ID: "d1"}}}}

	resp := env.query(t, `mutation($id: ID!, $input: UpdateSceneInput!) { updateScene(id: $id, input: $input) { id targets { targetType targetId } } }`,
		map[string]any{
			"id": "s1",
			"input": map[string]any{
				"definition": map[string]any{
					"targets": []map[string]any{{"targetType": "device", "targetId": "d2"}},
					"lighting": map[string]any{
						"overrides": []map[string]any{{"deviceId": "d2", "kind": "state", "state": map[string]any{"on": true}}},
					},
					"supportingStates": []map[string]any{},
				},
			},
		})
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		UpdateScene struct {
			ID      string `json:"id"`
			Targets []struct {
				TargetType string `json:"targetType"`
				TargetID   string `json:"targetId"`
			} `json:"targets"`
		} `json:"updateScene"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(data.UpdateScene.Targets) != 1 {
		t.Fatalf("expected 1 target after update, got %d", len(data.UpdateScene.Targets))
	}
	if data.UpdateScene.Targets[0].TargetID != "d2" {
		t.Errorf("expected targetId d2, got %s", data.UpdateScene.Targets[0].TargetID)
	}
	if got := env.sceneRunner.deactivatedScenes(); len(got) != 1 || got[0] != "s1" {
		t.Fatalf("deactivated scenes = %v, want [s1]", got)
	}
}

func TestMutationDeleteScene(t *testing.T) {
	env := newTestEnv(t)
	env.store.scenes["s1"] = store.Scene{ID: "s1", Name: "Deleteme"}

	resp := env.query(t, `mutation { deleteScene(id: "s1") }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	if !env.store.deleteSceneCalled {
		t.Error("expected DeleteScene to be called on store")
	}
	if got := env.sceneRunner.deactivatedScenes(); len(got) != 1 || got[0] != "s1" {
		t.Fatalf("deactivated scenes = %v, want [s1]", got)
	}
}

func TestMutationCreateAutomation(t *testing.T) {
	env := newTestEnv(t)

	resp := env.query(t, `mutation($input: CreateAutomationInput!) { createAutomation(input: $input) { id name enabled nodes { id type config } } }`,
		map[string]any{
			"input": map[string]any{
				"name":    "Night Lights",
				"enabled": true,
				"nodes": []map[string]any{
					{"id": "t1", "type": "trigger", "config": `{"event_type":"device.state_changed","filter_expr":"true"}`},
					{"id": "a1", "type": "action", "config": `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":false}"}`},
				},
				"edges": []map[string]any{
					{"fromNodeId": "t1", "toNodeId": "a1"},
				},
			},
		})
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		CreateAutomation struct {
			ID      string `json:"id"`
			Name    string `json:"name"`
			Enabled bool   `json:"enabled"`
			Nodes   []struct {
				ID     string `json:"id"`
				Type   string `json:"type"`
				Config string `json:"config"`
			} `json:"nodes"`
		} `json:"createAutomation"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if data.CreateAutomation.Name != "Night Lights" {
		t.Errorf("expected name Night Lights, got %s", data.CreateAutomation.Name)
	}
	if !env.store.createAutomationCalled {
		t.Error("expected CreateAutomation to be called on store")
	}
	if !env.reloader.wasCalled() {
		t.Error("expected AutomationReloader.Reload() to be called")
	}
}

func TestMutationUpdateAutomationPersistsDraftAndReportsCompilability(t *testing.T) {
	env := newTestEnv(t)
	env.store.automations["a1"] = store.Automation{ID: "a1", Name: "Draft"}

	mutation := `mutation($id: ID!, $input: UpdateAutomationInput!) {
		updateAutomation(id: $id, input: $input) { id compilable nodes { id } }
	}`
	baseNodes := []map[string]any{
		{"id": "t1", "type": "trigger", "config": `{"kind":"event","event_type":"test.fire","filter_expr":"true"}`},
		{"id": "a1", "type": "action", "config": `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		{"id": "op1", "type": "operator", "config": `{"kind":"and"}`},
	}
	variables := map[string]any{
		"id": "a1",
		"input": map[string]any{
			"nodes": baseNodes,
			"edges": []map[string]any{{"fromNodeId": "t1", "toNodeId": "a1"}},
		},
	}

	resp := env.query(t, mutation, variables)
	if len(resp.Errors) > 0 {
		t.Fatalf("disconnected draft should save: %v", resp.Errors)
	}
	var saved struct {
		UpdateAutomation struct {
			Compilable bool `json:"compilable"`
			Nodes      []struct {
				ID string `json:"id"`
			} `json:"nodes"`
		} `json:"updateAutomation"`
	}
	if err := json.Unmarshal(resp.Data, &saved); err != nil {
		t.Fatalf("unmarshal draft response: %v", err)
	}
	if !saved.UpdateAutomation.Compilable {
		t.Fatal("isolated operator should not prevent compilation")
	}
	if len(saved.UpdateAutomation.Nodes) != 3 {
		t.Fatalf("expected all draft nodes to persist, got %d", len(saved.UpdateAutomation.Nodes))
	}

	variables["input"] = map[string]any{
		"nodes": baseNodes,
		"edges": []map[string]any{
			{"fromNodeId": "t1", "toNodeId": "a1"},
			{"fromNodeId": "op1", "toNodeId": "op1"},
		},
	}
	resp = env.query(t, mutation, variables)
	if len(resp.Errors) > 0 {
		t.Fatalf("non-compilable draft should still save: %v", resp.Errors)
	}
	if err := json.Unmarshal(resp.Data, &saved); err != nil {
		t.Fatalf("unmarshal non-compilable response: %v", err)
	}
	if saved.UpdateAutomation.Compilable {
		t.Fatal("cyclic graph should report compilable=false")
	}
}

func TestMutationToggleAutomation(t *testing.T) {
	env := newTestEnv(t)
	env.store.automations["a1"] = store.Automation{
		ID:      "a1",
		Name:    "Test Auto",
		Enabled: true,
	}

	resp := env.query(t, `mutation { toggleAutomation(id: "a1", enabled: false) { id enabled } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		ToggleAutomation struct {
			ID      string `json:"id"`
			Enabled bool   `json:"enabled"`
		} `json:"toggleAutomation"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if data.ToggleAutomation.Enabled {
		t.Error("expected enabled=false after toggle")
	}
	if !env.store.toggleCalled {
		t.Error("expected UpdateAutomationEnabled called")
	}
	if !env.reloader.wasCalled() {
		t.Error("expected reload called")
	}
}

// TestMutationDisableDeviceBlocksCommands covers the two halves of the disable
// contract at the API edge: updateDevice persists the flag and reports it back,
// and setTargetState then refuses rather than publishing a command that would
// silently go nowhere.
func TestMutationDisableDeviceBlocksCommands(t *testing.T) {
	env := newTestEnv(t)
	now := time.Now().Truncate(time.Second)
	env.stateReader.addDevice(device.Device{
		ID:           "ac",
		FriendlyName: "Portable AC",
		Source:       device.SourceTuya,
		Type:         device.Climate,
		Available:    true,
		LastSeen:     now,
	})

	ch := env.bus.Subscribe(eventbus.EventCommandRequested)
	defer env.bus.Unsubscribe(ch)
	updates := env.bus.Subscribe(eventbus.EventDeviceUpdated)
	defer env.bus.Unsubscribe(updates)

	resp := env.query(t, `mutation { updateDevice(id: "ac", input: {disabled: true}) { id disabled } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors disabling: %v", resp.Errors)
	}
	var disabledOut struct {
		UpdateDevice struct {
			ID       string `json:"id"`
			Disabled bool   `json:"disabled"`
		} `json:"updateDevice"`
	}
	if err := json.Unmarshal(resp.Data, &disabledOut); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if !disabledOut.UpdateDevice.Disabled {
		t.Fatal("updateDevice did not report the device as disabled")
	}
	drainDeviceUpdate(t, updates, env.stateReader)

	for _, m := range []struct{ name, doc string }{
		{"setTargetState", `mutation { setTargetState(targetType: DEVICE, targetId: "ac", state: {on: true}) }`},
		{"simulateDeviceAction", `mutation { simulateDeviceAction(deviceId: "ac", action: "single") }`},
	} {
		resp = env.query(t, m.doc, nil)
		if len(resp.Errors) == 0 {
			t.Fatalf("expected %s to reject a disabled device", m.name)
		}
		if !strings.Contains(resp.Errors[0].Message, "disabled") {
			t.Errorf("%s error should name the reason, got %q", m.name, resp.Errors[0].Message)
		}
	}
	select {
	case evt := <-ch:
		t.Fatalf("a command was published for a disabled device: %+v", evt)
	case <-time.After(100 * time.Millisecond):
	}

	resp = env.query(t, `mutation { updateDevice(id: "ac", input: {disabled: false}) { id disabled } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors re-enabling: %v", resp.Errors)
	}
	drainDeviceUpdate(t, updates, env.stateReader)
	resp = env.query(t, `mutation { setTargetState(targetType: DEVICE, targetId: "ac", state: {on: true}) }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("re-enabled device still rejects commands: %v", resp.Errors)
	}
	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for the command after re-enabling")
	}
}

func TestMutationDeleteRestoreDevice(t *testing.T) {
	env := newTestEnv(t)
	env.stateReader.addDevice(device.Device{
		ID: "lamp", FriendlyName: "Desk Lamp", Source: device.SourceZigbee2MQTT, Type: device.Light, Available: true,
	})
	updates := env.bus.Subscribe(eventbus.EventDeviceUpdated)
	defer env.bus.Unsubscribe(updates)

	resp := env.query(t, `mutation { deleteDevice(id: "lamp") { id disabled deleted } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("delete device: %v", resp.Errors)
	}
	var deleted struct {
		DeleteDevice struct {
			Disabled bool `json:"disabled"`
			Deleted  bool `json:"deleted"`
		} `json:"deleteDevice"`
	}
	if err := json.Unmarshal(resp.Data, &deleted); err != nil {
		t.Fatalf("decode delete: %v", err)
	}
	if !deleted.DeleteDevice.Deleted || !deleted.DeleteDevice.Disabled {
		t.Fatalf("delete response = %+v", deleted.DeleteDevice)
	}
	drainDeviceUpdate(t, updates, env.stateReader)

	resp = env.query(t, `mutation { setTargetState(targetType: DEVICE, targetId: "lamp", state: {on: true}) }`, nil)
	if len(resp.Errors) == 0 || !strings.Contains(resp.Errors[0].Message, "deleted") {
		t.Fatalf("deleted command error = %v", resp.Errors)
	}
	resp = env.query(t, `mutation { updateDevice(id: "lamp", input: {disabled: false}) { id } }`, nil)
	if len(resp.Errors) == 0 || !strings.Contains(resp.Errors[0].Message, "restore") {
		t.Fatalf("enable deleted device error = %v", resp.Errors)
	}

	resp = env.query(t, `mutation { restoreDevice(id: "lamp") { id disabled deleted } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("restore device: %v", resp.Errors)
	}
	var restored struct {
		RestoreDevice struct {
			Disabled bool `json:"disabled"`
			Deleted  bool `json:"deleted"`
		} `json:"restoreDevice"`
	}
	if err := json.Unmarshal(resp.Data, &restored); err != nil {
		t.Fatalf("decode restore: %v", err)
	}
	if restored.RestoreDevice.Deleted || !restored.RestoreDevice.Disabled {
		t.Fatalf("restore response = %+v", restored.RestoreDevice)
	}
	drainDeviceUpdate(t, updates, env.stateReader)

	resp = env.query(t, `mutation { setTargetState(targetType: DEVICE, targetId: "lamp", state: {on: true}) }`, nil)
	if len(resp.Errors) == 0 || !strings.Contains(resp.Errors[0].Message, "disabled") {
		t.Fatalf("restored command error = %v", resp.Errors)
	}
}

func TestMutationBatchDeleteRestoreDevices(t *testing.T) {
	env := newTestEnv(t)
	for _, id := range []device.DeviceID{"d-1", "d-2"} {
		env.stateReader.addDevice(device.Device{ID: id, FriendlyName: string(id), Type: device.Light})
	}

	resp := env.query(t, `mutation { batchDeleteDevices(ids: ["d-1", "d-2", "d-2", "missing"]) }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("batch delete: %v", resp.Errors)
	}
	var deleted struct {
		Count int `json:"batchDeleteDevices"`
	}
	if err := json.Unmarshal(resp.Data, &deleted); err != nil {
		t.Fatalf("decode batch delete: %v", err)
	}
	if deleted.Count != 2 {
		t.Fatalf("batch delete count = %d", deleted.Count)
	}

	resp = env.query(t, `mutation { batchDeleteDevices(ids: ["d-1", "d-2"]) }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("idempotent batch delete: %v", resp.Errors)
	}
	if err := json.Unmarshal(resp.Data, &deleted); err != nil || deleted.Count != 0 {
		t.Fatalf("idempotent batch delete = (%+v, %v)", deleted, err)
	}

	resp = env.query(t, `mutation { batchRestoreDevices(ids: ["d-2", "missing"]) }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("batch restore: %v", resp.Errors)
	}
	var restored struct {
		Count int `json:"batchRestoreDevices"`
	}
	if err := json.Unmarshal(resp.Data, &restored); err != nil || restored.Count != 1 {
		t.Fatalf("batch restore = (%+v, %v)", restored, err)
	}
}

// drainDeviceUpdate applies one device.updated event to the state reader the way
// device.MemoryStore does in production, so a test can assert on what the
// command gate sees after a metadata mutation.
func drainDeviceUpdate(t *testing.T, ch <-chan eventbus.Event, sr *mockStateReader) {
	t.Helper()
	select {
	case evt := <-ch:
		d, ok := evt.Payload.(device.Device)
		if !ok {
			t.Fatalf("device.updated payload is not a Device: %T", evt.Payload)
		}
		sr.applyUserFields(d)
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for device.updated")
	}
}
