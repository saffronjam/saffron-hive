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
	reader.setDeviceState("light-1", &device.DeviceState{Brightness: device.Ptr(200)})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil)
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
	reader.setDeviceState("light-1", &device.DeviceState{Brightness: device.Ptr(200)})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionSetDeviceState,
		TargetType: TargetDevice,
		TargetID:   "light-1",
		Payload:    `{"brightness": 100}`,
	})

	select {
	case evt := <-ch:
		cmd, ok := evt.Payload.(device.Command)
		if !ok {
			t.Fatal("expected Command payload")
		}
		if cmd.Brightness == nil || *cmd.Brightness != 100 {
			t.Fatalf("expected brightness 100, got %v", cmd.Brightness)
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

	executor := NewActionExecutor(bus, reader, s, s, nil)
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
	reader.setDeviceState("light-1", &device.DeviceState{
		Brightness: device.Ptr(200),
		ColorTemp:  device.Ptr(350),
	})

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, s, s, nil)
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
