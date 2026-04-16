package store

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestCreateGroup(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	g, err := s.CreateGroup(ctx, CreateGroupParams{ID: "grp-1", Name: "Living Room"})
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	if g.ID != "grp-1" {
		t.Errorf("got ID %q, want %q", g.ID, "grp-1")
	}
	if g.Name != "Living Room" {
		t.Errorf("got Name %q, want %q", g.Name, "Living Room")
	}
	if g.CreatedAt.IsZero() {
		t.Error("expected CreatedAt to be set")
	}
}

func TestGetGroup(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateGroup(ctx, CreateGroupParams{ID: "grp-1", Name: "Kitchen"})
	if err != nil {
		t.Fatalf("create group: %v", err)
	}

	g, err := s.GetGroup(ctx, "grp-1")
	if err != nil {
		t.Fatalf("get group: %v", err)
	}
	if g.Name != "Kitchen" {
		t.Errorf("got Name %q, want %q", g.Name, "Kitchen")
	}
}

func TestGetGroupNotFound(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.GetGroup(ctx, "nonexistent")
	if err == nil {
		t.Fatal("expected error for non-existent group")
	}
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows, got: %v", err)
	}
}

func TestListGroups(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	for _, name := range []string{"A", "B", "C"} {
		_, err := s.CreateGroup(ctx, CreateGroupParams{ID: "grp-" + name, Name: name})
		if err != nil {
			t.Fatalf("create group %s: %v", name, err)
		}
	}

	groups, err := s.ListGroups(ctx)
	if err != nil {
		t.Fatalf("list groups: %v", err)
	}
	if len(groups) != 3 {
		t.Fatalf("got %d groups, want 3", len(groups))
	}
}

func TestUpdateGroup(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateGroup(ctx, CreateGroupParams{ID: "grp-1", Name: "Old Name"})
	if err != nil {
		t.Fatalf("create group: %v", err)
	}

	g, err := s.UpdateGroup(ctx, UpdateGroupParams{ID: "grp-1", Name: "New Name"})
	if err != nil {
		t.Fatalf("update group: %v", err)
	}
	if g.Name != "New Name" {
		t.Errorf("got Name %q, want %q", g.Name, "New Name")
	}
}

func TestDeleteGroup(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateGroup(ctx, CreateGroupParams{ID: "grp-1", Name: "Deleteme"})
	if err != nil {
		t.Fatalf("create group: %v", err)
	}

	if err := s.DeleteGroup(ctx, "grp-1"); err != nil {
		t.Fatalf("delete group: %v", err)
	}

	_, err = s.GetGroup(ctx, "grp-1")
	if err == nil {
		t.Fatal("expected error after delete")
	}
}

func TestAddGroupMember(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateGroup(ctx, CreateGroupParams{ID: "grp-1", Name: "Room"})
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	_, err = s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "Light", Source: "zigbee", Type: device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	m, err := s.AddGroupMember(ctx, AddGroupMemberParams{
		ID:         "mem-1",
		GroupID:    "grp-1",
		MemberType: device.GroupMemberDevice,
		MemberID:   "dev-1",
	})
	if err != nil {
		t.Fatalf("add member: %v", err)
	}
	if m.MemberType != device.GroupMemberDevice {
		t.Errorf("expected member type %q, got %q", device.GroupMemberDevice, m.MemberType)
	}
	if m.MemberID != "dev-1" {
		t.Errorf("expected member ID dev-1, got %s", m.MemberID)
	}
}

func TestAddGroupMemberGroup(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateGroup(ctx, CreateGroupParams{ID: "parent", Name: "Parent"})
	if err != nil {
		t.Fatalf("create parent: %v", err)
	}
	_, err = s.CreateGroup(ctx, CreateGroupParams{ID: "child", Name: "Child"})
	if err != nil {
		t.Fatalf("create child: %v", err)
	}

	m, err := s.AddGroupMember(ctx, AddGroupMemberParams{
		ID:         "mem-1",
		GroupID:    "parent",
		MemberType: device.GroupMemberGroup,
		MemberID:   "child",
	})
	if err != nil {
		t.Fatalf("add group member: %v", err)
	}
	if m.MemberType != device.GroupMemberGroup {
		t.Errorf("expected member type %q, got %q", device.GroupMemberGroup, m.MemberType)
	}
}

