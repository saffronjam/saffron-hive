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

func TestScenes_QueryAll(t *testing.T) {
	deviceID, err := queryDeviceIDByName("Living Room Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	sceneInput := map[string]any{
		"name": "QueryAll Scene A",
		"actions": []map[string]any{
			{"targetType": "device", "targetId": deviceID, "payload": `{"on":true}`},
		},
	}
	data1, err := graphqlMutation(`mutation($input: CreateSceneInput!) {
		createScene(input: $input) { id }
	}`, map[string]any{"input": sceneInput})
	if err != nil {
		t.Fatalf("create scene A: %v", err)
	}
	var sa struct {
		CreateScene struct{ ID string } `json:"createScene"`
	}
	_ = json.Unmarshal(data1, &sa)

	sceneInput["name"] = "QueryAll Scene B"
	data2, err := graphqlMutation(`mutation($input: CreateSceneInput!) {
		createScene(input: $input) { id }
	}`, map[string]any{"input": sceneInput})
	if err != nil {
		t.Fatalf("create scene B: %v", err)
	}
	var sb struct {
		CreateScene struct{ ID string } `json:"createScene"`
	}
	_ = json.Unmarshal(data2, &sb)

	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": sa.CreateScene.ID})
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": sb.CreateScene.ID})
	})

	data, err := graphqlQuery(`{ scenes { id name } }`, nil)
	if err != nil {
		t.Fatalf("query scenes: %v", err)
	}

	var result struct {
		Scenes []struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"scenes"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	foundA := false
	foundB := false
	for _, s := range result.Scenes {
		if s.ID == sa.CreateScene.ID {
			foundA = true
		}
		if s.ID == sb.CreateScene.ID {
			foundB = true
		}
	}
	if !foundA {
		t.Error("scene A not found in scenes query")
	}
	if !foundB {
		t.Error("scene B not found in scenes query")
	}
}

func TestScenes_UpdateScene(t *testing.T) {
	deviceID, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	data, err := graphqlMutation(`mutation($input: CreateSceneInput!) {
		createScene(input: $input) { id name }
	}`, map[string]any{
		"input": map[string]any{
			"name": "Before Update",
			"actions": []map[string]any{
				{"targetType": "device", "targetId": deviceID, "payload": `{"on":true}`},
			},
		},
	})
	if err != nil {
		t.Fatalf("create scene: %v", err)
	}
	var cr struct {
		CreateScene struct{ ID string } `json:"createScene"`
	}
	_ = json.Unmarshal(data, &cr)
	sceneID := cr.CreateScene.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": sceneID})
	})

	data, err = graphqlMutation(`mutation($id: ID!, $input: UpdateSceneInput!) {
		updateScene(id: $id, input: $input) { id name actions { targetId payload } }
	}`, map[string]any{
		"id": sceneID,
		"input": map[string]any{
			"name": "After Update",
			"actions": []map[string]any{
				{"targetType": "device", "targetId": deviceID, "payload": `{"on":false,"brightness":50}`},
			},
		},
	})
	if err != nil {
		t.Fatalf("update scene: %v", err)
	}

	var result struct {
		UpdateScene struct {
			ID      string `json:"id"`
			Name    string `json:"name"`
			Actions []struct {
				TargetID string `json:"targetId"`
				Payload  string `json:"payload"`
			} `json:"actions"`
		} `json:"updateScene"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if result.UpdateScene.Name != "After Update" {
		t.Errorf("name=%q, want %q", result.UpdateScene.Name, "After Update")
	}
	if len(result.UpdateScene.Actions) != 1 {
		t.Fatalf("expected 1 action, got %d", len(result.UpdateScene.Actions))
	}
	if result.UpdateScene.Actions[0].TargetID != deviceID {
		t.Errorf("action targetId=%q, want %q", result.UpdateScene.Actions[0].TargetID, deviceID)
	}
}

func TestScenes_UpdateScene_InvalidID(t *testing.T) {
	err := graphqlMutationExpectError(`mutation($id: ID!, $input: UpdateSceneInput!) {
		updateScene(id: $id, input: $input) { id }
	}`, map[string]any{
		"id":    "nonexistent-scene-id",
		"input": map[string]any{"name": "Nope"},
	})
	if err != nil {
		t.Fatalf("expected GraphQL error for invalid scene ID, got: %v", err)
	}
}

func TestScenes_ApplySceneWithGroupTarget(t *testing.T) {
	// EXPECTED FAIL: Bug #1/#2 — resolveSceneTarget uses StateReader (memory store) for groups,
	// but groups are only in DB. No MQTT command will be sent.

	data, err := graphqlMutation(`mutation { createGroup(input: { name: "Scene Apply Group" }) { id } }`, nil)
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	var gr struct {
		CreateGroup struct{ ID string } `json:"createGroup"`
	}
	_ = json.Unmarshal(data, &gr)
	groupID := gr.CreateGroup.ID

	deviceID, err := queryDeviceIDByName("Living Room Light")
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

	data, err = graphqlMutation(`mutation($input: CreateSceneInput!) {
		createScene(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"name": "Group Target Scene",
			"actions": []map[string]any{
				{"targetType": "group", "targetId": groupID, "payload": `{"on":true,"brightness":200}`},
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
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteGroup(id: $id) }`, map[string]any{"id": groupID})
	})

	cmdCh, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe commands: %v", err)
	}

	_, err = graphqlMutation(`mutation($id: ID!) { applyScene(sceneId: $id) { id } }`, map[string]any{"id": sceneID})
	if err != nil {
		t.Fatalf("apply scene: %v", err)
	}

	ok := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		select {
		case msg := <-cmdCh:
			if msg.Topic == "zigbee2mqtt/Living Room Light/set" {
				return true
			}
		default:
		}
		return false
	})
	if !ok {
		t.Fatal("timed out waiting for MQTT command to Living Room Light — group target resolution failed (Bug #1/#2)")
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
