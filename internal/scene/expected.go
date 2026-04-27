package scene

import (
	"math"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// colorMatchDeltaE is the perceptual-distance threshold (CIE76) below which
// a device's reported colour is considered "the same" as the scene's expected
// colour. Hue-style bulbs store colour in CIE xy and recompute RGB on read;
// that round-trip can drift by ±1–2 per channel even though the bulb is
// honouring the commanded colour exactly. A ΔE of 3 is the standard
// "perceptible but acceptable" line — well above bulb round-trip noise and
// far below any deliberate user colour change.
const colorMatchDeltaE = 3.0

// BuildExpected snapshots the scene-relevant state of a device at the moment a
// scene is applied. Each field is either:
//
//   - Set to the commanded value from the scene, when the scene commands it.
//   - Set to the device's current reported value, when the scene does not
//     command it (so unrelated drift later still invalidates).
//   - Left nil, meaning "don't care" — the field doesn't participate in
//     invalidation. ExpectedMatchesCurrent treats nil as always matching.
//
// The color/colorTemp pair is coupled on most colour bulbs: the device
// derives one from the other. To avoid a scene that sets colorTemp
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
// `colorTemp` tolerate the bulb's derived colour drifting.
//
// For non-nil expected fields the rule is strict: current must be non-nil
// and equal. A device that stops reporting a field it was reporting at
// apply time counts as drift.
//
// The set of compared fields is fixed to on, brightness, colorTemp, and
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
	fieldColorTemp  = "colorTemp"
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
	return rgbDeltaE76(
		derefInt(exp.ColorR), derefInt(exp.ColorG), derefInt(exp.ColorB),
		current.Color.R, current.Color.G, current.Color.B,
	) <= colorMatchDeltaE
}

// rgbDeltaE76 returns the CIE76 ΔE between two sRGB triples. The pipeline is
// sRGB(0–255) → gamma-decoded linear RGB → CIE XYZ (D65) → CIE L*a*b* (D65)
// → Euclidean distance. Cheaper than ΔE2000 and accurate enough at the
// scene-active threshold we care about.
func rgbDeltaE76(r1, g1, b1, r2, g2, b2 int) float64 {
	l1, a1, lb1 := rgbToLab(r1, g1, b1)
	l2, a2, lb2 := rgbToLab(r2, g2, b2)
	dL := l1 - l2
	da := a1 - a2
	db := lb1 - lb2
	return math.Sqrt(dL*dL + da*da + db*db)
}

func rgbToLab(r, g, b int) (l, a, lb float64) {
	rl := srgbToLinear(float64(r) / 255)
	gl := srgbToLinear(float64(g) / 255)
	bl := srgbToLinear(float64(b) / 255)

	x := rl*0.4124564 + gl*0.3575761 + bl*0.1804375
	y := rl*0.2126729 + gl*0.7151522 + bl*0.0721750
	z := rl*0.0193339 + gl*0.1191920 + bl*0.9503041

	const xn, yn, zn = 0.95047, 1.0, 1.08883
	fx := labF(x / xn)
	fy := labF(y / yn)
	fz := labF(z / zn)

	l = 116*fy - 16
	a = 500 * (fx - fy)
	lb = 200 * (fy - fz)
	return
}

func srgbToLinear(c float64) float64 {
	if c <= 0.04045 {
		return c / 12.92
	}
	return math.Pow((c+0.055)/1.055, 2.4)
}

func labF(t float64) float64 {
	const epsilon = 216.0 / 24389.0
	const kappa = 24389.0 / 27.0
	if t > epsilon {
		return math.Cbrt(t)
	}
	return (kappa*t + 16) / 116
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
