package spatial

import (
	"math"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/lightfield"
)

const minimumPointExtent = 0.25

func fallbackPoints(ids []device.DeviceID, seed int64) map[device.DeviceID]lightfield.Point {
	points := make(map[device.DeviceID]lightfield.Point, len(ids))
	switch len(ids) {
	case 0:
		return points
	case 1:
		points[ids[0]] = lightfield.Point{X: 0.5, Y: 0.5}
		return points
	case 2:
		angle := hashUnit(uint64(seed)) * 2 * math.Pi
		dx, dy := math.Cos(angle)*0.22, math.Sin(angle)*0.22
		points[ids[0]] = lightfield.Point{X: 0.5 - dx, Y: 0.5 - dy}
		points[ids[1]] = lightfield.Point{X: 0.5 + dx, Y: 0.5 + dy}
		return points
	}
	for _, id := range ids {
		hash := splitmix64(uint64(seed) ^ hashString(string(id)))
		points[id] = lightfield.Point{
			X: 0.08 + 0.84*hashUnit(hash),
			Y: 0.08 + 0.84*radicalInverse(hash>>1),
		}
	}
	return points
}

func stableOffset(seed int64, id string, radius float64) lightfield.Point {
	hash := splitmix64(uint64(seed) ^ hashString(id))
	angle := hashUnit(hash) * 2 * math.Pi
	distance := radius * (0.55 + 0.45*hashUnit(hash^0x9e3779b97f4a7c15))
	return lightfield.Point{X: math.Cos(angle) * distance, Y: math.Sin(angle) * distance}
}

func normalizePointSet(points []DevicePoint) {
	if len(points) == 0 {
		return
	}
	if len(points) == 1 {
		points[0].Point = lightfield.Point{X: 0.5, Y: 0.5}
		return
	}
	minX, maxX := points[0].Point.X, points[0].Point.X
	minY, maxY := points[0].Point.Y, points[0].Point.Y
	for _, point := range points[1:] {
		minX = min(minX, point.Point.X)
		maxX = max(maxX, point.Point.X)
		minY = min(minY, point.Point.Y)
		maxY = max(maxY, point.Point.Y)
	}
	if maxX-minX < 1e-12 && maxY-minY < 1e-12 {
		for i := range points {
			angle := 2*math.Pi*float64(i)/float64(len(points)) - math.Pi/2
			points[i].Point.X = 0.5 + math.Cos(angle)*minimumPointExtent/2
			points[i].Point.Y = 0.5 + math.Sin(angle)*minimumPointExtent/2
		}
		return
	}
	if maxX-minX < 1e-12 {
		for i := range points {
			points[i].Point.X = 0.5 + (float64(i)/float64(len(points)-1)-0.5)*minimumPointExtent
		}
		minX, maxX = 0.5-minimumPointExtent/2, 0.5+minimumPointExtent/2
	}
	if maxY-minY < 1e-12 {
		for i := range points {
			points[i].Point.Y = 0.5 + (float64(i)/float64(len(points)-1)-0.5)*minimumPointExtent
		}
		minY, maxY = 0.5-minimumPointExtent/2, 0.5+minimumPointExtent/2
	}
	for i := range points {
		points[i].Point.X = expandExtent(points[i].Point.X, minX, maxX)
		points[i].Point.Y = expandExtent(points[i].Point.Y, minY, maxY)
	}
}

func expandExtent(value, low, high float64) float64 {
	extent := high - low
	if extent >= minimumPointExtent {
		return clamp01(value)
	}
	center := (low + high) / 2
	scale := minimumPointExtent / extent
	return clamp01(0.5 + (value-center)*scale)
}

func radicalInverse(value uint64) float64 {
	result, factor := 0.0, 0.5
	for value > 0 {
		result += float64(value&1) * factor
		value >>= 1
		factor *= 0.5
	}
	return result
}

func hashString(value string) uint64 {
	const (
		offset = uint64(14695981039346656037)
		prime  = uint64(1099511628211)
	)
	hash := offset
	for i := range value {
		hash ^= uint64(value[i])
		hash *= prime
	}
	return hash
}

func splitmix64(value uint64) uint64 {
	value += 0x9e3779b97f4a7c15
	value = (value ^ (value >> 30)) * 0xbf58476d1ce4e5b9
	value = (value ^ (value >> 27)) * 0x94d049bb133111eb
	return value ^ (value >> 31)
}

func hashUnit(value uint64) float64 {
	return float64(splitmix64(value)>>11) / float64(uint64(1)<<53)
}
