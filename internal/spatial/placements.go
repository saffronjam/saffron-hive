package spatial

import (
	"context"
	"math"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/lightfield"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type floorTopology struct {
	placements map[structuralNode]lightfield.Point
	rooms      map[string][]polygon
}

func buildFloorTopology(floorplan *store.Floorplan) *floorTopology {
	topology := &floorTopology{
		placements: map[structuralNode]lightfield.Point{},
		rooms:      map[string][]polygon{},
	}
	if floorplan == nil {
		return topology
	}
	world := make([]worldPoint, 0, len(floorplan.Vertices)+len(floorplan.Placements))
	vertices := make(map[string]worldPoint, len(floorplan.Vertices))
	for _, vertex := range floorplan.Vertices {
		point := worldPoint{x: vertex.X, y: vertex.Y}
		vertices[vertex.ID] = point
		world = append(world, point)
	}
	if len(floorplan.Vertices) == 0 {
		for _, placement := range floorplan.Placements {
			world = append(world, worldPoint{x: placement.X, y: placement.Y})
		}
	}
	bounds := worldBounds(world)
	for _, placement := range floorplan.Placements {
		topology.placements[structuralNode{kind: placement.MemberType, id: placement.MemberID}] = bounds.normalize(worldPoint{x: placement.X, y: placement.Y})
	}
	for _, room := range floorplan.Rooms {
		if room.RoomID == nil || *room.RoomID == "" {
			continue
		}
		points := make([]lightfield.Point, 0, len(room.VertexIDs))
		valid := true
		for _, id := range room.VertexIDs {
			point, ok := vertices[id]
			if !ok {
				valid = false
				break
			}
			points = append(points, bounds.normalize(point))
		}
		face, ok := newPolygon(points)
		if valid && ok {
			topology.rooms[*room.RoomID] = append(topology.rooms[*room.RoomID], face)
		} else if _, exists := topology.rooms[*room.RoomID]; !exists {
			topology.rooms[*room.RoomID] = nil
		}
	}
	return topology
}

type groupCandidate struct {
	id       string
	distance int
	size     int
	point    lightfield.Point
}

func (r *Resolver) groupPoint(ctx context.Context, topology *floorTopology, id device.DeviceID, paths []membershipPath, seed int64) (lightfield.Point, bool) {
	candidates := map[string]groupCandidate{}
	for _, path := range paths {
		for index, node := range path {
			if node.kind != device.TargetGroup {
				continue
			}
			point, positioned := topology.placements[node]
			if !positioned {
				continue
			}
			candidate := groupCandidate{
				id:       node.id,
				distance: len(path) - index - 1,
				size:     len(r.store.ResolveTargetDeviceIDs(ctx, device.TargetGroup, node.id)),
				point:    point,
			}
			current, exists := candidates[node.id]
			if !exists || candidate.distance < current.distance {
				candidates[node.id] = candidate
			}
		}
	}
	bestDistance, bestSize := math.MaxInt, math.MaxInt
	for _, candidate := range candidates {
		if candidate.distance < bestDistance || candidate.distance == bestDistance && candidate.size < bestSize {
			bestDistance, bestSize = candidate.distance, candidate.size
		}
	}
	if bestDistance == math.MaxInt {
		return lightfield.Point{}, false
	}
	var point lightfield.Point
	count := 0.0
	for _, candidate := range candidates {
		if candidate.distance == bestDistance && candidate.size == bestSize {
			point.X += candidate.point.X
			point.Y += candidate.point.Y
			count++
		}
	}
	point.X /= count
	point.Y /= count
	offset := stableOffset(seed, string(id), 0.045)
	point.X = clamp01(point.X + offset.X)
	point.Y = clamp01(point.Y + offset.Y)
	return point, true
}

type worldPoint struct {
	x float64
	y float64
}

type bounds2D struct {
	minX float64
	minY float64
	maxX float64
	maxY float64
}

func worldBounds(points []worldPoint) bounds2D {
	if len(points) == 0 {
		return bounds2D{maxX: 1, maxY: 1}
	}
	bounds := bounds2D{minX: points[0].x, maxX: points[0].x, minY: points[0].y, maxY: points[0].y}
	for _, point := range points[1:] {
		bounds.minX = min(bounds.minX, point.x)
		bounds.maxX = max(bounds.maxX, point.x)
		bounds.minY = min(bounds.minY, point.y)
		bounds.maxY = max(bounds.maxY, point.y)
	}
	if bounds.maxX-bounds.minX < 1e-9 {
		bounds.minX -= 0.5
		bounds.maxX += 0.5
	}
	if bounds.maxY-bounds.minY < 1e-9 {
		bounds.minY -= 0.5
		bounds.maxY += 0.5
	}
	return bounds
}

func (b bounds2D) normalize(point worldPoint) lightfield.Point {
	return lightfield.Point{
		X: clamp01((point.x - b.minX) / (b.maxX - b.minX)),
		Y: clamp01((point.y - b.minY) / (b.maxY - b.minY)),
	}
}

func clamp01(value float64) float64 {
	return min(max(value, 0), 1)
}
