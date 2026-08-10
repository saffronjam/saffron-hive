package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// GetFloorplanGraph loads the floorplan together with its vertices, walls,
// openings, rooms, and placements. Returns nil when no floorplan has been
// saved yet.
func (s *DB) GetFloorplanGraph(ctx context.Context) (*Floorplan, error) {
	row, err := s.q.GetFloorplan(ctx)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get floorplan: %w", err)
	}

	fp := &Floorplan{
		ID:        row.ID,
		Name:      row.Name,
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
	}

	vertices, err := s.q.ListFloorplanVertices(ctx, fp.ID)
	if err != nil {
		return nil, fmt.Errorf("list floorplan vertices: %w", err)
	}
	fp.Vertices = make([]FloorplanVertex, len(vertices))
	for i, v := range vertices {
		fp.Vertices[i] = FloorplanVertex{ID: v.ID, X: v.X, Y: v.Y}
	}

	walls, err := s.q.ListFloorplanWalls(ctx, fp.ID)
	if err != nil {
		return nil, fmt.Errorf("list floorplan walls: %w", err)
	}
	fp.Walls = make([]FloorplanWall, len(walls))
	for i, w := range walls {
		fp.Walls[i] = FloorplanWall{
			ID:        w.ID,
			VertexA:   w.VertexA,
			VertexB:   w.VertexB,
			Thickness: w.Thickness,
			CurveX:    w.CurveX,
			CurveY:    w.CurveY,
		}
	}

	openings, err := s.q.ListFloorplanOpenings(ctx, fp.ID)
	if err != nil {
		return nil, fmt.Errorf("list floorplan openings: %w", err)
	}
	fp.Openings = make([]FloorplanOpening, len(openings))
	for i, o := range openings {
		fp.Openings[i] = FloorplanOpening{
			ID:     o.ID,
			WallID: o.WallID,
			T:      o.T,
			Width:  o.Width,
			Kind:   FloorplanOpeningKind(o.Kind),
		}
	}

	rooms, err := s.q.ListFloorplanRooms(ctx, fp.ID)
	if err != nil {
		return nil, fmt.Errorf("list floorplan rooms: %w", err)
	}
	fp.Rooms = make([]FloorplanRoom, len(rooms))
	for i, r := range rooms {
		fp.Rooms[i] = FloorplanRoom{
			ID:        r.ID,
			Name:      r.Name,
			RoomID:    r.RoomID,
			VertexIDs: unmarshalStringArray(r.VertexIds),
		}
	}

	placements, err := s.q.ListFloorplanPlacements(ctx, fp.ID)
	if err != nil {
		return nil, fmt.Errorf("list floorplan placements: %w", err)
	}
	fp.Placements = make([]FloorplanPlacement, len(placements))
	for i, p := range placements {
		fp.Placements[i] = FloorplanPlacement{MemberType: p.MemberType, MemberID: p.MemberID, X: p.X, Y: p.Y}
	}

	return fp, nil
}

// ReplaceFloorplan atomically upserts the floorplan row and replaces its
// vertices, walls, openings, rooms, and placements with the given sets.
// Deletes run children-first and inserts parents-first so the foreign keys
// hold at every point inside the transaction.
func (s *DB) ReplaceFloorplan(ctx context.Context, params ReplaceFloorplanParams) error {
	return s.execTx(ctx, func(q *sqlite.Queries) error {
		if err := q.UpsertFloorplan(ctx, sqlite.UpsertFloorplanParams{
			ID:   params.ID,
			Name: params.Name,
		}); err != nil {
			return fmt.Errorf("upsert floorplan: %w", err)
		}
		if err := q.DeleteFloorplanPlacementsByFloorplan(ctx, params.ID); err != nil {
			return fmt.Errorf("delete floorplan placements: %w", err)
		}
		if err := q.DeleteFloorplanRoomsByFloorplan(ctx, params.ID); err != nil {
			return fmt.Errorf("delete floorplan rooms: %w", err)
		}
		if err := q.DeleteFloorplanOpeningsByFloorplan(ctx, params.ID); err != nil {
			return fmt.Errorf("delete floorplan openings: %w", err)
		}
		if err := q.DeleteFloorplanWallsByFloorplan(ctx, params.ID); err != nil {
			return fmt.Errorf("delete floorplan walls: %w", err)
		}
		if err := q.DeleteFloorplanVerticesByFloorplan(ctx, params.ID); err != nil {
			return fmt.Errorf("delete floorplan vertices: %w", err)
		}
		for _, v := range params.Vertices {
			if err := q.CreateFloorplanVertex(ctx, sqlite.CreateFloorplanVertexParams{
				ID:          v.ID,
				FloorplanID: params.ID,
				X:           v.X,
				Y:           v.Y,
			}); err != nil {
				return fmt.Errorf("create floorplan vertex: %w", err)
			}
		}
		for _, w := range params.Walls {
			if err := q.CreateFloorplanWall(ctx, sqlite.CreateFloorplanWallParams{
				ID:          w.ID,
				FloorplanID: params.ID,
				VertexA:     w.VertexA,
				VertexB:     w.VertexB,
				Thickness:   w.Thickness,
				CurveX:      w.CurveX,
				CurveY:      w.CurveY,
			}); err != nil {
				return fmt.Errorf("create floorplan wall: %w", err)
			}
		}
		for _, o := range params.Openings {
			if err := q.CreateFloorplanOpening(ctx, sqlite.CreateFloorplanOpeningParams{
				ID:          o.ID,
				FloorplanID: params.ID,
				WallID:      o.WallID,
				T:           o.T,
				Width:       o.Width,
				Kind:        string(o.Kind),
			}); err != nil {
				return fmt.Errorf("create floorplan opening: %w", err)
			}
		}
		for _, r := range params.Rooms {
			vertexIDs, err := marshalStringArray(r.VertexIDs)
			if err != nil {
				return fmt.Errorf("marshal floorplan room vertex ids: %w", err)
			}
			if err := q.CreateFloorplanRoom(ctx, sqlite.CreateFloorplanRoomParams{
				ID:          r.ID,
				FloorplanID: params.ID,
				Name:        r.Name,
				RoomID:      r.RoomID,
				VertexIds:   vertexIDs,
			}); err != nil {
				return fmt.Errorf("create floorplan room: %w", err)
			}
		}
		for _, p := range params.Placements {
			if err := q.CreateFloorplanPlacement(ctx, sqlite.CreateFloorplanPlacementParams{
				FloorplanID: params.ID,
				MemberType:  p.MemberType,
				MemberID:    p.MemberID,
				X:           p.X,
				Y:           p.Y,
			}); err != nil {
				return fmt.Errorf("create floorplan placement: %w", err)
			}
		}
		return nil
	})
}

// unmarshalStringArray parses a JSON TEXT array column. Empty or invalid JSON
// yields nil.
func unmarshalStringArray(raw string) []string {
	if raw == "" || raw == "[]" {
		return nil
	}
	var out []string
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return nil
	}
	return out
}
