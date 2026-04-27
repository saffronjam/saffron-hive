package device

import (
	"reflect"
	"testing"
)

func withCap(name string) Capability { return Capability{Name: name, Access: 7} }

func TestFilterCommandFields(t *testing.T) {
	light := Device{
		ID:   "light-1",
		Type: Light,
		Capabilities: []Capability{
			withCap(CapOnOff), withCap(CapBrightness), withCap(CapColorTemp), withCap(CapColor),
		},
	}
	plug := Device{
		ID:           "plug-1",
		Type:         Plug,
		Capabilities: []Capability{withCap(CapOnOff), withCap(CapPower)},
	}
	sensor := Device{
		ID:           "sensor-1",
		Type:         Sensor,
		Capabilities: []Capability{withCap(CapTemperature), withCap(CapHumidity)},
	}

	cases := []struct {
		name string
		dev  Device
		in   map[string]any
		want map[string]any
	}{
		{
			name: "light keeps all fields it supports",
			dev:  light,
			in:   map[string]any{"on": true, "brightness": 100, "colorTemp": 370, "color": map[string]any{"r": 255}},
			want: map[string]any{"on": true, "brightness": 100, "colorTemp": 370, "color": map[string]any{"r": 255}},
		},
		{
			name: "plug strips brightness and color",
			dev:  plug,
			in:   map[string]any{"on": true, "brightness": 100, "color": map[string]any{"r": 255}},
			want: map[string]any{"on": true},
		},
		{
			name: "sensor strips everything commandable",
			dev:  sensor,
			in:   map[string]any{"on": true, "brightness": 100},
			want: map[string]any{},
		},
		{
			name: "unknown field (transition) passes through",
			dev:  plug,
			in:   map[string]any{"on": true, "transition": 1.5},
			want: map[string]any{"on": true, "transition": 1.5},
		},
		{
			name: "empty input returns empty output",
			dev:  light,
			in:   map[string]any{},
			want: map[string]any{},
		},
		{
			name: "device with no capabilities passes through everything",
			dev:  Device{ID: "unknown-1"},
			in:   map[string]any{"on": true, "brightness": 100},
			want: map[string]any{"on": true, "brightness": 100},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := FilterCommandFields(tc.in, tc.dev)
			if !reflect.DeepEqual(got, tc.want) {
				t.Fatalf("FilterCommandFields = %v, want %v", got, tc.want)
			}
		})
	}
}
