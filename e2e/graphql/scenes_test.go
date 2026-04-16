//go:build e2e

package graphql_test

import (
	"encoding/json"
	"testing"
	"time"
)

func TestScenes_CreateWithDeviceTarget(t *testing.T) {
	deviceID, err := queryDeviceIDByName("Living Room Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	data, err := graphqlMutation(`mutation($input: CreateSceneInput!) {
		createScene(input: $input) {
			id
			name
			actions { id targetType targetId payload }
		}
	}`, map[string]any{
		"input": map[string]any{
			"name": "Evening",
			"actions": []map[string]any{
				{
					"targetType": "device",
					"targetId":   deviceID,
					"payload":    `{"on":true,"brightness":150}`,
				},
			},
		},
	})
	if err != nil {
		t.Fatalf("create scene: %v", err)
	}

	var result struct {
		CreateScene struct {
			ID      string `json:"id"`
			Name    string `json:"name"`
			Actions []struct {
				ID         string `json:"id"`
				TargetType string `json:"targetType"`
				TargetID   string `json:"targetId"`
				Payload    string `json:"payload"`
			} `json:"actions"`
		} `json:"createScene"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if result.CreateScene.Name != "Evening" {
		t.Errorf("name=%q, want Evening", result.CreateScene.Name)
	}
	if len(result.CreateScene.Actions) != 1 {
		t.Fatalf("expected 1 action, got %d", len(result.CreateScene.Actions))
	}
	if result.CreateScene.Actions[0].TargetID != deviceID {
		t.Errorf("target id=%q, want %q", result.CreateScene.Actions[0].TargetID, deviceID)
	}

	sceneID := result.CreateScene.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": sceneID})
	})
}

func TestScenes_CreateWithGroupTarget(t *testing.T) {
	data, err := graphqlMutation(`mutation { createGroup(input: { name: "Scene Group" }) { id } }`, nil)
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	var gr struct {
		CreateGroup struct{ ID string } `json:"createGroup"`
	}
	_ = json.Unmarshal(data, &gr)
	groupID := gr.CreateGroup.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteGroup(id: $id) }`, map[string]any{"id": groupID})
	})

	data, err = graphqlMutation(`mutation($input: CreateSceneInput!) {
		createScene(input: $input) { id actions { targetType targetId } }
	}`, map[string]any{
		"input": map[string]any{
			"name": "Group Scene",
			"actions": []map[string]any{
				{
					"targetType": "group",
					"targetId":   groupID,
					"payload":    `{"on":true}`,
				},
			},
		},
	})
	if err != nil {
		t.Fatalf("create scene: %v", err)
	}

	var result struct {
		CreateScene struct {
			ID      string
			Actions []struct {
				TargetType string `json:"targetType"`
				TargetID   string `json:"targetId"`
			}
		} `json:"createScene"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(result.CreateScene.Actions) != 1 {
		t.Fatalf("expected 1 action, got %d", len(result.CreateScene.Actions))
	}
	if result.CreateScene.Actions[0].TargetType != "group" {
		t.Errorf("target type=%q, want group", result.CreateScene.Actions[0].TargetType)
	}

	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": result.CreateScene.ID})
	})
}

func TestScenes_ApplyScene(t *testing.T) {
	deviceID, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	cmdCh, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe commands: %v", err)
	}

	data, err := graphqlMutation(`mutation($input: CreateSceneInput!) {
		createScene(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name": "Apply Test Scene",
			"actions": []map[string]any{
				{
					"targetType": "device",
					"targetId":   deviceID,
					"payload":    `{"on":true,"brightness":255}`,
				},
			},
		},
	})
	if err != nil {
		t.Fatalf("create scene: %v", err)
	}
	var sr struct {
		CreateScene struct{ ID string } `json:"createScene"`
	}
	_ = json.Unmarshal(data, &sr)
	sceneID := sr.CreateScene.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": sceneID})
	})

	_, err = graphqlMutation(`mutation($id: ID!) { applyScene(sceneId: $id) { id } }`, map[string]any{"id": sceneID})
	if err != nil {
		t.Fatalf("apply scene: %v", err)
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
		t.Fatal("timed out waiting for command on MQTT")
	}
}

func TestScenes_Delete(t *testing.T) {
	data, err := graphqlMutation(`mutation($input: CreateSceneInput!) {
		createScene(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name":    "To Delete",
			"actions": []map[string]any{},
		},
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	var sr struct {
		CreateScene struct{ ID string } `json:"createScene"`
	}
	_ = json.Unmarshal(data, &sr)

	data, err = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": sr.CreateScene.ID})
	if err != nil {
		t.Fatalf("delete: %v", err)
	}

	var delResult struct {
		DeleteScene bool `json:"deleteScene"`
	}
	_ = json.Unmarshal(data, &delResult)
	if !delResult.DeleteScene {
		t.Error("expected deleteScene to return true")
	}
}
