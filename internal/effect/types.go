// Package effect defines the protocol-agnostic domain types for Effects:
// timed multi-track sequences of device commands ("timeline" effects) or named
// external effect programs run on the device itself ("native" effects).
package effect

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"strings"
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
	// ClipSetColor sets the color of the target — either by RGB triplet or by
	// color temperature (mireds), distinguished by the clip config's Mode field.
	// Capability requirements are derived per-clip from Mode: rgb → color,
	// temp → color_temp.
	ClipSetColor ClipKind = "set_color"
	// ClipNativeEffect fires a native protocol-side effect by name at the
	// clip's start offset.
	ClipNativeEffect ClipKind = "native_effect"
)

// ColorMode discriminates the payload inside a ClipSetColor: rgb means the RGB
// triplet is authoritative, temp means the mireds value is authoritative. Only
// one of the matching sub-payloads is non-nil at a time.
type ColorMode string

const (
	ColorModeRGB  ColorMode = "rgb"
	ColorModeTemp ColorMode = "temp"
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
	SetColor      *SetColorClipConfig
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

// SetColorClipConfig parameterises a ClipSetColor clip. Mode discriminates
// the active payload: when "rgb", RGB is authoritative; when "temp", Temp is.
// The other sub-payload is nil. Disk shape is {"mode":..., "rgb":{...}} or
// {"mode":..., "temp":{...}} — only the matching sub-key is present.
type SetColorClipConfig struct {
	Mode ColorMode          `json:"mode"`
	RGB  *SetColorRGBValue  `json:"rgb,omitempty"`
	Temp *SetColorTempValue `json:"temp,omitempty"`
}

type SetColorRGBValue struct {
	R int `json:"r"`
	G int `json:"g"`
	B int `json:"b"`
}

type SetColorTempValue struct {
	Mireds int `json:"mireds"`
}

// NativeEffectClipConfig parameterises a ClipNativeEffect clip; Name is the
// protocol-side effect program to fire at the clip's StartMs.
type NativeEffectClipConfig struct {
	Name string `json:"name"`
}

// EncodeClipConfig serialises a Clip's typed Config to JSON. The output is
// the inner struct that matches kind, with no wrapper object.
func EncodeClipConfig(kind ClipKind, cfg ClipConfig) ([]byte, error) {
	count := 0
	for _, present := range []bool{cfg.SetOnOff != nil, cfg.SetBrightness != nil, cfg.SetColor != nil, cfg.NativeEffect != nil} {
		if present {
			count++
		}
	}
	if count != 1 {
		return nil, fmt.Errorf("provide exactly one clip configuration")
	}

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
	case ClipSetColor:
		if cfg.SetColor == nil {
			return nil, fmt.Errorf("marshal clip config: kind %q missing set_color payload", kind)
		}
		switch cfg.SetColor.Mode {
		case ColorModeRGB:
			if cfg.SetColor.RGB == nil {
				return nil, fmt.Errorf("marshal clip config: set_color mode=rgb missing rgb payload")
			}
		case ColorModeTemp:
			if cfg.SetColor.Temp == nil {
				return nil, fmt.Errorf("marshal clip config: set_color mode=temp missing temp payload")
			}
		default:
			return nil, fmt.Errorf("marshal clip config: set_color unknown mode %q", cfg.SetColor.Mode)
		}
		return json.Marshal(cfg.SetColor)
	case ClipNativeEffect:
		if cfg.NativeEffect == nil {
			return nil, fmt.Errorf("marshal clip config: kind %q missing native_effect payload", kind)
		}
		return json.Marshal(cfg.NativeEffect)
	default:
		return nil, fmt.Errorf("marshal clip config: unknown kind %q", kind)
	}
}

