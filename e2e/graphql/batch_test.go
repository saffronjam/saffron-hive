//go:build e2e

package graphql_test

import (
	"encoding/json"
	"testing"
)

func TestBatch_DeleteScenes(t *testing.T) {
	ids := make([]string, 3)
	for i := range ids {
		data, err := graphqlMutation(`mutation($input: CreateSceneInput!) {
			createScene(input: $input) { id }
		}`, map[string]any{
			"input": map[string]any{"name": "Batch scene", "actions": []any{}},
		})
		if err != nil {
			t.Fatalf("create scene: %v", err)
		}
		var r struct {
			CreateScene struct{ ID string } `json:"createScene"`
		}
		if err := json.Unmarshal(data, &r); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		ids[i] = r.CreateScene.ID
	}

	data, err := graphqlMutation(`mutation($ids: [ID!]!) {
		batchDeleteScenes(ids: $ids)
	}`, map[string]any{"ids": ids})
	if err != nil {
		t.Fatalf("batch delete: %v", err)
	}
	var result struct {
		BatchDeleteScenes int `json:"batchDeleteScenes"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if result.BatchDeleteScenes != 3 {
		t.Errorf("deleted count = %d, want 3", result.BatchDeleteScenes)
	}

	listData, err := graphqlMutation(`query { scenes { id } }`, nil)
	if err != nil {
		t.Fatalf("list scenes: %v", err)
	}
	var list struct {
		Scenes []struct{ ID string } `json:"scenes"`
	}
	if err := json.Unmarshal(listData, &list); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	for _, s := range list.Scenes {
		for _, removed := range ids {
			if s.ID == removed {
				t.Errorf("scene %q should have been deleted", removed)
			}
		}
	}
}

func TestBatch_AddRoomMembers(t *testing.T) {
	roomData, err := graphqlMutation(`mutation($input: CreateRoomInput!) {
		createRoom(input: $input) { id }
	}`, map[string]any{"input": map[string]any{"name": "Batch Room"}})
	if err != nil {
		t.Fatalf("create room: %v", err)
	}
	var rr struct {
		CreateRoom struct{ ID string } `json:"createRoom"`
	}
	if err := json.Unmarshal(roomData, &rr); err != nil {
		t.Fatalf("unmarshal room: %v", err)
	}

	d1, err := queryDeviceIDByName("Living Room Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}
	d2, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	members := []map[string]any{
		{"memberType": "device", "memberId": d1},
		{"memberType": "device", "memberId": d2},
	}

	data, err := graphqlMutation(`mutation($roomId: ID!, $members: [RoomMemberInput!]!) {
		batchAddRoomMembers(roomId: $roomId, members: $members) {
			id
			resolvedDevices { id }
		}
	}`, map[string]any{
		"roomId":  rr.CreateRoom.ID,
		"members": members,
	})
	if err != nil {
		t.Fatalf("batch add: %v", err)
	}
	var result struct {
		BatchAddRoomMembers struct {
			ID              string
			ResolvedDevices []struct{ ID string } `json:"resolvedDevices"`
		} `json:"batchAddRoomMembers"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(result.BatchAddRoomMembers.ResolvedDevices) != 2 {
		t.Errorf("device count = %d, want 2", len(result.BatchAddRoomMembers.ResolvedDevices))
	}

	_, err = graphqlMutation(`mutation($roomId: ID!, $members: [RoomMemberInput!]!) {
		batchAddRoomMembers(roomId: $roomId, members: $members) { id }
	}`, map[string]any{
		"roomId":  rr.CreateRoom.ID,
		"members": members,
	})
	if err != nil {
		t.Fatalf("batch add re-run: %v", err)
	}

	roomState, err := graphqlMutation(`query($id: ID!) {
		room(id: $id) { id resolvedDevices { id } }
	}`, map[string]any{"id": rr.CreateRoom.ID})
	if err != nil {
		t.Fatalf("query room: %v", err)
	}
	var qr struct {
		Room struct {
			ResolvedDevices []struct{ ID string } `json:"resolvedDevices"`
		} `json:"room"`
	}
	if err := json.Unmarshal(roomState, &qr); err != nil {
		t.Fatalf("unmarshal room: %v", err)
	}
	if len(qr.Room.ResolvedDevices) != 2 {
		t.Errorf("room device count = %d, want 2 (duplicates should be ignored)", len(qr.Room.ResolvedDevices))
	}
}
