package lightfield

import (
	"errors"
	"math"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// LightIntent is the capability-filtered output of a field sample.
type LightIntent struct {
	DeviceID   device.DeviceID
	On         *bool
	Brightness *int
	ColorTemp  *int
	Color      *device.Color
}

// Empty reports whether an intent contains no writable device state.
func (i LightIntent) Empty() bool {
	return i.On == nil && i.Brightness == nil && i.ColorTemp == nil && i.Color == nil
}

// Command converts an intent to the command bus representation.
func (i LightIntent) Command(transitionSeconds float64) device.Command {
	command := device.Command{
		DeviceID:   i.DeviceID,
		On:         i.On,
		Brightness: i.Brightness,
		ColorTemp:  i.ColorTemp,
		Color:      i.Color,
	}
	if !i.Empty() {
		command.Transition = device.Ptr(max(0, transitionSeconds))
	}
	return command
}

// Project adapts an abstract field sample to the device's writable light
// capabilities. brightnessScale is normalized to [0,1].
func Project(target device.Device, sample Sample, brightnessScale float64) (LightIntent, error) {
	intent := LightIntent{DeviceID: target.ID}
	if !finite(brightnessScale) || brightnessScale < 0 || brightnessScale > 1 {
		return intent, errors.New("brightness scale must be finite and between 0 and 1")
	}
	if !fieldEligible(target) {
		return intent, nil
	}
	domain, err := validateProjectedSample(sample)
	if err != nil {
		return intent, err
	}

	switch domain {
	case DomainFullColor:
		projectColor(target, *sample.Color, &intent)
	case DomainWhiteAmbience:
		projectWhite(target, *sample.White, &intent)
	}
	if capability, ok := writableCapability(target, device.CapBrightness); ok {
		low, high := capabilityRange(capability, 1, 254)
		value := low + brightnessScale*(high-low)
		intent.Brightness = device.Ptr(int(math.Round(clamp(value, low, high))))
	}
	if _, ok := writableCapability(target, device.CapOnOff); ok {
		intent.On = device.Ptr(true)
	}
	return intent, nil
}

func projectColor(target device.Device, sample ColorSample, intent *LightIntent) {
	if _, ok := writableCapability(target, device.CapColor); ok {
		intent.Color = deviceColor(OKLCHToSRGB(sample))
		return
	}
	if capability, ok := writableCapability(target, device.CapColorTemp); ok {
		rgb := OKLCHToSRGB(sample)
		warmth := clamp((rgb.R-rgb.B+1)/2, 0, 1)
		low, high := capabilityRange(capability, 153, 500)
		intent.ColorTemp = device.Ptr(int(math.Round(mix(low, high, warmth))))
	}
}

func projectWhite(target device.Device, sample WhiteSample, intent *LightIntent) {
	if capability, ok := writableCapability(target, device.CapColorTemp); ok {
		low, high := capabilityRange(capability, 153, 500)
		intent.ColorTemp = device.Ptr(int(math.Round(clamp(sample.Mireds, low, high))))
		return
	}
	if _, ok := writableCapability(target, device.CapColor); ok {
		intent.Color = deviceColor(MiredsToSRGB(sample.Mireds))
	}
}

func validateProjectedSample(sample Sample) (Domain, error) {
	switch {
	case sample.Color != nil && sample.White == nil:
		if err := sample.Color.validate(); err != nil {
			return "", err
		}
		return DomainFullColor, nil
	case sample.White != nil && sample.Color == nil:
		if err := sample.White.validate(); err != nil {
			return "", err
		}
		return DomainWhiteAmbience, nil
	default:
		return "", errors.New("sample must contain exactly one domain value")
	}
}

func fieldEligible(target device.Device) bool {
	if target.Removed || target.RuntimeDisabled() {
		return false
	}
	return device.IsLightControlDevice(target)
}

func writableCapability(target device.Device, name string) (device.Capability, bool) {
	capability, ok := target.Capability(name)
	return capability, ok && capability.CanSet()
}

func capabilityRange(capability device.Capability, defaultLow, defaultHigh float64) (float64, float64) {
	low, high := defaultLow, defaultHigh
	if capability.ValueMin != nil && finite(*capability.ValueMin) {
		low = *capability.ValueMin
	}
	if capability.ValueMax != nil && finite(*capability.ValueMax) {
		high = *capability.ValueMax
	}
	if low > high {
		low, high = high, low
	}
	return low, high
}

func deviceColor(rgb RGB) *device.Color {
	x, y := RGBToXY(rgb)
	return &device.Color{
		R: int(math.Round(clamp(rgb.R, 0, 1) * 255)),
		G: int(math.Round(clamp(rgb.G, 0, 1) * 255)),
		B: int(math.Round(clamp(rgb.B, 0, 1) * 255)),
		X: x,
		Y: y,
	}
}