// DecodeClipConfig parses a JSON payload into the ClipConfig variant
// indicated by kind. Exactly one ClipConfig field is set on success.
func DecodeClipConfig(kind ClipKind, data []byte) (ClipConfig, error) {
	var cfg ClipConfig
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(data, &fields); err != nil || fields == nil {
		return cfg, fmt.Errorf("clip config must be an object")
	}
	require := func(key string) error {
		v, ok := fields[key]
		if !ok || bytes.Equal(bytes.TrimSpace(v), []byte("null")) {
			return fmt.Errorf("%s is required", key)
		}
		return nil
	}
	if kind == ClipSetOnOff || kind == ClipSetBrightness {
		if err := require("value"); err != nil {
			return cfg, err
		}
	}
	switch kind {
	case ClipSetOnOff:
		var v SetOnOffClipConfig
		if err := decodeClip(data, &v); err != nil {
			return ClipConfig{}, fmt.Errorf("unmarshal set_on_off config: %w", err)
		}
		cfg.SetOnOff = &v
	case ClipSetBrightness:
		var v SetBrightnessClipConfig
		if err := decodeClip(data, &v); err != nil {
			return ClipConfig{}, fmt.Errorf("unmarshal set_brightness config: %w", err)
		}
		if v.Value < 0 || v.Value > 254 {
			return ClipConfig{}, fmt.Errorf("brightness must be between 0 and 254")
		}
		cfg.SetBrightness = &v
	case ClipSetColor:
		var v SetColorClipConfig
		if err := decodeClip(data, &v); err != nil {
			return ClipConfig{}, fmt.Errorf("unmarshal set_color config: %w", err)
		}
		switch v.Mode {
		case ColorModeRGB:
			if v.RGB == nil {
				return ClipConfig{}, fmt.Errorf("unmarshal set_color: mode=rgb missing rgb payload")
			}
			var channels map[string]json.RawMessage
			if err := json.Unmarshal(fields["rgb"], &channels); err != nil {
				return cfg, err
			}
			for _, key := range []string{"r", "g", "b"} {
				if value, ok := channels[key]; !ok || bytes.Equal(bytes.TrimSpace(value), []byte("null")) {
					return cfg, fmt.Errorf("rgb.%s is required", key)
				}
			}

			if v.Temp != nil {
				return ClipConfig{}, fmt.Errorf("rgb color must not include temp")
			}
			if v.RGB.R < 0 || v.RGB.R > 255 || v.RGB.G < 0 || v.RGB.G > 255 || v.RGB.B < 0 || v.RGB.B > 255 {
				return ClipConfig{}, fmt.Errorf("RGB channels must be between 0 and 255")
			}
		case ColorModeTemp:
			if v.Temp == nil {
				return ClipConfig{}, fmt.Errorf("unmarshal set_color: mode=temp missing temp payload")
			}
			var temperature map[string]json.RawMessage
			if err := json.Unmarshal(fields["temp"], &temperature); err != nil {
				return cfg, err
			}
			if value, ok := temperature["mireds"]; !ok || bytes.Equal(bytes.TrimSpace(value), []byte("null")) {
				return cfg, fmt.Errorf("temp.mireds is required")
			}

			if v.RGB != nil {
				return ClipConfig{}, fmt.Errorf("temp color must not include rgb")
			}
			if v.Temp.Mireds < 0 {
				return ClipConfig{}, fmt.Errorf("color temperature must be non-negative")
			}
		default:
			return ClipConfig{}, fmt.Errorf("unmarshal set_color: unknown mode %q", v.Mode)
		}
		cfg.SetColor = &v
	case ClipNativeEffect:
		var v NativeEffectClipConfig
		if err := decodeClip(data, &v); err != nil {
			return ClipConfig{}, fmt.Errorf("unmarshal native_effect config: %w", err)
		}
		if strings.TrimSpace(v.Name) == "" {
			return ClipConfig{}, fmt.Errorf("native effect name is required")
		}
		cfg.NativeEffect = &v
	default:
		return ClipConfig{}, fmt.Errorf("unmarshal clip config: unknown kind %q", kind)
	}
	return cfg, nil
}

func decodeClip[T any](data []byte, value *T) error {
	if bytes.Equal(bytes.TrimSpace(data), []byte("null")) {
		return fmt.Errorf("clip config must be an object")
	}
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(value); err != nil {
		return err
	}
	var trailing json.RawMessage
	if err := decoder.Decode(&trailing); err != io.EOF {
		return fmt.Errorf("clip config must contain one object")
	}
	return nil
}
