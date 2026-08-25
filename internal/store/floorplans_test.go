package store

import (
	"context"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// seedPlacedPlan saves a one-wall plan carrying one device placement and one
// group placement, and returns the store it was saved into.
func seedPlacedPlan(t *testing.T) *DB {
	t.Helper()
	s := newTestStore(t)
	ctx := context.Background()

	if err := s.UpsertDevice(ctx, CreateDeviceParams{
		ID:           "dev-1",
		FriendlyName: "Kitchen ceiling",
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Light,
	}); err != nil {
		t.Fatalf("upsert device: %v", err)
	}
	if _, err := s.CreateGroup(ctx, CreateGroupParams{ID: "grp-1", Name: "Ceiling lights"}); err != nil {
		t.Fatalf("create group: %v", err)
	}

	if err := s.ReplaceFloorplan(ctx, ReplaceFloorplanParams{
		ID:   "fp-1",
		Name: "Home",
		Vertices: []FloorplanVertex{
			{ID: "vtx-a", X: 0, Y: 0},
			{ID: "vtx-b", X: 4, Y: 0},
		},
		Walls: []FloorplanWall{
			{ID: "wall-1", VertexA: "vtx-a", VertexB: "vtx-b", Thickness: 0.1},
		},
		Placements: []FloorplanPlacement{
			{MemberType: device.TargetDevice, MemberID: "dev-1", X: 1.5, Y: 2.25},
			{MemberType: device.TargetGroup, MemberID: "grp-1", X: 3, Y: 1},
		},
	}); err != nil {
		t.Fatalf("replace floorplan: %v", err)
	}
	return s
}

func placementRefs(t *testing.T, s *DB) map[string]bool {
	t.Helper()
	fp, err := s.GetFloorplanGraph(context.Background())
	if err != nil {
		t.Fatalf("get floorplan graph: %v", err)
	}
	if fp == nil {
		t.Fatal("floorplan is nil")
	}
	refs := make(map[string]bool, len(fp.Placements))
	for _, p := range fp.Placements {
		refs[string(p.MemberType)+":"+p.MemberID] = true
	}
	return refs
}

func TestReplaceFloorplanRoundtripsPlacements(t *testing.T) {
	s := seedPlacedPlan(t)

	fp, err := s.GetFloorplanGraph(context.Background())
	if err != nil {
		t.Fatalf("get floorplan graph: %v", err)
	}
	if len(fp.Placements) != 2 {
		t.Fatalf("placements = %d, want 2", len(fp.Placements))
	}
	for _, p := range fp.Placements {
		switch p.MemberType {
		case device.TargetDevice:
			if p.MemberID != "dev-1" || p.X != 1.5 || p.Y != 2.25 {
				t.Errorf("device placement = %s (%v, %v), want dev-1 (1.5, 2.25)", p.MemberID, p.X, p.Y)
			}
		case device.TargetGroup:
			if p.MemberID != "grp-1" || p.X != 3 || p.Y != 1 {
				t.Errorf("group placement = %s (%v, %v), want grp-1 (3, 1)", p.MemberID, p.X, p.Y)
			}
		default:
			t.Errorf("unexpected placement member type %q", p.MemberType)
		}
	}
}

func TestReplaceFloorplanRoundtripsOpenings(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	want := []FloorplanOpening{
		{ID: "open-1", WallID: "wall-1", T: 0.25, Width: 0.9, Kind: FloorplanOpeningDoor},
		{ID: "open-2", WallID: "wall-1", T: 0.75, Width: 1.2, Kind: FloorplanOpeningWindow},
		{ID: "open-3", WallID: "wall-1", T: 0, Width: 1.1, Kind: FloorplanOpeningCased},
	}
	if err := s.ReplaceFloorplan(ctx, ReplaceFloorplanParams{
		ID:       "fp-1",
		Name:     "Home",
		Vertices: []FloorplanVertex{{ID: "vtx-a"}, {ID: "vtx-b", X: 4}},
		Walls:    []FloorplanWall{{ID: "wall-1", VertexA: "vtx-a", VertexB: "vtx-b", Thickness: 0.1}},
		Openings: want,
	}); err != nil {
		t.Fatalf("replace floorplan: %v", err)
	}

	fp, err := s.GetFloorplanGraph(ctx)
	if err != nil {
		t.Fatalf("get floorplan graph: %v", err)
	}
	got := make(map[string]FloorplanOpening, len(fp.Openings))
	for _, o := range fp.Openings {
		got[o.ID] = o
	}
	if len(got) != len(want) {
		t.Fatalf("openings = %d, want %d", len(got), len(want))
	}
	for _, w := range want {
		if got[w.ID] != w {
			t.Errorf("opening %q = %+v, want %+v", w.ID, got[w.ID], w)
		}
	}
}

func TestReplaceFloorplanRoundtripsDoorBindings(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	if err := s.UpsertDevice(ctx, CreateDeviceParams{
		ID:           "door-1",
		FriendlyName: "Entry contact",
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Sensor,
		Capabilities: []device.Capability{{Name: device.CapContact, Access: 1}},
	}); err != nil {
		t.Fatalf("upsert device: %v", err)
	}
	if err := s.ReplaceFloorplan(ctx, ReplaceFloorplanParams{
		ID:       "fp-1",
		Name:     "Home",
		Vertices: []FloorplanVertex{{ID: "vtx-a"}, {ID: "vtx-b", X: 4}},
		Walls:    []FloorplanWall{{ID: "wall-1", VertexA: "vtx-a", VertexB: "vtx-b", Thickness: 0.1}},
		Openings: []FloorplanOpening{{ID: "open-1", WallID: "wall-1", T: 0.5, Width: 0.9, Kind: FloorplanOpeningDoor}},
		DoorBindings: []FloorplanDoorBinding{{
			OpeningID: "open-1",
			DeviceID:  "door-1",
			HingeSide: FloorplanDoorHingeEnd,
			SwingSide: FloorplanDoorSwingRight,
		}},
	}); err != nil {
		t.Fatalf("replace floorplan: %v", err)
	}

	fp, err := s.GetFloorplanGraph(ctx)
	if err != nil {
		t.Fatalf("get floorplan: %v", err)
	}
	if len(fp.DoorBindings) != 1 {
		t.Fatalf("door bindings = %d, want 1", len(fp.DoorBindings))
	}
	want := FloorplanDoorBinding{OpeningID: "open-1", DeviceID: "door-1", HingeSide: FloorplanDoorHingeEnd, SwingSide: FloorplanDoorSwingRight}
	if fp.DoorBindings[0] != want {
		t.Fatalf("door binding = %+v, want %+v", fp.DoorBindings[0], want)
	}
}

func TestDoorBindingBlocksRoleChangeAndIsClearedWithDevice(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	d, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID:           "door-1",
		FriendlyName: "Entry contact",
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Sensor,
		Capabilities: []device.Capability{{Name: device.CapContact, Access: 1}},
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}
	d, err = s.UpdateDevice(ctx, UpdateDeviceParams{
		ID:        d.ID,
		Available: d.Available,
		SetRoles:  true,
		Roles:     device.DeviceRoles{Contact: device.Ptr(device.ContactRoleDoor)},
	})
	if err != nil {
		t.Fatalf("set door role: %v", err)
	}
	if err := s.ReplaceFloorplan(ctx, ReplaceFloorplanParams{
		ID:       "fp-1",
		Name:     "Home",
		Vertices: []FloorplanVertex{{ID: "vtx-a"}, {ID: "vtx-b", X: 4}},
		Walls:    []FloorplanWall{{ID: "wall-1", VertexA: "vtx-a", VertexB: "vtx-b", Thickness: 0.1}},
		Openings: []FloorplanOpening{{ID: "open-1", WallID: "wall-1", T: 0.5, Width: 0.9, Kind: FloorplanOpeningDoor}},
		DoorBindings: []FloorplanDoorBinding{{
			OpeningID: "open-1",
			DeviceID:  d.ID,
			HingeSide: FloorplanDoorHingeStart,
			SwingSide: FloorplanDoorSwingLeft,
		}},
	}); err != nil {
		t.Fatalf("replace floorplan: %v", err)
	}

	_, err = s.UpdateDevice(ctx, UpdateDeviceParams{
		ID:       d.ID,
		SetRoles: true,
		Roles:    device.DeviceRoles{Contact: device.Ptr(device.ContactRoleWindow)},
	})
	if err == nil || err.Error() != "Detach this sensor from its map door before changing its contact role." {
		t.Fatalf("role update error = %v", err)
	}

	if err := s.PurgeDevice(ctx, d.ID); err != nil {
		t.Fatalf("delete device: %v", err)
	}
	fp, err := s.GetFloorplanGraph(ctx)
	if err != nil {
		t.Fatalf("get floorplan: %v", err)
	}
	if len(fp.DoorBindings) != 0 {
		t.Fatalf("door bindings after delete = %+v", fp.DoorBindings)
	}
}

