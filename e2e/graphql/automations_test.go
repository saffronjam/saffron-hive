//go:build e2e

package graphql_test

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/e2e/infra"
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
			id name enabled
			nodes { id type config }
			edges { fromNodeId toNodeId }
		}
	}`, map[string]any{
		"input": map[string]any{
			"name":    "Test Automation",
			"enabled": true,
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
			ID      string `json:"id"`
			Name    string `json:"name"`
			Enabled bool   `json:"enabled"`
			Nodes   []struct {
				ID     string `json:"id"`
				Type   string `json:"type"`
				Config string `json:"config"`
			} `json:"nodes"`
			Edges []struct {
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
			"name":    "Trigger Test",
			"enabled": true,
			"nodes": []map[string]any{
				{"id": "tve-t1", "type": "trigger", "config": string(triggerConfig)},
				{"id": "tve-a1", "type": "action", "config": string(actionConfig)},
			},
			"edges": []map[string]any{
				{"fromNodeId": "tve-t1", "toNodeId": "tve-a1"},
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

func TestAutomations_QueryAll(t *testing.T) {
	triggerConfig, _ := json.Marshal(map[string]string{
		"event_type":     "device.state_changed",
		"condition_expr": "true",
	})
	actionConfig, _ := json.Marshal(map[string]string{
		"action_type": "set_device_state",
		"target_type": "device",
		"target_id":   "dummy",
		"payload":     `{"on":true}`,
	})

	counter := 0
	makeInput := func(name string) map[string]any {
		counter++
		tID := fmt.Sprintf("qa-t%d", counter)
		aID := fmt.Sprintf("qa-a%d", counter)
		return map[string]any{
			"name":    name,
			"enabled": false,
			"nodes": []map[string]any{
				{"id": tID, "type": "trigger", "config": string(triggerConfig)},
				{"id": aID, "type": "action", "config": string(actionConfig)},
			},
			"edges": []map[string]any{
				{"fromNodeId": tID, "toNodeId": aID},
			},
		}
	}

	data1, err := graphqlMutation(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) { id }
	}`, map[string]any{"input": makeInput("QueryAll Auto A")})
	if err != nil {
		t.Fatalf("create A: %v", err)
	}
	var ra struct {
		CreateAutomation struct{ ID string } `json:"createAutomation"`
	}
	_ = json.Unmarshal(data1, &ra)

	data2, err := graphqlMutation(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) { id }
	}`, map[string]any{"input": makeInput("QueryAll Auto B")})
	if err != nil {
		t.Fatalf("create B: %v", err)
	}
	var rb struct {
		CreateAutomation struct{ ID string } `json:"createAutomation"`
	}
	_ = json.Unmarshal(data2, &rb)

	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteAutomation(id: $id) }`, map[string]any{"id": ra.CreateAutomation.ID})
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteAutomation(id: $id) }`, map[string]any{"id": rb.CreateAutomation.ID})
	})

	data, err := graphqlQuery(`{ automations { id name } }`, nil)
	if err != nil {
		t.Fatalf("query automations: %v", err)
	}

	var result struct {
		Automations []struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"automations"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	foundA := false
	foundB := false
	for _, a := range result.Automations {
		if a.ID == ra.CreateAutomation.ID {
			foundA = true
		}
		if a.ID == rb.CreateAutomation.ID {
			foundB = true
		}
	}
	if !foundA {
		t.Error("automation A not found in automations query")
	}
	if !foundB {
		t.Error("automation B not found in automations query")
	}
}

func TestAutomations_UpdateAutomation(t *testing.T) {
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
		"payload":     `{"on":true}`,
	})

	data, err := graphqlMutation(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name":    "Before Update",
			"enabled": false,
			"nodes": []map[string]any{
				{"id": "upd-t1", "type": "trigger", "config": string(triggerConfig)},
				{"id": "upd-a1", "type": "action", "config": string(actionConfig)},
			},
			"edges": []map[string]any{
				{"fromNodeId": "upd-t1", "toNodeId": "upd-a1"},
			},
		},
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	var cr struct {
		CreateAutomation struct{ ID string } `json:"createAutomation"`
	}
	_ = json.Unmarshal(data, &cr)
	autoID := cr.CreateAutomation.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteAutomation(id: $id) }`, map[string]any{"id": autoID})
	})

	newActionConfig, _ := json.Marshal(map[string]string{
		"action_type": "set_device_state",
		"target_type": "device",
		"target_id":   deviceID,
		"payload":     `{"on":false,"brightness":0}`,
	})

	data, err = graphqlMutation(`mutation($id: ID!, $input: UpdateAutomationInput!) {
		updateAutomation(id: $id, input: $input) { id name nodes { id type config } }
	}`, map[string]any{
		"id": autoID,
		"input": map[string]any{
			"name": "After Update",
			"nodes": []map[string]any{
				{"id": "upd-t2", "type": "trigger", "config": string(triggerConfig)},
				{"id": "upd-a2", "type": "action", "config": string(newActionConfig)},
			},
			"edges": []map[string]any{
				{"fromNodeId": "upd-t2", "toNodeId": "upd-a2"},
			},
		},
	})
	if err != nil {
		t.Fatalf("update: %v", err)
	}

	var result struct {
		UpdateAutomation struct {
			ID    string `json:"id"`
			Name  string `json:"name"`
			Nodes []struct {
				ID     string `json:"id"`
				Type   string `json:"type"`
				Config string `json:"config"`
			} `json:"nodes"`
		} `json:"updateAutomation"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if result.UpdateAutomation.Name != "After Update" {
		t.Errorf("name=%q, want %q", result.UpdateAutomation.Name, "After Update")
	}
	if len(result.UpdateAutomation.Nodes) != 2 {
		t.Errorf("expected 2 nodes, got %d", len(result.UpdateAutomation.Nodes))
	}
}

func TestAutomations_UpdateAutomation_InvalidID(t *testing.T) {
	err := graphqlMutationExpectError(`mutation($id: ID!, $input: UpdateAutomationInput!) {
		updateAutomation(id: $id, input: $input) { id }
	}`, map[string]any{
		"id":    "nonexistent-automation-id",
		"input": map[string]any{"name": "Nope"},
	})
	if err != nil {
		t.Fatalf("expected GraphQL error for invalid automation ID, got: %v", err)
	}
}

func TestAutomations_TriggerWithGroupTargetAction(t *testing.T) {
	// EXPECTED FAIL: Bug #3/#4 — resolveTargetDevices/executeAction uses StateReader.ResolveGroupDevices
	// (memory store). Groups from GraphQL are only in DB.

	data, err := graphqlMutation(`mutation { createGroup(input: { name: "Auto Trigger Group" }) { id } }`, nil)
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	var gr struct {
		CreateGroup struct{ ID string } `json:"createGroup"`
	}
	_ = json.Unmarshal(data, &gr)
	groupID := gr.CreateGroup.ID

	deviceID, err := queryDeviceIDByName("Kitchen Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	_, err = graphqlMutation(`mutation($input: AddGroupMemberInput!) {
		addGroupMember(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"groupId":    groupID,
			"memberType": "device",
			"memberId":   deviceID,
		},
	})
	if err != nil {
		t.Fatalf("add member: %v", err)
	}

	triggerConfig, _ := json.Marshal(map[string]string{
		"event_type":     "device.state_changed",
		"condition_expr": "true",
	})
	actionConfig, _ := json.Marshal(map[string]string{
		"action_type": "set_device_state",
		"target_type": "group",
		"target_id":   groupID,
		"payload":     `{"on":true,"brightness":255}`,
	})

	data, err = graphqlMutation(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name":    "Group Target Automation",
			"enabled": true,
			"nodes": []map[string]any{
				{"id": "grp-t1", "type": "trigger", "config": string(triggerConfig)},
				{"id": "grp-a1", "type": "action", "config": string(actionConfig)},
			},
			"edges": []map[string]any{
				{"fromNodeId": "grp-t1", "toNodeId": "grp-a1"},
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
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteGroup(id: $id) }`, map[string]any{"id": groupID})
	})

	cmdCh, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe commands: %v", err)
	}

	sensorState, _ := json.Marshal(map[string]float64{"temperature": 35.0, "humidity": 70})
	if err := publisher.PublishDeviceState("Living Room Sensor", sensorState); err != nil {
		t.Fatalf("publish sensor: %v", err)
	}

	ok := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		select {
		case msg := <-cmdCh:
			if msg.Topic == "zigbee2mqtt/Kitchen Light/set" {
				return true
			}
		default:
		}
		return false
	})
	if !ok {
		t.Fatal("timed out waiting for MQTT command to Kitchen Light — group target resolution failed (Bug #3/#4)")
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
			"name":    "Disable Test",
			"enabled": true,
			"nodes": []map[string]any{
				{"id": "dis-t1", "type": "trigger", "config": string(triggerConfig)},
				{"id": "dis-a1", "type": "action", "config": string(actionConfig)},
			},
			"edges": []map[string]any{
				{"fromNodeId": "dis-t1", "toNodeId": "dis-a1"},
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

// TestAutomations_TriggerViaButtonAction verifies that an automation with a
// button_action trigger (event_type=device.action_fired, filter on
// trigger.payload.action) fires a downstream action when the button publishes
// the matching action value — and does NOT fire when a different action is
// reported by the same button.
func TestAutomations_TriggerViaButtonAction(t *testing.T) {
	buttonID, err := queryDeviceIDByName("Office Button")
	if err != nil {
		t.Fatalf("find button: %v", err)
	}
	targetID, err := queryDeviceIDByName("Kitchen Light")
	if err != nil {
		t.Fatalf("find target: %v", err)
	}

	triggerConfig, _ := json.Marshal(map[string]string{
		"kind":        "event",
		"event_type":  "device.action_fired",
		"filter_expr": fmt.Sprintf(`trigger.device_id == %q && trigger.payload.action == "single"`, buttonID),
	})
	actionConfig, _ := json.Marshal(map[string]string{
		"action_type": "set_device_state",
		"target_type": "device",
		"target_id":   targetID,
		"payload":     `{"on":true,"brightness":200}`,
	})

	data, err := graphqlMutation(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name":    "Button Trigger Test",
			"enabled": true,
			"nodes": []map[string]any{
				{"id": "btn-t1", "type": "trigger", "config": string(triggerConfig)},
				{"id": "btn-a1", "type": "action", "config": string(actionConfig)},
			},
			"edges": []map[string]any{
				{"fromNodeId": "btn-t1", "toNodeId": "btn-a1"},
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
		t.Fatalf("subscribe commands: %v", err)
	}

	nonMatching, _ := json.Marshal(map[string]string{"action": "double"})
	if err := publisher.PublishDeviceState("Office Button", nonMatching); err != nil {
		t.Fatalf("publish non-matching action: %v", err)
	}
	fired := pollUntil(500*time.Millisecond, 50*time.Millisecond, func() bool {
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
		t.Fatal("automation must not fire on non-matching action value")
	}

	buttonState, err := infra.LoadButtonState()
	if err != nil {
		t.Fatalf("load button fixture: %v", err)
	}
	if err := publisher.PublishDeviceState("Office Button", buttonState); err != nil {
		t.Fatalf("publish matching action: %v", err)
	}

	ok := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		select {
		case msg := <-cmdCh:
			if msg.Topic == "zigbee2mqtt/Kitchen Light/set" {
				return true
			}
		default:
		}
		return false
	})
	if !ok {
		t.Fatal("timed out waiting for MQTT command after matching button press")
	}
}

// TestAutomations_TriggerCooldownSubSecond verifies that a per-trigger
// cooldown_ms is enforced by the live engine: a 50 ms window blocks a refire
// at ~20 ms but permits one well past it.
func TestAutomations_TriggerCooldownSubSecond(t *testing.T) {
	targetID, err := queryDeviceIDByName("Kitchen Light")
	if err != nil {
		t.Fatalf("find target: %v", err)
	}

	triggerConfig, _ := json.Marshal(map[string]any{
		"kind":        "event",
		"event_type":  "device.state_changed",
		"filter_expr": "true",
		"cooldown_ms": 50,
	})
	actionConfig, _ := json.Marshal(map[string]string{
		"action_type": "set_device_state",
		"target_type": "device",
		"target_id":   targetID,
		"payload":     `{"on":true}`,
	})

	data, err := graphqlMutation(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name":    "Sub-second Trigger Cooldown",
			"enabled": true,
			"nodes": []map[string]any{
				{"id": "sub-t1", "type": "trigger", "config": string(triggerConfig)},
				{"id": "sub-a1", "type": "action", "config": string(actionConfig)},
			},
			"edges": []map[string]any{
				{"fromNodeId": "sub-t1", "toNodeId": "sub-a1"},
			},
		},
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	var ar struct {
		CreateAutomation struct {
			ID string `json:"id"`
		} `json:"createAutomation"`
	}
	_ = json.Unmarshal(data, &ar)
	autoID := ar.CreateAutomation.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteAutomation(id: $id) }`, map[string]any{"id": autoID})
	})

	cmdCh, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe commands: %v", err)
	}

	sensorState, _ := json.Marshal(map[string]float64{"temperature": 20})
	firstFire := func() bool {
		if err := publisher.PublishDeviceState("Living Room Sensor", sensorState); err != nil {
			t.Fatalf("publish: %v", err)
		}
		return pollUntil(2*time.Second, 20*time.Millisecond, func() bool {
			select {
			case msg := <-cmdCh:
				if msg.Topic == "zigbee2mqtt/Kitchen Light/set" {
					return true
				}
			default:
			}
			return false
		})
	}

	if !firstFire() {
		t.Fatal("expected first fire to succeed")
	}

	time.Sleep(20 * time.Millisecond)
	if err := publisher.PublishDeviceState("Living Room Sensor", sensorState); err != nil {
		t.Fatalf("publish: %v", err)
	}
	blocked := pollUntil(150*time.Millisecond, 20*time.Millisecond, func() bool {
		select {
		case msg := <-cmdCh:
			if msg.Topic == "zigbee2mqtt/Kitchen Light/set" {
				return true
			}
		default:
		}
		return false
	})
	if blocked {
		t.Fatal("refire within 50 ms trigger cooldown must not reach MQTT")
	}

	time.Sleep(120 * time.Millisecond)
	if !firstFire() {
		t.Fatal("refire past 50 ms trigger cooldown should succeed")
	}
}

