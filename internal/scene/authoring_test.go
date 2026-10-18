package scene

import (
	"context"
	"reflect"
	"slices"
	"strings"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestAuthorStatesResolvesAndFilters(t *testing.T) {
	state := device.NewMemoryStore()
	state.Register(device.Device{ID: "white", Type: device.Light, Capabilities: []device.Capability{writableCap(device.CapOnOff), writableCap(device.CapBrightness), writableCap(device.CapColorTemp)}})
	state.Register(device.Device{ID: "rgb", Type: device.Light, Capabilities: []device.Capability{writableCap(device.CapColor)}})
	state.Register(device.Device{ID: "plug", Type: device.Plug, Capabilities: []device.Capability{writableCap(device.CapOnOff)}})
	state.Register(device.Device{ID: "sensor", Type: device.Sensor, Capabilities: []device.Capability{{Name: device.CapBrightness, Access: device.CapabilityAccessState}}})
	state.Register(device.Device{ID: "disabled", Type: device.Light, Disabled: true, Capabilities: []device.Capability{writableCap(device.CapOnOff)}})
	resolver := &fakeResolver{members: map[string][]device.DeviceID{"hallway": {"white", "rgb", "plug", "sensor", "disabled"}, "overlap": {"white"}}}
	targets := []store.SceneTarget{{Type: device.TargetRoom, ID: "hallway"}, {Type: device.TargetGroup, ID: "overlap"}}
	before := state.ListDevices()
	slices.SortFunc(before, func(a, b device.Device) int { return strings.Compare(string(a.ID), string(b.ID)) })
	authored := AuthorStates(context.Background(), state, resolver, targets, false, false, store.DesiredState{Brightness: device.Ptr(13), ColorTemp: device.Ptr(500), Transition: device.Ptr(1.0)})
	if len(authored) != 3 {
		t.Fatalf("states=%#v", authored)
	}
	for _, s := range authored {
		switch s.DeviceID {
		case "white":
			if s.State.Brightness == nil || *s.State.Brightness != 13 || s.State.ColorTemp == nil || *s.State.ColorTemp != 500 || !s.Lighting || s.State.Transition == nil || *s.State.Transition != 1 {
				t.Fatalf("white=%#v", s)
			}
		case "rgb":
			if s.State.ColorTemp != nil || s.State.Brightness != nil {
				t.Fatalf("unsupported fields: %#v", s)
			}
		case "plug":
			if s.Lighting || s.State.On == nil || s.State.Brightness != nil {
				t.Fatalf("supporting=%#v", s)
			}
		}
	}
	after := state.ListDevices()
	slices.SortFunc(after, func(a, b device.Device) int { return strings.Compare(string(a.ID), string(b.ID)) })
	if !reflect.DeepEqual(before, after) {
		t.Fatal("authoring changed devices")
	}
}

func TestAuthorStatesCaptureAndFallback(t *testing.T) {
	state := device.NewMemoryStore()
	state.Register(device.Device{ID: "thermostat", Type: device.Climate, Capabilities: []device.Capability{writableCap(device.CapTargetTemperature), writableCap(device.CapHvacMode), {Name: device.CapFanMode, Access: device.CapabilityAccessState}}})
	state.Register(device.Device{ID: "plug", Type: device.Plug, Capabilities: []device.Capability{writableCap(device.CapOnOff)}})
	state.UpdateDeviceState("thermostat", device.DeviceState{TargetTemperature: device.Ptr(21.0), HvacMode: device.Ptr("heat"), FanMode: device.Ptr("auto")})
	resolver := &fakeResolver{members: map[string][]device.DeviceID{"room": {"thermostat", "plug"}}}
	targets := []store.SceneTarget{{Type: device.TargetRoom, ID: "room"}}
	captured := AuthorStates(context.Background(), state, resolver, targets, true, false, store.DesiredState{})
	if len(captured) != 1 || captured[0].DeviceID != "thermostat" || captured[0].State.FanMode != nil || captured[0].State.TargetTemperature == nil || *captured[0].State.TargetTemperature != 21 {
		t.Fatalf("capture=%#v", captured)
	}
	fallback := AuthorStates(context.Background(), state, resolver, targets, true, true, store.DesiredState{})
	if len(fallback) != 2 || fallback[0].DeviceID != "plug" || fallback[0].State.On == nil || !*fallback[0].State.On {
		t.Fatalf("fallback=%#v", fallback)
	}
}
