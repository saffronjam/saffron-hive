package automation

import (
	"fmt"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestActivateSceneExplicitPayloadsFanOut(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	s.setSceneActions("scene-1", []store.SceneAction{
		{SceneID: "scene-1", TargetType: "device", TargetID: "light-1"},
		{SceneID: "scene-1", TargetType: "device", TargetID: "light-2"},
		{SceneID: "scene-1", TargetType: "device", TargetID: "light-3"},
	})
	s.setSceneDevicePayloads("scene-1", []store.SceneDevicePayload{
		{SceneID: "scene-1", DeviceID: "light-1", Payload: `{"brightness": 100}`},
		{SceneID: "scene-1", DeviceID: "light-2", Payload: `{"brightness": 150}`},
		{SceneID: "scene-1", DeviceID: "light-3", Payload: `{"on": true}`},
	})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionActivateScene,
		Payload:    "scene-1",
	})

	var commands []eventbus.Event
	timeout := time.After(time.Second)
	for len(commands) < 3 {
		select {
		case evt := <-ch:
			commands = append(commands, evt)
		case <-timeout:
			t.Fatalf("expected 3 commands, got %d", len(commands))
		}
	}
}

func TestActivateSceneNotFound(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	s.setSceneError("nonexistent", fmt.Errorf("not found"))

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionActivateScene,
		Payload:    "nonexistent",
	})

	select {
	case <-ch:
		t.Fatal("expected no commands for nonexistent scene")
	case <-time.After(50 * time.Millisecond):
	}
}

func TestActivateSceneEmptyActions(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	s.setSceneActions("scene-empty", []store.SceneAction{})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionActivateScene,
		Payload:    "scene-empty",
	})

	select {
	case <-ch:
		t.Fatal("expected no commands for empty scene")
	case <-time.After(50 * time.Millisecond):
	}
}

func TestActivateSceneSkipsMatchingState(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.setDeviceState("light-1", &device.DeviceState{Brightness: device.Ptr(100)})

	s.setSceneActions("scene-1", []store.SceneAction{
		{SceneID: "scene-1", TargetType: "device", TargetID: "light-1"},
		{SceneID: "scene-1", TargetType: "device", TargetID: "light-2"},
	})
	s.setSceneDevicePayloads("scene-1", []store.SceneDevicePayload{
		{SceneID: "scene-1", DeviceID: "light-1", Payload: `{"brightness": 100}`},
		{SceneID: "scene-1", DeviceID: "light-2", Payload: `{"brightness": 200}`},
	})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionActivateScene,
		Payload:    "scene-1",
	})

	select {
	case evt := <-ch:
		cmd := evt.Payload.(device.Command)
		if cmd.DeviceID != "light-2" {
			t.Fatalf("expected command for light-2, got %s", cmd.DeviceID)
		}
	case <-time.After(time.Second):
		t.Fatal("expected at least one command")
	}

	select {
	case <-ch:
		t.Fatal("expected only one command (light-1 should be skipped)")
	case <-time.After(50 * time.Millisecond):
	}
}

// TestActivateSceneDefaultFallbackCapabilityFiltered — when a device is pulled
// in by a group/room target but has no per-device payload, apply emits a
// warm-white default gated by the device's capabilities.
func TestActivateSceneDefaultFallbackCapabilityFiltered(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	writable := func(name string) device.Capability { return device.Capability{Name: name, Access: 7} }
	reader.addDevice(device.Device{
		ID:           "lamp-1",
		Name:         "Lamp 1",
		Capabilities: []device.Capability{writable(device.CapOnOff), writable(device.CapBrightness), writable(device.CapColorTemp)},
	})
	reader.addDevice(device.Device{
		ID:           "plug-1",
		Name:         "Plug 1",
		Capabilities: []device.Capability{writable(device.CapOnOff)},
	})

	s.setSceneActions("scene-1", []store.SceneAction{
		{SceneID: "scene-1", TargetType: "group", TargetID: "living"},
	})
	s.setGroupMembers("living", []store.GroupMember{
		{ID: "m-1", GroupID: "living", MemberType: device.GroupMemberDevice, MemberID: "lamp-1"},
		{ID: "m-2", GroupID: "living", MemberType: device.GroupMemberDevice, MemberID: "plug-1"},
	})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil)
	executor.ExecuteGraphAction(ActionConfig{ActionType: ActionActivateScene, Payload: "scene-1"})

	cmds := drainCommands(t, ch, 2)
	byID := map[device.DeviceID]device.Command{}
	for _, c := range cmds {
		byID[c.DeviceID] = c
	}

	lamp, ok := byID["lamp-1"]
	if !ok {
		t.Fatalf("lamp-1 missing command")
	}
	if lamp.On == nil || !*lamp.On || lamp.Brightness == nil || *lamp.Brightness != 200 || lamp.ColorTemp == nil || *lamp.ColorTemp != 370 {
		t.Fatalf("lamp default payload wrong: on=%v bri=%v temp=%v", lamp.On, lamp.Brightness, lamp.ColorTemp)
	}
	plug, ok := byID["plug-1"]
	if !ok {
		t.Fatalf("plug-1 missing command")
	}
	if plug.On == nil || !*plug.On || plug.Brightness != nil || plug.ColorTemp != nil {
		t.Fatalf("plug default payload wrong: on=%v bri=%v temp=%v", plug.On, plug.Brightness, plug.ColorTemp)
	}
}

func TestActivateSceneStampsSceneOrigin(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	s.setSceneActions("scene-7", []store.SceneAction{
		{SceneID: "scene-7", TargetType: "device", TargetID: "light-1"},
	})
	s.setSceneDevicePayloads("scene-7", []store.SceneDevicePayload{
		{SceneID: "scene-7", DeviceID: "light-1", Payload: `{"brightness": 100}`},
	})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil)
	executor.ExecuteGraphAction(ActionConfig{ActionType: ActionActivateScene, Payload: "scene-7"})

	select {
	case evt := <-ch:
		cmd := evt.Payload.(device.Command)
		if cmd.Origin.Kind != device.OriginKindScene || cmd.Origin.ID != "scene-7" {
			t.Fatalf("expected scene origin scene-7, got %+v", cmd.Origin)
		}
	case <-time.After(time.Second):
		t.Fatal("expected command to be published")
	}
}

func drainCommands(t *testing.T, ch <-chan eventbus.Event, want int) []device.Command {
	t.Helper()
	out := make([]device.Command, 0, want)
	timeout := time.After(time.Second)
	for len(out) < want {
		select {
		case evt := <-ch:
			out = append(out, evt.Payload.(device.Command))
		case <-timeout:
			t.Fatalf("expected %d commands, got %d", want, len(out))
		}
	}
	return out
}
