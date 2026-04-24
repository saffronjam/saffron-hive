package automation

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// TestTriggerCooldownBlocksRefire verifies that the trigger's own cooldown_ms
// suppresses re-matches inside the window, even when the event filter would
// otherwise pass.
func TestTriggerCooldownBlocksRefire(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "cooldown", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger",
				Config: `{"kind":"event","event_type":"device.state_changed","filter_expr":"true","cooldown_ms":60000}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action",
				Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"brightness\":100}"}`},
		},
		[]store.AutomationEdge{
			{AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	bus := eventbus.NewChannelBus()
	engine := NewEngine(bus, reader, s, s, nil)

	var (
		mu  sync.Mutex
		clk = time.Date(2025, 1, 1, 12, 0, 0, 0, time.UTC)
	)
	engine.now = func() time.Time {
		mu.Lock()
		defer mu.Unlock()
		return clk
	}
	advance := func(d time.Duration) {
		mu.Lock()
		defer mu.Unlock()
		clk = clk.Add(d)
	}

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

	advance(30 * time.Second)
	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "x", Timestamp: time.Now()})
	select {
	case <-ch:
		t.Fatal("second fire within trigger cooldown should be blocked")
	case <-time.After(100 * time.Millisecond):
	}

	advance(31 * time.Second) // total 61s, past the 60s cooldown
	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "x", Timestamp: time.Now()})
	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("fire after cooldown should succeed")
	}
}