// TestAutomations_ToggleAction_Device drives a manual-trigger automation whose
// action toggles a device's on state, then asserts the published command has
// on=false (since the live device fixture starts on).
func TestAutomations_ToggleAction_Device(t *testing.T) {
	deviceID, err := queryDeviceIDByName("Kitchen Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	onState, _ := json.Marshal(map[string]any{"state": "ON"})
	if err := publisher.PublishDeviceState("Kitchen Light", onState); err != nil {
		t.Fatalf("publish device on: %v", err)
	}
	time.Sleep(150 * time.Millisecond)

	triggerConfig, _ := json.Marshal(map[string]string{"kind": "manual"})
	actionConfig, _ := json.Marshal(map[string]string{
		"action_type": "toggle_device_state",
		"target_type": "device",
		"target_id":   deviceID,
		"payload":     "",
	})

	data, err := graphqlMutation(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name":    "Toggle Device E2E",
			"enabled": true,
			"nodes": []map[string]any{
				{"id": "tog-t1", "type": "trigger", "config": string(triggerConfig)},
				{"id": "tog-a1", "type": "action", "config": string(actionConfig)},
			},
			"edges": []map[string]any{
				{"fromNodeId": "tog-t1", "toNodeId": "tog-a1"},
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
		t.Fatalf("subscribe commands: %v", err)
	}

	if _, err := graphqlMutation(`mutation($id: ID!, $nid: ID!) {
		fireAutomationTrigger(automationId: $id, nodeId: $nid)
	}`, map[string]any{"id": autoID, "nid": "tog-t1"}); err != nil {
		t.Fatalf("fire trigger: %v", err)
	}

	ok := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		select {
		case msg := <-cmdCh:
			if msg.Topic == "zigbee2mqtt/Kitchen Light/set" {
				var p map[string]any
				if err := json.Unmarshal(msg.Payload, &p); err == nil {
					if state, ok := p["state"].(string); ok && state == "OFF" {
						return true
					}
				}
			}
		default:
		}
		return false
	})
	if !ok {
		t.Fatal("timed out waiting for toggle command (expected state=OFF)")
	}
}

