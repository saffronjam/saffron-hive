package automation

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestReloadPicksUpNewAutomation(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()

	bus := eventbus.NewChannelBus()
	engine := NewEngine(bus, reader, s)
	engine.now = func() time.Time { return time.Date(2025, 1, 1, 12, 0, 0, 0, time.UTC) }

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go func() { _ = engine.Run(ctx) }()
	time.Sleep(20 * time.Millisecond)

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "x", Timestamp: time.Now()})
	select {
	case <-ch:
		t.Fatal("expected no command before adding automation")
	case <-time.After(100 * time.Millisecond):
	}

	devID := device.DeviceID("light-1")
	s.addAutomation(store.Automation{
		ID: "auto-1", Name: "new", Enabled: true,
		TriggerEvent: "device.state_changed", ConditionExpr: `true`,
	}, []store.AutomationAction{
		{ID: "act-1", AutomationID: "auto-1", ActionType: ActionSetDeviceState, DeviceID: &devID, Payload: `{"brightness": 100}`},
	})

	if err := engine.Reload(ctx); err != nil {
		t.Fatal(err)
	}

	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "x", Timestamp: time.Now()})
	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("expected command after reload picks up new automation")
	}
}

func TestReloadRemovesDeletedAutomation(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	devID := device.DeviceID("light-1")
	s.addAutomation(store.Automation{
		ID: "auto-1", Name: "deleteme", Enabled: true,
		TriggerEvent: "device.state_changed", ConditionExpr: `true`,
	}, []store.AutomationAction{
		{ID: "act-1", AutomationID: "auto-1", ActionType: ActionSetDeviceState, DeviceID: &devID, Payload: `{"brightness": 100}`},
	})

	bus := eventbus.NewChannelBus()
	engine := NewEngine(bus, reader, s)
	engine.now = func() time.Time { return time.Date(2025, 1, 1, 12, 0, 0, 0, time.UTC) }

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go func() { _ = engine.Run(ctx) }()
	time.Sleep(20 * time.Millisecond)

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "x", Timestamp: time.Now()})
	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("expected command before removal")
	}

	s.removeAutomation("auto-1")
	if err := engine.Reload(ctx); err != nil {
		t.Fatal(err)
	}

	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "x", Timestamp: time.Now()})
	select {
	case <-ch:
		t.Fatal("expected no command after automation removed and reloaded")
	case <-time.After(100 * time.Millisecond):
	}
}
