package scene

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/effect"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type fakeEffectCtl struct {
	mu     sync.Mutex
	starts []effectStart
	stops  []effect.Target
	nextID int
	bus    eventbus.Publisher
}

type effectStart struct {
	EffectID   string
	NativeName string
	Target     effect.Target
	RunID      string
}

func newFakeEffectCtl(bus eventbus.Publisher) *fakeEffectCtl {
	return &fakeEffectCtl{bus: bus}
}

func (f *fakeEffectCtl) Start(_ context.Context, effectID string, target effect.Target) (string, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.nextID++
	runID := "run-" + string(rune('a'+f.nextID-1))
	f.starts = append(f.starts, effectStart{EffectID: effectID, Target: target, RunID: runID})
	return runID, nil
}

func (f *fakeEffectCtl) StartNative(_ context.Context, nativeName string, target effect.Target) (string, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.nextID++
	runID := "run-" + string(rune('a'+f.nextID-1))
	f.starts = append(f.starts, effectStart{NativeName: nativeName, Target: target, RunID: runID})
	return runID, nil
}

func (f *fakeEffectCtl) Stop(target effect.Target) bool {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.stops = append(f.stops, target)
	return true
}

func (f *fakeEffectCtl) startCount() int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return len(f.starts)
}

func (f *fakeEffectCtl) stopTargets() []effect.Target {
	f.mu.Lock()
	defer f.mu.Unlock()
	out := make([]effect.Target, len(f.stops))
	copy(out, f.stops)
	return out
}

func (f *fakeEffectCtl) lastStart() (effectStart, bool) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if len(f.starts) == 0 {
		return effectStart{}, false
	}
	return f.starts[len(f.starts)-1], true
}

type effectFixture struct {
	t           *testing.T
	bus         *eventbus.ChannelBus
	store       *fakeStore
	state       *device.MemoryStore
	w           *Watcher
	ctl         *fakeEffectCtl
	ctx         context.Context
	cancel      context.CancelFunc
	done        chan struct{}
	activated   chan ActivationEvent
	deactivated chan ActivationEvent
}

func newEffectFixture(t *testing.T) *effectFixture {
	t.Helper()
	bus := eventbus.NewChannelBus()
	st := newFakeStore()
	state := device.NewMemoryStore()
	ctl := newFakeEffectCtl(bus)
	w := NewWatcher(bus, st, &fakeResolver{groups: map[string][]device.DeviceID{}}, state, ctl)

	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})
	go func() {
		w.Run(ctx)
		close(done)
	}()

	actCh := bus.Subscribe(eventbus.EventSceneActivated)
	deactCh := bus.Subscribe(eventbus.EventSceneDeactivated)

	f := &effectFixture{
		t:           t,
		bus:         bus,
		store:       st,
		state:       state,
		w:           w,
		ctl:         ctl,
		ctx:         ctx,
		cancel:      cancel,
		done:        done,
		activated:   make(chan ActivationEvent, 16),
		deactivated: make(chan ActivationEvent, 16),
	}

	go func() {
		for ev := range actCh {
			if a, ok := ev.Payload.(ActivationEvent); ok {
				f.activated <- a
			}
		}
	}()
	go func() {
		for ev := range deactCh {
			if a, ok := ev.Payload.(ActivationEvent); ok {
				f.deactivated <- a
			}
		}
	}()

	t.Cleanup(func() {
		cancel()
		<-done
	})
	return f
}

func (f *effectFixture) registerLight(id device.DeviceID) {
	f.state.Register(device.Device{
		ID:   id,
		Name: string(id),
		Type: device.Light,
		Capabilities: []device.Capability{
			{Name: device.CapOnOff, Access: 7},
			{Name: device.CapBrightness, Access: 7},
			{Name: device.CapColorTemp, Access: 7},
		},
	})
}

func (f *effectFixture) seedSceneAction(sceneID string, did device.DeviceID) {
	f.store.mu.Lock()
	defer f.store.mu.Unlock()
	f.store.actions[sceneID] = append(f.store.actions[sceneID], store.SceneAction{
		SceneID:    sceneID,
		TargetType: string(device.TargetDevice),
		TargetID:   string(did),
	})
}

func (f *effectFixture) seedPayload(sceneID string, did device.DeviceID, payload string) {
	f.store.mu.Lock()
	defer f.store.mu.Unlock()
	f.store.payloads[sceneID] = append(f.store.payloads[sceneID], store.SceneDevicePayload{
		SceneID:  sceneID,
		DeviceID: did,
		Payload:  payload,
	})
}

