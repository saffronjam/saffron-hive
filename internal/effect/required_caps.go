package effect

import "github.com/saffronjam/saffron-hive/internal/device"

// RequiredCapabilities returns the union of device capabilities that every
// target of this effect must support for the effect to apply cleanly. Native
// effects return an empty slice; native cap derivation is the responsibility
// of the discovery layer that owns the per-device nativeEffectOptions list.
// Native-effect clips inside a timeline contribute no capability either —
// their support is gated by the device's effect cap value list, not the
// generic on/off/brightness/color set.
func (e Effect) RequiredCapabilities() []string {
	if e.Kind == KindNative {
		return nil
	}
	seen := make(map[string]struct{})
	var out []string
	for _, t := range e.Tracks {
		for _, c := range t.Clips {
			cap := capabilityForClip(c.Kind)
			if cap == "" {
				continue
			}
			if _, ok := seen[cap]; ok {
				continue
			}
			seen[cap] = struct{}{}
			out = append(out, cap)
		}
	}
	return out
}

func capabilityForClip(kind ClipKind) string {
	switch kind {
	case ClipSetOnOff:
		return device.CapOnOff
	case ClipSetBrightness:
		return device.CapBrightness
	case ClipSetColorRGB:
		return device.CapColor
	case ClipSetColorTemp:
		return device.CapColorTemp
	case ClipNativeEffect:
		return ""
	default:
		return ""
	}
}