// TestAutomations_CycleScenes_AdvancesAndWraps creates two scenes targeting
// different devices and a manual-trigger automation with a cycle_scenes
// action over both. Firing twice should activate scene A then scene B; a
// third fire wraps back to scene A.
func TestAutomations_CycleScenes_AdvancesAndWraps(t *testing.T) {
	deviceA, err := queryDeviceIDByName("Kitchen Light")
	if err != nil {
		t.Fatalf("find Kitchen Light: %v", err)
	}
	deviceB, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find Bedroom Light: %v", err)
	}

	mkScene := func(name, devID string) string {
		t.Helper()
		data, err := graphqlMutation(`mutation($input: CreateSceneInput!) {
			createScene(input: $input) { id }
		}`, map[string]any{
			"input": map[string]any{
				"name": name,
				"actions": []map[string]any{
					{"targetType": "device", "targetId": devID},
				},
				"devicePayloads": []map[string]any{
					{"deviceId": devID, "payload": `{"on":true,"brightness":100}`},
				},
			},
		})
		if err != nil {
			t.Fatalf("create scene %s: %v", name, err)
		}
		var sc struct {
			CreateScene struct{ ID string } `json:"createScene"`
		}
		_ = json.Unmarshal(data, &sc)
		return sc.CreateScene.ID
	}

	sceneA := mkScene("Cycle Scene A", deviceA)
	sceneB := mkScene("Cycle Scene B", deviceB)
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": sceneA})
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": sceneB})
	})

	triggerConfig, _ := json.Marshal(map[string]string{"kind": "manual"})
	cyclePayload, _ := json.Marshal(map[string]any{"scenes": []string{sceneA, sceneB}})
	actionConfig, _ := json.Marshal(map[string]string{
		"action_type": "cycle_scenes",
		"target_type": "",
		"target_id":   "",
		"payload":     string(cyclePayload),
	})

	data, err := graphqlMutation(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name":    "Cycle Scenes E2E",
			"enabled": true,
			"nodes": []map[string]any{
				{"id": "cyc-t1", "type": "trigger", "config": string(triggerConfig)},
				{"id": "cyc-a1", "type": "action", "config": string(actionConfig)},
			},
			"edges": []map[string]any{
				{"fromNodeId": "cyc-t1", "toNodeId": "cyc-a1"},
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
		t.Fatalf("subscribe commands: %v", err)
	}

	fireAndExpect := func(expectedTopic string) {
		t.Helper()
		if _, err := graphqlMutation(`mutation($id: ID!, $nid: ID!) {
			fireAutomationTrigger(automationId: $id, nodeId: $nid)
		}`, map[string]any{"id": autoID, "nid": "cyc-t1"}); err != nil {
			t.Fatalf("fire trigger: %v", err)
		}
		ok := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
			select {
			case msg := <-cmdCh:
				if msg.Topic == expectedTopic {
					return true
				}
			default:
			}
			return false
		})
		if !ok {
			t.Fatalf("timed out waiting for %s", expectedTopic)
		}
	}

	fireAndExpect("zigbee2mqtt/Kitchen Light/set")
	fireAndExpect("zigbee2mqtt/Bedroom Light/set")
	fireAndExpect("zigbee2mqtt/Kitchen Light/set")
}

