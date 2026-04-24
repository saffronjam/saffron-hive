package scene

import (
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// BuildExpected snapshots the scene-relevant state of a device at the moment a
// scene is applied. Each field is either:
//
//   - Set to the commanded value from the scene, when the scene commands it.
//   - Set to the device's current reported value, when the scene does not
//     command it (so unrelated drift later still invalidates).
//   - Left nil, meaning "don't care" — the field doesn't participate in
//     invalidation. ExpectedMatchesCurrent treats nil as always matching.
//
// The color/color_temp pair is coupled on most colour bulbs: the device
// derives one from the other. To avoid a scene that sets color_temp
// invalidating itself the moment the bulb echoes back a recomputed colour,
// only the field the scene explicitly set is tracked when the scene touches
// this pair. If the scene sets neither, both fall back to the pre-apply
// current values (strict invalidation on unrelated manual changes).
func BuildExpected(sceneID string, cmd device.Command, current *device.DeviceState) store.SceneExpectedState {
	exp := store.SceneExpectedState{
		SceneID:  sceneID,
		DeviceID: cmd.DeviceID,
	}

	exp.On = firstBoolPtr(cmd.On, currentOn(current))
	exp.Brightness = firstIntPtr(cmd.Brightness, currentInt(current, fieldBrightness))

	switch {
	case cmd.ColorTemp != nil && cmd.Color == nil:
		// Scene drives white-point only; let the derived colour float.
		ct := *cmd.ColorTemp
		exp.ColorTemp = &ct
	case cmd.Color != nil && cmd.ColorTemp == nil:
		// Scene drives colour only; let the derived white-point float.
		r, g, b := cmd.Color.R, cmd.Color.G, cmd.Color.B
		exp.ColorR, exp.ColorG, exp.ColorB = &r, &g, &b
	case cmd.ColorTemp != nil && cmd.Color != nil:
		ct := *cmd.ColorTemp
		exp.ColorTemp = &ct
		r, g, b := cmd.Color.R, cmd.Color.G, cmd.Color.B
		exp.ColorR, exp.ColorG, exp.ColorB = &r, &g, &b
	default:
		// Scene sets neither: strict — snapshot both so any manual drift
		// (someone changing colour with another app) invalidates.
		exp.ColorTemp = currentInt(current, fieldColorTemp)
		if current != nil && current.Color != nil {
			r, g, b := current.Color.R, current.Color.G, current.Color.B
			exp.ColorR, exp.ColorG, exp.ColorB = &r, &g, &b
		}
	}
	return exp
}

// ExpectedMatchesCurrent reports whether a device's current reported state
// still matches the expected snapshot. Nil expected fields are treated as
// "don't care" and always match — this is what lets a scene that commanded
// `color_temp` tolerate the bulb's derived colour drifting.
//
// For non-nil expected fields the rule is strict: current must be non-nil
// and equal. A device that stops reporting a field it was reporting at
// apply time counts as drift.
//
// The set of compared fields is fixed to on, brightness, color_temp, and
// color (RGB only, ignoring xy since devices round xy differently — an
// exact RGB match is what "same colour" means for scene-active detection).
// Sensor fields (temperature, humidity, battery, …) are never scene-relevant.
func ExpectedMatchesCurrent(exp store.SceneExpectedState, current *device.DeviceState) bool {
	return boolFieldMatches(exp.On, currentOn(current)) &&
		intFieldMatches(exp.Brightness, currentInt(current, fieldBrightness)) &&
		intFieldMatches(exp.ColorTemp, currentInt(current, fieldColorTemp)) &&
		colorFieldMatches(exp, current)
}

const (
	fieldBrightness = "brightness"
	fieldColorTemp  = "color_temp"
)

func boolFieldMatches(expected, current *bool) bool {
	if expected == nil {
		return true
	}
	if current == nil {
		return false
	}
	return *expected == *current
}

func intFieldMatches(expected, current *int) bool {
	if expected == nil {
		return true
	}
	if current == nil {
		return false
	}
	return *expected == *current
}

func colorFieldMatches(exp store.SceneExpectedState, current *device.DeviceState) bool {
	if exp.ColorR == nil && exp.ColorG == nil && exp.ColorB == nil {
		return true
	}
	if current == nil || current.Color == nil {
		return false
	}
	return derefInt(exp.ColorR) == current.Color.R &&
		derefInt(exp.ColorG) == current.Color.G &&
		derefInt(exp.ColorB) == current.Color.B
}

func currentOn(s *device.DeviceState) *bool {
	if s == nil {
		return nil
	}
	return s.On
}

func currentInt(s *device.DeviceState, field string) *int {
	if s == nil {
		return nil
	}
	switch field {
	case fieldBrightness:
		return s.Brightness
	case fieldColorTemp:
		return s.ColorTemp
	}
	return nil
}

func firstBoolPtr(primary, fallback *bool) *bool {
	if primary != nil {
		v := *primary
		return &v
	}
	if fallback != nil {
		v := *fallback
		return &v
	}
	return nil
}

func firstIntPtr(primary, fallback *int) *int {
	if primary != nil {
		v := *primary
		return &v
	}
	if fallback != nil {
		v := *fallback
		return &v
	}
	return nil
}

func derefInt(p *int) int {
	if p == nil {
		return 0
	}
	return *p
}
