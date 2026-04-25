package scene

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// fakeStore is a minimal in-memory WatcherStore. It persists just enough to
// exercise the watcher's lifecycle (activated_at, expected states, actions,
// payloads). Reusing the real sqlite store would couple these tests to the
// store package's migrations; the watcher's contract is narrow so a fake is
// cleaner.
type fakeStore struct {
	mu           sync.Mutex
	actions      map[string][]store.SceneAction
	payloads     map[string][]store.SceneDevicePayload
	activatedAt  map[string]time.Time
	expected     map[string][]store.SceneExpectedState
	clearedCount int
}

func newFakeStore() *fakeStore {
	return &fakeStore{
		actions:     map[string][]store.SceneAction{},
		payloads:    map[string][]store.SceneDevicePayload{},
		activatedAt: map[string]time.Time{},
		expected:    map[string][]store.SceneExpectedState{},
	}
}

func (f *fakeStore) ListSceneActions(_ context.Context, sceneID string) ([]store.SceneAction, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]store.SceneAction(nil), f.actions[sceneID]...), nil
}

func (f *fakeStore) ListSceneDevicePayloads(_ context.Context, sceneID string) ([]store.SceneDevicePayload, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]store.SceneDevicePayload(nil), f.payloads[sceneID]...), nil
}

func (f *fakeStore) SetSceneActivatedAt(_ context.Context, sceneID string, at time.Time) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.activatedAt[sceneID] = at
	return nil
}

func (f *fakeStore) ClearSceneActivatedAt(_ context.Context, sceneID string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	delete(f.activatedAt, sceneID)
	f.clearedCount++
	return nil
}

func (f *fakeStore) ReplaceSceneExpectedStates(_ context.Context, sceneID string, states []store.SceneExpectedState) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if len(states) == 0 {
		delete(f.expected, sceneID)
	} else {
		f.expected[sceneID] = append([]store.SceneExpectedState(nil), states...)
	}
	return nil
}

func (f *fakeStore) ListActiveScenesWithExpectedStates(_ context.Context) ([]store.ActiveSceneSnapshot, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	out := make([]store.ActiveSceneSnapshot, 0, len(f.activatedAt))
	for id, at := range f.activatedAt {
		out = append(out, store.ActiveSceneSnapshot{
			SceneID:     id,
			ActivatedAt: at,
			Expected:    append([]store.SceneExpectedState(nil), f.expected[id]...),
		})
	}
	return out, nil
}

func (f *fakeStore) isActive(sceneID string) bool {
	f.mu.Lock()
	defer f.mu.Unlock()
	_, ok := f.activatedAt[sceneID]
	return ok
}

// fakeResolver maps TargetType+TargetID → device list. For device targets it
// returns the target as-is; for groups/rooms it looks up a preset list.
type fakeResolver struct {
	groups map[string][]device.DeviceID
}

func (f *fakeResolver) ResolveTargetDeviceIDs(_ context.Context, t device.TargetType, id string) []device.DeviceID {
	switch t {
	case device.TargetDevice:
		return []device.DeviceID{device.DeviceID(id)}
	case device.TargetGroup, device.TargetRoom:
		return append([]device.DeviceID(nil), f.groups[id]...)
	}
	return nil
}

type watcherFixture struct {
	t      *testing.T
	bus    *eventbus.ChannelBus
	store  *fakeStore
	res    *fakeResolver
	state  *device.MemoryStore
	w      *Watcher
	ctx    context.Context
	cancel context.CancelFunc
	done   chan struct{}

	activated   chan ActivationEvent
	deactivated chan ActivationEvent
}