// TestTriggerCooldownIndependentPerTrigger verifies that two triggers in the
// same graph have independent cooldowns — throttling one does not throttle the
// other.
func TestTriggerCooldownIndependentPerTrigger(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "btn-1", Name: "btn-1"})
	reader.addDevice(device.Device{ID: "btn-2", Name: "btn-2"})
	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "two-triggers", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger",
				Config: `{"kind":"event","event_type":"device.action_fired","filter_expr":"trigger.device_id == \"btn-1\"","cooldown_ms":1000}`},
			{ID: "t2", AutomationID: "auto-1", Type: "trigger",
				Config: `{"kind":"event","event_type":"device.action_fired","filter_expr":"trigger.device_id == \"btn-2\""}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action",
				Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
			{AutomationID: "auto-1", FromNodeID: "t2", ToNodeID: "a1"},
		},
	)

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceActionFired, DeviceID: "btn-1", Timestamp: time.Now(), Payload: device.Action{Action: "single"}})
	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("btn-1 first fire should succeed")
	}

	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceActionFired, DeviceID: "btn-1", Timestamp: time.Now(), Payload: device.Action{Action: "single"}})
	select {
	case <-ch:
		t.Fatal("btn-1 second fire should be in cooldown")
	case <-time.After(100 * time.Millisecond):
	}

	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceActionFired, DeviceID: "btn-2", Timestamp: time.Now(), Payload: device.Action{Action: "single"}})
	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("btn-2 fire should be independent of btn-1's cooldown")
	}
}

// TestTriggerGraceWindowCombinesWithLaterEvent verifies that grace_ms keeps a
// trigger "active" so a later event from a second trigger satisfies an AND
// operator. Without grace, AND can never fire when its inputs come from
// separate events.
func TestTriggerGraceWindowCombinesWithLaterEvent(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "btn-a", Name: "btn-a"})
	reader.addDevice(device.Device{ID: "btn-b", Name: "btn-b"})

	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-and", Name: "combo", Enabled: true},
		[]store.AutomationNode{
			{ID: "tA", AutomationID: "auto-and", Type: "trigger",
				Config: `{"kind":"event","event_type":"device.action_fired","filter_expr":"trigger.device_id == \"btn-a\"","grace_ms":5000}`},
			{ID: "tB", AutomationID: "auto-and", Type: "trigger",
				Config: `{"kind":"event","event_type":"device.action_fired","filter_expr":"trigger.device_id == \"btn-b\"","grace_ms":5000}`},
			{ID: "op", AutomationID: "auto-and", Type: "operator", Config: `{"kind":"and"}`},
			{ID: "a1", AutomationID: "auto-and", Type: "action",
				Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{AutomationID: "auto-and", FromNodeID: "tA", ToNodeID: "op"},
			{AutomationID: "auto-and", FromNodeID: "tB", ToNodeID: "op"},
			{AutomationID: "auto-and", FromNodeID: "op", ToNodeID: "a1"},
		},
	)

	bus := eventbus.NewChannelBus()
	engine := NewEngine(bus, reader, s, s, nil)

	var (
		mu  sync.Mutex
		clk = time.Date(2025, 1, 1, 12, 0, 0, 0, time.UTC)
	)
	engine.now = func() time.Time {
		mu.Lock()
		defer mu.Unlock()
		return clk
	}
	advance := func(d time.Duration) {
		mu.Lock()
		defer mu.Unlock()
		clk = clk.Add(d)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go func() { _ = engine.Run(ctx) }()
	time.Sleep(20 * time.Millisecond)

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceActionFired, DeviceID: "btn-a", Timestamp: time.Now(), Payload: device.Action{Action: "single"}})
	select {
	case <-ch:
		t.Fatal("AND should not fire on btn-a alone")
	case <-time.After(100 * time.Millisecond):
	}

	advance(2 * time.Second) // inside tA's 5s grace window
	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceActionFired, DeviceID: "btn-b", Timestamp: time.Now(), Payload: device.Action{Action: "single"}})
	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("AND should fire when btn-b arrives inside btn-a's grace window")
	}
}

// TestTriggerGraceExpiresDoesNotFire confirms that past the grace window, the
// earlier trigger is no longer considered active — AND stays false.
func TestTriggerGraceExpiresDoesNotFire(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "btn-a", Name: "btn-a"})
	reader.addDevice(device.Device{ID: "btn-b", Name: "btn-b"})

	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-and-expire", Name: "combo-expire", Enabled: true},
		[]store.AutomationNode{
			{ID: "tA", AutomationID: "auto-and-expire", Type: "trigger",
				Config: `{"kind":"event","event_type":"device.action_fired","filter_expr":"trigger.device_id == \"btn-a\"","grace_ms":500}`},
			{ID: "tB", AutomationID: "auto-and-expire", Type: "trigger",
				Config: `{"kind":"event","event_type":"device.action_fired","filter_expr":"trigger.device_id == \"btn-b\""}`},
			{ID: "op", AutomationID: "auto-and-expire", Type: "operator", Config: `{"kind":"and"}`},
			{ID: "a1", AutomationID: "auto-and-expire", Type: "action",
				Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{AutomationID: "auto-and-expire", FromNodeID: "tA", ToNodeID: "op"},
			{AutomationID: "auto-and-expire", FromNodeID: "tB", ToNodeID: "op"},
			{AutomationID: "auto-and-expire", FromNodeID: "op", ToNodeID: "a1"},
		},
	)

	bus := eventbus.NewChannelBus()
	engine := NewEngine(bus, reader, s, s, nil)

	var (
		mu  sync.Mutex
		clk = time.Date(2025, 1, 1, 12, 0, 0, 0, time.UTC)
	)
	engine.now = func() time.Time {
		mu.Lock()
		defer mu.Unlock()
		return clk
	}
	advance := func(d time.Duration) {
		mu.Lock()
		defer mu.Unlock()
		clk = clk.Add(d)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go func() { _ = engine.Run(ctx) }()
	time.Sleep(20 * time.Millisecond)

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceActionFired, DeviceID: "btn-a", Timestamp: time.Now(), Payload: device.Action{Action: "single"}})
	select {
	case <-ch:
		t.Fatal("AND should not fire on btn-a alone")
	case <-time.After(100 * time.Millisecond):
	}

	advance(1 * time.Second) // past tA's 500ms grace
	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceActionFired, DeviceID: "btn-b", Timestamp: time.Now(), Payload: device.Action{Action: "single"}})
	select {
	case <-ch:
		t.Fatal("btn-a grace has expired, AND must not fire")
	case <-time.After(100 * time.Millisecond):
	}
}

// TestValidateTriggerTiming covers the validation helper used by callers that
// need to reject negative values before persisting.
func TestValidateTriggerTiming(t *testing.T) {
	cases := []struct {
		name       string
		graceMs    int64
		cooldownMs int64
		wantErr    bool
	}{
		{"both zero", 0, 0, false},
		{"grace positive", 500, 0, false},
		{"cooldown positive", 0, 500, false},
		{"both positive", 5000, 1000, false},
		{"negative grace", -1, 0, true},
		{"negative cooldown", 0, -1, true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := ValidateTriggerTiming(tc.graceMs, tc.cooldownMs)
			if tc.wantErr && err == nil {
				t.Fatalf("ValidateTriggerTiming(%d, %d) = nil, want error", tc.graceMs, tc.cooldownMs)
			}
			if !tc.wantErr && err != nil {
				t.Fatalf("ValidateTriggerTiming(%d, %d) = %v, want nil", tc.graceMs, tc.cooldownMs, err)
			}
		})
	}
}
