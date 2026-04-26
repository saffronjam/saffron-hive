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
			kind: ClipSetColorRGB,
			cfg:  ClipConfig{SetColorRGB: &SetColorRGBClipConfig{R: 244, G: 42, B: 23}},
			want: `{"r":244,"g":42,"b":23}`,
		},
		{
			name: "set_color_temp",
			kind: ClipSetColorTemp,
			cfg:  ClipConfig{SetColorTemp: &SetColorTempClipConfig{Mireds: 370}},
			want: `{"mireds":370}`,
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
	for _, kind := range []ClipKind{ClipSetOnOff, ClipSetBrightness, ClipSetColorRGB, ClipSetColorTemp, ClipNativeEffect} {
		if _, err := MarshalClipConfig(kind, ClipConfig{}); err == nil {
			t.Errorf("kind %q: expected error for missing payload", kind)
		}
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

func TestClipConfigDiskShapeColorRGB(t *testing.T) {
	cfg := ClipConfig{SetColorRGB: &SetColorRGBClipConfig{R: 244, G: 42, B: 23}}
	raw, err := MarshalClipConfig(ClipSetColorRGB, cfg)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var fields map[string]any
	if err := json.Unmarshal(raw, &fields); err != nil {
		t.Fatalf("unmarshal raw: %v", err)
	}
	for _, k := range []string{"r", "g", "b"} {
		if _, ok := fields[k]; !ok {
			t.Errorf("missing field %q in disk shape: %s", k, raw)
		}
	}
	if len(fields) != 3 {
		t.Errorf("expected exactly 3 fields in disk shape, got: %s", raw)
	}
}
