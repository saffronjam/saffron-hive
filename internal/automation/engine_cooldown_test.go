package automation

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestCooldownBlocksRefire(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "cooldown", Enabled: true, CooldownSeconds: 60},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"brightness\":100}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	bus := eventbus.NewChannelBus()
	engine := NewEngine(bus, reader, s, s)

	currentTime := time.Date(2025, 1, 1, 12, 0, 0, 0, time.UTC)
	engine.now = func() time.Time { return currentTime }

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
		t.Fatal("first fire should succeed")
	}

	currentTime = currentTime.Add(30 * time.Second)
	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "x", Timestamp: time.Now()})
	select {
	case <-ch:
		t.Fatal("second fire within cooldown should be blocked")
	case <-time.After(100 * time.Millisecond):
	}
}

func TestCooldownExpiresAllowsRefire(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "cooldown", Enabled: true, CooldownSeconds: 60},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"brightness\":100}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	bus := eventbus.NewChannelBus()
	engine := NewEngine(bus, reader, s, s)

	currentTime := time.Date(2025, 1, 1, 12, 0, 0, 0, time.UTC)
	engine.now = func() time.Time { return currentTime }

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
		t.Fatal("first fire should succeed")
	}

	currentTime = currentTime.Add(61 * time.Second)
	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "x", Timestamp: time.Now()})
	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("second fire after cooldown should succeed")
	}
}

func TestCooldownPerAutomation(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()

	s.addAutomationGraph(
		store.Automation{ID: "auto-a", Name: "a", Enabled: true, CooldownSeconds: 60},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-a", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "a1", AutomationID: "auto-a", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"brightness\":100}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-a", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)
	s.addAutomationGraph(
		store.Automation{ID: "auto-b", Name: "b", Enabled: true, CooldownSeconds: 60},
		[]store.AutomationNode{
			{ID: "t2", AutomationID: "auto-b", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "a2", AutomationID: "auto-b", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-2","payload":"{\"brightness\":200}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e2", AutomationID: "auto-b", FromNodeID: "t2", ToNodeID: "a2"},
		},
	)

	bus := eventbus.NewChannelBus()
	engine := NewEngine(bus, reader, s, s)

	currentTime := time.Date(2025, 1, 1, 12, 0, 0, 0, time.UTC)
	engine.now = func() time.Time { return currentTime }

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go func() { _ = engine.Run(ctx) }()
	time.Sleep(20 * time.Millisecond)

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "x", Timestamp: time.Now()})
	got := 0
	timeout := time.After(time.Second)
	for got < 2 {
		select {
		case <-ch:
			got++
		case <-timeout:
			t.Fatalf("expected 2 commands on first fire, got %d", got)
		}
	}

	currentTime = currentTime.Add(30 * time.Second)
	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "x", Timestamp: time.Now()})
	select {
	case <-ch:
		t.Fatal("both should be in cooldown")
	case <-time.After(100 * time.Millisecond):
	}
}

func TestCooldownZero(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "no-cooldown", Enabled: true, CooldownSeconds: 0},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"brightness\":100}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	bus := eventbus.NewChannelBus()
	engine := NewEngine(bus, reader, s, s)
	engine.now = func() time.Time { return time.Date(2025, 1, 1, 12, 0, 0, 0, time.UTC) }

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go func() { _ = engine.Run(ctx) }()
	time.Sleep(20 * time.Millisecond)

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	for i := 0; i < 3; i++ {
		bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "x", Timestamp: time.Now()})
		select {
		case <-ch:
		case <-time.After(time.Second):
			t.Fatalf("fire %d should succeed with zero cooldown", i+1)
		}
	}
}
