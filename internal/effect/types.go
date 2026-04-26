// Package effect defines the protocol-agnostic domain types for Effects:
// timed multi-track sequences of device commands ("timeline" effects) or named
// external effect programs run on the device itself ("native" effects).
package effect

import (
	"encoding/json"
	"fmt"
	"time"
)

// Kind classifies an effect by how it executes. Timeline effects walk a flat
// sorted-by-startMs event list across all tracks; native effects delegate to a
// protocol-side program referenced by NativeName.
type Kind string

const (
	// KindTimeline is a runner-driven multi-track timeline of typed clips.
	KindTimeline Kind = "timeline"
	// KindNative is a single named effect program executed on the device.
	KindNative Kind = "native"
)

// ClipKind classifies a single clip inside a timeline track.
type ClipKind string

const (
	// ClipSetOnOff sets the on/off state of the target.
	ClipSetOnOff ClipKind = "set_on_off"
	// ClipSetBrightness sets the brightness level of the target.
	ClipSetBrightness ClipKind = "set_brightness"
	// ClipSetColorRGB sets the color of the target by RGB triplet.
	ClipSetColorRGB ClipKind = "set_color_rgb"
	// ClipSetColorTemp sets the color temperature of the target in mireds.
	ClipSetColorTemp ClipKind = "set_color_temp"
	// ClipNativeEffect fires a native protocol-side effect by name at the
	// clip's start offset.
	ClipNativeEffect ClipKind = "native_effect"
)

// Effect is a named multi-track timeline (or a single named native program)
// that can be applied to one or more targets.
type Effect struct {
	ID         string
	Name       string
	Icon       string
	Kind       Kind
	NativeName string
	Loop       bool
	// DurationMs is the loop length for Loop=true effects (the End line on the
	// editor's timeline). For Loop=false effects it is informational; the
	// runner stops as soon as the last clip event has fired.
	DurationMs int
	Tracks     []Track
	CreatedBy  string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// Track is a generic ordered container of mutually-exclusive clips. Multiple
// tracks fire in parallel. Name is the user-supplied label shown in the
// editor; an empty string is valid and rendered as a placeholder by the UI.
type Track struct {
	ID    string
	Index int
	Name  string
	Clips []Clip
}

// Clip is an absolute-positioned event on a track. Exactly one field of Config
// is non-nil — the one matching Kind. TransitionMinMs and TransitionMaxMs
// bound the random transition sampled per clip-execution; equal bounds collapse
// to a deterministic value. Visual clip width on the editor is TransitionMaxMs.
type Clip struct {
	ID              string
	StartMs         int
	TransitionMinMs int
	TransitionMaxMs int
	Kind            ClipKind
	Config          ClipConfig
}

// ClipConfig is a tagged-union of clip-specific parameter shapes. Marshalling
// emits exactly the inner struct that matches Kind, so the disk shape is the
// inner struct directly (no wrapper object).
type ClipConfig struct {
	SetOnOff      *SetOnOffClipConfig
	SetBrightness *SetBrightnessClipConfig
	SetColorRGB   *SetColorRGBClipConfig
	SetColorTemp  *SetColorTempClipConfig
	NativeEffect  *NativeEffectClipConfig
}

// SetOnOffClipConfig parameterises a ClipSetOnOff clip.
type SetOnOffClipConfig struct {
	Value bool `json:"value"`
}

// SetBrightnessClipConfig parameterises a ClipSetBrightness clip.
type SetBrightnessClipConfig struct {
	Value int `json:"value"`
}

// SetColorRGBClipConfig parameterises a ClipSetColorRGB clip.
type SetColorRGBClipConfig struct {
	R int `json:"r"`
	G int `json:"g"`
	B int `json:"b"`
}

// SetColorTempClipConfig parameterises a ClipSetColorTemp clip.
type SetColorTempClipConfig struct {
	Mireds int `json:"mireds"`
}

// NativeEffectClipConfig parameterises a ClipNativeEffect clip; Name is the
// protocol-side effect program to fire at the clip's StartMs.
type NativeEffectClipConfig struct {
	Name string `json:"name"`
}

// MarshalClipConfig serialises a Clip's typed Config to JSON. The output is
// the inner struct that matches kind, with no wrapper object.
func MarshalClipConfig(kind ClipKind, cfg ClipConfig) ([]byte, error) {
	switch kind {
	case ClipSetOnOff:
		if cfg.SetOnOff == nil {
			return nil, fmt.Errorf("marshal clip config: kind %q missing set_on_off payload", kind)
		}
		return json.Marshal(cfg.SetOnOff)
	case ClipSetBrightness:
		if cfg.SetBrightness == nil {
			return nil, fmt.Errorf("marshal clip config: kind %q missing set_brightness payload", kind)
		}
		return json.Marshal(cfg.SetBrightness)
	case ClipSetColorRGB:
		if cfg.SetColorRGB == nil {
			return nil, fmt.Errorf("marshal clip config: kind %q missing set_color_rgb payload", kind)
		}
		return json.Marshal(cfg.SetColorRGB)
	case ClipSetColorTemp:
		if cfg.SetColorTemp == nil {
			return nil, fmt.Errorf("marshal clip config: kind %q missing set_color_temp payload", kind)
		}
		return json.Marshal(cfg.SetColorTemp)
	case ClipNativeEffect:
		if cfg.NativeEffect == nil {
			return nil, fmt.Errorf("marshal clip config: kind %q missing native_effect payload", kind)
		}
		return json.Marshal(cfg.NativeEffect)
	default:
		return nil, fmt.Errorf("marshal clip config: unknown kind %q", kind)
	}
}

// UnmarshalClipConfig parses a JSON payload into the ClipConfig variant
// indicated by kind. Exactly one ClipConfig field is set on success.
func UnmarshalClipConfig(kind ClipKind, data []byte) (ClipConfig, error) {
	var cfg ClipConfig
	switch kind {
	case ClipSetOnOff:
		var v SetOnOffClipConfig
		if err := json.Unmarshal(data, &v); err != nil {
			return ClipConfig{}, fmt.Errorf("unmarshal set_on_off config: %w", err)
		}
		cfg.SetOnOff = &v
	case ClipSetBrightness:
		var v SetBrightnessClipConfig
		if err := json.Unmarshal(data, &v); err != nil {
			return ClipConfig{}, fmt.Errorf("unmarshal set_brightness config: %w", err)
		}
		cfg.SetBrightness = &v
	case ClipSetColorRGB:
		var v SetColorRGBClipConfig
		if err := json.Unmarshal(data, &v); err != nil {
			return ClipConfig{}, fmt.Errorf("unmarshal set_color_rgb config: %w", err)
		}
		cfg.SetColorRGB = &v
	case ClipSetColorTemp:
		var v SetColorTempClipConfig
		if err := json.Unmarshal(data, &v); err != nil {
			return ClipConfig{}, fmt.Errorf("unmarshal set_color_temp config: %w", err)
		}
		cfg.SetColorTemp = &v
	case ClipNativeEffect:
		var v NativeEffectClipConfig
		if err := json.Unmarshal(data, &v); err != nil {
			return ClipConfig{}, fmt.Errorf("unmarshal native_effect config: %w", err)
		}
		cfg.NativeEffect = &v
	default:
		return ClipConfig{}, fmt.Errorf("unmarshal clip config: unknown kind %q", kind)
	}
	return cfg, nil
}
