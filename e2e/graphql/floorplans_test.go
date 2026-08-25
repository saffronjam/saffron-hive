//go:build e2e

package graphql_test

import (
	"context"
	"encoding/json"
	"strings"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

const floorplanFields = `
	id name
	vertices { id x y }
	walls { id vertexA vertexB thickness curveX curveY }
	openings { id wallId t width kind }
	doorBindings { openingId deviceId hingeSide swingSide }
	rooms { id name roomId vertexIds }
	placements { memberType memberId x y }
	furniture { id kind x y width height rotation occluder }
`

type floorplanResult struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Vertices []struct {
		ID string  `json:"id"`
		X  float64 `json:"x"`
		Y  float64 `json:"y"`
	} `json:"vertices"`
	Walls []struct {
		ID        string   `json:"id"`
		VertexA   string   `json:"vertexA"`
		VertexB   string   `json:"vertexB"`
		Thickness float64  `json:"thickness"`
		CurveX    *float64 `json:"curveX"`
		CurveY    *float64 `json:"curveY"`
	} `json:"walls"`
	Openings []struct {
		ID     string  `json:"id"`
		WallID string  `json:"wallId"`
		T      float64 `json:"t"`
		Width  float64 `json:"width"`
		Kind   string  `json:"kind"`
	} `json:"openings"`
	DoorBindings []struct {
		OpeningID string `json:"openingId"`
		DeviceID  string `json:"deviceId"`
		HingeSide string `json:"hingeSide"`
		SwingSide string `json:"swingSide"`
	} `json:"doorBindings"`
	Rooms []struct {
		ID        string   `json:"id"`
		Name      *string  `json:"name"`
		RoomID    *string  `json:"roomId"`
		VertexIds []string `json:"vertexIds"`
	} `json:"rooms"`
	Placements []struct {
		MemberType string  `json:"memberType"`
		MemberID   string  `json:"memberId"`
		X          float64 `json:"x"`
		Y          float64 `json:"y"`
	} `json:"placements"`
	Furniture []struct {
		ID       string  `json:"id"`
		Kind     string  `json:"kind"`
		X        float64 `json:"x"`
		Y        float64 `json:"y"`
		Width    float64 `json:"width"`
		Height   float64 `json:"height"`
		Rotation float64 `json:"rotation"`
		Occluder bool    `json:"occluder"`
	} `json:"furniture"`
}

