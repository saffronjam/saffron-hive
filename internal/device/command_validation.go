package device

import (
	"fmt"
	"math"
	"slices"
)

// ValidateCommand checks protocol-independent desired-state bounds.
func ValidateCommand(c Command) error {
	if c.Brightness != nil && (*c.Brightness < 0 || *c.Brightness > 254) {
		return fmt.Errorf("brightness must be between 0 and 254")
	}
	if c.ColorTemp != nil && *c.ColorTemp < 0 {
		return fmt.Errorf("color temperature must be non-negative")
	}
	if c.Transition != nil && (!finiteCommandNumber(*c.Transition) || *c.Transition < 0) {
		return fmt.Errorf("transition must be finite and non-negative")
	}
	if c.TargetTemperature != nil && !finiteCommandNumber(*c.TargetTemperature) {
		return fmt.Errorf("target temperature must be finite")
	}
	if c.Color != nil {
		v := c.Color
		if v.R < 0 || v.R > 255 || v.G < 0 || v.G > 255 || v.B < 0 || v.B > 255 {
			return fmt.Errorf("RGB channels must be between 0 and 255")
		}
		if !finiteCommandNumber(v.X) || !finiteCommandNumber(v.Y) || v.X < 0 || v.X > 1 || v.Y < 0 || v.Y > 1 {
			return fmt.Errorf("xy coordinates must be between 0 and 1")
		}
	}
	return nil
}
func finiteCommandNumber(v float64) bool { return !math.IsNaN(v) && !math.IsInf(v, 0) }

// ProjectCommand clamps numeric fields to advertised ranges and validates enum values.
func ProjectCommand(c Command, d Device) (Command, error) {
	for _, cap := range d.Capabilities {
		if !cap.CanSet() {
			continue
		}
		clamp := func(v float64) float64 {
			if cap.ValueMin != nil {
				v = math.Max(v, *cap.ValueMin)
			}
			if cap.ValueMax != nil {
				v = math.Min(v, *cap.ValueMax)
			}
			return v
		}
		integer := func(v *int) *int {
			if v == nil {
				return nil
			}
			n := int(clamp(float64(*v)))
			return &n
		}
		var enum *string
		switch cap.Name {
		case CapBrightness:
			c.Brightness = integer(c.Brightness)
		case CapColorTemp:
			c.ColorTemp = integer(c.ColorTemp)
		case CapTargetTemperature:
			if c.TargetTemperature != nil {
				v := clamp(*c.TargetTemperature)
				c.TargetTemperature = &v
			}
		case CapHvacMode:
			enum = c.HvacMode
		case CapFanMode:
			enum = c.FanMode
		case CapSwing:
			enum = c.Swing
		}
		if enum != nil && len(cap.Values) > 0 && !slices.Contains(cap.Values, *enum) {
			return Command{}, fmt.Errorf("device %s does not support %s value %q", d.ID, cap.Name, *enum)
		}
	}
	return c, nil
}
