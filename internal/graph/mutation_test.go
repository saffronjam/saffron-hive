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
	env.stateReader.setLightState("d1", &device.LightState{On: device.Ptr(false), Brightness: device.Ptr(0)})

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
		cmd, ok := evt.Payload.(device.DeviceCommand)
		if !ok {
			t.Fatalf("payload is not DeviceCommand: %T", evt.Payload)
		}
		lc, ok := cmd.Payload.(device.LightCommand)
		if !ok {
			t.Fatalf("inner payload is not LightCommand: %T", cmd.Payload)
		}
		if lc.Brightness == nil || *lc.Brightness != 200 {
			t.Errorf("expected brightness 200, got %v", lc.Brightness)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for event")
	}
}

func TestMutationApplyScene(t *testing.T) {
	env := newTestEnv(t)
	env.store.scenes["scene1"] = store.Scene{ID: "scene1", Name: "Evening"}
	env.store.sceneActions["scene1"] = []store.SceneAction{
		{ID: "a1", SceneID: "scene1", DeviceID: "d1", Payload: `{"on":true}`},
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

	resp := env.query(t, `mutation($input: CreateSceneInput!) { createScene(input: $input) { id name actions { deviceId payload } } }`,
		map[string]any{
			"input": map[string]any{
				"name": "Movie Night",
				"actions": []map[string]any{
					{"deviceId": "d1", "payload": `{"brightness":50}`},
					{"deviceId": "d2", "payload": `{"on":false}`},
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
				DeviceID string `json:"deviceId"`
				Payload  string `json:"payload"`
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
		{ID: "old-a1", SceneID: "s1", DeviceID: "d1", Payload: `{"on":true}`},
	}

	resp := env.query(t, `mutation($id: ID!, $input: UpdateSceneInput!) { updateScene(id: $id, input: $input) { id actions { deviceId payload } } }`,
		map[string]any{
			"id": "s1",
			"input": map[string]any{
				"actions": []map[string]any{
					{"deviceId": "d2", "payload": `{"brightness":100}`},
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
				DeviceID string `json:"deviceId"`
				Payload  string `json:"payload"`
			} `json:"actions"`
		} `json:"updateScene"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(data.UpdateScene.Actions) != 1 {
		t.Fatalf("expected 1 action after update, got %d", len(data.UpdateScene.Actions))
	}
	if data.UpdateScene.Actions[0].DeviceID != "d2" {
		t.Errorf("expected deviceId d2, got %s", data.UpdateScene.Actions[0].DeviceID)
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

	resp := env.query(t, `mutation($input: CreateAutomationInput!) { createAutomation(input: $input) { id name enabled triggerEvent conditionExpr cooldownSeconds actions { actionType payload } } }`,
		map[string]any{
			"input": map[string]any{
				"name":            "Night Lights",
				"enabled":         true,
				"triggerEvent":    "device.state_changed",
				"conditionExpr":   "temperature > 25",
				"cooldownSeconds": 60,
				"actions": []map[string]any{
					{"actionType": "set_device_state", "payload": `{"on":false}`},
				},
			},
		})
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		CreateAutomation struct {
			ID              string `json:"id"`
			Name            string `json:"name"`
			Enabled         bool   `json:"enabled"`
			CooldownSeconds int    `json:"cooldownSeconds"`
			Actions         []struct {
				ActionType string `json:"actionType"`
				Payload    string `json:"payload"`
			} `json:"actions"`
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
