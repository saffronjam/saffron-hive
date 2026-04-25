package store

import (
	"context"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestBatchDeleteRooms(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	for _, id := range []string{"r-1", "r-2", "r-3"} {
		if _, err := s.CreateRoom(ctx, CreateRoomParams{ID: id, Name: id}); err != nil {
			t.Fatalf("create room %s: %v", id, err)
		}
	}

	n, err := s.BatchDeleteRooms(ctx, []string{"r-1", "r-3", "r-missing"})
	if err != nil {
		t.Fatalf("batch delete rooms: %v", err)
	}
	if n != 2 {
		t.Errorf("deleted count = %d, want 2", n)
	}

	rooms, err := s.ListRooms(ctx)
	if err != nil {
		t.Fatalf("list rooms: %v", err)
	}
	if len(rooms) != 1 || rooms[0].ID != "r-2" {
		t.Errorf("remaining rooms = %+v, want only r-2", rooms)
	}
}

func TestBatchDeleteRoomsEmptyInput(t *testing.T) {
	s := newTestStore(t)
	n, err := s.BatchDeleteRooms(context.Background(), nil)
	if err != nil {
		t.Fatalf("batch delete rooms empty: %v", err)
	}
	if n != 0 {
		t.Errorf("deleted count = %d, want 0 for empty input", n)
	}
}

func TestBatchDeleteGroupsAndScenes(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	for _, id := range []string{"g-1", "g-2"} {
		if _, err := s.CreateGroup(ctx, CreateGroupParams{ID: id, Name: id}); err != nil {
			t.Fatalf("create group %s: %v", id, err)
		}
	}
	for _, id := range []string{"s-1", "s-2", "s-3"} {
		if _, err := s.CreateScene(ctx, CreateSceneParams{ID: id, Name: id}); err != nil {
			t.Fatalf("create scene %s: %v", id, err)
		}
	}

	ng, err := s.BatchDeleteGroups(ctx, []string{"g-1", "g-2"})
	if err != nil || ng != 2 {
		t.Fatalf("batch delete groups: n=%d err=%v", ng, err)
	}
	ns, err := s.BatchDeleteScenes(ctx, []string{"s-2"})
	if err != nil || ns != 1 {
		t.Fatalf("batch delete scenes: n=%d err=%v", ns, err)
	}
}

func TestBatchDeleteAutomations(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	for _, id := range []string{"a-1", "a-2"} {
		if _, err := s.CreateAutomation(ctx, CreateAutomationParams{ID: id, Name: id}); err != nil {
			t.Fatalf("create automation %s: %v", id, err)
		}
	}

	n, err := s.BatchDeleteAutomations(ctx, []string{"a-1", "a-2"})
	if err != nil {
		t.Fatalf("batch delete automations: %v", err)
	}
	if n != 2 {
		t.Errorf("deleted count = %d, want 2", n)
	}
}

func TestBatchDeleteUsers(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	for _, id := range []string{"u-1", "u-2", "u-3"} {
		if _, err := s.CreateUser(ctx, CreateUserParams{
			ID: id, Username: id, Name: id, PasswordHash: "h",
		}); err != nil {
			t.Fatalf("create user %s: %v", id, err)
		}
	}

	n, err := s.BatchDeleteUsers(ctx, []string{"u-1", "u-3"})
	if err != nil {
		t.Fatalf("batch delete users: %v", err)
	}
	if n != 2 {
		t.Errorf("deleted count = %d, want 2", n)
	}

	count, err := s.CountUsers(ctx)
	if err != nil {
		t.Fatalf("count users: %v", err)
	}
	if count != 1 {
		t.Errorf("remaining user count = %d, want 1", count)
	}
}

func TestGetUserAvatarPathsByIDs(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	for _, id := range []string{"u-1", "u-2", "u-3"} {
		if _, err := s.CreateUser(ctx, CreateUserParams{
			ID: id, Username: id, Name: id, PasswordHash: "h",
		}); err != nil {
			t.Fatalf("create user %s: %v", id, err)
		}
	}
	avatar1 := "u-1.png"
	avatar3 := "u-3.jpg"
	if _, err := s.UpdateUserProfile(ctx, UpdateUserProfileParams{ID: "u-1", AvatarPath: &avatar1}); err != nil {
		t.Fatalf("set avatar u-1: %v", err)
	}
	if _, err := s.UpdateUserProfile(ctx, UpdateUserProfileParams{ID: "u-3", AvatarPath: &avatar3}); err != nil {
		t.Fatalf("set avatar u-3: %v", err)
	}

	paths, err := s.GetUserAvatarPathsByIDs(ctx, []string{"u-1", "u-2", "u-3", "u-missing"})
	if err != nil {
		t.Fatalf("get avatar paths: %v", err)
	}
	if len(paths) != 2 {
		t.Fatalf("got %d avatar paths, want 2: %v", len(paths), paths)
	}
	if paths["u-1"] != avatar1 || paths["u-3"] != avatar3 {
		t.Errorf("unexpected paths: %v", paths)
	}
	if _, has := paths["u-2"]; has {
		t.Error("u-2 has no avatar; should be absent from result")
	}
}

func TestBatchAddRoomMembersIgnoresDuplicates(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if _, err := s.CreateRoom(ctx, CreateRoomParams{ID: "r-1", Name: "Room 1"}); err != nil {
		t.Fatalf("create room: %v", err)
	}

	makeDevices := func(ids ...string) []RoomMemberInput {
		out := make([]RoomMemberInput, len(ids))
		for i, id := range ids {
			out[i] = RoomMemberInput{MemberType: device.RoomMemberDevice, MemberID: id}
		}
		return out
	}

	n, err := s.BatchAddRoomMembers(ctx, "r-1", makeDevices("d-1", "d-2", "d-3"))
	if err != nil {
		t.Fatalf("batch add: %v", err)
	}
	if n != 3 {
		t.Errorf("inserted = %d, want 3", n)
	}

	n2, err := s.BatchAddRoomMembers(ctx, "r-1", makeDevices("d-1", "d-2", "d-4"))
	if err != nil {
		t.Fatalf("batch add (dup): %v", err)
	}
	if n2 != 1 {
		t.Errorf("inserted = %d, want 1 (only d-4 is new)", n2)
	}

	members, err := s.ListRoomMembers(ctx, "r-1")
	if err != nil {
		t.Fatalf("list members: %v", err)
	}
	if len(members) != 4 {
		t.Errorf("room membership count = %d, want 4", len(members))
	}
}

func TestBatchAddGroupDevicesIgnoresDuplicates(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if _, err := s.CreateGroup(ctx, CreateGroupParams{ID: "g-1", Name: "Group 1"}); err != nil {
		t.Fatalf("create group: %v", err)
	}

	n, err := s.BatchAddGroupDevices(ctx, "g-1", []string{"d-1", "d-2"})
	if err != nil {
		t.Fatalf("batch add: %v", err)
	}
	if n != 2 {
		t.Errorf("inserted = %d, want 2", n)
	}

	n2, err := s.BatchAddGroupDevices(ctx, "g-1", []string{"d-1", "d-3"})
	if err != nil {
		t.Fatalf("batch add (dup): %v", err)
	}
	if n2 != 1 {
		t.Errorf("inserted = %d, want 1 (only d-3 is new)", n2)
	}

	members, err := s.ListGroupMembers(ctx, "g-1")
	if err != nil {
		t.Fatalf("list members: %v", err)
	}
	if len(members) != 3 {
		t.Errorf("group member count = %d, want 3", len(members))
	}
	for _, m := range members {
		if m.MemberType != device.GroupMemberDevice {
			t.Errorf("member %s type = %q, want %q", m.MemberID, m.MemberType, device.GroupMemberDevice)
		}
	}
}

func TestBatchDeleteAlarmsByAlarmIDs(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	for _, id := range []string{"alarm-a", "alarm-b", "alarm-c"} {
		if _, _, err := s.InsertAlarmTx(ctx, InsertAlarmParams{
			AlarmID:  id,
			Severity: AlarmSeverityHigh,
			Kind:     AlarmKindOneShot,
			Message:  id,
			Source:   "test",
		}); err != nil {
			t.Fatalf("insert alarm %s: %v", id, err)
		}
	}

	n, err := s.BatchDeleteAlarmsByAlarmIDs(ctx, []string{"alarm-a", "alarm-c"})
	if err != nil {
		t.Fatalf("batch delete alarms: %v", err)
	}
	if n != 2 {
		t.Errorf("deleted count = %d, want 2", n)
	}

	rows, err := s.ListAlarms(ctx)
	if err != nil {
		t.Fatalf("list alarms: %v", err)
	}
	if len(rows) != 1 || rows[0].AlarmID != "alarm-b" {
		t.Errorf("remaining = %+v, want only alarm-b", rows)
	}
}
