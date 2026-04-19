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
	engine := NewEngine(bus, reader, s, s)
	engine.now = func() time.Time {
		return time.Date(2025, 1, 6, 22, 30, 0, 0, time.UTC)
	}
	ctx, cancel := context.WithCancel(context.Background())
	go func() { _ = engine.Run(ctx) }()
	time.Sleep(20 * time.Millisecond)
	return engine, bus, cancel
}

func TestEngineTriggerToAction(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.setLightState("light-1", &device.LightState{On: device.Ptr(true)})

	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "test", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"device(\"light-1\").on == true"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"brightness\":100}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

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
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "test", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"brightness\":100}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

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

func TestEngineTriggerConditionFalse(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "sensor-1", Name: "sensor-1"})
	reader.setSensorState("sensor-1", &device.SensorState{Temperature: device.Ptr(20.0)})

	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "temp-check", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"device(\"sensor-1\").temperature > 25"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

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

func TestEngineANDOperator(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "sensor-1", Name: "sensor-1"})
	reader.setSensorState("sensor-1", &device.SensorState{Temperature: device.Ptr(30.0)})

	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "and-test", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "t2", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"device(\"sensor-1\").temperature > 25"}`},
			{ID: "op1", AutomationID: "auto-1", Type: "operator", Config: `{"kind":"and"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "t2", ToNodeID: "op1"},
			{ID: "e3", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "a1"},
		},
	)

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
		t.Fatal("expected command when both AND inputs are satisfied")
	}
}

func TestEngineANDOperatorPartialFail(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "sensor-1", Name: "sensor-1"})
	reader.setSensorState("sensor-1", &device.SensorState{Temperature: device.Ptr(20.0)})

	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "and-partial", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "t2", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"device(\"sensor-1\").temperature > 25"}`},
			{ID: "op1", AutomationID: "auto-1", Type: "operator", Config: `{"kind":"and"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "t2", ToNodeID: "op1"},
			{ID: "e3", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "a1"},
		},
	)

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
		t.Fatal("expected no command when only one AND input is satisfied")
	case <-time.After(100 * time.Millisecond):
	}
}

func TestEngineOROperator(t *testing.T) {
	reader := newMockStateReader()

	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "or-test", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "t2", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.availability_changed","condition_expr":"true"}`},
			{ID: "op1", AutomationID: "auto-1", Type: "operator", Config: `{"kind":"or"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "t2", ToNodeID: "op1"},
			{ID: "e3", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "a1"},
		},
	)

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "x",
		Timestamp: time.Now(),
	})

	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("expected command when one OR input is satisfied")
	}
}

func TestEngineNOTOperator(t *testing.T) {
	reader := newMockStateReader()

	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "not-test", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"false"}`},
			{ID: "op1", AutomationID: "auto-1", Type: "operator", Config: `{"kind":"not"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "a1"},
		},
	)

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "x",
		Timestamp: time.Now(),
	})

	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("expected command when NOT inverts inactive trigger")
	}
}

func TestEngineNOTOperatorBlocksActiveInput(t *testing.T) {
	reader := newMockStateReader()

	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "not-block", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "op1", AutomationID: "auto-1", Type: "operator", Config: `{"kind":"not"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "a1"},
		},
	)

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "x",
		Timestamp: time.Now(),
	})

	select {
	case <-ch:
		t.Fatal("expected no command when NOT negates an active trigger")
	case <-time.After(100 * time.Millisecond):
	}
}

