package automation

import (
	"fmt"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestActivateSceneExpandsToCommands(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	s.setSceneActions("scene-1", []store.SceneAction{
		{ID: "sa-1", SceneID: "scene-1", DeviceID: "light-1", Payload: `{"brightness": 100}`},
		{ID: "sa-2", SceneID: "scene-1", DeviceID: "light-2", Payload: `{"brightness": 150}`},
		{ID: "sa-3", SceneID: "scene-1", DeviceID: "light-3", Payload: `{"on": true}`},
	})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s)
	executor.Execute(store.AutomationAction{
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

	if len(commands) != 3 {
		t.Fatalf("expected 3 commands, got %d", len(commands))
	}
}

func TestActivateSceneNotFound(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	s.setSceneError("nonexistent", fmt.Errorf("not found"))

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s)
	executor.Execute(store.AutomationAction{
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

	executor := NewActionExecutor(bus, reader, s)
	executor.Execute(store.AutomationAction{
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
	reader.setLightState("light-1", &device.LightState{Brightness: device.Ptr(100)})

	s.setSceneActions("scene-1", []store.SceneAction{
		{ID: "sa-1", SceneID: "scene-1", DeviceID: "light-1", Payload: `{"brightness": 100}`},
		{ID: "sa-2", SceneID: "scene-1", DeviceID: "light-2", Payload: `{"brightness": 200}`},
	})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s)
	executor.Execute(store.AutomationAction{
		ActionType: ActionActivateScene,
		Payload:    "scene-1",
	})

	select {
	case evt := <-ch:
		cmd := evt.Payload.(device.DeviceCommand)
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