// TestAutomations_CycleScenes_RejectsSingleScene confirms the save-time
// validator requires at least two scenes.
func TestAutomations_CycleScenes_RejectsSingleScene(t *testing.T) {
	deviceID, err := queryDeviceIDByName("Kitchen Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}
	data, err := graphqlMutation(`mutation($input: CreateSceneInput!) {
		createScene(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name": "Cycle Scenes Single",
			"actions": []map[string]any{
				{"targetType": "device", "targetId": deviceID},
			},
		},
	})
	if err != nil {
		t.Fatalf("create scene: %v", err)
	}
	var sc struct {
		CreateScene struct{ ID string } `json:"createScene"`
	}
	_ = json.Unmarshal(data, &sc)
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": sc.CreateScene.ID})
	})

	triggerConfig, _ := json.Marshal(map[string]string{"kind": "manual"})
	cyclePayload, _ := json.Marshal(map[string]any{"scenes": []string{sc.CreateScene.ID}})
	actionConfig, _ := json.Marshal(map[string]string{
		"action_type": "cycle_scenes",
		"target_type": "",
		"target_id":   "",
		"payload":     string(cyclePayload),
	})

	if err := graphqlMutationExpectError(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name":    "Cycle Single",
			"enabled": false,
			"nodes": []map[string]any{
				{"id": "cs-t1", "type": "trigger", "config": string(triggerConfig)},
				{"id": "cs-a1", "type": "action", "config": string(actionConfig)},
			},
			"edges": []map[string]any{
				{"fromNodeId": "cs-t1", "toNodeId": "cs-a1"},
			},
		},
	}); err != nil {
		t.Fatalf("expected validation error for single-scene cycle: %v", err)
	}
}