func TestEngineChainedOperators(t *testing.T) {
	reader := newMockStateReader()

	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "chain", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "t2", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "op1", AutomationID: "auto-1", Type: "operator", Config: `{"kind":"and"}`},
			{ID: "t3", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "op2", AutomationID: "auto-1", Type: "operator", Config: `{"kind":"or"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "t2", ToNodeID: "op1"},
			{ID: "e3", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "op2"},
			{ID: "e4", AutomationID: "auto-1", FromNodeID: "t3", ToNodeID: "op2"},
			{ID: "e5", AutomationID: "auto-1", FromNodeID: "op2", ToNodeID: "a1"},
		},
	)

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "x",
		Timestamp: time.Now(),
	})

	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("expected command through chained AND->OR")
	}
}

func TestEngineDisabledAutomation(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "disabled", Enabled: false},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

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
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "multi-action", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"brightness\":100}"}`},
			{ID: "a2", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-2","payload":"{\"brightness\":150}"}`},
			{ID: "a3", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-3","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a2"},
			{ID: "e3", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a3"},
		},
	)

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

func TestEngineNodeActivationEventsPublished(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "activation", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	activationCh := bus.Subscribe(eventbus.EventAutomationNodeActivated)
	defer bus.Unsubscribe(activationCh)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "x",
		Timestamp: time.Now(),
	})

	var activations []NodeActivation
	timeout := time.After(time.Second)
	for len(activations) < 2 {
		select {
		case evt := <-activationCh:
			na, ok := evt.Payload.(NodeActivation)
			if !ok {
				continue
			}
			activations = append(activations, na)
		case <-timeout:
			t.Fatalf("expected 2 activation events, got %d", len(activations))
		}
	}

	for _, na := range activations {
		if !na.Active {
			t.Errorf("expected all nodes to be active, node %s was not", na.NodeID)
		}
	}
}

func TestEngineGroupTargetResolution(t *testing.T) {
	reader := newMockStateReader()

	s := newMockStore()
	s.setGroupMembers("group-1", []store.GroupMember{
		{ID: "m1", MemberType: device.GroupMemberDevice, MemberID: "light-1"},
		{ID: "m2", MemberType: device.GroupMemberDevice, MemberID: "light-2"},
		{ID: "m3", MemberType: device.GroupMemberDevice, MemberID: "light-3"},
	})
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "group-test", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"group","target_id":"group-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

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
			t.Fatalf("expected 3 commands for group expansion, got %d", len(commands))
		}
	}
}

// TestEngineConditionGatesAction verifies that a condition node blocks an
// action when its expression is false, and allows it when true.
func TestEngineConditionGatesAction(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})

	s := newMockStore()
	// Trigger fires on any device.state_changed. Condition requires
	// hour >= 21. Engine's fixed clock (setupEngine) is 22:30 UTC, so
	// the condition passes.
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "test", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"event","event_type":"device.state_changed","filter_expr":"true"}`},
			{ID: "c1", AutomationID: "auto-1", Type: "condition", Config: `{"expr":"time.hour >= 21"}`},
			{ID: "op1", AutomationID: "auto-1", Type: "operator", Config: `{"kind":"and"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "c1", ToNodeID: "op1"},
			{ID: "e3", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "a1"},
		},
	)

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "x",
		Timestamp: time.Now(),
	})

	select {
	case evt := <-ch:
		cmd, ok := evt.Payload.(device.DeviceCommand)
		if !ok {
			t.Fatalf("expected DeviceCommand, got %T", evt.Payload)
		}
		if cmd.DeviceID != "light-1" {
			t.Fatalf("expected light-1, got %s", cmd.DeviceID)
		}
	case <-time.After(time.Second):
		t.Fatal("expected action to fire (condition should pass at 22:30)")
	}
}

// TestEngineConditionBlocksWhenFalse verifies that a condition node blocks the
// action when its expression is false.
func TestEngineConditionBlocksWhenFalse(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})

	s := newMockStore()
	// Condition time.hour >= 23; the engine clock is 22:30, so this fails.
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "test", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"event","event_type":"device.state_changed","filter_expr":"true"}`},
			{ID: "c1", AutomationID: "auto-1", Type: "condition", Config: `{"expr":"time.hour >= 23"}`},
			{ID: "op1", AutomationID: "auto-1", Type: "operator", Config: `{"kind":"and"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op1"},
			{ID: "e2", AutomationID: "auto-1", FromNodeID: "c1", ToNodeID: "op1"},
			{ID: "e3", AutomationID: "auto-1", FromNodeID: "op1", ToNodeID: "a1"},
		},
	)

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "x",
		Timestamp: time.Now(),
	})

	select {
	case <-ch:
		t.Fatal("expected no command (condition should block at 22:30 when threshold is 23)")
	case <-time.After(200 * time.Millisecond):
		// expected: no command published
	}
}

// TestEngineScheduleTriggerFires verifies that a schedule trigger fires when
// invoked by the engine's cron dispatch path (simulated via direct call).
func TestEngineScheduleTriggerFires(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})

	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "test", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"schedule","cron_expr":"0 0 9 * * *"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	engine, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	// Simulate cron firing by directly invoking the scheduled trigger handler.
	engine.handleScheduledTrigger("auto-1", "t1")

	select {
	case evt := <-ch:
		cmd, ok := evt.Payload.(device.DeviceCommand)
		if !ok {
			t.Fatalf("expected DeviceCommand, got %T", evt.Payload)
		}
		if cmd.DeviceID != "light-1" {
			t.Fatalf("expected light-1, got %s", cmd.DeviceID)
		}
	case <-time.After(time.Second):
		t.Fatal("expected action to fire from scheduled trigger")
	}
}
