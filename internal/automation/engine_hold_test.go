package automation

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type fakeTimer struct {
	d       time.Duration
	f       func()
	stopped bool
}

// fakeTimers stands in for time.AfterFunc so tests decide when a hold expires.
type fakeTimers struct {
	mu     sync.Mutex
	timers []*fakeTimer
}

func (ft *fakeTimers) afterFunc(d time.Duration, f func()) func() bool {
	ft.mu.Lock()
	defer ft.mu.Unlock()
	timer := &fakeTimer{d: d, f: f}
	ft.timers = append(ft.timers, timer)
	return func() bool {
		ft.mu.Lock()
		defer ft.mu.Unlock()
		running := !timer.stopped
		timer.stopped = true
		return running
	}
}

func (ft *fakeTimers) running() []*fakeTimer {
	ft.mu.Lock()
	defer ft.mu.Unlock()
	var out []*fakeTimer
	for _, timer := range ft.timers {
		if !timer.stopped {
			out = append(out, timer)
		}
	}
	return out
}

// expire runs the single running timer, as time.AfterFunc would on expiry.
func (ft *fakeTimers) expire(t *testing.T) {
	t.Helper()
	running := ft.running()
	if len(running) != 1 {
		t.Fatalf("running timers = %d, want 1", len(running))
	}
	ft.mu.Lock()
	running[0].stopped = true
	ft.mu.Unlock()
	running[0].f()
}

const holdFilter = `trigger.device_id == "sensor" && trigger.payload.state.presence != nil && trigger.payload.state.presence == false`

func holdAutomation(id string, holdMs, cooldownMs int64) (store.Automation, []store.AutomationNode, []store.AutomationEdge) {
	trigger := fmt.Sprintf(`{"kind":"event","event_type":"device.state_changed","filter_expr":%q,"hold_ms":%d,"device_id":"sensor","cooldown_ms":%d}`, holdFilter, holdMs, cooldownMs)
	return store.Automation{ID: id, Name: "lights off when empty", Enabled: true},
		[]store.AutomationNode{
			{ID: "t1", AutomationID: id, Type: "trigger", Config: trigger},
			{ID: "a1", AutomationID: id, Type: "action",
				Config: `{"action_type":"set_device_state","target_type":"device","target_id":"lamp","payload":"{\"on\":false}"}`},
		},
		[]store.AutomationEdge{{AutomationID: id, FromNodeID: "t1", ToNodeID: "a1"}}
}

type holdFixture struct {
	engine   *Engine
	reader   *mockStateReader
	store    *mockStore
	timers   *fakeTimers
	commands <-chan eventbus.Event
	state    device.DeviceState
	clock    time.Time
}

func newHoldFixture(t *testing.T, holdMs, cooldownMs int64) *holdFixture {
	t.Helper()
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "sensor", FriendlyName: "sensor"})
	reader.addDevice(device.Device{ID: "lamp", FriendlyName: "lamp", Type: device.Light,
		Capabilities: []device.Capability{{Name: device.CapOnOff, Access: device.CapabilityAccessState | device.CapabilityAccessSet}}})
	reader.setDeviceState("lamp", &device.DeviceState{On: device.Ptr(true)})
	s := newMockStore()
	s.addAutomationGraph(holdAutomation("auto-1", holdMs, cooldownMs))

	bus := eventbus.NewChannelBus()
	f := &holdFixture{
		reader: reader, store: s, timers: &fakeTimers{},
		clock: time.Date(2026, 10, 6, 20, 0, 0, 0, time.UTC),
	}
	f.engine = NewEngine(bus, reader, s, s, nil, nil, nil)
	f.engine.afterFunc = f.timers.afterFunc
	f.engine.now = func() time.Time { return f.clock }
	f.commands = bus.Subscribe(eventbus.EventCommandRequested)
	t.Cleanup(func() { bus.Unsubscribe(f.commands) })
	return f
}

func (f *holdFixture) reload(t *testing.T) {
	t.Helper()
	if err := f.engine.Reload(context.Background()); err != nil {
		t.Fatal(err)
	}
}

// report merges a partial report into the sensor's state and delivers it.
func (f *holdFixture) report(id device.DeviceID, partial device.DeviceState) {
	if id == "sensor" {
		f.state = device.MergeDeviceState(f.state, partial)
		merged := f.state
		f.reader.setDeviceState(id, &merged)
	}
	f.engine.handleEvent(eventbus.Event{
		Type: eventbus.EventDeviceStateChanged, DeviceID: string(id), Timestamp: f.clock,
		Payload: device.DeviceStateChange{State: partial},
	})
}