func TestListGroupMembers(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateGroup(ctx, CreateGroupParams{ID: "grp-1", Name: "Room"})
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	for i, devName := range []string{"dev-1", "dev-2"} {
		_, err := s.CreateDevice(ctx, CreateDeviceParams{
			ID: device.DeviceID(devName), Name: "Device", Source: "zigbee", Type: device.Light,
		})
		if err != nil {
			t.Fatalf("create device %d: %v", i, err)
		}
		_, err = s.AddGroupMember(ctx, AddGroupMemberParams{
			ID:         "mem-" + devName,
			GroupID:    "grp-1",
			MemberType: device.GroupMemberDevice,
			MemberID:   devName,
		})
		if err != nil {
			t.Fatalf("add member %d: %v", i, err)
		}
	}

	members, err := s.ListGroupMembers(ctx, "grp-1")
	if err != nil {
		t.Fatalf("list members: %v", err)
	}
	if len(members) != 2 {
		t.Fatalf("got %d members, want 2", len(members))
	}
}

func TestRemoveGroupMember(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateGroup(ctx, CreateGroupParams{ID: "grp-1", Name: "Room"})
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	_, err = s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "Light", Source: "zigbee", Type: device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}
	_, err = s.AddGroupMember(ctx, AddGroupMemberParams{
		ID:         "mem-1",
		GroupID:    "grp-1",
		MemberType: device.GroupMemberDevice,
		MemberID:   "dev-1",
	})
	if err != nil {
		t.Fatalf("add member: %v", err)
	}

	if err := s.RemoveGroupMember(ctx, "mem-1"); err != nil {
		t.Fatalf("remove member: %v", err)
	}

	members, err := s.ListGroupMembers(ctx, "grp-1")
	if err != nil {
		t.Fatalf("list members: %v", err)
	}
	if len(members) != 0 {
		t.Fatalf("got %d members after removal, want 0", len(members))
	}
}

func TestDeleteGroupCascadesMembers(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateGroup(ctx, CreateGroupParams{ID: "grp-1", Name: "Room"})
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	_, err = s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "Light", Source: "zigbee", Type: device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}
	_, err = s.AddGroupMember(ctx, AddGroupMemberParams{
		ID:         "mem-1",
		GroupID:    "grp-1",
		MemberType: device.GroupMemberDevice,
		MemberID:   "dev-1",
	})
	if err != nil {
		t.Fatalf("add member: %v", err)
	}

	if err := s.DeleteGroup(ctx, "grp-1"); err != nil {
		t.Fatalf("delete group: %v", err)
	}

	members, err := s.ListGroupMembers(ctx, "grp-1")
	if err != nil {
		t.Fatalf("list members: %v", err)
	}
	if len(members) != 0 {
		t.Fatalf("got %d members after cascade delete, want 0", len(members))
	}
}

func TestListGroupsContainingMember(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateGroup(ctx, CreateGroupParams{ID: "grp-1", Name: "Room 1"})
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	_, err = s.CreateGroup(ctx, CreateGroupParams{ID: "grp-2", Name: "Room 2"})
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	_, err = s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "Light", Source: "zigbee", Type: device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	_, err = s.AddGroupMember(ctx, AddGroupMemberParams{
		ID: "mem-1", GroupID: "grp-1", MemberType: device.GroupMemberDevice, MemberID: "dev-1",
	})
	if err != nil {
		t.Fatalf("add member to grp-1: %v", err)
	}
	_, err = s.AddGroupMember(ctx, AddGroupMemberParams{
		ID: "mem-2", GroupID: "grp-2", MemberType: device.GroupMemberDevice, MemberID: "dev-1",
	})
	if err != nil {
		t.Fatalf("add member to grp-2: %v", err)
	}

	groups, err := s.ListGroupsContainingMember(ctx, device.GroupMemberDevice, "dev-1")
	if err != nil {
		t.Fatalf("list groups containing member: %v", err)
	}
	if len(groups) != 2 {
		t.Fatalf("got %d groups, want 2", len(groups))
	}
}

func TestAddGroupMemberDuplicateRejected(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateGroup(ctx, CreateGroupParams{ID: "grp-1", Name: "Room"})
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	_, err = s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "Light", Source: "zigbee", Type: device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	_, err = s.AddGroupMember(ctx, AddGroupMemberParams{
		ID: "mem-1", GroupID: "grp-1", MemberType: device.GroupMemberDevice, MemberID: "dev-1",
	})
	if err != nil {
		t.Fatalf("first add: %v", err)
	}

	_, err = s.AddGroupMember(ctx, AddGroupMemberParams{
		ID: "mem-2", GroupID: "grp-1", MemberType: device.GroupMemberDevice, MemberID: "dev-1",
	})
	if err == nil {
		t.Fatal("expected error for duplicate member (unique constraint)")
	}
}
