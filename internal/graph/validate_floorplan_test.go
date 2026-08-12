package graph

import (
	"context"
	"math"
	"strings"
	"testing"

	"github.com/99designs/gqlgen/graphql"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func floorplanInput(rooms []*model.FloorplanRoomInput, placements []*model.FloorplanPlacementInput) model.UpdateFloorplanInput {
	return model.UpdateFloorplanInput{
		ID:         "fp-1",
		Name:       "Home",
		Rooms:      rooms,
		Placements: placements,
	}
}

func linkedRoomInput(id, roomID string) *model.FloorplanRoomInput {
	return &model.FloorplanRoomInput{
		ID:        id,
		RoomID:    graphql.OmittableOf(&roomID),
		VertexIds: []string{},
	}
}

// openingInput builds a plan holding one wall and the given openings on it, so
// a case only has to state what makes it invalid.
func openingInput(openings ...*model.FloorplanOpeningInput) model.UpdateFloorplanInput {
	input := floorplanInput(nil, nil)
	input.Walls = []*model.FloorplanWallInput{
		{ID: "wall-1", VertexA: "vtx-a", VertexB: "vtx-b", Thickness: 0.1},
	}
	input.Openings = openings
	return input
}

func doorInput(id string, t, width float64) *model.FloorplanOpeningInput {
	return &model.FloorplanOpeningInput{
		ID:     id,
		WallID: "wall-1",
		T:      t,
		Width:  width,
		Kind:   model.FloorplanOpeningKindDoor,
	}
}

func seedRoom(t *testing.T, st *mockStore, id, name string) {
	t.Helper()
	if _, err := st.CreateRoom(context.Background(), store.CreateRoomParams{ID: id, Name: name}); err != nil {
		t.Fatalf("seed room: %v", err)
	}
}

func seedGroup(t *testing.T, st *mockStore, id, name string) {
	t.Helper()
	if _, err := st.CreateGroup(context.Background(), store.CreateGroupParams{ID: id, Name: name}); err != nil {
		t.Fatalf("seed group: %v", err)
	}
}

func devicePlacement(id string, x, y float64) *model.FloorplanPlacementInput {
	return &model.FloorplanPlacementInput{MemberType: "device", MemberID: id, X: x, Y: y}
}

func groupPlacement(id string, x, y float64) *model.FloorplanPlacementInput {
	return &model.FloorplanPlacementInput{MemberType: "group", MemberID: id, X: x, Y: y}
}

func TestValidateFloorplanInput_AcceptsValidInput(t *testing.T) {
	st := newMockStore()
	seedRoom(t, st, "r-1", "Kitchen")
	seedGroup(t, st, "g-1", "Ceiling lights")
	st.putDevice(device.Device{ID: "d-1"})

	input := floorplanInput(
		[]*model.FloorplanRoomInput{
			linkedRoomInput("fr-1", "r-1"),
			{ID: "fr-2", VertexIds: []string{}},
		},
		[]*model.FloorplanPlacementInput{
			devicePlacement("d-1", 1.5, 2.5),
			groupPlacement("g-1", 3.0, 0.5),
		},
	)
	if err := validateFloorplanInput(context.Background(), st, input); err != nil {
		t.Fatalf("expected valid, got error: %v", err)
	}
}

func TestValidateFloorplanInput_AcceptsOpeningsOnAKnownWall(t *testing.T) {
	st := newMockStore()

	input := openingInput(doorInput("open-1", 0.25, 0.9), doorInput("open-2", 1, 1.2))
	if err := validateFloorplanInput(context.Background(), st, input); err != nil {
		t.Fatalf("expected valid, got error: %v", err)
	}
}

func TestValidateFloorplanInput_RejectsOpeningOnUnknownWall(t *testing.T) {
	st := newMockStore()

	opening := doorInput("open-1", 0.5, 0.9)
	opening.WallID = "wall-missing"
	err := validateFloorplanInput(context.Background(), st, openingInput(opening))
	if err == nil {
		t.Fatal("expected error for an opening on a wall outside the plan")
	}
	if !strings.Contains(err.Error(), "wall-missing") {
		t.Errorf("error should name the unknown wall id: %v", err)
	}
}

func TestValidateFloorplanInput_RejectsOpeningOutsideItsWall(t *testing.T) {
	st := newMockStore()

	for name, opening := range map[string]*model.FloorplanOpeningInput{
		"t above one": doorInput("open-1", 1.5, 0.9),
		"negative t":  doorInput("open-1", -0.5, 0.9),
		"zero width":  doorInput("open-1", 0.5, 0),
	} {
		t.Run(name, func(t *testing.T) {
			err := validateFloorplanInput(context.Background(), st, openingInput(opening))
			if err == nil {
				t.Fatal("expected error for an out-of-range opening")
			}
			if !strings.Contains(err.Error(), "open-1") {
				t.Errorf("error should name the opening id: %v", err)
			}
		})
	}
}

func TestValidateFloorplanInput_RejectsDuplicateOpeningID(t *testing.T) {
	st := newMockStore()

	err := validateFloorplanInput(
		context.Background(),
		st,
		openingInput(doorInput("open-1", 0.25, 0.9), doorInput("open-1", 0.75, 0.9)),
	)
	if err == nil {
		t.Fatal("expected error for a repeated opening id")
	}
	if !strings.Contains(err.Error(), "open-1") {
		t.Errorf("error should name the duplicated opening id: %v", err)
	}
}

func TestValidateFloorplanInput_RejectsUnknownRoom(t *testing.T) {
	st := newMockStore()

	input := floorplanInput([]*model.FloorplanRoomInput{linkedRoomInput("fr-1", "missing-room")}, nil)
	err := validateFloorplanInput(context.Background(), st, input)
	if err == nil {
		t.Fatal("expected error for unknown roomId")
	}
	if !strings.Contains(err.Error(), "missing-room") || !strings.Contains(err.Error(), "not found") {
		t.Errorf("error should name the unknown room id: %v", err)
	}
}

func TestValidateFloorplanInput_RejectsDuplicateRoomLink(t *testing.T) {
	st := newMockStore()
	seedRoom(t, st, "r-1", "Kitchen")

	input := floorplanInput([]*model.FloorplanRoomInput{
		linkedRoomInput("fr-1", "r-1"),
		linkedRoomInput("fr-2", "r-1"),
	}, nil)
	err := validateFloorplanInput(context.Background(), st, input)
	if err == nil {
		t.Fatal("expected error for two faces linking the same room")
	}
	if !strings.Contains(err.Error(), "Kitchen") {
		t.Errorf("error should name the Hive room: %v", err)
	}
}

func TestValidateFloorplanInput_RejectsUnknownPlacementDevice(t *testing.T) {
	st := newMockStore()

	input := floorplanInput(nil, []*model.FloorplanPlacementInput{devicePlacement("d-missing", 0, 0)})
	err := validateFloorplanInput(context.Background(), st, input)
	if err == nil {
		t.Fatal("expected error for unknown placement memberId")
	}
	if !strings.Contains(err.Error(), "d-missing") || !strings.Contains(err.Error(), "not found") {
		t.Errorf("error should name the unknown device id: %v", err)
	}
}

func TestValidateFloorplanInput_RejectsUnknownPlacementGroup(t *testing.T) {
	st := newMockStore()

	input := floorplanInput(nil, []*model.FloorplanPlacementInput{groupPlacement("g-missing", 0, 0)})
	err := validateFloorplanInput(context.Background(), st, input)
	if err == nil {
		t.Fatal("expected error for unknown placement group")
	}
	if !strings.Contains(err.Error(), "g-missing") || !strings.Contains(err.Error(), "not found") {
		t.Errorf("error should name the unknown group id: %v", err)
	}
}

func TestValidateFloorplanInput_RejectsUnknownMemberType(t *testing.T) {
	st := newMockStore()
	seedRoom(t, st, "r-1", "Kitchen")

	input := floorplanInput(nil, []*model.FloorplanPlacementInput{
		{MemberType: "room", MemberID: "r-1", X: 0, Y: 0},
	})
	err := validateFloorplanInput(context.Background(), st, input)
	if err == nil {
		t.Fatal("expected error for a memberType that is neither device nor group")
	}
	if !strings.Contains(err.Error(), "room") {
		t.Errorf("error should name the rejected memberType: %v", err)
	}
}

func TestValidateFloorplanInput_RejectsDuplicatePlacementRef(t *testing.T) {
	st := newMockStore()
	seedGroup(t, st, "g-1", "Ceiling lights")
	st.putDevice(device.Device{ID: "d-1"})

	input := floorplanInput(nil, []*model.FloorplanPlacementInput{
		groupPlacement("g-1", 0, 0),
		devicePlacement("d-1", 1, 1),
		groupPlacement("g-1", 2, 2),
	})
	err := validateFloorplanInput(context.Background(), st, input)
	if err == nil {
		t.Fatal("expected error for the same ref placed twice")
	}
	if !strings.Contains(err.Error(), "g-1") || !strings.Contains(err.Error(), "more than once") {
		t.Errorf("error should name the duplicated ref: %v", err)
	}
}

func TestUpdateFloorplan_RejectsInvalidInputBeforeSaving(t *testing.T) {
	te := newTestEnv(t)

	resp := te.query(t, `
		mutation($input: UpdateFloorplanInput!) {
			updateFloorplan(input: $input) { id }
		}
	`, map[string]any{
		"input": map[string]any{
			"id":         "fp-1",
			"name":       "Home",
			"vertices":   []any{},
			"walls":      []any{},
			"openings":   []any{},
			"rooms":      []any{map[string]any{"id": "fr-1", "roomId": "missing-room", "vertexIds": []any{}}},
			"placements": []any{},
			"furniture":  []any{},
		},
	})
	if len(resp.Errors) == 0 {
		t.Fatal("expected a GraphQL error for an unknown roomId")
	}
	if !strings.Contains(resp.Errors[0].Message, "missing-room") {
		t.Errorf("error should name the unknown room id: %s", resp.Errors[0].Message)
	}
	if te.store.floorplan != nil {
		t.Error("floorplan was persisted despite failing validation")
	}
}

func furnitureInput(pieces ...*model.FloorplanFurnitureInput) model.UpdateFloorplanInput {
	input := floorplanInput(nil, nil)
	input.Furniture = pieces
	return input
}

func piece(id, kind string) *model.FloorplanFurnitureInput {
	return &model.FloorplanFurnitureInput{
		ID: id, Kind: kind, X: 1, Y: 1, Width: 1, Height: 1, Rotation: 0,
	}
}

func TestValidateFloorplanInput_AcceptsKnownFurniture(t *testing.T) {
	st := newMockStore()
	input := furnitureInput(piece("furn-1", "bed-double"), piece("furn-2", "box"))
	if err := validateFloorplanInput(context.Background(), st, input); err != nil {
		t.Fatalf("valid furniture rejected: %v", err)
	}
}

func TestValidateFloorplanInput_RejectsUnknownFurnitureKind(t *testing.T) {
	st := newMockStore()
	input := furnitureInput(piece("furn-1", "hovercraft"))
	err := validateFloorplanInput(context.Background(), st, input)
	if err == nil || !strings.Contains(err.Error(), "hovercraft") {
		t.Fatalf("error = %v, want one naming the kind", err)
	}
}

func TestValidateFloorplanInput_RejectsFurnitureWithoutPositiveSize(t *testing.T) {
	st := newMockStore()
	for _, tc := range []struct {
		name  string
		mutta func(*model.FloorplanFurnitureInput)
		field string
	}{
		{"zero width", func(p *model.FloorplanFurnitureInput) { p.Width = 0 }, "width"},
		{"negative height", func(p *model.FloorplanFurnitureInput) { p.Height = -1 }, "height"},
		{"NaN width", func(p *model.FloorplanFurnitureInput) { p.Width = math.NaN() }, "width"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			p := piece("furn-1", "box")
			tc.mutta(p)
			err := validateFloorplanInput(context.Background(), st, furnitureInput(p))
			if err == nil || !strings.Contains(err.Error(), tc.field) {
				t.Fatalf("error = %v, want one naming %q", err, tc.field)
			}
		})
	}
}