func (f *effectFixture) applyScene(sceneID string) {
	f.bus.Publish(eventbus.Event{
		Type:      eventbus.EventSceneApplied,
		Timestamp: time.Now(),
		Payload:   sceneID,
	})
}

func (f *effectFixture) waitActivated(sceneID string) {
	f.t.Helper()
	select {
	case ev := <-f.activated:
		if ev.SceneID != sceneID {
			f.t.Fatalf("activated: want %s, got %s", sceneID, ev.SceneID)
		}
	case <-time.After(time.Second):
		f.t.Fatalf("timed out waiting for EventSceneActivated for %s", sceneID)
	}
}

func (f *effectFixture) waitDeactivated(sceneID string) {
	f.t.Helper()
	select {
	case ev := <-f.deactivated:
		if ev.SceneID != sceneID {
			f.t.Fatalf("deactivated: want %s, got %s", sceneID, ev.SceneID)
		}
	case <-time.After(time.Second):
		f.t.Fatalf("timed out waiting for EventSceneDeactivated for %s", sceneID)
	}
}

func (f *effectFixture) setDeviceState(id device.DeviceID, s device.DeviceState) {
	f.state.UpdateDeviceState(id, s)
	f.bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  string(id),
		Timestamp: time.Now(),
		Payload:   device.DeviceStateChange{State: s},
	})
}

// TestWatcher_MixedStaticAndEffectActivatesBoth confirms that a scene whose
// per-device payloads mix a static command on one device and an effect on
// another publishes a command for the static device and starts a run for the
// effect device. Deactivating via drift on the static device stops the
// effect run started for that scene activation.
func TestWatcher_MixedStaticAndEffectActivatesBoth(t *testing.T) {
	f := newEffectFixture(t)
	f.registerLight("static-1")
	f.registerLight("effect-1")
	f.state.UpdateDeviceState("static-1", device.DeviceState{
		On: device.Ptr(true), Brightness: device.Ptr(200), ColorTemp: device.Ptr(370),
	})

	f.seedSceneAction("scene-mix", "static-1")
	f.seedSceneAction("scene-mix", "effect-1")
	f.seedPayload("scene-mix", "static-1", `{"kind":"static","on":true,"brightness":150,"color_temp":370}`)
	f.seedPayload("scene-mix", "effect-1", `{"kind":"effect","effect_id":"fireplace"}`)

	f.applyScene("scene-mix")
	f.waitActivated("scene-mix")

	if got := f.ctl.startCount(); got != 1 {
		t.Fatalf("expected 1 effect Start call, got %d", got)
	}
	last, _ := f.ctl.lastStart()
	if last.EffectID != "fireplace" || last.Target.ID != "effect-1" || last.Target.Type != device.TargetDevice {
		t.Fatalf("unexpected start call: %+v", last)
	}

	f.setDeviceState("static-1", device.DeviceState{
		On: device.Ptr(false), Brightness: device.Ptr(150), ColorTemp: device.Ptr(370),
	})
	f.waitDeactivated("scene-mix")

	stops := f.ctl.stopTargets()
	if len(stops) != 1 {
		t.Fatalf("expected 1 effect Stop, got %d: %+v", len(stops), stops)
	}
	if stops[0].ID != "effect-1" || stops[0].Type != device.TargetDevice {
		t.Fatalf("unexpected stop target: %+v", stops[0])
	}
}

// TestWatcher_EffectDeviceDoesNotTriggerDriftOnStateChange confirms that a
// state change on a device whose scene payload selects an effect does NOT
// deactivate the scene — the effect is intentionally evolving the state.
func TestWatcher_EffectDeviceDoesNotTriggerDriftOnStateChange(t *testing.T) {
	f := newEffectFixture(t)
	f.registerLight("static-1")
	f.registerLight("effect-1")
	f.state.UpdateDeviceState("static-1", device.DeviceState{
		On: device.Ptr(true), Brightness: device.Ptr(200), ColorTemp: device.Ptr(370),
	})

	f.seedSceneAction("scene-mix", "static-1")
	f.seedSceneAction("scene-mix", "effect-1")
	f.seedPayload("scene-mix", "static-1", `{"kind":"static","on":true,"brightness":200,"color_temp":370}`)
	f.seedPayload("scene-mix", "effect-1", `{"kind":"effect","effect_id":"fireplace"}`)

	f.applyScene("scene-mix")
	f.waitActivated("scene-mix")

	f.setDeviceState("effect-1", device.DeviceState{
		On: device.Ptr(true), Brightness: device.Ptr(99), ColorTemp: device.Ptr(150),
	})

	select {
	case ev := <-f.deactivated:
		t.Fatalf("scene should not deactivate from effect-driven state change: %+v", ev)
	case <-time.After(150 * time.Millisecond):
	}
}