func TestReplaceFloorplanRejectsOutOfRangeOpenings(t *testing.T) {
	base := ReplaceFloorplanParams{
		ID:       "fp-1",
		Name:     "Home",
		Vertices: []FloorplanVertex{{ID: "vtx-a"}, {ID: "vtx-b", X: 4}},
		Walls:    []FloorplanWall{{ID: "wall-1", VertexA: "vtx-a", VertexB: "vtx-b", Thickness: 0.1}},
	}
	cases := map[string]FloorplanOpening{
		"t above one":   {ID: "open-1", WallID: "wall-1", T: 1.5, Width: 0.9, Kind: FloorplanOpeningDoor},
		"negative t":    {ID: "open-1", WallID: "wall-1", T: -0.1, Width: 0.9, Kind: FloorplanOpeningDoor},
		"zero width":    {ID: "open-1", WallID: "wall-1", T: 0.5, Width: 0, Kind: FloorplanOpeningDoor},
		"unknown kind":  {ID: "open-1", WallID: "wall-1", T: 0.5, Width: 0.9, Kind: "hatch"},
		"empty kind":    {ID: "open-1", WallID: "wall-1", T: 0.5, Width: 0.9, Kind: ""},
		"negative wide": {ID: "open-1", WallID: "wall-1", T: 0.5, Width: -1, Kind: FloorplanOpeningDoor},
	}
	for name, opening := range cases {
		t.Run(name, func(t *testing.T) {
			s := newTestStore(t)
			params := base
			params.Openings = []FloorplanOpening{opening}
			if err := s.ReplaceFloorplan(context.Background(), params); err == nil {
				t.Fatal("replace floorplan accepted an opening the schema should reject")
			}
		})
	}
}

