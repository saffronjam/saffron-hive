//go:build e2e

package graphql_test

import (
	"encoding/json"
	"testing"
	"time"
)

func TestAutomations_CreateAndQuery(t *testing.T) {
	deviceID, err := queryDeviceIDByName("Living Room Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	triggerConfig, _ := json.Marshal(map[string]string{
		"event_type":     "device.state_changed",
		"condition_expr": "true",
	})
	actionConfig, _ := json.Marshal(map[string]string{
		"action_type": "set_device_state",
		"target_type": "device",
		"target_id":   deviceID,
		"payload":     `{"on":true,"brightness":100}`,
	})

	data, err := graphqlMutation(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) {
			id name enabled cooldownSeconds
			nodes { id type config }
			edges { id fromNodeId toNodeId }
		}
	}`, map[string]any{
		"input": map[string]any{
			"name":            "Test Automation",
			"enabled":         true,
			"cooldownSeconds": 0,
			"nodes": []map[string]any{
				{"id": "trigger-1", "type": "trigger", "config": string(triggerConfig)},
				{"id": "action-1", "type": "action", "config": string(actionConfig)},
			},
			"edges": []map[string]any{
				{"fromNodeId": "trigger-1", "toNodeId": "action-1"},
			},
		},
	})
	if err != nil {
		t.Fatalf("create automation: %v", err)
	}

	var result struct {
		CreateAutomation struct {
			ID              string `json:"id"`
			Name            string `json:"name"`
			Enabled         bool   `json:"enabled"`
			CooldownSeconds int    `json:"cooldownSeconds"`
			Nodes           []struct {
				ID     string `json:"id"`
				Type   string `json:"type"`
				Config string `json:"config"`
			} `json:"nodes"`
			Edges []struct {
				ID         string `json:"id"`
				FromNodeID string `json:"fromNodeId"`
				ToNodeID   string `json:"toNodeId"`
			} `json:"edges"`
		} `json:"createAutomation"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if result.CreateAutomation.Name != "Test Automation" {
		t.Errorf("name=%q, want Test Automation", result.CreateAutomation.Name)
	}
	if !result.CreateAutomation.Enabled {
		t.Error("expected automation to be enabled")
	}
	if len(result.CreateAutomation.Nodes) != 2 {
		t.Errorf("expected 2 nodes, got %d", len(result.CreateAutomation.Nodes))
	}
	if len(result.CreateAutomation.Edges) != 1 {
		t.Errorf("expected 1 edge, got %d", len(result.CreateAutomation.Edges))
	}

	autoID := result.CreateAutomation.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteAutomation(id: $id) }`, map[string]any{"id": autoID})
	})
}

func TestAutomations_TriggerViaEvent(t *testing.T) {
	deviceID, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	triggerConfig, _ := json.Marshal(map[string]string{
		"event_type":     "device.state_changed",
		"condition_expr": "true",
	})
	actionConfig, _ := json.Marshal(map[string]string{
		"action_type": "set_device_state",
		"target_type": "device",
		"target_id":   deviceID,
		"payload":     `{"on":true,"brightness":50}`,
	})

	data, err := graphqlMutation(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name":            "Trigger Test",
			"enabled":         true,
			"cooldownSeconds": 0,
			"nodes": []map[string]any{
				{"id": "t1", "type": "trigger", "config": string(triggerConfig)},
				{"id": "a1", "type": "action", "config": string(actionConfig)},
			},
			"edges": []map[string]any{
				{"fromNodeId": "t1", "toNodeId": "a1"},
			},
		},
	})
	if err != nil {
		t.Fatalf("create automation: %v", err)
	}
	var ar struct {
		CreateAutomation struct{ ID string } `json:"createAutomation"`
	}
	_ = json.Unmarshal(data, &ar)
	autoID := ar.CreateAutomation.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteAutomation(id: $id) }`, map[string]any{"id": autoID})
	})

	cmdCh, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}

	sensorState, err := json.Marshal(map[string]float64{"temperature": 30.0, "humidity": 60})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if err := publisher.PublishDeviceState("Living Room Sensor", sensorState); err != nil {
		t.Fatalf("publish: %v", err)
	}

	ok := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		select {
		case msg := <-cmdCh:
			if msg.Topic == "zigbee2mqtt/Bedroom Light/set" {
				return true
			}
		default:
		}
		return false
	})
	if !ok {
		t.Fatal("timed out waiting for automation command on MQTT")
	}
}

func TestAutomations_DisableStopsFiring(t *testing.T) {
	deviceID, err := queryDeviceIDByName("Kitchen Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	triggerConfig, _ := json.Marshal(map[string]string{
		"event_type":     "device.state_changed",
		"condition_expr": "true",
	})
	actionConfig, _ := json.Marshal(map[string]string{
		"action_type": "set_device_state",
		"target_type": "device",
		"target_id":   deviceID,
		"payload":     `{"on":false}`,
	})

	data, err := graphqlMutation(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name":            "Disable Test",
			"enabled":         true,
			"cooldownSeconds": 0,
			"nodes": []map[string]any{
				{"id": "t1", "type": "trigger", "config": string(triggerConfig)},
				{"id": "a1", "type": "action", "config": string(actionConfig)},
			},
			"edges": []map[string]any{
				{"fromNodeId": "t1", "toNodeId": "a1"},
			},
		},
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	var ar struct {
		CreateAutomation struct{ ID string } `json:"createAutomation"`
	}
	_ = json.Unmarshal(data, &ar)
	autoID := ar.CreateAutomation.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteAutomation(id: $id) }`, map[string]any{"id": autoID})
	})

	_, err = graphqlMutation(`mutation($id: ID!, $enabled: Boolean!) {
		toggleAutomation(id: $id, enabled: $enabled) { id enabled }
	}`, map[string]any{"id": autoID, "enabled": false})
	if err != nil {
		t.Fatalf("toggle: %v", err)
	}

	cmdCh, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}

	sensorState, err := json.Marshal(map[string]float64{"temperature": 25.0})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if err := publisher.PublishDeviceState("Outdoor Sensor", sensorState); err != nil {
		t.Fatalf("publish: %v", err)
	}

	fired := pollUntil(2*time.Second, 50*time.Millisecond, func() bool {
		select {
		case msg := <-cmdCh:
			if msg.Topic == "zigbee2mqtt/Kitchen Light/set" {
				return true
			}
		default:
		}
		return false
	})
	if fired {
		t.Fatal("disabled automation should not have fired")
	}
}
