package automation

import (
	"context"
	"sync"
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
	engine := NewEngine(bus, reader, s, s, nil)

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
	engine := NewEngine(bus, reader, s, s, nil)

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
	engine := NewEngine(bus, reader, s, s, nil)

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
	engine := NewEngine(bus, reader, s, s, nil)
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

// TestCooldownSubSecond verifies that fractional-second cooldowns are
// honoured — a 50 ms cooldown blocks a refire at +20 ms and allows one at
// +80 ms. This exercises the time.Duration(x * float64(time.Second)) math in
// engine.inCooldown.
func TestCooldownSubSecond(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "subsecond", Enabled: true, CooldownSeconds: 0.05},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","condition_expr":"true"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{ID: "e1", AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	bus := eventbus.NewChannelBus()
	engine := NewEngine(bus, reader, s, s, nil)

	// The engine reads time.Now via the injected closure from its goroutine; the
	// test needs to advance time between publishes. Guard the shared variable
	// with a mutex so -race stays happy.
	var (
		clockMu     sync.Mutex
		currentTime = time.Date(2025, 1, 1, 12, 0, 0, 0, time.UTC)
	)
	getTime := func() time.Time {
		clockMu.Lock()
		defer clockMu.Unlock()
		return currentTime
	}
	advanceTime := func(d time.Duration) {
		clockMu.Lock()
		defer clockMu.Unlock()
		currentTime = currentTime.Add(d)
	}
	engine.now = getTime

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

	advanceTime(20 * time.Millisecond)
	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "x", Timestamp: time.Now()})
	select {
	case <-ch:
		t.Fatal("fire at +20ms (inside 50ms cooldown) should be blocked")
	case <-time.After(100 * time.Millisecond):
	}

	advanceTime(60 * time.Millisecond) // total +80ms
	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "x", Timestamp: time.Now()})
	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("fire at +80ms (past 50ms cooldown) should succeed")
	}
}

// TestValidateCooldown covers the millisecond floor enforcement used by both
// the GraphQL resolver and the frontend.
func TestValidateCooldown(t *testing.T) {
	cases := []struct {
		name    string
		value   float64
		wantErr bool
	}{
		{"zero allowed", 0, false},
		{"minimum allowed", 0.001, false},
		{"half second", 0.5, false},
		{"one second", 1, false},
		{"large", 3600, false},
		{"just below minimum", 0.0009, true},
		{"sub-microsecond", 0.00005, true},
		{"negative", -1, true},
		{"negative small", -0.0001, true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := ValidateCooldown(tc.value)
			if tc.wantErr && err == nil {
				t.Fatalf("ValidateCooldown(%g) = nil, want error", tc.value)
			}
			if !tc.wantErr && err != nil {
				t.Fatalf("ValidateCooldown(%g) = %v, want nil", tc.value, err)
			}
		})
	}
}
