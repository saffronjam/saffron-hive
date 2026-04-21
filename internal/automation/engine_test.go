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
	engine := NewEngine(bus, reader, s, s, nil)
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
	reader.setDeviceState("light-1", &device.DeviceState{On: device.Ptr(true)})

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
	reader.setDeviceState("sensor-1", &device.DeviceState{Temperature: device.Ptr(20.0)})

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
	reader.setDeviceState("sensor-1", &device.DeviceState{Temperature: device.Ptr(30.0)})

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
	reader.setDeviceState("sensor-1", &device.DeviceState{Temperature: device.Ptr(20.0)})

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
		cmd, ok := evt.Payload.(device.Command)
		if !ok {
			t.Fatalf("expected Command, got %T", evt.Payload)
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
		cmd, ok := evt.Payload.(device.Command)
		if !ok {
			t.Fatalf("expected Command, got %T", evt.Payload)
		}
		if cmd.DeviceID != "light-1" {
			t.Fatalf("expected light-1, got %s", cmd.DeviceID)
		}
	case <-time.After(time.Second):
		t.Fatal("expected action to fire from scheduled trigger")
	}
}

// TestEngineButtonActionTrigger verifies that triggers keyed on
// device.action_fired fire when the event arrives and the
// trigger.payload.action filter matches. Parameterised over a variety of
// realistic action values to catch any payload-field regressions.
func TestEngineButtonActionTrigger(t *testing.T) {
	cases := []struct {
		name        string
		wantAction  string
		firedAction string
		shouldFire  bool
	}{
		{"single matches", "single", "single", true},
		{"double matches", "double", "double", true},
		{"hold matches", "hold", "hold", true},
		{"on_press matches", "on_press", "on_press", true},
		{"on_press_release matches", "on_press_release", "on_press_release", true},
		{"mismatch does not fire", "single", "double", false},
		{"empty fired action does not match", "single", "", false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			reader := newMockStateReader()
			reader.addDevice(device.Device{ID: "btn-1", Name: "Gaming room switch"})

			s := newMockStore()
			triggerConfig := `{"kind":"event","event_type":"device.action_fired","filter_expr":"trigger.device_id == \"btn-1\" && trigger.payload.action == \"` + tc.wantAction + `\""}`
			s.addAutomationGraph(
				store.Automation{ID: "auto-btn", Name: "btn-" + tc.name, Enabled: true},
				[]store.AutomationNode{
					{ID: "t1", AutomationID: "auto-btn", Type: "trigger", Config: triggerConfig},
					{ID: "a1", AutomationID: "auto-btn", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
				},
				[]store.AutomationEdge{
					{ID: "e1", AutomationID: "auto-btn", FromNodeID: "t1", ToNodeID: "a1"},
				},
			)

			_, bus, cancel := setupEngine(t, reader, s)
			defer cancel()

			ch := bus.Subscribe(eventbus.EventCommandRequested)
			defer bus.Unsubscribe(ch)

			bus.Publish(eventbus.Event{
				Type:      eventbus.EventDeviceActionFired,
				DeviceID:  "btn-1",
				Timestamp: time.Now(),
				Payload:   device.Action{Action: tc.firedAction},
			})

			select {
			case <-ch:
				if !tc.shouldFire {
					t.Fatalf("expected no fire for action %q, but action fired", tc.firedAction)
				}
			case <-time.After(200 * time.Millisecond):
				if tc.shouldFire {
					t.Fatalf("expected fire for action %q, but nothing fired", tc.firedAction)
				}
			}
		})
	}
}

// TestEngineButtonActionTriggerDeviceIDFilter verifies the device_id filter
// discriminates between buttons — a press from a different button must not
// fire the automation even when the action value matches.
func TestEngineButtonActionTriggerDeviceIDFilter(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "btn-1", Name: "Gaming room switch"})
	reader.addDevice(device.Device{ID: "btn-2", Name: "Office switch"})

	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-btn-id", Name: "btn id filter", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-btn-id", Type: "trigger",
				Config: `{"kind":"event","event_type":"device.action_fired","filter_expr":"trigger.device_id == \"btn-1\" && trigger.payload.action == \"single\""}`},
			{ID: "a1", AutomationID: "auto-btn-id", Type: "action",
				Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-btn-id", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceActionFired,
		DeviceID:  "btn-2",
		Timestamp: time.Now(),
		Payload:   device.Action{Action: "single"},
	})

	select {
	case <-ch:
		t.Fatal("expected no fire when a different button published the same action")
	case <-time.After(150 * time.Millisecond):
	}

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceActionFired,
		DeviceID:  "btn-1",
		Timestamp: time.Now(),
		Payload:   device.Action{Action: "single"},
	})

	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("expected fire when the configured button published the action")
	}
}

