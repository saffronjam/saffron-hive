//go:build e2e

package graphql_test

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestRooms_AddDeviceMember(t *testing.T) {
	roomID := mustCreateRoom(t, "Living Room")
	deviceID, err := queryDeviceIDByName("Living Room Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	memberID := mustAddRoomMemberE2E(t, roomID, "device", deviceID)

	got := mustQueryRoom(t, roomID)
	if len(got.Members) != 1 || got.Members[0].ID != memberID {
		t.Fatalf("expected one member %q, got %+v", memberID, got.Members)
	}
	if len(got.ResolvedDevices) != 1 || got.ResolvedDevices[0].ID != deviceID {
		t.Errorf("resolvedDevices = %+v, want [%q]", got.ResolvedDevices, deviceID)
	}
}

func TestRooms_AddGroupMemberExposesNestedDevices(t *testing.T) {
	roomID := mustCreateRoom(t, "Den")
	groupID := mustCreateGroupE2E(t, "Lamp")

	deviceID, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}
	mustAddGroupMemberE2E(t, groupID, "device", deviceID)
	mustAddRoomMemberE2E(t, roomID, "group", groupID)

	got := mustQueryRoom(t, roomID)
	if len(got.Members) != 1 || got.Members[0].MemberType != "group" {
		t.Fatalf("expected one group member, got %+v", got.Members)
	}
	if len(got.ResolvedDevices) != 1 || got.ResolvedDevices[0].ID != deviceID {
		t.Errorf("transitive resolvedDevices = %+v, want [%q]", got.ResolvedDevices, deviceID)
	}
}

