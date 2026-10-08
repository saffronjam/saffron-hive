//go:build e2e

package graphql_test

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

// TestAutomations_MacrosAndFunctions runs an automation whose condition uses
// a target macro through any_of and since, and whose action calls an action
// macro with an argument: it fires only while the light it guards is off.
func TestAutomations_MacrosAndFunctions(t *testing.T) {
	sensorID, err := queryDeviceIDByName(fp300Name)
	if err != nil {
		t.Fatalf("find sensor: %v", err)
	}
	lightID, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find light: %v", err)
	}
	publishLight := func(on bool) {
		t.Helper()
		state := "OFF"
		if on {
			state = "ON"
		}
		if err := publisher.PublishDeviceState("Bedroom Light", []byte(`{"state":"`+state+`"}`)); err != nil {
			t.Fatalf("publish light: %v", err)
		}
	}
	publishLight(false)
	publishPresence(t, false)

	definitions, _ := json.Marshal(map[string]any{
		"lights": map[string]any{
			"kind":        "target",
			"target_expr": []map[string]any{{"subject": "device", "op": "is", "values": []string{lightID}}},
		},
		"dim": map[string]any{
			"kind":   "action",
			"params": 1,
			"action": map[string]any{
				"action_type": "set_device_state",
				"target_type": "macro",
				"target_id":   "lights",
				"payload":     map[string]any{"on": true, "brightness": "$1"},
			},
		},
	})
	triggerConfig, _ := json.Marshal(map[string]any{
		"kind":        "event",
		"event_type":  "device.state_changed",
		"filter_expr": `trigger.device_id == "` + sensorID + `" && trigger.payload.state.presence != nil && trigger.payload.state.presence == true`,
	})
	conditionConfig, _ := json.Marshal(map[string]string{
		"expr": `any_of({"macro": "lights"}, "on", false) && since({"device": "` + sensorID + `"}, "presence") < duration("1m")`,
	})
	actionConfig, _ := json.Marshal(map[string]any{"use": "dim", "args": []int{66}})
	nodes := []map[string]any{
		{"id": "t1", "type": "trigger", "config": string(triggerConfig)},
		{"id": "c1", "type": "condition", "config": string(conditionConfig)},
		{"id": "a1", "type": "action", "config": string(actionConfig)},
	}
	data, err := graphqlMutation(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) { id compilable definitions }
	}`, map[string]any{
		"input": map[string]any{
			"name":        "Language Test",
			"enabled":     true,
			"definitions": string(definitions),
			"nodes":       nodes,
			"edges": []map[string]any{
				{"fromNodeId": "t1", "toNodeId": "c1"},
				{"fromNodeId": "c1", "toNodeId": "a1"},
			},
		},
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	var created struct {
		CreateAutomation struct {
			ID          string `json:"id"`
			Compilable  bool   `json:"compilable"`
			Definitions string `json:"definitions"`
		} `json:"createAutomation"`
	}
	_ = json.Unmarshal(data, &created)
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteAutomation(id: $id) }`, map[string]any{"id": created.CreateAutomation.ID})
	})
	if !created.CreateAutomation.Compilable {
		t.Fatal("automation with macros should compile")
	}
	if !strings.Contains(created.CreateAutomation.Definitions, `"dim"`) {
		t.Fatalf("definitions not stored: %s", created.CreateAutomation.Definitions)
	}

	commands, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	lightCommand := func(within time.Duration) bool {
		deadline := time.After(within)
		for {
			select {
			case message := <-commands:
				if message.Topic == "zigbee2mqtt/Bedroom Light/set" && strings.Contains(string(message.Payload), "66") {
					return true
				}
			case <-deadline:
				return false
			}
		}
	}

	publishPresence(t, true)
	if !lightCommand(3 * time.Second) {
		t.Fatal("action macro did not run while the light was off")
	}

	publishLight(true)
	time.Sleep(300 * time.Millisecond)
	publishPresence(t, false)
	publishPresence(t, true)
	if lightCommand(1500 * time.Millisecond) {
		t.Fatal("action ran although the guarded light was on")
	}

	resp, err := graphqlPostRaw(`mutation($id: ID!, $input: UpdateAutomationInput!) {
		updateAutomation(id: $id, input: $input) { id }
	}`, map[string]any{
		"id":    created.CreateAutomation.ID,
		"input": map[string]any{"definitions": "{}"},
	})
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if len(resp.Errors) == 0 || !strings.Contains(resp.Errors[0].Message, "unknown macro") {
		t.Fatalf("removing a used macro should be rejected, got %+v", resp.Errors)
	}
}
