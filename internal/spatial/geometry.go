package spatial

import (
	"math"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/lightfield"
)

type polygon struct {
	points   []lightfield.Point
	centroid lightfield.Point
	bounds   bounds2D
}

func newPolygon(points []lightfield.Point) (polygon, bool) {
	if len(points) < 3 {
		return polygon{}, false
	}
	area2 := 0.0
	cx, cy := 0.0, 0.0
	for i, point := range points {
		next := points[(i+1)%len(points)]
		cross := point.X*next.Y - next.X*point.Y
		area2 += cross
		cx += (point.X + next.X) * cross
		cy += (point.Y + next.Y) * cross
	}
	if math.Abs(area2) < 1e-10 {
		return polygon{}, false
	}
	centroid := lightfield.Point{X: cx / (3 * area2), Y: cy / (3 * area2)}
	bounds := bounds2D{minX: points[0].X, maxX: points[0].X, minY: points[0].Y, maxY: points[0].Y}
	for _, point := range points[1:] {
		bounds.minX = min(bounds.minX, point.X)
		bounds.maxX = max(bounds.maxX, point.X)
		bounds.minY = min(bounds.minY, point.Y)
		bounds.maxY = max(bounds.maxY, point.Y)
	}
	face := polygon{points: append([]lightfield.Point(nil), points...), centroid: centroid, bounds: bounds}
	if !face.contains(centroid) {
		centroid = face.interiorFallback()
		face.centroid = centroid
	}
	return face, true
}

func (p polygon) contains(point lightfield.Point) bool {
	inside := false
	for i, current := range p.points {
		previous := p.points[(i+len(p.points)-1)%len(p.points)]
		intersects := (current.Y > point.Y) != (previous.Y > point.Y) &&
			point.X < (previous.X-current.X)*(point.Y-current.Y)/(previous.Y-current.Y)+current.X
		if intersects {
			inside = !inside
		}
	}
	return inside
}

func (p polygon) interiorFallback() lightfield.Point {
	mean := lightfield.Point{}
	for _, point := range p.points {
		mean.X += point.X
		mean.Y += point.Y
	}
	mean.X /= float64(len(p.points))
	mean.Y /= float64(len(p.points))
	if p.contains(mean) {
		return mean
	}
	vertex := p.points[0]
	for amount := 0.1; amount < 1; amount += 0.1 {
		candidate := lightfield.Point{X: vertex.X*(1-amount) + mean.X*amount, Y: vertex.Y*(1-amount) + mean.Y*amount}
		if p.contains(candidate) {
			return candidate
		}
	}
	return lightfield.Point{X: (p.bounds.minX + p.bounds.maxX) / 2, Y: (p.bounds.minY + p.bounds.maxY) / 2}
}

func (p polygon) offsetPoint(seed int64, deviceID, roomID string) lightfield.Point {
	offset := stableOffset(seed^int64(hashString(roomID)), deviceID, 0.12)
	candidate := lightfield.Point{
		X: p.centroid.X + offset.X*(p.bounds.maxX-p.bounds.minX),
		Y: p.centroid.Y + offset.Y*(p.bounds.maxY-p.bounds.minY),
	}
	for range 10 {
		if p.contains(candidate) {
			return candidate
		}
		candidate.X = (candidate.X + p.centroid.X) / 2
		candidate.Y = (candidate.Y + p.centroid.Y) / 2
	}
	return p.centroid
}

func roomPoint(topology *floorTopology, id device.DeviceID, paths []membershipPath, seed int64) (lightfield.Point, []string, bool) {
	type roomCandidate struct {
		id       string
		distance int
		faces    []polygon
	}
	candidates := map[string]roomCandidate{}
	var degenerate []string
	for _, path := range paths {
		for index, node := range path {
			if node.kind != device.TargetRoom {
				continue
			}
			faces, linked := topology.rooms[node.id]
			if linked && len(faces) == 0 {
				degenerate = append(degenerate, node.id)
				continue
			}
			if !linked {
				continue
			}
			candidate := roomCandidate{id: node.id, distance: len(path) - index - 1, faces: faces}
			current, exists := candidates[node.id]
			if !exists || candidate.distance < current.distance {
				candidates[node.id] = candidate
			}
		}
	}
	bestDistance := math.MaxInt
	for _, candidate := range candidates {
		bestDistance = min(bestDistance, candidate.distance)
	}
	if bestDistance == math.MaxInt {
		return lightfield.Point{}, degenerate, false
	}
	point := lightfield.Point{}
	count := 0.0
	for _, candidate := range candidates {
		if candidate.distance != bestDistance {
			continue
		}
		for _, face := range candidate.faces {
			placed := face.offsetPoint(seed, string(id), candidate.id)
			point.X += placed.X
			point.Y += placed.Y
			count++
		}
	}
	if count == 0 {
		return lightfield.Point{}, degenerate, false
	}
	point.X = clamp01(point.X / count)
	point.Y = clamp01(point.Y / count)
	return point, degenerate, true
}