func TestRooms_AddMemberRejectsRoomType(t *testing.T) {
	roomID := mustCreateRoom(t, "Kitchen")
	otherRoomID := mustCreateRoom(t, "Pantry")

	_, err := graphqlMutation(`mutation($input: AddRoomMemberInput!) {
		addRoomMember(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"roomId":     roomID,
			"memberType": "room",
			"memberId":   otherRoomID,
		},
	})
	if err == nil {
		t.Fatal("expected error rejecting memberType=room")
	}
	if !strings.Contains(err.Error(), "invalid room member type") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestRooms_AddGroupMemberRejectsCycle(t *testing.T) {
	roomID := mustCreateRoom(t, "Hall")
	groupID := mustCreateGroupE2E(t, "HallContents")

	// Group already contains the room — adding the group to the room would
	// close the loop and must be rejected.
	mustAddGroupMemberE2E(t, groupID, "room", roomID)

	_, err := graphqlMutation(`mutation($input: AddRoomMemberInput!) {
		addRoomMember(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"roomId":     roomID,
			"memberType": "group",
			"memberId":   groupID,
		},
	})
	if err == nil {
		t.Fatal("expected circular dependency error")
	}
	if !strings.Contains(err.Error(), "circular dependency") {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestRooms_RemoveMember(t *testing.T) {
	roomID := mustCreateRoom(t, "Office")
	deviceID, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}
	memberID := mustAddRoomMemberE2E(t, roomID, "device", deviceID)

	data, err := graphqlMutation(`mutation($id: ID!) {
		removeRoomMember(id: $id) { id members { id } }
	}`, map[string]any{"id": memberID})
	if err != nil {
		t.Fatalf("remove: %v", err)
	}
	var removed struct {
		RemoveRoomMember struct {
			ID      string
			Members []struct{ ID string }
		} `json:"removeRoomMember"`
	}
	if err := json.Unmarshal(data, &removed); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if removed.RemoveRoomMember.ID != roomID {
		t.Errorf("removeRoomMember room id = %q, want %q", removed.RemoveRoomMember.ID, roomID)
	}
	if len(removed.RemoveRoomMember.Members) != 0 {
		t.Errorf("members in mutation result = %+v, want empty", removed.RemoveRoomMember.Members)
	}

	got := mustQueryRoom(t, roomID)
	if len(got.Members) != 0 {
		t.Errorf("members after remove = %+v, want empty", got.Members)
	}
}

type roomQueryShape struct {
	ID      string `json:"id"`
	Members []struct {
		ID         string `json:"id"`
		MemberType string `json:"memberType"`
		MemberID   string `json:"memberId"`
	} `json:"members"`
	ResolvedDevices []struct {
		ID string `json:"id"`
	} `json:"resolvedDevices"`
}

func mustQueryRoom(t *testing.T, id string) roomQueryShape {
	t.Helper()
	data, err := graphqlQuery(`query($id: ID!) {
		room(id: $id) {
			id
			members { id memberType memberId }
			resolvedDevices { id }
		}
	}`, map[string]any{"id": id})
	if err != nil {
		t.Fatalf("query room %s: %v", id, err)
	}
	var result struct {
		Room roomQueryShape `json:"room"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	return result.Room
}

func mustCreateRoom(t *testing.T, name string) string {
	t.Helper()
	data, err := graphqlMutation(`mutation($input: CreateRoomInput!) {
		createRoom(input: $input) { id }
	}`, map[string]any{"input": map[string]any{"name": name}})
	if err != nil {
		t.Fatalf("create room %q: %v", name, err)
	}
	var result struct {
		CreateRoom struct{ ID string } `json:"createRoom"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	return result.CreateRoom.ID
}

func mustCreateGroupE2E(t *testing.T, name string) string {
	t.Helper()
	data, err := graphqlMutation(`mutation($input: CreateGroupInput!) {
		createGroup(input: $input) { id }
	}`, map[string]any{"input": map[string]any{"name": name}})
	if err != nil {
		t.Fatalf("create group %q: %v", name, err)
	}
	var result struct {
		CreateGroup struct{ ID string } `json:"createGroup"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	return result.CreateGroup.ID
}

// mustAddRoomMemberE2E adds a member and returns its membership id. The
// mutation reports the updated room, so the id is read back out of the
// member list.
func mustAddRoomMemberE2E(t *testing.T, roomID, memberType, memberID string) string {
	t.Helper()
	data, err := graphqlMutation(`mutation($input: AddRoomMemberInput!) {
		addRoomMember(input: $input) { id members { id memberType memberId } }
	}`, map[string]any{
		"input": map[string]any{
			"roomId":     roomID,
			"memberType": memberType,
			"memberId":   memberID,
		},
	})
	if err != nil {
		t.Fatalf("add room member: %v", err)
	}
	var result struct {
		AddRoomMember struct {
			ID      string
			Members []struct {
				ID         string
				MemberType string `json:"memberType"`
				MemberID   string `json:"memberId"`
			}
		} `json:"addRoomMember"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	for _, m := range result.AddRoomMember.Members {
		if m.MemberType == memberType && m.MemberID == memberID {
			return m.ID
		}
	}
	t.Fatalf("room %q has no %s member %q after add", roomID, memberType, memberID)
	return ""
}

// mustAddGroupMemberE2E adds a member and returns its membership id, read back
// out of the updated group the mutation reports.
func mustAddGroupMemberE2E(t *testing.T, groupID, memberType, memberID string) string {
	t.Helper()
	data, err := graphqlMutation(`mutation($input: AddGroupMemberInput!) {
		addGroupMember(input: $input) { id members { id memberType memberId } }
	}`, map[string]any{
		"input": map[string]any{
			"groupId":    groupID,
			"memberType": memberType,
			"memberId":   memberID,
		},
	})
	if err != nil {
		t.Fatalf("add group member: %v", err)
	}
	var result struct {
		AddGroupMember struct {
			ID      string
			Members []struct {
				ID         string
				MemberType string `json:"memberType"`
				MemberID   string `json:"memberId"`
			}
		} `json:"addGroupMember"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	for _, m := range result.AddGroupMember.Members {
		if m.MemberType == memberType && m.MemberID == memberID {
			return m.ID
		}
	}
	t.Fatalf("group %q has no %s member %q after add", groupID, memberType, memberID)
	return ""
}