func (f *holdFixture) expectCommand(t *testing.T) {
	t.Helper()
	select {
	case <-f.commands:
	case <-time.After(time.Second):
		t.Fatal("expected the action to run")
	}
}

func (f *holdFixture) expectNoCommand(t *testing.T) {
	t.Helper()
	select {
	case event := <-f.commands:
		t.Fatalf("unexpected command: %+v", event.Payload)
	case <-time.After(100 * time.Millisecond):
	}
}

func TestHoldTriggerFiresOnlyAfterConditionLasts(t *testing.T) {
	f := newHoldFixture(t, 10_000, 0)
	f.reload(t)

	f.report("sensor", device.DeviceState{Presence: device.Ptr(false)})
	running := f.timers.running()
	if len(running) != 1 || running[0].d != 10*time.Second {
		t.Fatalf("running timers = %+v, want one 10s hold", running)
	}
	f.expectNoCommand(t)

	f.timers.expire(t)
	f.expectCommand(t)
}

func TestHoldTriggerIgnoresReportsThatDoNotChangeTheCondition(t *testing.T) {
	f := newHoldFixture(t, 10_000, 0)
	f.reload(t)
	f.report("sensor", device.DeviceState{Presence: device.Ptr(false)})

	f.report("sensor", device.DeviceState{Temperature: device.Ptr(21.5)})
	f.report("other", device.DeviceState{Presence: device.Ptr(true)})
	f.report("sensor", device.DeviceState{Presence: device.Ptr(false)})

	if running := f.timers.running(); len(running) != 1 || len(f.timers.timers) != 1 {
		t.Fatalf("timers = %d running of %d, want the original hold untouched", len(running), len(f.timers.timers))
	}
	f.timers.expire(t)
	f.expectCommand(t)
}

func TestHoldTriggerCancelsWhenConditionBreaks(t *testing.T) {
	f := newHoldFixture(t, 10_000, 0)
	f.reload(t)
	f.report("sensor", device.DeviceState{Presence: device.Ptr(false)})
	stale := f.timers.running()[0]

	f.report("sensor", device.DeviceState{Presence: device.Ptr(true)})
	if running := f.timers.running(); len(running) != 0 {
		t.Fatalf("running timers = %d, want the hold cancelled", len(running))
	}
	stale.f()
	f.expectNoCommand(t)

	f.report("sensor", device.DeviceState{Presence: device.Ptr(false)})
	if running := f.timers.running(); len(running) != 1 || running[0].d != 10*time.Second {
		t.Fatal("a new stretch must start a full hold again")
	}
	f.timers.expire(t)
	f.expectCommand(t)
}

func TestHoldTriggerFiresOncePerStretch(t *testing.T) {
	f := newHoldFixture(t, 10_000, 0)
	f.reload(t)
	f.report("sensor", device.DeviceState{Presence: device.Ptr(false)})
	f.timers.expire(t)
	f.expectCommand(t)

	f.report("sensor", device.DeviceState{Presence: device.Ptr(false)})
	if running := f.timers.running(); len(running) != 0 {
		t.Fatal("trigger re-armed without the condition breaking")
	}

	f.report("sensor", device.DeviceState{Presence: device.Ptr(true)})
	f.report("sensor", device.DeviceState{Presence: device.Ptr(false)})
	f.timers.expire(t)
	f.expectCommand(t)
}

func TestHoldTriggerRespectsCooldownAtFireTime(t *testing.T) {
	f := newHoldFixture(t, 10_000, 60_000)
	f.reload(t)
	f.report("sensor", device.DeviceState{Presence: device.Ptr(false)})
	f.timers.expire(t)
	f.expectCommand(t)

	f.clock = f.clock.Add(20 * time.Second)
	f.report("sensor", device.DeviceState{Presence: device.Ptr(true)})
	f.report("sensor", device.DeviceState{Presence: device.Ptr(false)})
	f.timers.expire(t)
	f.expectNoCommand(t)
}

func TestHoldTriggerStartsFromCurrentStateOnLoad(t *testing.T) {
	f := newHoldFixture(t, 10_000, 0)
	f.state = device.DeviceState{Presence: device.Ptr(false)}
	f.reader.setDeviceState("sensor", &device.DeviceState{Presence: device.Ptr(false)})
	f.reload(t)

	if running := f.timers.running(); len(running) != 1 {
		t.Fatalf("running timers = %d, want a hold started from current state", len(running))
	}
	f.timers.expire(t)
	f.expectCommand(t)
}

