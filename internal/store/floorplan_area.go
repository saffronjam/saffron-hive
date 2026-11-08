package store

import (
	"context"
	"math"
)

// CleaningRoomAreas returns the measured Hive floor-plan area for linked rooms.
func (s *DB) CleaningRoomAreas(ctx context.Context) (map[string]float64, error) {
	plan, err := s.GetFloorplanGraph(ctx)
	if err != nil {
		return nil, err
	}
	return floorplanRoomAreas(plan), nil
}

func floorplanRoomAreas(plan *Floorplan) map[string]float64 {
	areas := map[string]float64{}
	if plan == nil {
		return areas
	}
	vertices := map[string]FloorplanVertex{}
	for _, vertex := range plan.Vertices {
		vertices[vertex.ID] = vertex
	}
	walls := map[[2]string]FloorplanWall{}
	for _, wall := range plan.Walls {
		walls[[2]string{wall.VertexA, wall.VertexB}] = wall
		walls[[2]string{wall.VertexB, wall.VertexA}] = wall
	}
	for _, room := range plan.Rooms {
		if room.RoomID == nil || len(room.VertexIDs) < 3 {
			continue
		}
		points := []FloorplanVertex{}
		valid := true
		for i, id := range room.VertexIDs {
			a, okA := vertices[id]
			b, okB := vertices[room.VertexIDs[(i+1)%len(room.VertexIDs)]]
			wall, okWall := walls[[2]string{a.ID, b.ID}]
			if !okA || !okB || !okWall {
				valid = false
				break
			}
			points = append(points, a)
			if wall.CurveX != nil && wall.CurveY != nil {
				cx, cy := *wall.CurveX, *wall.CurveY
				for segment := 1; segment < 16; segment++ {
					t := float64(segment) / 16
					mt := 1 - t
					points = append(points, FloorplanVertex{
						X: mt*mt*a.X + 2*mt*t*cx + t*t*b.X,
						Y: mt*mt*a.Y + 2*mt*t*cy + t*t*b.Y,
					})
				}
			}
		}
		if !valid {
			continue
		}
		area := 0.0
		for i, a := range points {
			b := points[(i+1)%len(points)]
			area += a.X*b.Y - b.X*a.Y
		}
		area = math.Abs(area) / 2
		if area > 0 && !math.IsNaN(area) && !math.IsInf(area, 0) {
			areas[*room.RoomID] += area
		}
	}
	return areas
}
