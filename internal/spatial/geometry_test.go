package spatial

import (
	"context"
	"math"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/lightfield"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestConcavePolygonCentroidAndOffsetsStayInside(t *testing.T) {
	face, ok := newPolygon([]lightfield.Point{
		{X: 0, Y: 0}, {X: 1, Y: 0}, {X: 1, Y: 0.35},
		{X: 0.35, Y: 0.35}, {X: 0.35, Y: 1}, {X: 0, Y: 1},
	})
	if !ok || !face.contains(face.centroid) {
		t.Fatalf("concave centroid = %#v, ok=%v", face.centroid, ok)
	}
	for seed := int64(0); seed < 30; seed++ {
		point := face.offsetPoint(seed, "device", "room")
		if !face.contains(point) {
			t.Fatalf("offset outside face: %#v", point)
		}
	}
}

func TestRoomGeometryMultipleRoomsMissingAndUnlinked(t *testing.T) {
	roomOne, roomTwo := "r1", "r2"
	floor := unitFloor()
	floor.Rooms = []store.FloorplanRoom{
		{ID: "face-1", RoomID: &roomOne, VertexIDs: []string{"a", "b", "c", "d"}},
		{ID: "face-2", RoomID: &roomTwo, VertexIDs: []string{"a", "missing", "c"}},
		{ID: "unlinked", VertexIDs: []string{"a", "b", "c"}},
	}
	s := &fakeStore{
		floor:  floor,
		groups: map[string][]store.GroupMember{},
		rooms: map[string][]store.RoomMember{
			"r1": {roomMember("r1", device.RoomMemberDevice, "d1")},
			"r2": {roomMember("r2", device.RoomMemberDevice, "d1")},
		},
		removed: map[string]bool{},
	}
	resolver := NewResolver(s)
	points, diagnostics, err := resolver.Resolve(context.Background(), TargetContext{
		DeviceIDs: []device.DeviceID{"d1"},
		PositiveRoots: map[device.DeviceID][]StructuralRoot{
			"d1": {{Type: device.TargetRoom, ID: "r1"}, {Type: device.TargetRoom, ID: "r2"}},
		},
	}, 4)
	if err != nil {
		t.Fatal(err)
	}
	if points[0].Source != PointSourceRoom || len(diagnostics.DegenerateRoomIDs) != 1 || diagnostics.DegenerateRoomIDs[0] != "r2" {
		t.Fatalf("points=%#v diagnostics=%#v", points, diagnostics)
	}
}

func TestDegenerateOrAbsentRoomFallsBack(t *testing.T) {
	roomID := "degenerate"
	floor := unitFloor()
	floor.Rooms = []store.FloorplanRoom{{ID: "face", RoomID: &roomID, VertexIDs: []string{"a", "b"}}}
	s := &fakeStore{
		floor:  floor,
		groups: map[string][]store.GroupMember{},
		rooms: map[string][]store.RoomMember{
			"degenerate": {roomMember("degenerate", device.RoomMemberDevice, "d1")},
			"absent":     {roomMember("absent", device.RoomMemberDevice, "d2")},
		},
		removed: map[string]bool{},
	}
	resolver := NewResolver(s)
	points, diagnostics, err := resolver.Resolve(context.Background(), TargetContext{
		DeviceIDs: []device.DeviceID{"d1", "d2"},
		PositiveRoots: map[device.DeviceID][]StructuralRoot{
			"d1": {{Type: device.TargetRoom, ID: "degenerate"}},
			"d2": {{Type: device.TargetRoom, ID: "absent"}},
		},
	}, 1)
	if err != nil {
		t.Fatal(err)
	}
	if points[0].Source != PointSourceFallback || points[1].Source != PointSourceFallback || len(diagnostics.DegenerateRoomIDs) != 1 {
		t.Fatalf("points=%#v diagnostics=%#v", points, diagnostics)
	}
}

func TestPolygonRejectsMissingArea(t *testing.T) {
	if _, ok := newPolygon([]lightfield.Point{{X: 0, Y: 0}, {X: 0.5, Y: 0.5}, {X: 1, Y: 1}}); ok {
		t.Fatal("degenerate polygon accepted")
	}
	face, ok := newPolygon([]lightfield.Point{{X: 0, Y: 0}, {X: 2, Y: 0}, {X: 2, Y: 2}, {X: 0, Y: 2}})
	if !ok || math.Abs(face.centroid.X-1) > 1e-9 || math.Abs(face.centroid.Y-1) > 1e-9 {
		t.Fatalf("square centroid = %#v", face.centroid)
	}
}