// TestEngineActionIncomingOr verifies that an action node with multiple
// incoming edges fires when ANY single incoming path is active. This covers
// the recently changed AND→OR semantics on action nodes.
func TestEngineActionIncomingOr(t *testing.T) {
	cases := []struct {
		name          string
		condAExpr     string
		condBExpr     string
		expectFire    bool
		expectFireMsg string
	}{
		{"A true, B false fires", "true", "false", true, "A alone should satisfy"},
		{"A false, B true fires", "false", "true", true, "B alone should satisfy"},
		{"both true fires once", "true", "true", true, "either alone satisfies"},
		{"both false does not fire", "false", "false", false, "no incoming is active"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			reader := newMockStateReader()
			reader.addDevice(device.Device{ID: "btn-1", Name: "btn"})

			s := newMockStore()
			s.addAutomationGraph(
				store.Automation{ID: "auto-or", Name: "action-or", Enabled: true},
				[]store.AutomationNode{
					{ID: "t1", AutomationID: "auto-or", Type: "trigger",
						Config: `{"kind":"event","event_type":"device.state_changed","filter_expr":"true"}`},
					{ID: "cA", AutomationID: "auto-or", Type: "condition",
						Config: `{"expr":"` + tc.condAExpr + `"}`},
					{ID: "cB", AutomationID: "auto-or", Type: "condition",
						Config: `{"expr":"` + tc.condBExpr + `"}`},
					{ID: "a1", AutomationID: "auto-or", Type: "action",
						Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
				},
				[]store.AutomationEdge{
					{ID: "e1", AutomationID: "auto-or", FromNodeID: "t1", ToNodeID: "cA"},
					{ID: "e2", AutomationID: "auto-or", FromNodeID: "t1", ToNodeID: "cB"},
					{ID: "e3", AutomationID: "auto-or", FromNodeID: "cA", ToNodeID: "a1"},
					{ID: "e4", AutomationID: "auto-or", FromNodeID: "cB", ToNodeID: "a1"},
				},
			)

			_, bus, cancel := setupEngine(t, reader, s)
			defer cancel()

			ch := bus.Subscribe(eventbus.EventCommandRequested)
			defer bus.Unsubscribe(ch)

			bus.Publish(eventbus.Event{
				Type:      eventbus.EventDeviceStateChanged,
				DeviceID:  "btn-1",
				Timestamp: time.Now(),
			})

			select {
			case <-ch:
				if !tc.expectFire {
					t.Fatalf("unexpected fire: %s", tc.expectFireMsg)
				}
				select {
				case <-ch:
					t.Fatal("action fired more than once per event — OR should deduplicate per evaluation")
				case <-time.After(100 * time.Millisecond):
				}
			case <-time.After(300 * time.Millisecond):
				if tc.expectFire {
					t.Fatalf("expected fire: %s", tc.expectFireMsg)
				}
			}
		})
	}
}

// TestEngineSetDeviceStateGroupFanoutFilters verifies that a set_device_state
// action targeting a mixed group delivers only capability-supported fields
// to each member: the light receives {on, brightness, color}, the plug
// receives only {on} (no brightness/color), and the bare-metal "unknown"
// device with no reported capabilities gets the full payload (permissive
// default).
func TestEngineSetDeviceStateGroupFanoutFilters(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{
		ID: "light-1", Name: "Light", Type: device.Light,
		Capabilities: []device.Capability{
			{Name: device.CapOnOff, Access: 7},
			{Name: device.CapBrightness, Access: 7},
			{Name: device.CapColor, Access: 7},
		},
	})
	reader.addDevice(device.Device{
		ID: "plug-1", Name: "Plug", Type: device.Plug,
		Capabilities: []device.Capability{
			{Name: device.CapOnOff, Access: 7},
			{Name: device.CapPower, Access: 1},
		},
	})
	reader.addDevice(device.Device{
		ID: "unknown-1", Name: "Unknown", Type: device.Unknown,
	})

	s := newMockStore()
	s.setGroupMembers("grp-mixed", []store.GroupMember{
		{ID: "m1", MemberType: device.GroupMemberDevice, MemberID: "light-1"},
		{ID: "m2", MemberType: device.GroupMemberDevice, MemberID: "plug-1"},
		{ID: "m3", MemberType: device.GroupMemberDevice, MemberID: "unknown-1"},
	})
	payload := `{\"on\":true,\"brightness\":200,\"color\":{\"r\":255,\"g\":0,\"b\":0}}`
	s.addAutomationGraph(
		store.Automation{ID: "auto-fan", Name: "fan-out", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-fan", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "a1", AutomationID: "auto-fan", Type: "action",
				Config: `{"action_type":"set_device_state","target_type":"group","target_id":"grp-mixed","payload":"` + payload + `"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-fan", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "trigger-x",
		Timestamp: time.Now(),
	})

	gotByID := make(map[device.DeviceID]device.Command)
	timeout := time.After(time.Second)
	for len(gotByID) < 3 {
		select {
		case evt := <-ch:
			cmd, ok := evt.Payload.(device.Command)
			if !ok {
				t.Fatalf("expected Command payload, got %T", evt.Payload)
			}
			gotByID[cmd.DeviceID] = cmd
		case <-timeout:
			t.Fatalf("expected 3 commands, got %d: %+v", len(gotByID), gotByID)
		}
	}

	light, ok := gotByID["light-1"]
	if !ok {
		t.Fatal("no command for light-1")
	}
	if light.On == nil || !*light.On {
		t.Errorf("light: On expected true, got %v", light.On)
	}
	if light.Brightness == nil || *light.Brightness != 200 {
		t.Errorf("light: Brightness expected 200, got %v", light.Brightness)
	}
	if light.Color == nil || light.Color.R != 255 {
		t.Errorf("light: Color expected R=255, got %+v", light.Color)
	}

	plug, ok := gotByID["plug-1"]
	if !ok {
		t.Fatal("no command for plug-1")
	}
	if plug.On == nil || !*plug.On {
		t.Errorf("plug: On expected true, got %v", plug.On)
	}
	if plug.Brightness != nil {
		t.Errorf("plug: Brightness expected nil, got %d", *plug.Brightness)
	}
	if plug.Color != nil {
		t.Errorf("plug: Color expected nil, got %+v", plug.Color)
	}

	unknown, ok := gotByID["unknown-1"]
	if !ok {
		t.Fatal("no command for unknown-1")
	}
	if unknown.On == nil || !*unknown.On || unknown.Brightness == nil || unknown.Color == nil {
		t.Errorf("unknown: expected permissive passthrough, got %+v", unknown)
	}
}
