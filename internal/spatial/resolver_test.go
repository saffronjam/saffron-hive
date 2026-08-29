package spatial

import (
	"context"
	"reflect"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type fakeStore struct {
	floor       *store.Floorplan
	groups      map[string][]store.GroupMember
	rooms       map[string][]store.RoomMember
	removed     map[string]bool
	floorReads  int
	memberReads int
}

func (s *fakeStore) GetFloorplanGraph(context.Context) (*store.Floorplan, error) {
	s.floorReads++
	return s.floor, nil
}

func (s *fakeStore) ListGroupMembers(_ context.Context, id string) ([]store.GroupMember, error) {
	s.memberReads++
	return append([]store.GroupMember(nil), s.groups[id]...), nil
}

func (s *fakeStore) ListRoomMembers(_ context.Context, id string) ([]store.RoomMember, error) {
	s.memberReads++
	return append([]store.RoomMember(nil), s.rooms[id]...), nil
}

func (s *fakeStore) ResolveTargetDeviceIDs(_ context.Context, kind device.TargetType, id string) []device.DeviceID {
	seen := map[structuralNode]bool{}
	devices := map[device.DeviceID]bool{}
	var walk func(structuralNode)
	walk = func(node structuralNode) {
		if seen[node] {
			return
		}
		seen[node] = true
		switch node.kind {
		case device.TargetDevice:
			devices[device.DeviceID(node.id)] = true
		case device.TargetGroup:
			if s.removed[node.id] {
				return
			}
			for _, member := range s.groups[node.id] {
				switch member.MemberType {
				case device.GroupMemberDevice:
					walk(structuralNode{kind: device.TargetDevice, id: member.MemberID})
				case device.GroupMemberGroup:
					walk(structuralNode{kind: device.TargetGroup, id: member.MemberID})
				case device.GroupMemberRoom:
					walk(structuralNode{kind: device.TargetRoom, id: member.MemberID})
				}
			}
		case device.TargetRoom:
			for _, member := range s.rooms[node.id] {
				if member.MemberType == device.RoomMemberDevice {
					walk(structuralNode{kind: device.TargetDevice, id: member.MemberID})
				} else {
					walk(structuralNode{kind: device.TargetGroup, id: member.MemberID})
				}
			}
		}
	}
	walk(structuralNode{kind: kind, id: id})
	result := make([]device.DeviceID, 0, len(devices))
	for deviceID := range devices {
		result = append(result, deviceID)
	}
	return deduplicateIDs(result)
}

func groupMember(groupID string, kind device.GroupMemberType, id string) store.GroupMember {
	return store.GroupMember{GroupID: groupID, MemberType: kind, MemberID: id}
}

func roomMember(roomID string, kind device.RoomMemberType, id string) store.RoomMember {
	return store.RoomMember{RoomID: roomID, MemberType: kind, MemberID: id}
}

func unitFloor(placements ...store.FloorplanPlacement) *store.Floorplan {
	return &store.Floorplan{
		Vertices:   []store.FloorplanVertex{{ID: "a", X: 0, Y: 0}, {ID: "b", X: 1, Y: 0}, {ID: "c", X: 1, Y: 1}, {ID: "d", X: 0, Y: 1}},
		Placements: placements,
	}
}

func TestResolveDirectPlacementWinsAndDeduplicates(t *testing.T) {
	s := &fakeStore{
		floor: unitFloor(
			store.FloorplanPlacement{MemberType: device.TargetDevice, MemberID: "d1", X: 0.8, Y: 0.7},
			store.FloorplanPlacement{MemberType: device.TargetGroup, MemberID: "g1", X: 0.1, Y: 0.1},
		),
		groups: map[string][]store.GroupMember{"g1": {groupMember("g1", device.GroupMemberDevice, "d1")}},
		rooms:  map[string][]store.RoomMember{}, removed: map[string]bool{},
	}
	resolver := NewResolver(s)
	points, _, err := resolver.Resolve(context.Background(), TargetContext{
		DeviceIDs: []device.DeviceID{"d1", "d1"},
		PositiveRoots: map[device.DeviceID][]StructuralRoot{
			"d1": {{Type: device.TargetDevice, ID: "d1"}, {Type: device.TargetGroup, ID: "g1"}},
		},
	}, 4)
	if err != nil {
		t.Fatal(err)
	}
	if len(points) != 1 || points[0].Source != PointSourceDevice {
		t.Fatalf("points = %#v", points)
	}
}

func TestResolveNestedGroupSpecificityAndMemberOffsets(t *testing.T) {
	s := &fakeStore{
		floor: unitFloor(
			store.FloorplanPlacement{MemberType: device.TargetGroup, MemberID: "outer", X: 0.15, Y: 0.3},
			store.FloorplanPlacement{MemberType: device.TargetGroup, MemberID: "inner", X: 0.85, Y: 0.7},
		),
		groups: map[string][]store.GroupMember{
			"outer": {groupMember("outer", device.GroupMemberGroup, "inner"), groupMember("outer", device.GroupMemberDevice, "d2")},
			"inner": {groupMember("inner", device.GroupMemberDevice, "d1"), groupMember("inner", device.GroupMemberDevice, "d3")},
		},
		rooms: map[string][]store.RoomMember{}, removed: map[string]bool{},
	}
	resolver := NewResolver(s)
	ids := []device.DeviceID{"d1", "d2", "d3"}
	roots := map[device.DeviceID][]StructuralRoot{}
	for _, id := range ids {
		roots[id] = []StructuralRoot{{Type: device.TargetGroup, ID: "outer"}}
	}
	points, _, err := resolver.Resolve(context.Background(), TargetContext{DeviceIDs: ids, PositiveRoots: roots}, 9)
	if err != nil {
		t.Fatal(err)
	}
	if len(points) != 3 || points[0].Source != PointSourceGroup || points[1].Source != PointSourceGroup || points[2].Source != PointSourceGroup {
		t.Fatalf("points = %#v", points)
	}
	if points[0].Point.X <= points[1].Point.X || points[2].Point == points[0].Point {
		t.Fatalf("specificity or member distribution failed: %#v", points)
	}
}

func TestResolveCyclesDiamondsAndRemovedGroups(t *testing.T) {
	s := &fakeStore{
		floor: unitFloor(),
		groups: map[string][]store.GroupMember{
			"root": {
				groupMember("root", device.GroupMemberGroup, "left"),
				groupMember("root", device.GroupMemberGroup, "right"),
			},
			"left":    {groupMember("left", device.GroupMemberGroup, "right"), groupMember("left", device.GroupMemberDevice, "d1")},
			"right":   {groupMember("right", device.GroupMemberGroup, "left"), groupMember("right", device.GroupMemberDevice, "d1")},
			"removed": {groupMember("removed", device.GroupMemberDevice, "d2")},
		},
		rooms: map[string][]store.RoomMember{}, removed: map[string]bool{"removed": true},
	}
	resolver := NewResolver(s)
	points, diagnostics, err := resolver.Resolve(context.Background(), TargetContext{
		DeviceIDs: []device.DeviceID{"d1", "d2"},
		PositiveRoots: map[device.DeviceID][]StructuralRoot{
			"d1": {{Type: device.TargetGroup, ID: "root"}},
			"d2": {{Type: device.TargetGroup, ID: "removed"}},
		},
	}, 7)
	if err != nil {
		t.Fatal(err)
	}
	if len(points) != 2 || diagnostics.CycleBranches == 0 || points[1].Source != PointSourceFallback {
		t.Fatalf("points=%#v diagnostics=%#v", points, diagnostics)
	}
}

func TestResolveRoomGroupCycleTerminates(t *testing.T) {
	s := &fakeStore{
		floor: unitFloor(),
		groups: map[string][]store.GroupMember{
			"g1": {groupMember("g1", device.GroupMemberRoom, "r1"), groupMember("g1", device.GroupMemberDevice, "d1")},
		},
		rooms: map[string][]store.RoomMember{
			"r1": {roomMember("r1", device.RoomMemberGroup, "g1")},
		},
		removed: map[string]bool{},
	}
	points, diagnostics, err := NewResolver(s).Resolve(context.Background(), TargetContext{
		DeviceIDs: []device.DeviceID{"d1"},
		PositiveRoots: map[device.DeviceID][]StructuralRoot{
			"d1": {{Type: device.TargetRoom, ID: "r1"}},
		},
	}, 3)
	if err != nil {
		t.Fatal(err)
	}
	if len(points) != 1 || diagnostics.CycleBranches == 0 {
		t.Fatalf("points=%#v diagnostics=%#v", points, diagnostics)
	}
}

func TestResolverCachesAndInvalidatesTopology(t *testing.T) {
	s := &fakeStore{floor: unitFloor(), groups: map[string][]store.GroupMember{}, rooms: map[string][]store.RoomMember{}, removed: map[string]bool{}}
	resolver := NewResolver(s)
	target := TargetContext{DeviceIDs: []device.DeviceID{"d1"}, PositiveRoots: map[device.DeviceID][]StructuralRoot{"d1": {{Type: device.TargetDevice, ID: "d1"}}}}
	if _, _, err := resolver.Resolve(context.Background(), target, 1); err != nil {
		t.Fatal(err)
	}
	if _, _, err := resolver.Resolve(context.Background(), target, 1); err != nil {
		t.Fatal(err)
	}
	if s.floorReads != 1 {
		t.Fatalf("floor reads = %d", s.floorReads)
	}
	resolver.Invalidate()
	if _, _, err := resolver.Resolve(context.Background(), target, 1); err != nil {
		t.Fatal(err)
	}
	if s.floorReads != 2 {
		t.Fatalf("floor reads after invalidation = %d", s.floorReads)
	}
}

func TestEqualGroupCandidatesAverageDeterministically(t *testing.T) {
	s := &fakeStore{
		floor: unitFloor(
			store.FloorplanPlacement{MemberType: device.TargetGroup, MemberID: "a", X: 0.2, Y: 0.4},
			store.FloorplanPlacement{MemberType: device.TargetGroup, MemberID: "b", X: 0.8, Y: 0.4},
		),
		groups: map[string][]store.GroupMember{
			"a": {groupMember("a", device.GroupMemberDevice, "d1")},
			"b": {groupMember("b", device.GroupMemberDevice, "d1")},
		}, rooms: map[string][]store.RoomMember{}, removed: map[string]bool{},
	}
	resolver := NewResolver(s)
	topology, _ := resolver.loadTopology(context.Background())
	paths := []membershipPath{
		{{kind: device.TargetGroup, id: "a"}, {kind: device.TargetDevice, id: "d1"}},
		{{kind: device.TargetGroup, id: "b"}, {kind: device.TargetDevice, id: "d1"}},
	}
	first, ok := resolver.groupPoint(context.Background(), topology, "d1", paths, 2)
	second, _ := resolver.groupPoint(context.Background(), topology, "d1", paths, 2)
	if !ok || !reflect.DeepEqual(first, second) || first.X < 0.45 || first.X > 0.55 {
		t.Fatalf("averaged point = %#v %#v", first, second)
	}
}
