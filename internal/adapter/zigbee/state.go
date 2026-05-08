package zigbee

import (
	"encoding/json"
	"math"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// mapDeviceState parses a zigbee2mqtt state payload into a device.DeviceState
// and the bulb's reported color_mode ("color_temp", "xy", or "" when not
// reported). Every known field is populated independently; a single payload
// may report light, sensor, and metering values simultaneously. Action is
// handled by mapAction and published as a separate event.
//
// When color_mode is reported, the field that the bulb is no longer driving
// from is dropped from the returned delta — Z2M still echoes the stale
// companion value (the bulb's last commanded color_temp while in xy mode,
// or the derived RGB while in color_temp mode), but it is not authoritative
// and must not be allowed to overwrite a previously-cleared cached value.
// The adapter pairs this with a ClearDeviceStateFields call so the cache
// matches: in xy mode the cached ColorTemp goes nil, and in color_temp mode
// the cached Color goes nil. Drift detection then naturally invalidates any
// scene that had been tracking the now-cleared field.
func mapDeviceState(raw json.RawMessage) (device.DeviceState, string, error) {
	var dto z2mDeviceState
	if err := json.Unmarshal(raw, &dto); err != nil {
		return device.DeviceState{}, "", err
	}

	var state device.DeviceState

	if dto.State != "" {
		on := dto.State == "ON"
		state.On = &on
	}
	if dto.Brightness != nil {
		state.Brightness = dto.Brightness
	}
	if dto.ColorTemp != nil {
		state.ColorTemp = dto.ColorTemp
	}
	if dto.Color != nil {
		color := &device.Color{
			R: dto.Color.R,
			G: dto.Color.G,
			B: dto.Color.B,
			X: dto.Color.X,
			Y: dto.Color.Y,
		}
		if color.R == 0 && color.G == 0 && color.B == 0 && (color.X != 0 || color.Y != 0) {
			color.R, color.G, color.B = xyToRGB(color.X, color.Y)
		}
		state.Color = color
	}

	switch dto.ColorMode {
	case "xy":
		state.ColorTemp = nil
	case "color_temp":
		state.Color = nil
	}

	state.Temperature = dto.Temperature
	state.Humidity = dto.Humidity
	state.Pressure = dto.Pressure
	state.Illuminance = dto.Illuminance
	state.Battery = dto.Battery

	state.Power = dto.Power
	state.Voltage = dto.Voltage
	state.Current = dto.Current
	state.Energy = dto.Energy

	return state, dto.ColorMode, nil
}

// xyToRGB converts CIE 1931 xy chromaticity to sRGB (D65) at the brightest
// in-gamut luminance, so the returned values represent pure chromaticity
// suitable for a color swatch. Channels are clamped to [0, 255].
func xyToRGB(x, y float64) (int, int, int) {
	if y == 0 {
		return 0, 0, 0
	}
	z := 1.0 - x - y
	const yLuma = 1.0
	X := (yLuma / y) * x
	Y := yLuma
	Z := (yLuma / y) * z

	r := 3.2406*X - 1.5372*Y - 0.4986*Z
	g := -0.9689*X + 1.8758*Y + 0.0415*Z
	b := 0.0557*X - 0.2040*Y + 1.0570*Z

	if m := math.Max(r, math.Max(g, b)); m > 1 {
		r /= m
		g /= m
		b /= m
	}
	r = math.Max(0, r)
	g = math.Max(0, g)
	b = math.Max(0, b)

	return to8Bit(compandSRGB(r)), to8Bit(compandSRGB(g)), to8Bit(compandSRGB(b))
}

func compandSRGB(c float64) float64 {
	if c <= 0.0031308 {
		return 12.92 * c
	}
	return 1.055*math.Pow(c, 1.0/2.4) - 0.055
}

func to8Bit(c float64) int {
	v := int(math.Round(c * 255))
	if v < 0 {
		return 0
	}
	if v > 255 {
		return 255
	}
	return v
}

// mapAction extracts a button action from a zigbee2mqtt state payload. Returns
// ("", false) when the payload contains no action field or it is empty.
func mapAction(raw json.RawMessage) (string, bool) {
	var dto z2mDeviceState
	if err := json.Unmarshal(raw, &dto); err != nil {
		return "", false
	}
	if dto.Action == "" {
		return "", false
	}
	return dto.Action, true
}
