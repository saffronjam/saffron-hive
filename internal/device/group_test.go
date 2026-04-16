package device

import (
	"sort"
	"testing"
)

func TestCreateGroup(t *testing.T) {
	s := NewMemoryStore()
	g := Group{ID: "g1", Name: "Living Room"}
	if err := s.CreateGroup(g); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	got, ok := s.GetGroup("g1")
	if !ok {
		t.Fatal("expected group to be found")
	}
	if got.ID != g.ID || got.Name != g.Name {
		t.Fatalf("group fields mismatch: got %+v", got)
	}
}

func TestCreateGroupDuplicateID(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "g1", Name: "First"})
	err := s.CreateGroup(Group{ID: "g1", Name: "Second"})
	if err == nil {
		t.Fatal("expected error for duplicate group ID")
	}
}

func TestGetGroupNotFound(t *testing.T) {
	s := NewMemoryStore()
	_, ok := s.GetGroup("nonexistent")
	if ok {
		t.Fatal("expected not found")
	}
}

func TestListGroups(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "g1", Name: "A"})
	_ = s.CreateGroup(Group{ID: "g2", Name: "B"})
	_ = s.CreateGroup(Group{ID: "g3", Name: "C"})

	groups := s.ListGroups()
	if len(groups) != 3 {
		t.Fatalf("expected 3 groups, got %d", len(groups))
	}
}

func TestListGroupsEmpty(t *testing.T) {
	s := NewMemoryStore()
	groups := s.ListGroups()
	if groups == nil {
		t.Fatal("expected non-nil empty slice")
	}
	if len(groups) != 0 {
		t.Fatalf("expected 0 groups, got %d", len(groups))
	}
}

func TestAddGroupMemberDevice(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "g1", Name: "Room"})
	s.Register(Device{ID: "d1", Type: Light})

	err := s.AddGroupMember(GroupMember{GroupID: "g1", MemberType: GroupMemberDevice, MemberID: "d1"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	members := s.ListGroupMembers("g1")
	if len(members) != 1 {
		t.Fatalf("expected 1 member, got %d", len(members))
	}
	if members[0].MemberType != GroupMemberDevice || members[0].MemberID != "d1" {
		t.Fatalf("unexpected member: %+v", members[0])
	}
}

func TestAddGroupMemberToNonExistentGroup(t *testing.T) {
	s := NewMemoryStore()
	err := s.AddGroupMember(GroupMember{GroupID: "nonexistent", MemberType: GroupMemberDevice, MemberID: "d1"})
	if err != ErrGroupNotFound {
		t.Fatalf("expected ErrGroupNotFound, got %v", err)
	}
}

func TestAddGroupMemberDuplicate(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "g1", Name: "Room"})

	m := GroupMember{GroupID: "g1", MemberType: GroupMemberDevice, MemberID: "d1"}
	_ = s.AddGroupMember(m)
	_ = s.AddGroupMember(m)

	members := s.ListGroupMembers("g1")
	if len(members) != 1 {
		t.Fatalf("expected 1 member after duplicate add, got %d", len(members))
	}
}

func TestAddGroupMemberNestedGroup(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "parent", Name: "Parent"})
	_ = s.CreateGroup(Group{ID: "child", Name: "Child"})

	err := s.AddGroupMember(GroupMember{GroupID: "parent", MemberType: GroupMemberGroup, MemberID: "child"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	members := s.ListGroupMembers("parent")
	if len(members) != 1 {
		t.Fatalf("expected 1 member, got %d", len(members))
	}
	if members[0].MemberType != GroupMemberGroup || members[0].MemberID != "child" {
		t.Fatalf("unexpected member: %+v", members[0])
	}
}

func TestListGroupMembersEmpty(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "g1", Name: "Empty"})

	members := s.ListGroupMembers("g1")
	if len(members) != 0 {
		t.Fatalf("expected 0 members, got %d", len(members))
	}
}

func TestListGroupMembersNonExistentGroup(t *testing.T) {
	s := NewMemoryStore()
	members := s.ListGroupMembers("nonexistent")
	if len(members) != 0 {
		t.Fatalf("expected 0 members for nonexistent group, got %d", len(members))
	}
}

