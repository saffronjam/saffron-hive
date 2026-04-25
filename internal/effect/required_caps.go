package effect

import "github.com/saffronjam/saffron-hive/internal/device"

// RequiredCapabilities returns the union of device capabilities that every
// target of this effect must support for the effect to apply cleanly. Wait
// steps contribute no capability. Native effects return an empty slice;
// native cap derivation is the responsibility of the discovery layer that
// owns the per-device nativeEffectOptions list.
func (e Effect) RequiredCapabilities() []string {
	if e.Kind == KindNative {
		return nil
	}
	seen := make(map[string]struct{}, len(e.Steps))
	var out []string
	for _, s := range e.Steps {
		cap := capabilityForStep(s.Kind)
		if cap == "" {
			continue
		}
		if _, ok := seen[cap]; ok {
			continue
		}
		seen[cap] = struct{}{}
		out = append(out, cap)
	}
	return out
}

func capabilityForStep(kind StepKind) string {
	switch kind {
	case StepSetOnOff:
		return device.CapOnOff
	case StepSetBrightness:
		return device.CapBrightness
	case StepSetColorRGB:
		return device.CapColor
	case StepSetColorTemp:
		return device.CapColorTemp
	case StepWait:
		return ""
	default:
		return ""
	}
}
