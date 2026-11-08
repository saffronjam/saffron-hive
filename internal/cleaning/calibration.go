package cleaning

import (
	"errors"
	"math"
)

// Point is a position in metres in a top-left coordinate system.
type Point struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// Anchor pairs one robot-map landmark with the matching Hive landmark.
type Anchor struct {
	Robot Point `json:"robot"`
	Hive  Point `json:"hive"`
}

// Transform represents a uniform scale and rotation followed by translation.
type Transform struct {
	A float64 `json:"a"`
	B float64 `json:"b"`
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

func finite(v float64) bool { return !math.IsNaN(v) && !math.IsInf(v, 0) }

// Validate checks a saved alignment, including drafts with fewer than two pairs.
func (c Calibration) Validate() error {
	if !finite(c.MapRotation) {
		return errors.New("map rotation must be finite")
	}
	for _, p := range c.Anchors {
		if !finite(p.Robot.X) || !finite(p.Robot.Y) || !finite(p.Hive.X) || !finite(p.Hive.Y) {
			return errors.New("landmarks must have finite coordinates")
		}
	}
	if len(c.Anchors) < 2 {
		return nil
	}
	_, err := Calibrate(c.Anchors)
	return err
}

// Calibrate fits a similarity transform to all matching landmark pairs.
func Calibrate(anchors []Anchor) (Transform, error) {
	if len(anchors) < 2 {
		return Transform{}, errors.New("select two matching landmarks")
	}
	var source, target Point
	for _, p := range anchors {
		if !finite(p.Robot.X) || !finite(p.Robot.Y) || !finite(p.Hive.X) || !finite(p.Hive.Y) {
			return Transform{}, errors.New("landmarks must have finite coordinates")
		}
		source.X += p.Robot.X
		source.Y += p.Robot.Y
		target.X += p.Hive.X
		target.Y += p.Hive.Y
	}
	n := float64(len(anchors))
	source.X /= n
	source.Y /= n
	target.X /= n
	target.Y /= n
	var denominator, a, b float64
	for _, p := range anchors {
		x, y := p.Robot.X-source.X, p.Robot.Y-source.Y
		u, v := p.Hive.X-target.X, p.Hive.Y-target.Y
		denominator += x*x + y*y
		a += x*u + y*v
		b += x*v - y*u
	}
	if denominator < 1e-10 {
		return Transform{}, errors.New("choose distinct robot-map landmarks")
	}
	a /= denominator
	b /= denominator
	if !finite(a) || !finite(b) || math.Hypot(a, b) < 1e-6 {
		return Transform{}, errors.New("choose distinct Hive landmarks")
	}
	return Transform{A: a, B: b, X: target.X - a*source.X + b*source.Y, Y: target.Y - b*source.X - a*source.Y}, nil
}

// Apply maps a robot point to the Hive floor plan.
func (t Transform) Apply(p Point) Point {
	return Point{t.A*p.X - t.B*p.Y + t.X, t.B*p.X + t.A*p.Y + t.Y}
}

// Heading maps a robot heading in clockwise degrees to the Hive frame.
func (t Transform) Heading(degrees float64) float64 {
	return math.Mod(degrees+math.Atan2(t.B, t.A)*180/math.Pi+360, 360)
}

// Error reports the distance in metres between a landmark and its transformed point.
func (t Transform) Error(anchor Anchor) float64 {
	p := t.Apply(anchor.Robot)
	return math.Hypot(p.X-anchor.Hive.X, p.Y-anchor.Hive.Y)
}