func TestRemoveGroupMember(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "g1", Name: "Room"})
	_ = s.AddGroupMember(GroupMember{GroupID: "g1", MemberType: GroupMemberDevice, MemberID: "d1"})
	_ = s.AddGroupMember(GroupMember{GroupID: "g1", MemberType: GroupMemberDevice, MemberID: "d2"})

	s.RemoveGroupMember("g1", GroupMemberDevice, "d1")

	members := s.ListGroupMembers("g1")
	if len(members) != 1 {
		t.Fatalf("expected 1 member after removal, got %d", len(members))
	}
	if members[0].MemberID != "d2" {
		t.Fatalf("expected remaining member d2, got %s", members[0].MemberID)
	}
}

func TestRemoveGroupMemberNonExistent(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "g1", Name: "Room"})
	s.RemoveGroupMember("g1", GroupMemberDevice, "nonexistent")
}

func TestRemoveGroupMemberFromNonExistentGroup(t *testing.T) {
	s := NewMemoryStore()
	s.RemoveGroupMember("nonexistent", GroupMemberDevice, "d1")
}

func TestDeleteGroup(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "g1", Name: "Room"})
	_ = s.AddGroupMember(GroupMember{GroupID: "g1", MemberType: GroupMemberDevice, MemberID: "d1"})

	s.DeleteGroup("g1")

	_, ok := s.GetGroup("g1")
	if ok {
		t.Fatal("expected group to be deleted")
	}
	members := s.ListGroupMembers("g1")
	if len(members) != 0 {
		t.Fatalf("expected 0 members after delete, got %d", len(members))
	}
}

func TestDeleteGroupCleansUpParentReferences(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "parent", Name: "Parent"})
	_ = s.CreateGroup(Group{ID: "child", Name: "Child"})
	_ = s.AddGroupMember(GroupMember{GroupID: "parent", MemberType: GroupMemberGroup, MemberID: "child"})
	_ = s.AddGroupMember(GroupMember{GroupID: "parent", MemberType: GroupMemberDevice, MemberID: "d1"})

	s.DeleteGroup("child")

	members := s.ListGroupMembers("parent")
	if len(members) != 1 {
		t.Fatalf("expected 1 member after child deletion, got %d", len(members))
	}
	if members[0].MemberType != GroupMemberDevice || members[0].MemberID != "d1" {
		t.Fatalf("expected remaining device member, got %+v", members[0])
	}
}

func TestDeleteGroupNonExistent(t *testing.T) {
	s := NewMemoryStore()
	s.DeleteGroup("nonexistent")
}

func TestResolveGroupDevicesSimple(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "g1", Name: "Room"})
	_ = s.AddGroupMember(GroupMember{GroupID: "g1", MemberType: GroupMemberDevice, MemberID: "d1"})
	_ = s.AddGroupMember(GroupMember{GroupID: "g1", MemberType: GroupMemberDevice, MemberID: "d2"})

	devices := s.ResolveGroupDevices("g1")
	sort.Slice(devices, func(i, j int) bool { return devices[i] < devices[j] })

	if len(devices) != 2 {
		t.Fatalf("expected 2 devices, got %d", len(devices))
	}
	if devices[0] != "d1" || devices[1] != "d2" {
		t.Fatalf("expected [d1, d2], got %v", devices)
	}
}

func TestResolveGroupDevicesNested(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "top", Name: "Top"})
	_ = s.CreateGroup(Group{ID: "mid", Name: "Mid"})
	_ = s.CreateGroup(Group{ID: "bottom", Name: "Bottom"})

	_ = s.AddGroupMember(GroupMember{GroupID: "bottom", MemberType: GroupMemberDevice, MemberID: "d1"})
	_ = s.AddGroupMember(GroupMember{GroupID: "bottom", MemberType: GroupMemberDevice, MemberID: "d2"})
	_ = s.AddGroupMember(GroupMember{GroupID: "mid", MemberType: GroupMemberGroup, MemberID: "bottom"})
	_ = s.AddGroupMember(GroupMember{GroupID: "mid", MemberType: GroupMemberDevice, MemberID: "d3"})
	_ = s.AddGroupMember(GroupMember{GroupID: "top", MemberType: GroupMemberGroup, MemberID: "mid"})
	_ = s.AddGroupMember(GroupMember{GroupID: "top", MemberType: GroupMemberDevice, MemberID: "d4"})

	devices := s.ResolveGroupDevices("top")
	sort.Slice(devices, func(i, j int) bool { return devices[i] < devices[j] })

	if len(devices) != 4 {
		t.Fatalf("expected 4 devices, got %d", len(devices))
	}
	expected := []DeviceID{"d1", "d2", "d3", "d4"}
	for i, exp := range expected {
		if devices[i] != exp {
			t.Fatalf("expected %s at index %d, got %s", exp, i, devices[i])
		}
	}
}

