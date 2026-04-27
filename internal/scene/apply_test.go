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

	plan := BuildApplyCommands(context.Background(), resolver, state, "s1", actions, payloads)

	if len(plan.Commands) != 1 {
		t.Fatalf("expected 1 command (light-1 only), got %d: %+v", len(plan.Commands), plan.Commands)
	}
	if plan.Commands[0].DeviceID != "light-1" {
		t.Errorf("expected light-1, got %s", plan.Commands[0].DeviceID)
	}
	if len(plan.EffectRuns) != 0 {
		t.Errorf("expected no effect runs, got %d", len(plan.EffectRuns))
	}
}

// TestBuildApplyCommands_NativeEffectPayloadEmitsEffectRun confirms that a
// per-device payload tagged kind=native_effect produces an EffectRun carrying
// NativeName (and no EffectID) instead of a static command.
func TestBuildApplyCommands_NativeEffectPayloadEmitsEffectRun(t *testing.T) {
	state := device.NewMemoryStore()
	state.Register(device.Device{
		ID:           "light-1",
		Capabilities: []device.Capability{writableCap(device.CapOnOff), writableCap(device.CapBrightness)},
	})

	resolver := &fakeResolver{groups: map[string][]device.DeviceID{}}

	actions := []store.SceneAction{{SceneID: "s1", TargetType: "device", TargetID: "light-1"}}
	payloads := []store.SceneDevicePayload{
		{SceneID: "s1", DeviceID: "light-1", Payload: `{"kind":"native_effect","native_name":"fireplace"}`},
	}

	plan := BuildApplyCommands(context.Background(), resolver, state, "s1", actions, payloads)

	if len(plan.Commands) != 0 {
		t.Errorf("expected no static commands for native effect payload, got %d", len(plan.Commands))
	}
	if len(plan.EffectRuns) != 1 {
		t.Fatalf("expected 1 effect run, got %d", len(plan.EffectRuns))
	}
	got := plan.EffectRuns[0]
	if got.DeviceID != "light-1" {
		t.Errorf("device id: want light-1, got %s", got.DeviceID)
	}
	if got.NativeName != "fireplace" {
		t.Errorf("native_name: want fireplace, got %q", got.NativeName)
	}
	if got.EffectID != "" {
		t.Errorf("effect_id should be empty for native run, got %q", got.EffectID)
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
		"colorTemp":  370,
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

// TestCommandFromDesired_FrontendPayloadShape locks the contract between the
// frontend's stored ActionPayload JSON shape (camelCase keys, with a "kind"
// discriminator), store.ParseScenePayload, and commandFromDesired. The
// literal payload below is copied from a real scene_device_payloads row.
func TestCommandFromDesired_FrontendPayloadShape(t *testing.T) {
	state := device.NewMemoryStore()
	state.Register(device.Device{
		ID: "bulb",
		Capabilities: []device.Capability{
			writableCap(device.CapOnOff),
			writableCap(device.CapBrightness),
			writableCap(device.CapColorTemp),
		},
	})

	parsed, err := store.ParseScenePayload(`{"on":true,"brightness":254,"colorTemp":150,"kind":"static"}`)
	if err != nil {
		t.Fatalf("ParseScenePayload: %v", err)
	}
	if parsed.Kind != store.ScenePayloadStatic {
		t.Fatalf("expected static kind, got %q", parsed.Kind)
	}

	cmd := commandFromDesired(state, "bulb", parsed.Static)

	if cmd.ColorTemp == nil || *cmd.ColorTemp != 150 {
		t.Errorf("ColorTemp: want 150, got %v", cmd.ColorTemp)
	}
	if cmd.Brightness == nil || *cmd.Brightness != 254 {
		t.Errorf("Brightness: want 254, got %v", cmd.Brightness)
	}
	if cmd.On == nil || !*cmd.On {
		t.Errorf("On: want true, got %v", cmd.On)
	}
}