func TestValidateFloorplanInput_RejectsFurnitureAtAPointThatIsNotANumber(t *testing.T) {
	st := newMockStore()
	p := piece("furn-1", "box")
	p.X = math.Inf(1)
	err := validateFloorplanInput(context.Background(), st, furnitureInput(p))
	if err == nil || !strings.Contains(err.Error(), "not a number") {
		t.Fatalf("error = %v, want one about a point that is not a number", err)
	}
}

func TestValidateFloorplanInput_RejectsDuplicateFurnitureID(t *testing.T) {
	st := newMockStore()
	input := furnitureInput(piece("furn-1", "box"), piece("furn-1", "ellipse"))
	err := validateFloorplanInput(context.Background(), st, input)
	if err == nil || !strings.Contains(err.Error(), "more than once") {
		t.Fatalf("error = %v, want one about a repeated id", err)
	}
}

func TestNormalizeRotation(t *testing.T) {
	for _, tc := range []struct{ in, want float64 }{
		{0, 0}, {90, 90}, {360, 0}, {450, 90}, {-90, 270}, {-370, 350},
	} {
		if got := normalizeRotation(tc.in); got != tc.want {
			t.Fatalf("normalizeRotation(%v) = %v, want %v", tc.in, got, tc.want)
		}
	}
	if got := normalizeRotation(math.NaN()); got != 0 {
		t.Fatalf("normalizeRotation(NaN) = %v, want 0", got)
	}
}