func TestHoldTriggerSurvivesReloadWhenUnchanged(t *testing.T) {
	f := newHoldFixture(t, 10_000, 0)
	f.reload(t)
	f.report("sensor", device.DeviceState{Presence: device.Ptr(false)})

	f.reload(t)
	if len(f.timers.timers) != 1 || len(f.timers.running()) != 1 {
		t.Fatalf("timers = %d, running %d; an unchanged trigger must keep its hold", len(f.timers.timers), len(f.timers.running()))
	}
	f.timers.expire(t)
	f.expectCommand(t)
}

func TestHoldTriggerRestartsWhenHoldChanges(t *testing.T) {
	f := newHoldFixture(t, 10_000, 0)
	f.reload(t)
	f.report("sensor", device.DeviceState{Presence: device.Ptr(false)})

	f.store.removeAutomation("auto-1")
	f.store.addAutomationGraph(holdAutomation("auto-1", 30_000, 0))
	f.reload(t)

	running := f.timers.running()
	if len(running) != 1 || running[0].d != 30*time.Second {
		t.Fatalf("running = %+v, want one restarted 30s hold", running)
	}
}

func TestHoldTriggerCancelledWhenAutomationDisabled(t *testing.T) {
	f := newHoldFixture(t, 10_000, 0)
	f.reload(t)
	f.report("sensor", device.DeviceState{Presence: device.Ptr(false)})
	stale := f.timers.running()[0]

	f.store.removeAutomation("auto-1")
	f.reload(t)
	if len(f.timers.running()) != 0 {
		t.Fatal("hold kept running after the automation was disabled")
	}
	stale.f()
	f.expectNoCommand(t)
}

func TestHoldTriggerPublishesPendingDeadline(t *testing.T) {
	f := newHoldFixture(t, 10_000, 0)
	activations := f.engine.bus.Subscribe(eventbus.EventAutomationNodeActivated)
	defer f.engine.bus.Unsubscribe(activations)
	f.reload(t)

	next := func() NodeActivation {
		t.Helper()
		select {
		case event := <-activations:
			return event.Payload.(NodeActivation)
		case <-time.After(time.Second):
			t.Fatal("expected a node activation")
			return NodeActivation{}
		}
	}

	f.report("sensor", device.DeviceState{Presence: device.Ptr(false)})
	started := next()
	if started.NodeID != "t1" || started.PendingUntil == nil || !started.PendingUntil.Equal(f.clock.Add(10*time.Second)) {
		t.Fatalf("pending activation = %+v", started)
	}
	if pending := f.engine.PendingHolds("auto-1"); !pending["t1"].Equal(f.clock.Add(10 * time.Second)) {
		t.Fatalf("PendingHolds = %v", pending)
	}

	f.report("sensor", device.DeviceState{Presence: device.Ptr(true)})
	if ended := next(); ended.NodeID != "t1" || ended.PendingUntil != nil {
		t.Fatalf("cleared activation = %+v", ended)
	}
	if pending := f.engine.PendingHolds("auto-1"); len(pending) != 0 {
		t.Fatalf("PendingHolds after cancel = %v", pending)
	}
}

func TestValidateTriggerHold(t *testing.T) {
	valid := TriggerConfig{Kind: TriggerEvent, EventType: string(eventbus.EventDeviceStateChanged), HoldMs: 10_000, HoldDeviceID: "sensor"}
	if err := ValidateTriggerHold(valid); err != nil {
		t.Fatal(err)
	}
	if err := ValidateTriggerHold(TriggerConfig{Kind: TriggerSchedule}); err != nil {
		t.Fatalf("a trigger without hold must pass: %v", err)
	}
	invalid := map[string]TriggerConfig{
		"negative":     {Kind: TriggerEvent, EventType: valid.EventType, HoldMs: -1, HoldDeviceID: "sensor"},
		"too long":     {Kind: TriggerEvent, EventType: valid.EventType, HoldMs: (25 * time.Hour).Milliseconds(), HoldDeviceID: "sensor"},
		"button event": {Kind: TriggerEvent, EventType: string(eventbus.EventDeviceActionFired), HoldMs: 1000, HoldDeviceID: "sensor"},
		"schedule":     {Kind: TriggerSchedule, HoldMs: 1000, HoldDeviceID: "sensor"},
		"no device":    {Kind: TriggerEvent, EventType: valid.EventType, HoldMs: 1000},
	}
	for name, tc := range invalid {
		if err := ValidateTriggerHold(tc); err == nil {
			t.Errorf("%s: accepted", name)
		}
	}
}
