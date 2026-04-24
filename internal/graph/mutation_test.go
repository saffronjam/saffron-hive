package graph

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestMutationSetDeviceState(t *testing.T) {
	env := newTestEnv(t)
	now := time.Now().Truncate(time.Second)

	env.stateReader.addDevice(device.Device{ID: "d1", Name: "Light 1", Source: "zigbee", Type: device.Light, Available: true, LastSeen: now})
	env.stateReader.setDeviceState("d1", &device.DeviceState{On: device.Ptr(false), Brightness: device.Ptr(0)})

	ch := env.bus.Subscribe(eventbus.EventCommandRequested)
	defer env.bus.Unsubscribe(ch)

	resp := env.query(t, `mutation { setDeviceState(deviceId: "d1", state: {brightness: 200}) { id } }`, nil)
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
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for event")
	}
}

func TestMutationApplyScene(t *testing.T) {
	env := newTestEnv(t)
	env.store.scenes["scene1"] = store.Scene{ID: "scene1", Name: "Evening"}
	env.store.sceneActions["scene1"] = []store.SceneAction{
		{SceneID: "scene1", TargetType: "device", TargetID: "d1"},
	}

	ch := env.bus.Subscribe(eventbus.EventSceneApplied)
	defer env.bus.Unsubscribe(ch)

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

	select {
	case evt := <-ch:
		if evt.Type != eventbus.EventSceneApplied {
			t.Fatalf("expected EventSceneApplied, got %s", evt.Type)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for event")
	}
}

func TestMutationCreateScene(t *testing.T) {
	env := newTestEnv(t)

	resp := env.query(t, `mutation($input: CreateSceneInput!) { createScene(input: $input) { id name actions { targetType targetId } } }`,
		map[string]any{
			"input": map[string]any{
				"name": "Movie Night",
				"actions": []map[string]any{
					{"targetType": "device", "targetId": "d1"},
					{"targetType": "device", "targetId": "d2"},
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
			Actions []struct {
				TargetType string `json:"targetType"`
				TargetID   string `json:"targetId"`
			} `json:"actions"`
		} `json:"createScene"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if data.CreateScene.Name != "Movie Night" {
		t.Errorf("expected name Movie Night, got %s", data.CreateScene.Name)
	}
	if len(data.CreateScene.Actions) != 2 {
		t.Errorf("expected 2 actions, got %d", len(data.CreateScene.Actions))
	}
	if !env.store.createSceneCalled {
		t.Error("expected CreateScene to be called on store")
	}
}

func TestMutationUpdateScene(t *testing.T) {
	env := newTestEnv(t)
	env.store.scenes["s1"] = store.Scene{ID: "s1", Name: "Old Name"}
	env.store.sceneActions["s1"] = []store.SceneAction{
		{SceneID: "s1", TargetType: "device", TargetID: "d1"},
	}

	resp := env.query(t, `mutation($id: ID!, $input: UpdateSceneInput!) { updateScene(id: $id, input: $input) { id actions { targetType targetId } } }`,
		map[string]any{
			"id": "s1",
			"input": map[string]any{
				"actions": []map[string]any{
					{"targetType": "device", "targetId": "d2"},
				},
			},
		})
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		UpdateScene struct {
			ID      string `json:"id"`
			Actions []struct {
				TargetType string `json:"targetType"`
				TargetID   string `json:"targetId"`
			} `json:"actions"`
		} `json:"updateScene"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(data.UpdateScene.Actions) != 1 {
		t.Fatalf("expected 1 action after update, got %d", len(data.UpdateScene.Actions))
	}
	if data.UpdateScene.Actions[0].TargetID != "d2" {
		t.Errorf("expected targetId d2, got %s", data.UpdateScene.Actions[0].TargetID)
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
