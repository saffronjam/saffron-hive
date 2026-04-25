package store

import (
	"context"
	"sort"
	"testing"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/device"
)

// TestResolveTargetDeviceIDs_RoomWithGroup checks that resolving a room target
// expands through any nested groups to surface every transitively reachable
// device exactly once.
func TestResolveTargetDeviceIDs_RoomWithGroup(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	mustCreateRoom(ctx, t, s, "r-1", "Room")
	mustCreateGroup(ctx, t, s, "g-1", "Group")

	// Room contains: device d-1 directly, group g-1
	// Group contains: device d-2, device d-3
	mustAddRoomMember(ctx, t, s, "r-1", device.RoomMemberDevice, "d-1")
	mustAddRoomMember(ctx, t, s, "r-1", device.RoomMemberGroup, "g-1")
	mustAddGroupMember(ctx, t, s, "g-1", device.GroupMemberDevice, "d-2")
	mustAddGroupMember(ctx, t, s, "g-1", device.GroupMemberDevice, "d-3")

	got := s.ResolveTargetDeviceIDs(ctx, device.TargetRoom, "r-1")
	want := []device.DeviceID{"d-1", "d-2", "d-3"}
	if !sliceEqual(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

// TestResolveTargetDeviceIDs_DedupesAcrossPaths checks that a device reachable
// through multiple paths (direct + via a nested group) appears only once.
func TestResolveTargetDeviceIDs_DedupesAcrossPaths(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	mustCreateRoom(ctx, t, s, "r-1", "Room")
	mustCreateGroup(ctx, t, s, "g-1", "Group")

	mustAddRoomMember(ctx, t, s, "r-1", device.RoomMemberDevice, "d-1")
	mustAddRoomMember(ctx, t, s, "r-1", device.RoomMemberGroup, "g-1")
	mustAddGroupMember(ctx, t, s, "g-1", device.GroupMemberDevice, "d-1")

	got := s.ResolveTargetDeviceIDs(ctx, device.TargetRoom, "r-1")
	want := []device.DeviceID{"d-1"}
	if !sliceEqual(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

// TestResolveTargetDeviceIDs_RoomGroupCycleTerminates models the cycle a user
// could create today by adding a room as a group member (allowed) and the same
// group as a member of that room (allowed at the store layer; the resolver
// rejects via checkCircularDependency, but the data integrity check belongs
// here too — never loop forever, regardless of how the cycle was introduced).
func TestResolveTargetDeviceIDs_RoomGroupCycleTerminates(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	mustCreateRoom(ctx, t, s, "r-1", "Room")
	mustCreateGroup(ctx, t, s, "g-1", "Group")

	mustAddRoomMember(ctx, t, s, "r-1", device.RoomMemberGroup, "g-1")
	mustAddGroupMember(ctx, t, s, "g-1", device.GroupMemberRoom, "r-1")
	mustAddGroupMember(ctx, t, s, "g-1", device.GroupMemberDevice, "d-1")

	got := s.ResolveTargetDeviceIDs(ctx, device.TargetRoom, "r-1")
	want := []device.DeviceID{"d-1"}
	if !sliceEqual(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

// TestListTransitiveRoomDeviceMemberships_NestedGroup checks that the bulk
// activity-cache feed surfaces devices nested through groups.
func TestListTransitiveRoomDeviceMemberships_NestedGroup(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	mustCreateRoom(ctx, t, s, "r-1", "Room")
	mustCreateGroup(ctx, t, s, "g-1", "Group")

	mustAddRoomMember(ctx, t, s, "r-1", device.RoomMemberGroup, "g-1")
	mustAddGroupMember(ctx, t, s, "g-1", device.GroupMemberDevice, "d-nested")

	rows, err := s.ListTransitiveRoomDeviceMemberships(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(rows) != 1 {
		t.Fatalf("got %d rows, want 1: %+v", len(rows), rows)
	}
	if rows[0].RoomID != "r-1" || rows[0].DeviceID != "d-nested" {
		t.Errorf("unexpected row: %+v", rows[0])
	}
}

// TestDeleteGroup_CleansRoomMembers verifies the polymorphic-FK cleanup: a
// group referenced as a room member must vanish from room_members on delete.
func TestDeleteGroup_CleansRoomMembers(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	mustCreateRoom(ctx, t, s, "r-1", "Room")
	mustCreateGroup(ctx, t, s, "g-1", "Group")
	mustAddRoomMember(ctx, t, s, "r-1", device.RoomMemberGroup, "g-1")

	if err := s.DeleteGroup(ctx, "g-1"); err != nil {
		t.Fatalf("delete group: %v", err)
	}

	members, err := s.ListRoomMembers(ctx, "r-1")
	if err != nil {
		t.Fatalf("list members: %v", err)
	}
	if len(members) != 0 {
		t.Errorf("group reference still in room_members: %+v", members)
	}
}

// TestDeleteRoom_CleansGroupMembers is the symmetric check for the existing
// allowed direction: a room referenced as a group member is purged on delete.
func TestDeleteRoom_CleansGroupMembers(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	mustCreateRoom(ctx, t, s, "r-1", "Room")
	mustCreateGroup(ctx, t, s, "g-1", "Group")
	mustAddGroupMember(ctx, t, s, "g-1", device.GroupMemberRoom, "r-1")

	if err := s.DeleteRoom(ctx, "r-1"); err != nil {
		t.Fatalf("delete room: %v", err)
	}

	members, err := s.ListGroupMembers(ctx, "g-1")
	if err != nil {
		t.Fatalf("list group members: %v", err)
	}
	if len(members) != 0 {
		t.Errorf("room reference still in group_members: %+v", members)
	}
}

func mustCreateRoom(ctx context.Context, t *testing.T, s *DB, id, name string) {
	t.Helper()
	if _, err := s.CreateRoom(ctx, CreateRoomParams{ID: id, Name: name}); err != nil {
		t.Fatalf("create room %s: %v", id, err)
	}
}

func mustCreateGroup(ctx context.Context, t *testing.T, s *DB, id, name string) {
	t.Helper()
	if _, err := s.CreateGroup(ctx, CreateGroupParams{ID: id, Name: name}); err != nil {
		t.Fatalf("create group %s: %v", id, err)
	}
}

func mustAddRoomMember(ctx context.Context, t *testing.T, s *DB, roomID string, mt device.RoomMemberType, memberID string) {
	t.Helper()
	if _, err := s.AddRoomMember(ctx, AddRoomMemberParams{
		ID:         uuid.New().String(),
		RoomID:     roomID,
		MemberType: mt,
		MemberID:   memberID,
	}); err != nil {
		t.Fatalf("add room member: %v", err)
	}
}

func mustAddGroupMember(ctx context.Context, t *testing.T, s *DB, groupID string, mt device.GroupMemberType, memberID string) {
	t.Helper()
	if _, err := s.AddGroupMember(ctx, AddGroupMemberParams{
		ID:         uuid.New().String(),
		GroupID:    groupID,
		MemberType: mt,
		MemberID:   memberID,
	}); err != nil {
		t.Fatalf("add group member: %v", err)
	}
}

func sliceEqual(a, b []device.DeviceID) bool {
	if len(a) != len(b) {
		return false
	}
	aa := append([]device.DeviceID(nil), a...)
	bb := append([]device.DeviceID(nil), b...)
	sort.Slice(aa, func(i, j int) bool { return aa[i] < aa[j] })
	sort.Slice(bb, func(i, j int) bool { return bb[i] < bb[j] })
	for i := range aa {
		if aa[i] != bb[i] {
			return false
		}
	}
	return true
}