func newWatcherFixture(t *testing.T) *watcherFixture {
	t.Helper()
	bus := eventbus.NewChannelBus()
	st := newFakeStore()
	res := &fakeResolver{groups: map[string][]device.DeviceID{}}
	state := device.NewMemoryStore()
	w := NewWatcher(bus, st, res, state)

	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})
	go func() {
		w.Run(ctx)
		close(done)
	}()

	actCh := bus.Subscribe(eventbus.EventSceneActivated)
	deactCh := bus.Subscribe(eventbus.EventSceneDeactivated)

	f := &watcherFixture{
		t:           t,
		bus:         bus,
		store:       st,
		res:         res,
		state:       state,
		w:           w,
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

func (f *watcherFixture) registerLight(id device.DeviceID) {
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

func (f *watcherFixture) seedScene(sceneID string, targetDeviceIDs ...device.DeviceID) {
	f.store.mu.Lock()
	defer f.store.mu.Unlock()
	for _, did := range targetDeviceIDs {
		f.store.actions[sceneID] = append(f.store.actions[sceneID], store.SceneAction{
			SceneID:    sceneID,
			TargetType: string(device.TargetDevice),
			TargetID:   string(did),
		})
	}
}

func (f *watcherFixture) setDeviceState(id device.DeviceID, s device.DeviceState) {
	f.state.UpdateDeviceState(id, s)
	f.bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  string(id),
		Timestamp: time.Now(),
		Payload:   device.DeviceStateChange{State: s},
	})
}

func (f *watcherFixture) applyScene(sceneID string) {
	f.bus.Publish(eventbus.Event{
		Type:      eventbus.EventSceneApplied,
		Timestamp: time.Now(),
		Payload:   sceneID,
	})
}

func waitActivated(t *testing.T, f *watcherFixture, sceneID string) {
	t.Helper()
	select {
	case ev := <-f.activated:
		if ev.SceneID != sceneID {
			t.Fatalf("activated: want %s, got %s", sceneID, ev.SceneID)
		}
		if ev.ActivatedAt == nil {
			t.Fatal("activated event carries nil ActivatedAt")
		}
	case <-time.After(time.Second):
		t.Fatalf("timed out waiting for EventSceneActivated for %s", sceneID)
	}
}

func waitDeactivated(t *testing.T, f *watcherFixture, sceneID string) {
	t.Helper()
	select {
	case ev := <-f.deactivated:
		if ev.SceneID != sceneID {
			t.Fatalf("deactivated: want %s, got %s", sceneID, ev.SceneID)
		}
	case <-time.After(time.Second):
		t.Fatalf("timed out waiting for EventSceneDeactivated for %s", sceneID)
	}
}

func expectNoActivation(t *testing.T, f *watcherFixture) {
	t.Helper()
	select {
	case ev := <-f.deactivated:
		t.Fatalf("unexpected deactivation: %+v", ev)
	case ev := <-f.activated:
		t.Fatalf("unexpected activation: %+v", ev)
	case <-time.After(100 * time.Millisecond):
	}
}

func TestWatcher_ApplySetsActiveAndExpected(t *testing.T) {
	f := newWatcherFixture(t)
	f.registerLight("dev-1")
	f.seedScene("scene-1", "dev-1")

	f.applyScene("scene-1")
	waitActivated(t, f, "scene-1")

	if !f.store.isActive("scene-1") {
		t.Fatal("scene-1 should be active in store")
	}
	f.store.mu.Lock()
	if len(f.store.expected["scene-1"]) != 1 {
		t.Fatalf("want 1 expected row, got %d", len(f.store.expected["scene-1"]))
	}
	f.store.mu.Unlock()
}

func TestWatcher_NonMemberStateChangeIsNoop(t *testing.T) {
	f := newWatcherFixture(t)
	f.registerLight("dev-1")
	f.registerLight("dev-2")
	f.seedScene("scene-1", "dev-1")

	f.applyScene("scene-1")
	waitActivated(t, f, "scene-1")

	f.setDeviceState("dev-2", device.DeviceState{On: device.Ptr(true)})
	expectNoActivation(t, f)

	if !f.store.isActive("scene-1") {
		t.Fatal("scene-1 should still be active (dev-2 isn't part of it)")
	}
}

