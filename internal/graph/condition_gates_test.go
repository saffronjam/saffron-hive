package graph

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/assistant"
	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestConditionGateValidationAcrossWrites(t *testing.T) {
	gateway, env, ctx := testAssistantGateway(t)
	lamp := device.Device{ID: "lamp", Type: device.Light, Capabilities: []device.Capability{{Name: device.CapOnOff, Access: device.CapabilityAccessSet}}}
	env.store.putDevice(lamp)
	env.stateReader.addDevice(lamp)
	input := map[string]any{
		"name": "gates", "enabled": true,
		"nodes": []map[string]any{
			{"id": "t", "type": "trigger", "config": map[string]any{"trigger": map[string]any{"mode": "schedule", "scheduleSubmode": "at", "scheduleHour": 1}}},
			{"id": "c", "type": "condition", "config": map[string]any{"condition": map[string]any{"mode": "time_window", "afterHour": 0, "beforeHour": 4, "negate": true}}},
			{"id": "a", "type": "action", "config": map[string]any{"action": map[string]any{"actionType": "toggle_device_state", "targetType": "device", "targetId": "lamp"}}},
		},
		"edges": []map[string]string{{"fromNodeId": "t", "toNodeId": "a"}, {"fromNodeId": "c", "toNodeId": "a"}},
	}
	create := `mutation($input:CreateAutomationInput!){createAutomation(input:$input){id revision validation{valid issues{nodeId path}} nodes{id config{condition{negate}}}}}`
	resp := env.query(t, create, map[string]any{"input": input})
	if len(resp.Errors) == 0 || resp.Errors[0].Extensions["code"] != "CONFIGURATION_INVALID" {
		t.Fatalf("enabled create accepted: %s %v", resp.Data, resp.Errors)
	}
	raw, err := json.Marshal(map[string]any{"input": input})
	if err != nil {
		t.Fatal(err)
	}
	if _, err = gateway.Execute(ctx, assistant.Operation{Field: "createAutomation", Arguments: raw, Selection: "id"}, nil); err == nil {
		t.Fatal("assistant bypassed validation")
	}
	input["enabled"] = false
	resp = env.query(t, create, map[string]any{"input": input})
	if len(resp.Errors) > 0 {
		t.Fatal(resp.Errors)
	}
	var result struct {
		CreateAutomation struct {
			ID         string
			Revision   int
			Validation struct {
				Valid  bool
				Issues []struct{ NodeID, Path string }
			}
		}
	}
	if err := json.Unmarshal(resp.Data, &result); err != nil {
		t.Fatal(err)
	}
	saved := result.CreateAutomation
	if saved.Validation.Valid || !strings.Contains(string(resp.Data), `"negate":true`) {
		t.Fatalf("draft: %s", resp.Data)
	}
	if len(saved.Validation.Issues) == 0 || saved.Validation.Issues[0].NodeID != "c" || saved.Validation.Issues[0].Path != "edges" {
		t.Fatalf("issues: %+v", saved.Validation.Issues)
	}
	for _, query := range []string{
		`mutation($id:ID!,$revision:Int!){toggleAutomation(id:$id,enabled:true,expectedRevision:$revision){id}}`,
		`mutation($id:ID!,$revision:Int!){updateAutomation(id:$id,input:{enabled:true,expectedRevision:$revision}){id}}`,
	} {
		resp := env.query(t, query, map[string]any{"id": saved.ID, "revision": saved.Revision})
		if len(resp.Errors) == 0 || resp.Errors[0].Extensions["code"] != "CONFIGURATION_INVALID" {
			t.Fatalf("enable accepted: %v", resp.Errors)
		}
	}
	repaired := env.query(t, `mutation($id:ID!,$revision:Int!){updateAutomation(id:$id,input:{expectedRevision:$revision,enabled:true,edges:[{fromNodeId:"t",toNodeId:"c"},{fromNodeId:"c",toNodeId:"a"}]}){enabled revision validation{valid} nodes{id config{condition{negate}}}}}`, map[string]any{"id": saved.ID, "revision": saved.Revision})
	if len(repaired.Errors) > 0 || !strings.Contains(string(repaired.Data), `"valid":true`) || !strings.Contains(string(repaired.Data), `"negate":true`) {
		t.Fatalf("repair: %s %v", repaired.Data, repaired.Errors)
	}
}
