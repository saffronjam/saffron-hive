package automation

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestFireTriggerFiresActions(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "manual", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"manual"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"brightness\":100}"}`},
		},
		[]store.AutomationEdge{
			{AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	engine, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	if err := engine.FireTrigger(context.Background(), "auto-1", "t1"); err != nil {
		t.Fatalf("FireTrigger: %v", err)
	}

	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("expected command to be published")
	}
}

func TestFireTriggerUnknownAutomation(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	engine, _, cancel := setupEngine(t, reader, s)
	defer cancel()

	if err := engine.FireTrigger(context.Background(), "missing", "t1"); err == nil {
		t.Fatal("expected error for unknown automation")
	}
}

func TestFireTriggerDisabledAutomation(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "manual", Enabled: false},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"manual"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	engine, _, cancel := setupEngine(t, reader, s)
	defer cancel()

	if err := engine.FireTrigger(context.Background(), "auto-1", "t1"); err == nil {
		t.Fatal("expected error for disabled automation (not loaded into engine)")
	}
}

func TestFireTriggerUnknownNode(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "manual", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"manual"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{}"}`},
		},
		[]store.AutomationEdge{
			{AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	engine, _, cancel := setupEngine(t, reader, s)
	defer cancel()

	if err := engine.FireTrigger(context.Background(), "auto-1", "nope"); err == nil {
		t.Fatal("expected error for unknown node")
	}
}

func TestFireTriggerEventNode(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "event", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"event_type":"device.state_changed","filter_expr":"true"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}`},
		},
		[]store.AutomationEdge{
			{AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	engine, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	if err := engine.FireTrigger(context.Background(), "auto-1", "t1"); err != nil {
		t.Fatalf("FireTrigger: %v", err)
	}

	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("expected command from injected event trigger")
	}
}

// TestFireTriggerHonoursCooldown verifies that per-trigger cooldown_ms
// throttles manual-trigger fires the same way it throttles event-driven ones.
func TestFireTriggerHonoursCooldown(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "manual-cd", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"manual","cooldown_ms":60000}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"brightness\":100}"}`},
		},
		[]store.AutomationEdge{
			{AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	engine, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	if err := engine.FireTrigger(context.Background(), "auto-1", "t1"); err != nil {
		t.Fatalf("FireTrigger: %v", err)
	}
	select {
	case <-ch:
	case <-time.After(time.Second):
		t.Fatal("first manual fire should succeed")
	}

	if err := engine.FireTrigger(context.Background(), "auto-1", "t1"); err != nil {
		t.Fatalf("FireTrigger: %v", err)
	}
	select {
	case <-ch:
		t.Fatal("second manual fire inside cooldown window must be suppressed")
	case <-time.After(100 * time.Millisecond):
	}
}

func TestFireTriggerDoesNotActivateUnrelatedCondition(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	// Two independent chains, each trigger→condition(→action). Firing chain A's
	// trigger must not publish an activation for chain B's condition — even
	// though the condition's expression evaluates to true.
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "two-chains", Enabled: true},
		[]store.AutomationNode{
			{ID: "tA", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"manual"}`},
			{ID: "cA", AutomationID: "auto-1", Type: "condition", Config: `{"expr":"true"}`},
			{ID: "aA", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"x","payload":"{}"}`},
			{ID: "tB", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"manual"}`},
			{ID: "cB", AutomationID: "auto-1", Type: "condition", Config: `{"expr":"true"}`},
			{ID: "aB", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"y","payload":"{}"}`},
		},
		[]store.AutomationEdge{
			{AutomationID: "auto-1", FromNodeID: "tA", ToNodeID: "cA"},
			{AutomationID: "auto-1", FromNodeID: "cA", ToNodeID: "aA"},
			{AutomationID: "auto-1", FromNodeID: "tB", ToNodeID: "cB"},
			{AutomationID: "auto-1", FromNodeID: "cB", ToNodeID: "aB"},
		},
	)

	engine, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventAutomationNodeActivated)
	defer bus.Unsubscribe(ch)
	done := make(chan map[NodeID]bool, 1)
	go func() {
		seen := make(map[NodeID]bool)
		deadline := time.After(250 * time.Millisecond)
		for {
			select {
			case evt := <-ch:
				if na, ok := evt.Payload.(NodeActivation); ok && na.Active {
					seen[na.NodeID] = true
				}
			case <-deadline:
				done <- seen
				return
			}
		}
	}()

	if err := engine.FireTrigger(context.Background(), "auto-1", "tA"); err != nil {
		t.Fatalf("FireTrigger: %v", err)
	}

	fired := <-done

	for _, want := range []NodeID{"tA", "cA", "aA"} {
		if !fired[want] {
			t.Errorf("expected chain A node %q to publish activation, did not", want)
		}
	}
	for _, nope := range []NodeID{"tB", "cB", "aB"} {
		if fired[nope] {
			t.Errorf("chain B node %q must not publish activation when chain A's trigger fires", nope)
		}
	}
}

