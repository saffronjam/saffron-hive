package automation

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type blockingCleaningRunner struct {
	calls   chan string
	release chan struct{}
}

func (*blockingCleaningRunner) Snapshot(context.Context, string) (cleaning.Snapshot, error) {
	return cleaning.Snapshot{}, nil
}
func (*blockingCleaningRunner) Prepare(context.Context, string, string, []string, cleaning.Options, cleaning.Scope) (cleaning.Plan, error) {
	return cleaning.Plan{}, nil
}
func (*blockingCleaningRunner) Start(context.Context, cleaning.Plan, string, string, string) (*cleaning.Task, error) {
	return nil, nil
}
func (r *blockingCleaningRunner) Control(ctx context.Context, _ string, action string, _ string) error {
	r.calls <- action
	select {
	case <-r.release:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

type readyCleaningBus struct {
	eventbus.EventBus
	ready chan struct{}
	once  sync.Once
}

func (b *readyCleaningBus) Subscribe(types ...eventbus.EventType) <-chan eventbus.Event {
	ch := b.EventBus.Subscribe(types...)
	for _, kind := range types {
		if kind == eventbus.EventDeviceActionFired {
			b.once.Do(func() { close(b.ready) })
		}
	}
	return ch
}
func TestCleaningConfirmationDoesNotBlockOtherAutomations(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "lamp", Capabilities: []device.Capability{{Name: device.CapOnOff, Access: device.CapabilityAccessSet}}})
	storage := newMockStore()
	storage.addAutomationGraph(store.Automation{ID: "clean", Enabled: true}, []store.AutomationNode{
		{ID: "t", AutomationID: "clean", Type: "trigger", Config: `{"event_type":"device.action_fired","filter_expr":"trigger.device_id == \"clean-button\""}`},
		{ID: "a", AutomationID: "clean", Type: "action", Config: `{"action_type":"control_cleaning","target_type":"device","target_id":"robot","payload":"{\"action\":\"pause\"}"}`},
	}, []store.AutomationEdge{{AutomationID: "clean", FromNodeID: "t", ToNodeID: "a"}})
	storage.addAutomationGraph(store.Automation{ID: "lights", Enabled: true}, []store.AutomationNode{
		{ID: "t", AutomationID: "lights", Type: "trigger", Config: `{"event_type":"device.action_fired","filter_expr":"trigger.device_id == \"light-button\""}`},
		{ID: "a", AutomationID: "lights", Type: "action", Config: `{"action_type":"set_device_state","target_type":"device","target_id":"lamp","payload":"{\"on\":true}"}`},
	}, []store.AutomationEdge{{AutomationID: "lights", FromNodeID: "t", ToNodeID: "a"}})
	bus := &readyCleaningBus{EventBus: eventbus.NewChannelBus(), ready: make(chan struct{})}
	runner := &blockingCleaningRunner{calls: make(chan string, 2), release: make(chan struct{})}
	engine := NewEngine(bus, reader, storage, storage, nil, nil, nil, runner)
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	defer close(runner.release)
	stopped := make(chan struct{})
	go func() { defer close(stopped); _ = engine.Run(ctx) }()
	<-bus.ready
	commands := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(commands)
	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceActionFired, DeviceID: "clean-button"})
	select {
	case <-runner.calls:
	case <-time.After(time.Second):
		t.Fatal("cleaning action did not start")
	}
	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceActionFired, DeviceID: "light-button"})
	select {
	case <-commands:
	case <-time.After(time.Second):
		t.Fatal("light waited for the vacuum confirmation")
	}
	cancel()
	select {
	case <-stopped:
	case <-time.After(time.Second):
		t.Fatal("engine did not stop")
	}
}
func TestCleaningActionsKeepOrderAndCancelQueuedWork(t *testing.T) {
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	runner := &blockingCleaningRunner{calls: make(chan string, 3), release: make(chan struct{})}
	executor := &ActionExecutor{cleaner: runner}
	config := ActionConfig{ActionType: ActionControlCleaning, TargetType: TargetDevice, TargetID: "robot", Payload: `{"action":"pause"}`}
	executor.ExecuteGraphAction(ctx, config)
	select {
	case action := <-runner.calls:
		if action != "pause" {
			t.Fatal(action)
		}
	case <-time.After(time.Second):
		t.Fatal("pause did not start")
	}
	config.Payload = `{"action":"resume"}`
	executor.ExecuteGraphAction(ctx, config)
	close(runner.release)
	select {
	case action := <-runner.calls:
		if action != "resume" {
			t.Fatal(action)
		}
	case <-time.After(time.Second):
		t.Fatal("resume did not follow pause")
	}
	cancel()
	config.Payload = `{"action":"dock"}`
	executor.ExecuteGraphAction(ctx, config)
	executor.cleaningMu.Lock()
	executor.cleaningMu.Unlock()
	select {
	case action := <-runner.calls:
		t.Fatalf("cancelled action executed: %s", action)
	case <-time.After(30 * time.Millisecond):
	}
}