func TestWatcher_MatchingEchoDoesNotInvalidate(t *testing.T) {
	f := newWatcherFixture(t)
	f.registerLight("dev-1")
	// Prime state with the warm-white default the scene will command.
	f.state.UpdateDeviceState("dev-1", device.DeviceState{
		On: device.Ptr(true), Brightness: device.Ptr(200), ColorTemp: device.Ptr(370),
	})
	f.seedScene("scene-1", "dev-1")

	f.applyScene("scene-1")
	waitActivated(t, f, "scene-1")

	f.setDeviceState("dev-1", device.DeviceState{
		On: device.Ptr(true), Brightness: device.Ptr(200), ColorTemp: device.Ptr(370),
	})
	expectNoActivation(t, f)

	if !f.store.isActive("scene-1") {
		t.Fatal("scene-1 should still be active after echo")
	}
}

func TestWatcher_DivergingStateDeactivates(t *testing.T) {
	f := newWatcherFixture(t)
	f.registerLight("dev-1")
	f.state.UpdateDeviceState("dev-1", device.DeviceState{
		On: device.Ptr(true), Brightness: device.Ptr(200), ColorTemp: device.Ptr(370),
	})
	f.seedScene("scene-1", "dev-1")

	f.applyScene("scene-1")
	waitActivated(t, f, "scene-1")

	f.setDeviceState("dev-1", device.DeviceState{
		On: device.Ptr(true), Brightness: device.Ptr(10), ColorTemp: device.Ptr(370),
	})
	waitDeactivated(t, f, "scene-1")

	if f.store.isActive("scene-1") {
		t.Fatal("scene-1 should be inactive after drift")
	}
	f.store.mu.Lock()
	if len(f.store.expected["scene-1"]) != 0 {
		t.Fatalf("expected-state rows should be cleared: %+v", f.store.expected["scene-1"])
	}
	f.store.mu.Unlock()
}

func TestWatcher_DisjointScenesCoexistAndInvalidateIndependently(t *testing.T) {
	f := newWatcherFixture(t)
	f.registerLight("dev-1")
	f.registerLight("dev-2")
	f.state.UpdateDeviceState("dev-1", device.DeviceState{
		On: device.Ptr(true), Brightness: device.Ptr(200), ColorTemp: device.Ptr(370),
	})
	f.state.UpdateDeviceState("dev-2", device.DeviceState{
		On: device.Ptr(true), Brightness: device.Ptr(200), ColorTemp: device.Ptr(370),
	})
	f.seedScene("scene-A", "dev-1")
	f.seedScene("scene-B", "dev-2")

	f.applyScene("scene-A")
	waitActivated(t, f, "scene-A")
	f.applyScene("scene-B")
	waitActivated(t, f, "scene-B")

	f.setDeviceState("dev-1", device.DeviceState{
		On: device.Ptr(false), Brightness: device.Ptr(200), ColorTemp: device.Ptr(370),
	})
	waitDeactivated(t, f, "scene-A")

	if f.store.isActive("scene-A") {
		t.Fatal("scene-A should be inactive")
	}
	if !f.store.isActive("scene-B") {
		t.Fatal("scene-B should still be active (independent device)")
	}
}

