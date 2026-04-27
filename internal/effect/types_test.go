package effect

import (
	"encoding/json"
	"reflect"
	"testing"
)

func TestClipConfigJSONRoundTrip(t *testing.T) {
	cases := []struct {
		name string
		kind ClipKind
		cfg  ClipConfig
		want string
	}{
		{
			name: "set_on_off",
			kind: ClipSetOnOff,
			cfg:  ClipConfig{SetOnOff: &SetOnOffClipConfig{Value: true}},
			want: `{"value":true}`,
		},
		{
			name: "set_brightness",
			kind: ClipSetBrightness,
			cfg:  ClipConfig{SetBrightness: &SetBrightnessClipConfig{Value: 200}},
			want: `{"value":200}`,
		},
		{
			name: "set_color_rgb",
			kind: ClipSetColor,
			cfg: ClipConfig{SetColor: &SetColorClipConfig{
				Mode: ColorModeRGB,
				RGB:  &SetColorRGBValue{R: 244, G: 42, B: 23},
			}},
			want: `{"mode":"rgb","rgb":{"r":244,"g":42,"b":23}}`,
		},
		{
			name: "set_color_temp",
			kind: ClipSetColor,
			cfg: ClipConfig{SetColor: &SetColorClipConfig{
				Mode: ColorModeTemp,
				Temp: &SetColorTempValue{Mireds: 370},
			}},
			want: `{"mode":"temp","temp":{"mireds":370}}`,
		},
		{
			name: "native_effect",
			kind: ClipNativeEffect,
			cfg:  ClipConfig{NativeEffect: &NativeEffectClipConfig{Name: "candle"}},
			want: `{"name":"candle"}`,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := MarshalClipConfig(tc.kind, tc.cfg)
			if err != nil {
				t.Fatalf("marshal: %v", err)
			}
			if string(got) != tc.want {
				t.Errorf("marshal = %s, want %s", got, tc.want)
			}

			parsed, err := UnmarshalClipConfig(tc.kind, got)
			if err != nil {
				t.Fatalf("unmarshal: %v", err)
			}
			if !reflect.DeepEqual(parsed, tc.cfg) {
				t.Errorf("round trip mismatch:\n got  %+v\n want %+v", parsed, tc.cfg)
			}

			reMarshalled, err := MarshalClipConfig(tc.kind, parsed)
			if err != nil {
				t.Fatalf("re-marshal: %v", err)
			}
			if string(reMarshalled) != tc.want {
				t.Errorf("re-marshal = %s, want %s", reMarshalled, tc.want)
			}
		})
	}
}

func TestMarshalClipConfigMissingPayloadReturnsError(t *testing.T) {
	for _, kind := range []ClipKind{ClipSetOnOff, ClipSetBrightness, ClipSetColor, ClipNativeEffect} {
		if _, err := MarshalClipConfig(kind, ClipConfig{}); err == nil {
			t.Errorf("kind %q: expected error for missing payload", kind)
		}
	}
}

func TestMarshalSetColorRequiresMatchingSubPayload(t *testing.T) {
	cfgRGB := ClipConfig{SetColor: &SetColorClipConfig{Mode: ColorModeRGB}}
	if _, err := MarshalClipConfig(ClipSetColor, cfgRGB); err == nil {
		t.Error("mode=rgb without RGB payload should error")
	}
	cfgTemp := ClipConfig{SetColor: &SetColorClipConfig{Mode: ColorModeTemp}}
	if _, err := MarshalClipConfig(ClipSetColor, cfgTemp); err == nil {
		t.Error("mode=temp without Temp payload should error")
	}
	cfgUnknown := ClipConfig{SetColor: &SetColorClipConfig{Mode: ColorMode("bogus")}}
	if _, err := MarshalClipConfig(ClipSetColor, cfgUnknown); err == nil {
		t.Error("unknown mode should error")
	}
}

func TestMarshalClipConfigUnknownKind(t *testing.T) {
	if _, err := MarshalClipConfig(ClipKind("bogus"), ClipConfig{}); err == nil {
		t.Fatal("expected error for unknown kind")
	}
}

func TestUnmarshalClipConfigUnknownKind(t *testing.T) {
	if _, err := UnmarshalClipConfig(ClipKind("bogus"), []byte(`{}`)); err == nil {
		t.Fatal("expected error for unknown kind")
	}
}

func TestUnmarshalClipConfigMalformedJSON(t *testing.T) {
	if _, err := UnmarshalClipConfig(ClipSetBrightness, []byte(`{not json`)); err == nil {
		t.Fatal("expected error for malformed JSON")
	}
}

func TestClipConfigDiskShapeSetColorRGB(t *testing.T) {
	cfg := ClipConfig{SetColor: &SetColorClipConfig{
		Mode: ColorModeRGB,
		RGB:  &SetColorRGBValue{R: 244, G: 42, B: 23},
	}}
	raw, err := MarshalClipConfig(ClipSetColor, cfg)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var fields map[string]any
	if err := json.Unmarshal(raw, &fields); err != nil {
		t.Fatalf("unmarshal raw: %v", err)
	}
	if fields["mode"] != "rgb" {
		t.Errorf("mode = %v, want rgb", fields["mode"])
	}
	if _, ok := fields["temp"]; ok {
		t.Errorf("rgb-mode disk shape must not include temp: %s", raw)
	}
	rgb, ok := fields["rgb"].(map[string]any)
	if !ok {
		t.Fatalf("rgb missing or wrong type: %s", raw)
	}
	for _, k := range []string{"r", "g", "b"} {
		if _, ok := rgb[k]; !ok {
			t.Errorf("missing rgb.%s in disk shape: %s", k, raw)
		}
	}
}

func TestClipConfigDiskShapeSetColorTemp(t *testing.T) {
	cfg := ClipConfig{SetColor: &SetColorClipConfig{
		Mode: ColorModeTemp,
		Temp: &SetColorTempValue{Mireds: 370},
	}}
	raw, err := MarshalClipConfig(ClipSetColor, cfg)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var fields map[string]any
	if err := json.Unmarshal(raw, &fields); err != nil {
		t.Fatalf("unmarshal raw: %v", err)
	}
	if fields["mode"] != "temp" {
		t.Errorf("mode = %v, want temp", fields["mode"])
	}
	if _, ok := fields["rgb"]; ok {
		t.Errorf("temp-mode disk shape must not include rgb: %s", raw)
	}
	temp, ok := fields["temp"].(map[string]any)
	if !ok || temp["mireds"] == nil {
		t.Fatalf("temp.mireds missing: %s", raw)
	}
}
