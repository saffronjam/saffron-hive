package effect

import (
	"encoding/json"
	"reflect"
	"testing"
)

func TestStepConfigJSONRoundTrip(t *testing.T) {
	cases := []struct {
		name string
		kind StepKind
		cfg  StepConfig
		want string
	}{
		{
			name: "wait",
			kind: StepWait,
			cfg:  StepConfig{Wait: &WaitConfig{DurationMS: 250}},
			want: `{"duration_ms":250}`,
		},
		{
			name: "set_on_off",
			kind: StepSetOnOff,
			cfg:  StepConfig{SetOnOff: &SetOnOffConfig{Value: true, TransitionMS: 100}},
			want: `{"value":true,"transition_ms":100}`,
		},
		{
			name: "set_brightness",
			kind: StepSetBrightness,
			cfg:  StepConfig{SetBrightness: &SetBrightnessConfig{Value: 200, TransitionMS: 500}},
			want: `{"value":200,"transition_ms":500}`,
		},
		{
			name: "set_color_rgb",
			kind: StepSetColorRGB,
			cfg:  StepConfig{SetColorRGB: &SetColorRGBConfig{R: 244, G: 42, B: 23, TransitionMS: 200}},
			want: `{"r":244,"g":42,"b":23,"transition_ms":200}`,
		},
		{
			name: "set_color_temp",
			kind: StepSetColorTemp,
			cfg:  StepConfig{SetColorTemp: &SetColorTempConfig{Mireds: 370, TransitionMS: 0}},
			want: `{"mireds":370,"transition_ms":0}`,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := MarshalConfig(tc.kind, tc.cfg)
			if err != nil {
				t.Fatalf("marshal: %v", err)
			}
			if string(got) != tc.want {
				t.Errorf("marshal = %s, want %s", got, tc.want)
			}

			parsed, err := UnmarshalConfig(tc.kind, got)
			if err != nil {
				t.Fatalf("unmarshal: %v", err)
			}
			if !reflect.DeepEqual(parsed, tc.cfg) {
				t.Errorf("round trip mismatch:\n got  %+v\n want %+v", parsed, tc.cfg)
			}

			reMarshalled, err := MarshalConfig(tc.kind, parsed)
			if err != nil {
				t.Fatalf("re-marshal: %v", err)
			}
			if string(reMarshalled) != tc.want {
				t.Errorf("re-marshal = %s, want %s", reMarshalled, tc.want)
			}
		})
	}
}

func TestMarshalConfigMissingPayloadReturnsError(t *testing.T) {
	for _, kind := range []StepKind{StepWait, StepSetOnOff, StepSetBrightness, StepSetColorRGB, StepSetColorTemp} {
		if _, err := MarshalConfig(kind, StepConfig{}); err == nil {
			t.Errorf("kind %q: expected error for missing payload", kind)
		}
	}
}

func TestMarshalConfigUnknownKind(t *testing.T) {
	if _, err := MarshalConfig(StepKind("bogus"), StepConfig{}); err == nil {
		t.Fatal("expected error for unknown kind")
	}
}

func TestUnmarshalConfigUnknownKind(t *testing.T) {
	if _, err := UnmarshalConfig(StepKind("bogus"), []byte(`{}`)); err == nil {
		t.Fatal("expected error for unknown kind")
	}
}

func TestUnmarshalConfigMalformedJSON(t *testing.T) {
	if _, err := UnmarshalConfig(StepWait, []byte(`{not json`)); err == nil {
		t.Fatal("expected error for malformed JSON")
	}
}

func TestStepConfigDiskShapeColorRGB(t *testing.T) {
	cfg := StepConfig{SetColorRGB: &SetColorRGBConfig{R: 244, G: 42, B: 23, TransitionMS: 200}}
	raw, err := MarshalConfig(StepSetColorRGB, cfg)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var fields map[string]any
	if err := json.Unmarshal(raw, &fields); err != nil {
		t.Fatalf("unmarshal raw: %v", err)
	}
	for _, k := range []string{"r", "g", "b", "transition_ms"} {
		if _, ok := fields[k]; !ok {
			t.Errorf("missing field %q in disk shape: %s", k, raw)
		}
	}
	if len(fields) != 4 {
		t.Errorf("extra fields in disk shape: %s", raw)
	}
}
