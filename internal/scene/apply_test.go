package scene

import (
	"context"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func writableCap(name string) device.Capability {
	return device.Capability{Name: name, Access: 7}
}

// TestBuildApplyCommands_DropsButtonWithStrayPayload regression-tests the
// "scene immediately deactivates" bug. A scene targeting a room may include a
// button device whose persisted payload says {"on": false}. Buttons have no
// on_off capability — emitting a Command with cmd.On=&false would cause the
// watcher to track an expected on-state the device never reports, instantly
// flipping the scene back to inactive. The apply path must drop that command
// entirely.
func TestBuildApplyCommands_DropsButtonWithStrayPayload(t *testing.T) {
	state := device.NewMemoryStore()
	state.Register(device.Device{
		ID:           "light-1",
		Capabilities: []device.Capability{writableCap(device.CapOnOff), writableCap(device.CapBrightness)},
	})
	state.Register(device.Device{
		ID:           "button-1",
		Capabilities: nil,
	})

	resolver := &fakeResolver{groups: map[string][]device.DeviceID{
		"room-1": {"light-1", "button-1"},
	}}

	actions := []store.SceneAction{{SceneID: "s1", TargetType: "room", TargetID: "room-1"}}
	payloads := []store.SceneDevicePayload{
		{SceneID: "s1", DeviceID: "light-1", Payload: `{"on":true,"brightness":200}`},
		{SceneID: "s1", DeviceID: "button-1", Payload: `{"on":false}`},
	}

	cmds := BuildApplyCommands(context.Background(), resolver, state, "s1", actions, payloads)

	if len(cmds) != 1 {
		t.Fatalf("expected 1 command (light-1 only), got %d: %+v", len(cmds), cmds)
	}
	if cmds[0].DeviceID != "light-1" {
		t.Errorf("expected light-1, got %s", cmds[0].DeviceID)
	}
}

// TestCommandFromDesired_GatesByCapability ensures a payload field for a
// device that lacks the matching capability is silently dropped instead of
// surfacing on the Command (which the watcher would then track as expected
// state forever).
func TestCommandFromDesired_GatesByCapability(t *testing.T) {
	state := device.NewMemoryStore()
	state.Register(device.Device{
		ID:           "dim-only",
		Capabilities: []device.Capability{writableCap(device.CapOnOff), writableCap(device.CapBrightness)},
	})

	cmd := commandFromDesired(state, "dim-only", map[string]any{
		"on":         true,
		"brightness": 150,
		"color_temp": 370,
		"color":      map[string]any{"r": 10, "g": 20, "b": 30, "x": 0.5, "y": 0.4},
	})

	if cmd.On == nil || !*cmd.On {
		t.Errorf("expected On=true, got %v", cmd.On)
	}
	if cmd.Brightness == nil || *cmd.Brightness != 150 {
		t.Errorf("expected Brightness=150, got %v", cmd.Brightness)
	}
	if cmd.ColorTemp != nil {
		t.Errorf("expected ColorTemp=nil (no capability), got %v", *cmd.ColorTemp)
	}
	if cmd.Color != nil {
		t.Errorf("expected Color=nil (no capability), got %+v", cmd.Color)
	}
}