func TestFireTriggerDoesNotActivateUnrelatedOperator(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	// Chain A: trigger→action. Chain B: trigger→AND→action. Firing A must not
	// publish the AND node's activation, even though its (unrelated) inputs
	// might be resolved during evaluation.
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "disjoint-op", Enabled: true},
		[]store.AutomationNode{
			{ID: "tA", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"manual"}`},
			{ID: "aA", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"x","payload":"{}"}`},
			{ID: "tB", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"manual"}`},
			{ID: "opB", AutomationID: "auto-1", Type: "operator", Config: `{"kind":"and"}`},
			{ID: "aB", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"y","payload":"{}"}`},
		},
		[]store.AutomationEdge{
			{AutomationID: "auto-1", FromNodeID: "tA", ToNodeID: "aA"},
			{AutomationID: "auto-1", FromNodeID: "tB", ToNodeID: "opB"},
			{AutomationID: "auto-1", FromNodeID: "opB", ToNodeID: "aB"},
		},
	)

	engine, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventAutomationNodeActivated)
	defer bus.Unsubscribe(ch)
	fired := make(chan map[NodeID]bool, 1)
	go func() {
		seen := make(map[NodeID]bool)
		deadline := time.After(250 * time.Millisecond)
		for {
			select {
			case evt := <-ch:
				if na, ok := evt.Payload.(NodeActivation); ok && na.Active {
					seen[na.NodeID] = true
				}
			case <-deadline:
				fired <- seen
				return
			}
		}
	}()

	if err := engine.FireTrigger(context.Background(), "auto-1", "tA"); err != nil {
		t.Fatalf("FireTrigger: %v", err)
	}

	seen := <-fired
	if !seen["tA"] {
		t.Error("expected tA to publish activation")
	}
	if seen["opB"] {
		t.Error("chain B's AND operator must not publish activation when chain A fires")
	}
	if seen["tB"] || seen["aB"] {
		t.Error("chain B's trigger/action must not publish activation when chain A fires")
	}
}

func TestFireTriggerSharedOperatorStillPublishes(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	// Shared AND operator with two trigger inputs. Firing one trigger: the AND
	// is reachable so its activation (false — only one input active) must still
	// publish. That tells the user "yes, this gate was evaluated for this fire,
	// and it came out false" rather than "was this gate even involved?".
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "shared-and", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"manual"}`},
			{ID: "t2", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"manual"}`},
			{ID: "op", AutomationID: "auto-1", Type: "operator", Config: `{"kind":"and"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"x","payload":"{}"}`},
		},
		[]store.AutomationEdge{
			{AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "op"},
			{AutomationID: "auto-1", FromNodeID: "t2", ToNodeID: "op"},
			{AutomationID: "auto-1", FromNodeID: "op", ToNodeID: "a1"},
		},
	)

	engine, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventAutomationNodeActivated)
	defer bus.Unsubscribe(ch)
	seenAll := make(chan []NodeActivation, 1)
	go func() {
		var list []NodeActivation
		deadline := time.After(250 * time.Millisecond)
		for {
			select {
			case evt := <-ch:
				if na, ok := evt.Payload.(NodeActivation); ok {
					list = append(list, na)
				}
			case <-deadline:
				seenAll <- list
				return
			}
		}
	}()

	if err := engine.FireTrigger(context.Background(), "auto-1", "t1"); err != nil {
		t.Fatalf("FireTrigger: %v", err)
	}

	list := <-seenAll
	var opFalse bool
	for _, na := range list {
		if na.NodeID == "op" && !na.Active {
			opFalse = true
		}
		if na.NodeID == "op" && na.Active {
			t.Error("operator with only one of two inputs active must not publish active=true")
		}
	}
	if !opFalse {
		t.Error("shared operator is reachable and must publish its (false) activation")
	}
}

func TestManualTriggerNotFiredByEventBus(t *testing.T) {
	reader := newMockStateReader()
	s := newMockStore()
	s.addAutomationGraph(
		store.Automation{ID: "auto-1", Name: "manual-only", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: "auto-1", Type: "trigger", Config: `{"kind":"manual"}`},
			{ID: "a1", AutomationID: "auto-1", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{}"}`},
		},
		[]store.AutomationEdge{
			{AutomationID: "auto-1", FromNodeID: "t1", ToNodeID: "a1"},
		},
	)

	_, bus, cancel := setupEngine(t, reader, s)
	defer cancel()

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	for _, evt := range []eventbus.EventType{
		eventbus.EventDeviceStateChanged,
		eventbus.EventDeviceAvailabilityChanged,
		eventbus.EventDeviceAdded,
		eventbus.EventDeviceRemoved,
	} {
		bus.Publish(eventbus.Event{Type: evt, DeviceID: "x", Timestamp: time.Now()})
	}

	select {
	case <-ch:
		t.Fatal("manual trigger must not respond to event bus events")
	case <-time.After(150 * time.Millisecond):
	}
}