func TestWatcher_OverlappingScenes_BApplyDeactivatesA(t *testing.T) {
	f := newWatcherFixture(t)
	f.registerLight("dev-1")
	f.state.UpdateDeviceState("dev-1", device.DeviceState{
		On: device.Ptr(true), Brightness: device.Ptr(50), ColorTemp: device.Ptr(200),
	})
	f.seedScene("scene-A", "dev-1")
	f.seedScene("scene-B", "dev-1")
	f.store.mu.Lock()
	f.store.payloads["scene-B"] = []store.SceneDevicePayload{
		{SceneID: "scene-B", DeviceID: "dev-1", Payload: `{"on":true,"brightness":123,"color_temp":250}`},
	}
	f.store.mu.Unlock()

	f.applyScene("scene-A")
	waitActivated(t, f, "scene-A")
	// Scene A snapshots current state. The act of applying B will change the
	// device state (via the test harness) to B's values; A must invalidate.
	f.applyScene("scene-B")
	waitActivated(t, f, "scene-B")

	f.setDeviceState("dev-1", device.DeviceState{
		On: device.Ptr(true), Brightness: device.Ptr(123), ColorTemp: device.Ptr(250),
	})
	waitDeactivated(t, f, "scene-A")

	if f.store.isActive("scene-A") {
		t.Fatal("scene-A should be inactive after B took over")
	}
	if !f.store.isActive("scene-B") {
		t.Fatal("scene-B should be active")
	}
}

func TestWatcher_Hydrate_ClearsDriftedScene(t *testing.T) {
	bus := eventbus.NewChannelBus()
	st := newFakeStore()
	state := device.NewMemoryStore()
	state.Register(device.Device{ID: "dev-1", Name: "d1", Type: device.Light})
	state.UpdateDeviceState("dev-1", device.DeviceState{On: device.Ptr(false)})

	st.mu.Lock()
	st.activatedAt["scene-drifted"] = time.Now()
	st.expected["scene-drifted"] = []store.SceneExpectedState{
		{SceneID: "scene-drifted", DeviceID: "dev-1", On: device.Ptr(true)},
	}
	st.mu.Unlock()

	w := NewWatcher(bus, st, &fakeResolver{}, state)
	if err := w.Hydrate(context.Background()); err != nil {
		t.Fatalf("hydrate: %v", err)
	}

	if st.isActive("scene-drifted") {
		t.Fatal("drifted scene should be cleared on hydrate")
	}
}

func TestWatcher_Hydrate_PreservesMatchingScene(t *testing.T) {
	bus := eventbus.NewChannelBus()
	st := newFakeStore()
	state := device.NewMemoryStore()
	state.Register(device.Device{ID: "dev-1", Name: "d1", Type: device.Light})
	state.UpdateDeviceState("dev-1", device.DeviceState{On: device.Ptr(true), Brightness: device.Ptr(200)})

	st.mu.Lock()
	st.activatedAt["scene-ok"] = time.Now()
	st.expected["scene-ok"] = []store.SceneExpectedState{
		{SceneID: "scene-ok", DeviceID: "dev-1", On: device.Ptr(true), Brightness: device.Ptr(200)},
	}
	st.mu.Unlock()

	w := NewWatcher(bus, st, &fakeResolver{}, state)
	if err := w.Hydrate(context.Background()); err != nil {
		t.Fatalf("hydrate: %v", err)
	}

	if !st.isActive("scene-ok") {
		t.Fatal("matching scene should stay active")
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan struct{})
	go func() { w.Run(ctx); close(done) }()

	deact := bus.Subscribe(eventbus.EventSceneDeactivated)
	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "dev-1",
		Timestamp: time.Now(),
		Payload:   device.DeviceStateChange{State: device.DeviceState{On: device.Ptr(true), Brightness: device.Ptr(200)}},
	})

	select {
	case <-deact:
		t.Fatal("matching echo should not deactivate after hydrate")
	case <-time.After(150 * time.Millisecond):
	}

	state.UpdateDeviceState("dev-1", device.DeviceState{On: device.Ptr(false), Brightness: device.Ptr(200)})
	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "dev-1",
		Timestamp: time.Now(),
		Payload:   device.DeviceStateChange{State: device.DeviceState{On: device.Ptr(false)}},
	})
	select {
	case ev := <-deact:
		if a, ok := ev.Payload.(ActivationEvent); !ok || a.SceneID != "scene-ok" {
			t.Fatalf("unexpected deactivation payload: %+v", ev)
		}
	case <-time.After(time.Second):
		t.Fatal("expected hydrated scene to deactivate after drift")
	}
	cancel()
	<-done
}
