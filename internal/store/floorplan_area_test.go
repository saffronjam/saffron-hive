package store

import (
	"math"
	"slices"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func areaTestPlan() *Floorplan {
	return &Floorplan{Vertices: []FloorplanVertex{{ID: "a"}, {ID: "b", X: 4}, {ID: "c", X: 4, Y: 3}, {ID: "d", Y: 3}},
		Walls: []FloorplanWall{{ID: "ab", VertexA: "a", VertexB: "b"}, {ID: "bc", VertexA: "b", VertexB: "c"}, {ID: "cd", VertexA: "c", VertexB: "d"}, {ID: "da", VertexA: "d", VertexB: "a"}},
		Rooms: []FloorplanRoom{{ID: "face", RoomID: device.Ptr("room"), VertexIDs: []string{"a", "b", "c", "d"}}}}
}

func TestFloorplanRoomAreas(t *testing.T) {
	for _, test := range []struct {
		name string
		edit func(*Floorplan)
		want float64
	}{
		{"rectangle", func(*Floorplan) {}, 12},
		{"reverse winding", func(p *Floorplan) { slices.Reverse(p.Rooms[0].VertexIDs) }, 12},
		{"curved wall", func(p *Floorplan) { p.Walls[0].CurveX = device.Ptr(2.0); p.Walls[0].CurveY = device.Ptr(-1.0) }, 13.328125},
		{"unlinked face", func(p *Floorplan) { p.Rooms[0].RoomID = nil }, 0},
		{"missing vertex", func(p *Floorplan) { p.Vertices = p.Vertices[:3] }, 0},
		{"missing wall", func(p *Floorplan) { p.Walls = p.Walls[:3] }, 0},
		{"invalid coordinates", func(p *Floorplan) { p.Vertices[0].X = math.NaN() }, 0},
	} {
		t.Run(test.name, func(t *testing.T) {
			p := areaTestPlan()
			test.edit(p)
			if got := floorplanRoomAreas(p)["room"]; math.Abs(got-test.want) > 1e-9 {
				t.Fatalf("area=%v,want %v", got, test.want)
			}
		})
	}
	if len(floorplanRoomAreas(nil)) != 0 {
		t.Fatal("absent floorplan has room areas")
	}
}
