package automation

import (
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func TestSkipCommandWhenStateMatches(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.setLightState("light-1", &device.LightState{Brightness: device.Ptr(200)})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionSetDeviceState,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"brightness": 200}`,
	})

	select {
	case <-ch:
		t.Fatal("expected no command when state matches")
	case <-time.After(50 * time.Millisecond):
	}
}

func TestSendCommandWhenStateDiffers(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.setLightState("light-1", &device.LightState{Brightness: device.Ptr(200)})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionSetDeviceState,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"brightness": 100}`,
	})

	select {
	case evt := <-ch:
		cmd, ok := evt.Payload.(device.DeviceCommand)
		if !ok {
			t.Fatal("expected DeviceCommand payload")
		}
		lc, ok := cmd.Payload.(device.LightCommand)
		if !ok {
			t.Fatal("expected LightCommand")
		}
		if lc.Brightness == nil || *lc.Brightness != 100 {
			t.Fatalf("expected brightness 100, got %v", lc.Brightness)
		}
	case <-time.After(time.Second):
		t.Fatal("expected command to be published")
	}
}

func TestSendCommandWhenCurrentStateUnknown(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionSetDeviceState,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"brightness": 100}`,
	})

	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("expected command when state unknown")
	}
}

func TestPartialStateComparison(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.setLightState("light-1", &device.LightState{
		Brightness: device.Ptr(200),
		ColorTemp:  device.Ptr(350),
	})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionSetDeviceState,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"brightness": 200}`,
	})

	select {
	case <-ch:
		t.Fatal("expected no command when brightness matches (partial comparison)")
	case <-time.After(50 * time.Millisecond):
	}
}