func saveFloorplan(t *testing.T, input map[string]any) floorplanResult {
	t.Helper()
	data, err := graphqlMutation(`mutation($input: UpdateFloorplanInput!) {
		updateFloorplan(input: $input) {`+floorplanFields+`}
	}`, map[string]any{"input": input})
	if err != nil {
		t.Fatalf("update floorplan: %v", err)
	}
	var result struct {
		UpdateFloorplan floorplanResult `json:"updateFloorplan"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	return result.UpdateFloorplan
}

func queryFloorplan(t *testing.T) *floorplanResult {
	t.Helper()
	data, err := graphqlQuery(`{ floorplan {`+floorplanFields+`} }`, nil)
	if err != nil {
		t.Fatalf("query floorplan: %v", err)
	}
	var result struct {
		Floorplan *floorplanResult `json:"floorplan"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	return result.Floorplan
}

func squareFloorplanInput(placements ...map[string]any) map[string]any {
	input := map[string]any{
		"id":   "fplan-e2e",
		"name": "Home",
		"vertices": []map[string]any{
			{"id": "vtx-a", "x": 0.0, "y": 0.0},
			{"id": "vtx-b", "x": 4.0, "y": 0.0},
			{"id": "vtx-c", "x": 4.0, "y": 3.0},
			{"id": "vtx-d", "x": 0.0, "y": 3.0},
		},
		"walls": []map[string]any{
			{"id": "wall-1", "vertexA": "vtx-a", "vertexB": "vtx-b", "thickness": 0.1},
			{"id": "wall-2", "vertexA": "vtx-b", "vertexB": "vtx-c", "thickness": 0.1},
			{"id": "wall-3", "vertexA": "vtx-c", "vertexB": "vtx-d", "thickness": 0.2, "curveX": 2.0, "curveY": 3.5},
			{"id": "wall-4", "vertexA": "vtx-d", "vertexB": "vtx-a", "thickness": 0.1},
		},
		"openings": []map[string]any{
			{"id": "open-1", "wallId": "wall-1", "t": 0.25, "width": 0.9, "kind": "DOOR"},
			{"id": "open-2", "wallId": "wall-2", "t": 0.5, "width": 1.2, "kind": "WINDOW"},
		},
		"doorBindings": []map[string]any{},
		"rooms": []map[string]any{
			{"id": "froom-1", "name": "Studio", "vertexIds": []string{"vtx-a", "vtx-b", "vtx-c", "vtx-d"}},
		},
		"placements": placements,
		"furniture":  []map[string]any{},
	}
	if placements == nil {
		input["placements"] = []map[string]any{}
	}
	return input
}

func furniturePiece(id, kind string, x, y, w, h, rot float64, occluder bool) map[string]any {
	return map[string]any{
		"id": id, "kind": kind, "x": x, "y": y,
		"width": w, "height": h, "rotation": rot, "occluder": occluder,
	}
}

func devicePlacement(id string, x, y float64) map[string]any {
	return map[string]any{"memberType": "device", "memberId": id, "x": x, "y": y}
}

func groupPlacement(id string, x, y float64) map[string]any {
	return map[string]any{"memberType": "group", "memberId": id, "x": x, "y": y}
}

func TestFloorplan_SaveAndQueryRoundtrip(t *testing.T) {
	deviceID, err := queryDeviceIDByName("Living Room Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	saved := saveFloorplan(t, squareFloorplanInput(devicePlacement(deviceID, 1.5, 2.25)))
	if saved.ID != "fplan-e2e" || saved.Name != "Home" {
		t.Errorf("saved plan = %s/%s, want fplan-e2e/Home", saved.ID, saved.Name)
	}

	fp := queryFloorplan(t)
	if fp == nil {
		t.Fatal("floorplan query returned null after save")
	}
	if len(fp.Vertices) != 4 || len(fp.Walls) != 4 || len(fp.Rooms) != 1 || len(fp.Placements) != 1 {
		t.Fatalf("counts = %d vertices, %d walls, %d rooms, %d placements; want 4/4/1/1",
			len(fp.Vertices), len(fp.Walls), len(fp.Rooms), len(fp.Placements))
	}

	walls := make(map[string]struct {
		VertexA   string
		Thickness float64
		CurveX    *float64
		CurveY    *float64
	}, len(fp.Walls))
	for _, w := range fp.Walls {
		walls[w.ID] = struct {
			VertexA   string
			Thickness float64
			CurveX    *float64
			CurveY    *float64
		}{w.VertexA, w.Thickness, w.CurveX, w.CurveY}
	}
	if w, ok := walls["wall-3"]; !ok {
		t.Error("wall-3 missing from roundtrip")
	} else {
		if w.Thickness != 0.2 {
			t.Errorf("wall-3 thickness = %v, want 0.2", w.Thickness)
		}
		if w.CurveX == nil || *w.CurveX != 2.0 || w.CurveY == nil || *w.CurveY != 3.5 {
			t.Errorf("wall-3 curve = %v/%v, want 2/3.5", w.CurveX, w.CurveY)
		}
	}
	if w, ok := walls["wall-1"]; !ok {
		t.Error("wall-1 missing from roundtrip")
	} else if w.CurveX != nil || w.CurveY != nil {
		t.Errorf("wall-1 curve = %v/%v, want null/null", w.CurveX, w.CurveY)
	}

	openings := make(map[string]struct {
		WallID string
		T      float64
		Width  float64
		Kind   string
	}, len(fp.Openings))
	for _, o := range fp.Openings {
		openings[o.ID] = struct {
			WallID string
			T      float64
			Width  float64
			Kind   string
		}{o.WallID, o.T, o.Width, o.Kind}
	}
	if len(openings) != 2 {
		t.Errorf("openings = %+v, want open-1 and open-2", fp.Openings)
	}
	if o, ok := openings["open-1"]; !ok {
		t.Error("open-1 missing from roundtrip")
	} else if o.WallID != "wall-1" || o.T != 0.25 || o.Width != 0.9 || o.Kind != "DOOR" {
		t.Errorf("open-1 = %+v, want wall-1 t=0.25 width=0.9 DOOR", o)
	}
	if o, ok := openings["open-2"]; !ok {
		t.Error("open-2 missing from roundtrip")
	} else if o.WallID != "wall-2" || o.T != 0.5 || o.Width != 1.2 || o.Kind != "WINDOW" {
		t.Errorf("open-2 = %+v, want wall-2 t=0.5 width=1.2 WINDOW", o)
	}

	room := fp.Rooms[0]
	if room.ID != "froom-1" {
		t.Errorf("room id = %q, want froom-1", room.ID)
	}
	if room.Name == nil || *room.Name != "Studio" {
		t.Errorf("room name = %v, want Studio", room.Name)
	}
	if room.RoomID != nil {
		t.Errorf("room roomId = %v, want null", room.RoomID)
	}
	if len(room.VertexIds) != 4 || room.VertexIds[0] != "vtx-a" {
		t.Errorf("room vertexIds = %v, want [vtx-a vtx-b vtx-c vtx-d]", room.VertexIds)
	}

	p := fp.Placements[0]
	if p.MemberType != "device" || p.MemberID != deviceID || p.X != 1.5 || p.Y != 2.25 {
		t.Errorf("placement = %s/%s (%v, %v), want device/%s (1.5, 2.25)", p.MemberType, p.MemberID, p.X, p.Y, deviceID)
	}
}

func TestFloorplan_DoorBindingRoundtripAndIntegrity(t *testing.T) {
	ctx := context.Background()
	d, err := sqlStore.CreateDevice(ctx, store.CreateDeviceParams{
		ID:           "floorplan-door-contact",
		FriendlyName: "Floorplan door contact",
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Sensor,
		Capabilities: []device.Capability{{Name: device.CapContact, Access: 1}},
	})
	if err != nil {
		t.Fatalf("create door sensor: %v", err)
	}
	defer func() { _ = sqlStore.PurgeDevice(ctx, d.ID) }()
	d, err = sqlStore.UpdateDevice(ctx, store.UpdateDeviceParams{
		ID:        d.ID,
		Available: d.Available,
		SetRoles:  true,
		Roles:     device.DeviceRoles{Contact: device.Ptr(device.ContactRoleDoor)},
	})
	if err != nil {
		t.Fatalf("set door role: %v", err)
	}

	input := squareFloorplanInput()
	input["doorBindings"] = []map[string]any{
		{
			"openingId": "open-1",
			"deviceId":  string(d.ID),
			"hingeSide": "END",
			"swingSide": "RIGHT",
		},
	}
	saved := saveFloorplan(t, input)
	if len(saved.DoorBindings) != 1 {
		t.Fatalf("door bindings = %+v, want one", saved.DoorBindings)
	}
	binding := saved.DoorBindings[0]
	if binding.OpeningID != "open-1" || binding.DeviceID != string(d.ID) || binding.HingeSide != "END" || binding.SwingSide != "RIGHT" {
		t.Fatalf("door binding = %+v", binding)
	}

	_, err = graphqlMutation(`mutation($id: ID!) {
		updateDevice(id: $id, input: { roles: { contact: WINDOW } }) { id }
	}`, map[string]any{"id": string(d.ID)})
	if err == nil || !strings.Contains(err.Error(), "Detach this sensor from its map door") {
		t.Fatalf("role update error = %v", err)
	}

	if err := sqlStore.PurgeDevice(ctx, d.ID); err != nil {
		t.Fatalf("delete door sensor: %v", err)
	}
	fp := queryFloorplan(t)
	if fp == nil || len(fp.DoorBindings) != 0 {
		t.Fatalf("door bindings after device delete = %+v", fp)
	}
}

func TestFloorplan_SecondSaveReplaces(t *testing.T) {
	saveFloorplan(t, squareFloorplanInput())

	replacement := map[string]any{
		"id":   "fplan-e2e",
		"name": "Home v2",
		"vertices": []map[string]any{
			{"id": "vtx-p", "x": 0.0, "y": 0.0},
			{"id": "vtx-q", "x": 6.0, "y": 0.0},
		},
		"walls": []map[string]any{
			{"id": "wall-pq", "vertexA": "vtx-p", "vertexB": "vtx-q", "thickness": 0.1},
		},
		"openings":     []map[string]any{},
		"doorBindings": []map[string]any{},
		"rooms":        []map[string]any{},
		"placements":   []map[string]any{},
		"furniture":    []map[string]any{},
	}
	saved := saveFloorplan(t, replacement)
	if saved.Name != "Home v2" {
		t.Errorf("saved name = %q, want Home v2", saved.Name)
	}

	fp := queryFloorplan(t)
	if fp == nil {
		t.Fatal("floorplan query returned null after save")
	}
	if len(fp.Vertices) != 2 || len(fp.Walls) != 1 || len(fp.Rooms) != 0 || len(fp.Placements) != 0 {
		t.Fatalf("counts = %d vertices, %d walls, %d rooms, %d placements; want 2/1/0/0",
			len(fp.Vertices), len(fp.Walls), len(fp.Rooms), len(fp.Placements))
	}
	if len(fp.Openings) != 0 {
		t.Errorf("openings = %+v, want none after the replace", fp.Openings)
	}
	for _, w := range fp.Walls {
		if w.ID != "wall-pq" {
			t.Errorf("unexpected wall %q survived the replace", w.ID)
		}
	}
	for _, v := range fp.Vertices {
		if v.ID != "vtx-p" && v.ID != "vtx-q" {
			t.Errorf("unexpected vertex %q survived the replace", v.ID)
		}
	}
}

func TestFloorplan_PlacementRemovedWithDevice(t *testing.T) {
	// Outdoor Sensor is not referenced by any test that runs after this one,
	// so deleting its row cannot disturb the rest of the suite.
	deviceID, err := queryDeviceIDByName("Outdoor Sensor")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	saveFloorplan(t, squareFloorplanInput(devicePlacement(deviceID, 1.5, 2.25)))
	fp := queryFloorplan(t)
	if fp == nil || len(fp.Placements) != 1 {
		t.Fatalf("expected 1 placement before device delete, got %+v", fp)
	}

	if err := sqlStore.PurgeDevice(context.Background(), device.DeviceID(deviceID)); err != nil {
		t.Fatalf("delete device: %v", err)
	}

	fp = queryFloorplan(t)
	if fp == nil {
		t.Fatal("floorplan query returned null after device delete")
	}
	if len(fp.Placements) != 0 {
		t.Errorf("placements = %+v, want none after device delete", fp.Placements)
	}
	if len(fp.Vertices) != 4 || len(fp.Walls) != 4 {
		t.Errorf("plan geometry changed on device delete: %d vertices, %d walls", len(fp.Vertices), len(fp.Walls))
	}
}

func TestFloorplan_GroupPlacementRoundtripsAndIsRemovedWithGroup(t *testing.T) {
	deviceID, err := queryDeviceIDByName("Living Room Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	data, err := graphqlMutation(`mutation { createGroup(input: { name: "Map Placed Group" }) { id } }`, nil)
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	var created struct {
		CreateGroup struct {
			ID string `json:"id"`
		} `json:"createGroup"`
	}
	if err := json.Unmarshal(data, &created); err != nil {
		t.Fatalf("unmarshal group: %v", err)
	}
	groupID := created.CreateGroup.ID

	saveFloorplan(t, squareFloorplanInput(
		devicePlacement(deviceID, 1.5, 2.25),
		groupPlacement(groupID, 3.0, 0.75),
	))

	fp := queryFloorplan(t)
	if fp == nil || len(fp.Placements) != 2 {
		t.Fatalf("expected 2 placements after save, got %+v", fp)
	}
	var group *struct {
		MemberType string  `json:"memberType"`
		MemberID   string  `json:"memberId"`
		X          float64 `json:"x"`
		Y          float64 `json:"y"`
	}
	for i := range fp.Placements {
		if fp.Placements[i].MemberType == "group" {
			group = &fp.Placements[i]
		}
	}
	if group == nil {
		t.Fatalf("no group placement in %+v", fp.Placements)
	}
	if group.MemberID != groupID || group.X != 3.0 || group.Y != 0.75 {
		t.Errorf("group placement = %s (%v, %v), want %s (3, 0.75)", group.MemberID, group.X, group.Y, groupID)
	}

	if _, err := graphqlMutation(`mutation($id: ID!) { deleteGroup(id: $id) }`, map[string]any{"id": groupID}); err != nil {
		t.Fatalf("delete group: %v", err)
	}

	fp = queryFloorplan(t)
	if fp == nil {
		t.Fatal("floorplan query returned null after group delete")
	}
	if len(fp.Placements) != 1 {
		t.Fatalf("placements = %+v, want only the device placement after group delete", fp.Placements)
	}
	if fp.Placements[0].MemberType != "device" || fp.Placements[0].MemberID != deviceID {
		t.Errorf("surviving placement = %s/%s, want device/%s",
			fp.Placements[0].MemberType, fp.Placements[0].MemberID, deviceID)
	}
	if len(fp.Vertices) != 4 || len(fp.Walls) != 4 {
		t.Errorf("plan geometry changed on group delete: %d vertices, %d walls", len(fp.Vertices), len(fp.Walls))
	}
}

func TestFloorplan_RejectsOpeningOnAWallOutsideThePlan(t *testing.T) {
	input := squareFloorplanInput()
	input["openings"] = []map[string]any{
		{"id": "open-x", "wallId": "wall-missing", "t": 0.5, "width": 0.9, "kind": "DOOR"},
	}
	if _, err := graphqlMutation(`mutation($input: UpdateFloorplanInput!) {
		updateFloorplan(input: $input) { id }
	}`, map[string]any{"input": input}); err == nil {
		t.Fatal("expected an error for an opening on a wall the plan does not contain")
	}
}

func TestFloorplan_RejectsUnknownPlacementMemberType(t *testing.T) {
	deviceID, err := queryDeviceIDByName("Living Room Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	input := squareFloorplanInput(map[string]any{
		"memberType": "room", "memberId": deviceID, "x": 1.0, "y": 1.0,
	})
	if _, err := graphqlMutation(`mutation($input: UpdateFloorplanInput!) {
		updateFloorplan(input: $input) { id }
	}`, map[string]any{"input": input}); err == nil {
		t.Fatal("expected an error for a memberType that is neither device nor group")
	}
}

func TestFloorplan_FurnitureRoundtripsAndReplaces(t *testing.T) {
	input := squareFloorplanInput()
	input["furniture"] = []map[string]any{
		furniturePiece("furn-1", "bed-double", 1.5, 1.25, 1.8, 2.0, 90, false),
		furniturePiece("furn-2", "box", 3.2, 2.4, 1.0, 0.6, 0, true),
	}
	got := saveFloorplan(t, input)
	if len(got.Furniture) != 2 {
		t.Fatalf("furniture count = %d, want 2", len(got.Furniture))
	}
	byID := map[string]int{}
	for i, f := range got.Furniture {
		byID[f.ID] = i
	}
	bed := got.Furniture[byID["furn-1"]]
	if bed.Kind != "bed-double" || bed.Width != 1.8 || bed.Height != 2.0 || bed.Rotation != 90 || bed.Occluder {
		t.Fatalf("bed round-tripped as %+v", bed)
	}
	box := got.Furniture[byID["furn-2"]]
	if !box.Occluder || box.X != 3.2 || box.Y != 2.4 {
		t.Fatalf("box round-tripped as %+v", box)
	}

	// A second save replaces the list wholesale, like every other child list.
	input["furniture"] = []map[string]any{furniturePiece("furn-2", "box", 1, 1, 1, 1, 0, false)}
	got = saveFloorplan(t, input)
	if len(got.Furniture) != 1 || got.Furniture[0].ID != "furn-2" || got.Furniture[0].Occluder {
		t.Fatalf("after replace, furniture = %+v", got.Furniture)
	}
}

func TestFloorplan_NormalizesFurnitureRotation(t *testing.T) {
	input := squareFloorplanInput()
	input["furniture"] = []map[string]any{furniturePiece("furn-1", "box", 1, 1, 1, 1, -90, false)}
	got := saveFloorplan(t, input)
	if len(got.Furniture) != 1 || got.Furniture[0].Rotation != 270 {
		t.Fatalf("rotation = %v, want 270", got.Furniture[0].Rotation)
	}
}

func TestFloorplan_RejectsUnknownFurnitureKind(t *testing.T) {
	input := squareFloorplanInput()
	input["furniture"] = []map[string]any{furniturePiece("furn-1", "hovercraft", 1, 1, 1, 1, 0, false)}
	if _, err := graphqlMutation(`mutation($input: UpdateFloorplanInput!) {
		updateFloorplan(input: $input) { id }
	}`, map[string]any{"input": input}); err == nil {
		t.Fatal("expected an error for a furniture kind the catalogue has no shape for")
	}
}

func TestFloorplan_RejectsFurnitureWithoutSize(t *testing.T) {
	input := squareFloorplanInput()
	input["furniture"] = []map[string]any{furniturePiece("furn-1", "box", 1, 1, 0, 1, 0, false)}
	if _, err := graphqlMutation(`mutation($input: UpdateFloorplanInput!) {
		updateFloorplan(input: $input) { id }
	}`, map[string]any{"input": input}); err == nil {
		t.Fatal("expected an error for furniture with a zero width")
	}
}