// TestWatcher_EffectEndedDeactivatesScene confirms that when an effect run
// terminates outside the watcher's control (e.g. drift on the effect device),
// the scene that spawned the run deactivates.
func TestWatcher_EffectEndedDeactivatesScene(t *testing.T) {
	f := newEffectFixture(t)
	f.registerLight("effect-1")
	f.state.UpdateDeviceState("effect-1", device.DeviceState{On: device.Ptr(true)})

	f.seedSceneAction("scene-fx", "effect-1")
	f.seedPayload("scene-fx", "effect-1", `{"kind":"effect","effect_id":"fireplace"}`)

	f.applyScene("scene-fx")
	f.waitActivated("scene-fx")

	last, ok := f.ctl.lastStart()
	if !ok {
		t.Fatal("expected an effect Start call")
	}

	f.bus.Publish(eventbus.Event{
		Type:      eventbus.EventEffectEnded,
		Timestamp: time.Now(),
		DeviceID:  "effect-1",
		Payload: eventbus.EffectEndedEvent{
			RunID:      last.RunID,
			EffectID:   last.EffectID,
			TargetType: string(device.TargetDevice),
			TargetID:   "effect-1",
			Reason:     eventbus.EffectEndReasonDrift,
		},
	})

	f.waitDeactivated("scene-fx")
}

// TestWatcher_NativeEffectPayloadDispatchesStartNative confirms that a scene
// per-device payload tagged kind=native_effect routes to the controller's
// StartNative method (carrying native_name) instead of the timeline Start
// method.
func TestWatcher_NativeEffectPayloadDispatchesStartNative(t *testing.T) {
	f := newEffectFixture(t)
	f.registerLight("native-1")

	f.seedSceneAction("scene-native", "native-1")
	f.seedPayload("scene-native", "native-1", `{"kind":"native_effect","native_name":"fireplace"}`)

	f.applyScene("scene-native")
	f.waitActivated("scene-native")

	if got := f.ctl.startCount(); got != 1 {
		t.Fatalf("expected 1 effect Start call, got %d", got)
	}
	last, _ := f.ctl.lastStart()
	if last.NativeName != "fireplace" {
		t.Errorf("native_name: want fireplace, got %q", last.NativeName)
	}
	if last.EffectID != "" {
		t.Errorf("effect_id should be empty for native start, got %q", last.EffectID)
	}
	if last.Target.ID != "native-1" || last.Target.Type != device.TargetDevice {
		t.Errorf("target: want device/native-1, got %+v", last.Target)
	}
}

// TestWatcher_EffectEndedStoppedReasonIsNoop confirms that the watcher's own
// Stop calls (which produce reason="stopped") do not retrigger deactivation
// when the EventEffectEnded round-trips back through the bus.
func TestWatcher_EffectEndedStoppedReasonIsNoop(t *testing.T) {
	f := newEffectFixture(t)
	f.registerLight("effect-1")

	f.seedSceneAction("scene-fx", "effect-1")
	f.seedPayload("scene-fx", "effect-1", `{"kind":"effect","effect_id":"fireplace"}`)

	f.applyScene("scene-fx")
	f.waitActivated("scene-fx")

	last, _ := f.ctl.lastStart()
	f.bus.Publish(eventbus.Event{
		Type:      eventbus.EventEffectEnded,
		Timestamp: time.Now(),
		DeviceID:  "effect-1",
		Payload: eventbus.EffectEndedEvent{
			RunID:      last.RunID,
			EffectID:   last.EffectID,
			TargetType: string(device.TargetDevice),
			TargetID:   "effect-1",
			Reason:     eventbus.EffectEndReasonStopped,
		},
	})

	select {
	case ev := <-f.deactivated:
		t.Fatalf("stopped-reason effect end must not deactivate: %+v", ev)
	case <-time.After(150 * time.Millisecond):
	}
}