func TestPurgeDeviceClearsItsPlacement(t *testing.T) {
	s := seedPlacedPlan(t)

	if err := s.PurgeDevice(context.Background(), "dev-1"); err != nil {
		t.Fatalf("purge device: %v", err)
	}

	refs := placementRefs(t, s)
	if refs["device:dev-1"] {
		t.Error("the purged device kept its placement")
	}
	if !refs["group:grp-1"] {
		t.Error("purging a device removed an unrelated group placement")
	}
}

func TestDeleteGroupClearsItsPlacement(t *testing.T) {
	s := seedPlacedPlan(t)

	if err := s.DeleteGroup(context.Background(), "grp-1"); err != nil {
		t.Fatalf("delete group: %v", err)
	}

	refs := placementRefs(t, s)
	if refs["group:grp-1"] {
		t.Error("the deleted group kept its placement")
	}
	if !refs["device:dev-1"] {
		t.Error("deleting a group removed an unrelated device placement")
	}
}

func TestBatchDeleteGroupsClearsPlacements(t *testing.T) {
	s := seedPlacedPlan(t)

	n, err := s.BatchDeleteGroups(context.Background(), []string{"grp-1"})
	if err != nil {
		t.Fatalf("batch delete groups: %v", err)
	}
	if n != 1 {
		t.Errorf("deleted = %d, want 1", n)
	}

	refs := placementRefs(t, s)
	if refs["group:grp-1"] {
		t.Error("the batch-deleted group kept its placement")
	}
	if !refs["device:dev-1"] {
		t.Error("batch deleting a group removed an unrelated device placement")
	}
}
