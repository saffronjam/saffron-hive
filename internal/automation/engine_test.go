package automation

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func setupEngine(t *testing.T, reader *mockStateReader, s *mockStore) (*Engine, eventbus.EventBus, func()) {
	t.Helper()
	bus := eventbus.NewChannelBus()
	engine := NewEngine(bus, reader, s)
	engine.now = func() time.Time {
		return time.Date(2025, 1, 6, 22, 30, 0, 0, time.UTC)
	}
	ctx, cancel := context.WithCancel(context.Background())
	go func() { _ = engine.Run(ctx) }()
	time.Sleep(20 * time.Millisecond)
	return engine, bus, cancel
}

func TestEngineTriggerMatch(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.setLightState("light-1", &device.LightState{On: device.Ptr(true)})

	s := newMockStore()
	devID := device.DeviceID("light-1")
	s.addAutomation(store.Automation{
		ID:            "auto-1",
		Name:          "test",
		Enabled:       true,
		TriggerEvent:  "device.state_changed",
		ConditionExpr: `device("light-1").on == true`,
	}, []store.AutomationAction{
		{ID: "act-1", AutomationID: "auto-1", ActionType: ActionSetDeviceState, DeviceID: &devID, Payload: `{"brightness": 100}`},
	})

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "light-1",
		Timestamp: time.Now(),
	})

	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("expected command to be published")
	}
}

func TestEngineTriggerNoMatch(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	devID := device.DeviceID("light-1")
	s.addAutomation(store.Automation{
		ID:            "auto-1",
		Name:          "test",
		Enabled:       true,
		TriggerEvent:  "device.state_changed",
		ConditionExpr: `true`,
	}, []store.AutomationAction{
		{ID: "act-1", AutomationID: "auto-1", ActionType: ActionSetDeviceState, DeviceID: &devID, Payload: `{"brightness": 100}`},
	})

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceAvailabilityChanged,
		DeviceID:  "light-1",
		Timestamp: time.Now(),
	})

	select {
	case <-ch:
		t.Fatal("expected no command for non-matching trigger")
	case <-time.After(100 * time.Millisecond):
	}
}

func TestEngineConditionTrue(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "sensor-1", Name: "sensor-1"})
	reader.setSensorState("sensor-1", &device.SensorState{Temperature: device.Ptr(30.0)})

	s := newMockStore()
	devID := device.DeviceID("light-1")
	s.addAutomation(store.Automation{
		ID:            "auto-1",
		Name:          "temp-check",
		Enabled:       true,
		TriggerEvent:  "device.state_changed",
		ConditionExpr: `device("sensor-1").temperature > 25`,
	}, []store.AutomationAction{
		{ID: "act-1", AutomationID: "auto-1", ActionType: ActionSetDeviceState, DeviceID: &devID, Payload: `{"on": true}`},
	})

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "sensor-1",
		Timestamp: time.Now(),
	})

	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("expected command when condition is true")
	}
}

func TestEngineConditionFalse(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "sensor-1", Name: "sensor-1"})
	reader.setSensorState("sensor-1", &device.SensorState{Temperature: device.Ptr(20.0)})

	s := newMockStore()
	devID := device.DeviceID("light-1")
	s.addAutomation(store.Automation{
		ID:            "auto-1",
		Name:          "temp-check",
		Enabled:       true,
		TriggerEvent:  "device.state_changed",
		ConditionExpr: `device("sensor-1").temperature > 25`,
	}, []store.AutomationAction{
		{ID: "act-1", AutomationID: "auto-1", ActionType: ActionSetDeviceState, DeviceID: &devID, Payload: `{"on": true}`},
	})

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "sensor-1",
		Timestamp: time.Now(),
	})

	select {
	case <-ch:
		t.Fatal("expected no command when condition is false")
	case <-time.After(100 * time.Millisecond):
	}
}

func TestEngineMultipleAutomations(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "sensor-1", Name: "sensor-1"})
	reader.setSensorState("sensor-1", &device.SensorState{Temperature: device.Ptr(30.0)})

	s := newMockStore()
	devID1 := device.DeviceID("light-1")
	devID2 := device.DeviceID("light-2")
	devID3 := device.DeviceID("light-3")

	s.addAutomation(store.Automation{
		ID: "auto-1", Name: "a", Enabled: true,
		TriggerEvent: "device.state_changed", ConditionExpr: `device("sensor-1").temperature > 25`,
	}, []store.AutomationAction{
		{ID: "act-1", AutomationID: "auto-1", ActionType: ActionSetDeviceState, DeviceID: &devID1, Payload: `{"on": true}`},
	})
	s.addAutomation(store.Automation{
		ID: "auto-2", Name: "b", Enabled: true,
		TriggerEvent: "device.state_changed", ConditionExpr: `device("sensor-1").temperature > 35`,
	}, []store.AutomationAction{
		{ID: "act-2", AutomationID: "auto-2", ActionType: ActionSetDeviceState, DeviceID: &devID2, Payload: `{"on": true}`},
	})
	s.addAutomation(store.Automation{
		ID: "auto-3", Name: "c", Enabled: true,
		TriggerEvent: "device.state_changed", ConditionExpr: `device("sensor-1").temperature > 20`,
	}, []store.AutomationAction{
		{ID: "act-3", AutomationID: "auto-3", ActionType: ActionSetDeviceState, DeviceID: &devID3, Payload: `{"on": true}`},
	})

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "sensor-1",
		Timestamp: time.Now(),
	})

	var commands []eventbus.Event
	timeout := time.After(time.Second)
	for len(commands) < 2 {
		select {
		case evt := <-ch:
			commands = append(commands, evt)
		case <-timeout:
			t.Fatalf("expected 2 commands, got %d", len(commands))
		}
	}

	select {
	case <-ch:
		t.Fatal("expected exactly 2 commands (auto-2 condition is false)")
	case <-time.After(100 * time.Millisecond):
	}
}

func TestEngineDisabledAutomation(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	devID := device.DeviceID("light-1")
	s.addAutomation(store.Automation{
		ID: "auto-1", Name: "disabled", Enabled: false,
		TriggerEvent: "device.state_changed", ConditionExpr: `true`,
	}, []store.AutomationAction{
		{ID: "act-1", AutomationID: "auto-1", ActionType: ActionSetDeviceState, DeviceID: &devID, Payload: `{"on": true}`},
	})

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "light-1",
		Timestamp: time.Now(),
	})

	select {
	case <-ch:
		t.Fatal("expected no command for disabled automation")
	case <-time.After(100 * time.Millisecond):
	}
}

func TestEngineMultipleActions(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	devID1 := device.DeviceID("light-1")
	devID2 := device.DeviceID("light-2")
	devID3 := device.DeviceID("light-3")
	s.addAutomation(store.Automation{
		ID: "auto-1", Name: "multi", Enabled: true,
		TriggerEvent: "device.state_changed", ConditionExpr: `true`,
	}, []store.AutomationAction{
		{ID: "act-1", AutomationID: "auto-1", ActionType: ActionSetDeviceState, DeviceID: &devID1, Payload: `{"brightness": 100}`},
		{ID: "act-2", AutomationID: "auto-1", ActionType: ActionSetDeviceState, DeviceID: &devID2, Payload: `{"brightness": 150}`},
		{ID: "act-3", AutomationID: "auto-1", ActionType: ActionSetDeviceState, DeviceID: &devID3, Payload: `{"on": true}`},
	})

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "x",
		Timestamp: time.Now(),
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