func TestResolveGroupDevicesDeduplicates(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "g1", Name: "Group1"})
	_ = s.CreateGroup(Group{ID: "g2", Name: "Group2"})

	_ = s.AddGroupMember(GroupMember{GroupID: "g1", MemberType: GroupMemberDevice, MemberID: "d1"})
	_ = s.AddGroupMember(GroupMember{GroupID: "g2", MemberType: GroupMemberDevice, MemberID: "d1"})
	_ = s.AddGroupMember(GroupMember{GroupID: "g1", MemberType: GroupMemberGroup, MemberID: "g2"})

	devices := s.ResolveGroupDevices("g1")
	if len(devices) != 1 {
		t.Fatalf("expected 1 deduplicated device, got %d: %v", len(devices), devices)
	}
	if devices[0] != "d1" {
		t.Fatalf("expected d1, got %s", devices[0])
	}
}

func TestResolveGroupDevicesNonExistentGroup(t *testing.T) {
	s := NewMemoryStore()
	devices := s.ResolveGroupDevices("nonexistent")
	if len(devices) != 0 {
		t.Fatalf("expected 0 devices for nonexistent group, got %d", len(devices))
	}
}

func TestResolveGroupDevicesEmpty(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "g1", Name: "Empty"})
	devices := s.ResolveGroupDevices("g1")
	if len(devices) != 0 {
		t.Fatalf("expected 0 devices for empty group, got %d", len(devices))
	}
}

func TestCircularDependencyDirectCycle(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "g1", Name: "Group1"})

	err := s.AddGroupMember(GroupMember{GroupID: "g1", MemberType: GroupMemberGroup, MemberID: "g1"})
	if err != ErrCircularDependency {
		t.Fatalf("expected ErrCircularDependency, got %v", err)
	}
}

func TestCircularDependencyTwoGroups(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "g1", Name: "Group1"})
	_ = s.CreateGroup(Group{ID: "g2", Name: "Group2"})

	_ = s.AddGroupMember(GroupMember{GroupID: "g1", MemberType: GroupMemberGroup, MemberID: "g2"})
	err := s.AddGroupMember(GroupMember{GroupID: "g2", MemberType: GroupMemberGroup, MemberID: "g1"})
	if err != ErrCircularDependency {
		t.Fatalf("expected ErrCircularDependency, got %v", err)
	}
}

func TestCircularDependencyDeepCycle(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "g1", Name: "Group1"})
	_ = s.CreateGroup(Group{ID: "g2", Name: "Group2"})
	_ = s.CreateGroup(Group{ID: "g3", Name: "Group3"})
	_ = s.CreateGroup(Group{ID: "g4", Name: "Group4"})

	_ = s.AddGroupMember(GroupMember{GroupID: "g1", MemberType: GroupMemberGroup, MemberID: "g2"})
	_ = s.AddGroupMember(GroupMember{GroupID: "g2", MemberType: GroupMemberGroup, MemberID: "g3"})
	_ = s.AddGroupMember(GroupMember{GroupID: "g3", MemberType: GroupMemberGroup, MemberID: "g4"})

	err := s.AddGroupMember(GroupMember{GroupID: "g4", MemberType: GroupMemberGroup, MemberID: "g1"})
	if err != ErrCircularDependency {
		t.Fatalf("expected ErrCircularDependency for deep cycle, got %v", err)
	}
}

func TestCircularDependencyAllowsNonCyclicDAG(t *testing.T) {
	s := NewMemoryStore()
	_ = s.CreateGroup(Group{ID: "g1", Name: "Group1"})
	_ = s.CreateGroup(Group{ID: "g2", Name: "Group2"})
	_ = s.CreateGroup(Group{ID: "g3", Name: "Group3"})

	_ = s.AddGroupMember(GroupMember{GroupID: "g1", MemberType: GroupMemberGroup, MemberID: "g3"})
	_ = s.AddGroupMember(GroupMember{GroupID: "g2", MemberType: GroupMemberGroup, MemberID: "g3"})

	if err := s.AddGroupMember(GroupMember{GroupID: "g1", MemberType: GroupMemberGroup, MemberID: "g2"}); err != nil {
		t.Fatalf("diamond DAG should be allowed, got %v", err)
	}
}

func TestMemoryStoreGroupInterfaceCompliance(t *testing.T) {
	var _ StateStore = (*MemoryStore)(nil)
}
