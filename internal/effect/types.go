// Package effect defines the protocol-agnostic domain types for Effects:
// timed sequences of device commands ("timeline" effects) or named external
// effect programs run on the device itself ("native" effects).
package effect

import (
	"encoding/json"
	"fmt"
	"time"
)

// Kind classifies an effect by how it executes. Timeline effects are stepped
// by the runner; native effects delegate to a protocol-side effect program
// referenced by NativeName.
type Kind string

const (
	// KindTimeline is a runner-driven sequence of typed steps.
	KindTimeline Kind = "timeline"
	// KindNative is a single named effect program executed on the device.
	KindNative Kind = "native"
)

// StepKind classifies a single step inside a timeline effect.
type StepKind string

const (
	// StepWait pauses the runner for a fixed duration.
	StepWait StepKind = "wait"
	// StepSetOnOff sets the on/off state of the target.
	StepSetOnOff StepKind = "set_on_off"
	// StepSetBrightness sets the brightness level of the target.
	StepSetBrightness StepKind = "set_brightness"
	// StepSetColorRGB sets the color of the target by RGB triplet.
	StepSetColorRGB StepKind = "set_color_rgb"
	// StepSetColorTemp sets the color temperature of the target in mireds.
	StepSetColorTemp StepKind = "set_color_temp"
)

// Effect is a named sequence of steps (or a single named native program) that
// can be applied to one or more targets.
type Effect struct {
	ID         string
	Name       string
	Icon       string
	Kind       Kind
	NativeName string
	Loop       bool
	Steps      []Step
	CreatedBy  string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// Step is one entry in a timeline effect. Exactly one field of Config is
// non-nil — the one matching Kind.
type Step struct {
	ID     string
	Index  int
	Kind   StepKind
	Config StepConfig
}

// StepConfig is a tagged-union of step-specific parameter shapes. Marshalling
// emits exactly the inner struct that matches the configured StepKind, so the
// disk shape is the inner struct directly (no wrapper object), e.g.
// {"r": 244, "g": 42, "b": 23, "transition_ms": 200} for a color step.
type StepConfig struct {
	Wait          *WaitConfig
	SetOnOff      *SetOnOffConfig
	SetBrightness *SetBrightnessConfig
	SetColorRGB   *SetColorRGBConfig
	SetColorTemp  *SetColorTempConfig
}

// WaitConfig parameterises a StepWait step.
type WaitConfig struct {
	DurationMS int `json:"duration_ms"`
}

// SetOnOffConfig parameterises a StepSetOnOff step.
type SetOnOffConfig struct {
	Value        bool `json:"value"`
	TransitionMS int  `json:"transition_ms"`
}

// SetBrightnessConfig parameterises a StepSetBrightness step.
type SetBrightnessConfig struct {
	Value        int `json:"value"`
	TransitionMS int `json:"transition_ms"`
}

// SetColorRGBConfig parameterises a StepSetColorRGB step.
type SetColorRGBConfig struct {
	R            int `json:"r"`
	G            int `json:"g"`
	B            int `json:"b"`
	TransitionMS int `json:"transition_ms"`
}

// SetColorTempConfig parameterises a StepSetColorTemp step.
type SetColorTempConfig struct {
	Mireds       int `json:"mireds"`
	TransitionMS int `json:"transition_ms"`
}

// MarshalConfig serialises a Step's typed Config to JSON. The output is the
// inner struct that matches kind, with no wrapper object.
func MarshalConfig(kind StepKind, cfg StepConfig) ([]byte, error) {
	switch kind {
	case StepWait:
		if cfg.Wait == nil {
			return nil, fmt.Errorf("marshal step config: kind %q missing wait payload", kind)
		}
		return json.Marshal(cfg.Wait)
	case StepSetOnOff:
		if cfg.SetOnOff == nil {
			return nil, fmt.Errorf("marshal step config: kind %q missing set_on_off payload", kind)
		}
		return json.Marshal(cfg.SetOnOff)
	case StepSetBrightness:
		if cfg.SetBrightness == nil {
			return nil, fmt.Errorf("marshal step config: kind %q missing set_brightness payload", kind)
		}
		return json.Marshal(cfg.SetBrightness)
	case StepSetColorRGB:
		if cfg.SetColorRGB == nil {
			return nil, fmt.Errorf("marshal step config: kind %q missing set_color_rgb payload", kind)
		}
		return json.Marshal(cfg.SetColorRGB)
	case StepSetColorTemp:
		if cfg.SetColorTemp == nil {
			return nil, fmt.Errorf("marshal step config: kind %q missing set_color_temp payload", kind)
		}
		return json.Marshal(cfg.SetColorTemp)
	default:
		return nil, fmt.Errorf("marshal step config: unknown kind %q", kind)
	}
}

// UnmarshalConfig parses a JSON payload into the StepConfig variant indicated
// by kind. Exactly one StepConfig field is set on success.
func UnmarshalConfig(kind StepKind, data []byte) (StepConfig, error) {
	var cfg StepConfig
	switch kind {
	case StepWait:
		var v WaitConfig
		if err := json.Unmarshal(data, &v); err != nil {
			return StepConfig{}, fmt.Errorf("unmarshal wait config: %w", err)
		}
		cfg.Wait = &v
	case StepSetOnOff:
		var v SetOnOffConfig
		if err := json.Unmarshal(data, &v); err != nil {
			return StepConfig{}, fmt.Errorf("unmarshal set_on_off config: %w", err)
		}
		cfg.SetOnOff = &v
	case StepSetBrightness:
		var v SetBrightnessConfig
		if err := json.Unmarshal(data, &v); err != nil {
			return StepConfig{}, fmt.Errorf("unmarshal set_brightness config: %w", err)
		}
		cfg.SetBrightness = &v
	case StepSetColorRGB:
		var v SetColorRGBConfig
		if err := json.Unmarshal(data, &v); err != nil {
			return StepConfig{}, fmt.Errorf("unmarshal set_color_rgb config: %w", err)
		}
		cfg.SetColorRGB = &v
	case StepSetColorTemp:
		var v SetColorTempConfig
		if err := json.Unmarshal(data, &v); err != nil {
			return StepConfig{}, fmt.Errorf("unmarshal set_color_temp config: %w", err)
		}
		cfg.SetColorTemp = &v
	default:
		return StepConfig{}, fmt.Errorf("unmarshal step config: unknown kind %q", kind)
	}
	return cfg, nil
}
