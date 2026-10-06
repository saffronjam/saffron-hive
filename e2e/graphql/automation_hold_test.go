//go:build e2e

package graphql_test

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

// TestAutomations_HoldFiresOnlyAfterConditionLasts verifies a device-state
// trigger with a hold: a condition that breaks before the hold expires runs
// nothing, and one that lasts runs the action once the hold has passed.
func TestAutomations_HoldFiresOnlyAfterConditionLasts(t *testing.T) {
	sensorID, err := queryDeviceIDByName(fp300Name)
	if err != nil {
		t.Fatalf("find sensor: %v", err)
	}
	lightID, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find light: %v", err)
	}
	if err := publisher.PublishDeviceState(fp300Name, []byte(`{"presence":true}`)); err != nil {
		t.Fatalf("publish presence: %v", err)
	}

	filter := `trigger.device_id == "` + sensorID + `" && trigger.payload.state.presence != nil && trigger.payload.state.presence == false`
	triggerConfig, _ := json.Marshal(map[string]any{
		"kind":        "event",
		"event_type":  "device.state_changed",
		"filter_expr": filter,
		"hold_ms":     1000,
		"device_id":   sensorID,
	})
	actionConfig, _ := json.Marshal(map[string]string{
		"action_type": "set_device_state",
		"target_type": "device",
		"target_id":   lightID,
		"payload":     `{"on":true,"brightness":77}`,
	})
	data, err := graphqlMutation(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name":    "Hold Test",
			"enabled": true,
			"nodes": []map[string]any{
				{"id": "hold-t1", "type": "trigger", "config": string(triggerConfig)},
				{"id": "hold-a1", "type": "action", "config": string(actionConfig)},
			},
			"edges": []map[string]any{{"fromNodeId": "hold-t1", "toNodeId": "hold-a1"}},
		},
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	var created struct {
		CreateAutomation struct{ ID string } `json:"createAutomation"`
	}
	_ = json.Unmarshal(data, &created)
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteAutomation(id: $id) }`, map[string]any{"id": created.CreateAutomation.ID})
	})

	commands, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	lightCommand := func(within time.Duration) bool {
		deadline := time.After(within)
		for {
			select {
			case message := <-commands:
				if message.Topic == "zigbee2mqtt/Bedroom Light/set" && strings.Contains(string(message.Payload), "77") {
					return true
				}
			case <-deadline:
				return false
			}
		}
	}

	publishPresence(t, false)
	time.Sleep(400 * time.Millisecond)
	publishPresence(t, true)
	if lightCommand(1500 * time.Millisecond) {
		t.Fatal("action ran although presence returned before the hold passed")
	}

	start := time.Now()
	publishPresence(t, false)
	if !lightCommand(4 * time.Second) {
		t.Fatal("action did not run after presence stayed false for the hold")
	}
	if elapsed := time.Since(start); elapsed < 900*time.Millisecond {
		t.Fatalf("action ran after %s, before the 1s hold", elapsed)
	}
}

func publishPresence(t *testing.T, present bool) {
	t.Helper()
	payload, _ := json.Marshal(map[string]bool{"presence": present})
	if err := publisher.PublishDeviceState(fp300Name, payload); err != nil {
		t.Fatalf("publish presence: %v", err)
	}
}
