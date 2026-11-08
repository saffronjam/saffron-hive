package store

import "testing"

func TestCleaningAlignmentTracksWallGeometry(t *testing.T) {
	plan := &Floorplan{ID: "floor", Name: "Home", Vertices: []FloorplanVertex{{ID: "a"}, {ID: "b", X: 4}}, Walls: []FloorplanWall{{ID: "wall", VertexA: "a", VertexB: "b", Thickness: 0.1}}}
	initial := FloorplanGeometry(plan)
	plan.Name = "Renamed"
	plan.Revision++
	plan.Furniture = []FloorplanFurniture{{ID: "chair", X: 2}}
	if FloorplanGeometry(plan) != initial {
		t.Fatal("name or furniture invalidated calibration")
	}
	plan.Vertices[1].X = 5
	if FloorplanGeometry(plan) == initial {
		t.Fatal("wall geometry change did not invalidate calibration")
	}
}
