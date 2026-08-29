package scene

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/effect"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/lightfield"
	"github.com/saffronjam/saffron-hive/internal/outputowner"
	"github.com/saffronjam/saffron-hive/internal/spatial"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type fakeResolver struct {
	mu      sync.Mutex
	members map[string][]device.DeviceID
}

type failingPositionResolver struct {
	mu    sync.Mutex
	fail  bool
	calls int
}

func (r *failingPositionResolver) Resolve(_ context.Context, target spatial.TargetContext, _ int64) ([]spatial.DevicePoint, spatial.Diagnostics, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.calls++
	if r.fail {
		return nil, spatial.Diagnostics{}, errors.New("topology unavailable")
	}
	points := make([]spatial.DevicePoint, len(target.DeviceIDs))
	for index, id := range target.DeviceIDs {
		points[index] = spatial.DevicePoint{DeviceID: id, Point: lightfield.Point{X: 0.5, Y: 0.5}, Source: spatial.PointSourceDevice}
	}
	return points, spatial.Diagnostics{}, nil
}

func (r *failingPositionResolver) setFail(fail bool) {
	r.mu.Lock()
	r.fail = fail
	r.mu.Unlock()
}

func (r *failingPositionResolver) callCount() int {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.calls
}

func (f *fakeResolver) ResolveTargetDeviceIDs(_ context.Context, targetType device.TargetType, targetID string) []device.DeviceID {
	if targetType == device.TargetDevice {
		return []device.DeviceID{device.DeviceID(targetID)}
	}
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]device.DeviceID(nil), f.members[targetID]...)
}

func (f *fakeResolver) set(targetID string, ids ...device.DeviceID) {
	f.mu.Lock()
	if f.members == nil {
		f.members = map[string][]device.DeviceID{}
	}
	f.members[targetID] = append([]device.DeviceID(nil), ids...)
	f.mu.Unlock()
}

type runnerStore struct {
	mu      sync.Mutex
	scenes  map[string]store.Scene
	effects map[string]store.Effect
	runs    map[string]store.ActiveSceneRun
}

func newRunnerStore(scenes ...store.Scene) *runnerStore {
	result := &runnerStore{scenes: map[string]store.Scene{}, effects: map[string]store.Effect{}, runs: map[string]store.ActiveSceneRun{}}
	for _, scene := range scenes {
		result.scenes[scene.ID] = scene
	}
	return result
}

func (s *runnerStore) GetScene(_ context.Context, id string) (store.Scene, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	scene, ok := s.scenes[id]
	if !ok {
		return store.Scene{}, errors.New("scene not found")
	}
	return scene, nil
}

func (s *runnerStore) GetEffect(_ context.Context, id string) (store.Effect, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	value, ok := s.effects[id]
	if !ok {
		return store.Effect{}, errors.New("effect not found")
	}
	return value, nil
}

func (s *runnerStore) StartActiveSceneRun(_ context.Context, run store.ActiveSceneRun) error {
	s.mu.Lock()
	s.runs[run.SceneID] = cloneRun(run)
	s.mu.Unlock()
	return nil
}

func (s *runnerStore) UpdateActiveSceneMemberExpected(_ context.Context, sceneID string, id device.DeviceID, expected store.DesiredState) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	run, ok := s.runs[sceneID]
	if !ok {
		return errors.New("run not found")
	}
	for index := range run.Members {
		if run.Members[index].DeviceID == id {
			run.Members[index].Expected = expected
		}
	}
	s.runs[sceneID] = run
	return nil
}

func (s *runnerStore) UpdateActiveSceneMemberEffectRun(_ context.Context, sceneID string, id device.DeviceID, runID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	run, ok := s.runs[sceneID]
	if !ok {
		return errors.New("run not found")
	}
	for index := range run.Members {
		if run.Members[index].DeviceID == id {
			run.Members[index].EffectRunID = runID
		}
	}
	s.runs[sceneID] = run
	return nil
}

func (s *runnerStore) StopActiveSceneRun(_ context.Context, sceneID string) (bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	_, ok := s.runs[sceneID]
	delete(s.runs, sceneID)
	return ok, nil
}

func (s *runnerStore) ListActiveSceneRuns(context.Context) ([]store.ActiveSceneRun, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	result := make([]store.ActiveSceneRun, 0, len(s.runs))
	for _, run := range s.runs {
		result = append(result, cloneRun(run))
	}
	return result, nil
}

func (s *runnerStore) run(sceneID string) (store.ActiveSceneRun, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	run, ok := s.runs[sceneID]
	return cloneRun(run), ok
}

func cloneRun(run store.ActiveSceneRun) store.ActiveSceneRun {
	run.Members = append([]store.ActiveSceneMember(nil), run.Members...)
	return run
}

type recordingCommander struct {
	mu       sync.Mutex
	commands []device.TargetCommand
	resolver device.TargetResolver
	state    *device.MemoryStore
}

func (c *recordingCommander) CommandTarget(ctx context.Context, command device.TargetCommand) error {
	c.mu.Lock()
	c.commands = append(c.commands, command)
	c.mu.Unlock()
	if c.state != nil {
		for _, id := range c.resolver.ResolveTargetDeviceIDs(ctx, command.TargetType, command.TargetID) {
			c.state.UpdateDeviceState(id, device.DeviceState{
				On: command.State.On, Brightness: command.State.Brightness, ColorTemp: command.State.ColorTemp,
				Color: command.State.Color, TargetTemperature: command.State.TargetTemperature,
				HvacMode: command.State.HvacMode, FanMode: command.State.FanMode, Swing: command.State.Swing,
			})
		}
	}
	return nil
}

func (c *recordingCommander) count() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return len(c.commands)
}

func (c *recordingCommander) snapshot() []device.TargetCommand {
	c.mu.Lock()
	defer c.mu.Unlock()
	return append([]device.TargetCommand(nil), c.commands...)
}

type runnerEffectController struct {
	mu     sync.Mutex
	next   int
	starts []string
	stops  []effect.Target
}

func (c *runnerEffectController) Start(_ context.Context, id string, _ effect.Target) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.next++
	runID := id + "-run-" + time.Unix(int64(c.next), 0).Format("05")
	c.starts = append(c.starts, runID)
	return runID, nil
}

func (c *runnerEffectController) StartNative(_ context.Context, name string, target effect.Target) (string, error) {
	return c.Start(context.Background(), name, target)
}

func (c *runnerEffectController) Stop(target effect.Target) bool {
	c.mu.Lock()
	c.stops = append(c.stops, target)
	c.mu.Unlock()
	return true
}

type runnerFixture struct {
	bus       *eventbus.ChannelBus
	state     *device.MemoryStore
	resolver  *fakeResolver
	store     *runnerStore
	commander *recordingCommander
	runner    *Runner
	now       time.Time
	cancel    context.CancelFunc
	done      chan struct{}
	stopOnce  sync.Once
}

func newRunnerFixture(t *testing.T, scene store.Scene) *runnerFixture {
	t.Helper()
	bus := eventbus.NewChannelBus()
	state := device.NewMemoryStore()
	resolver := &fakeResolver{members: map[string][]device.DeviceID{}}
	persistence := newRunnerStore(scene)
	commander := &recordingCommander{resolver: resolver, state: state}
	runner := NewRunner(bus, persistence, resolver, commander, state, nil, &runnerEffectController{}, outputowner.New())
	fixture := &runnerFixture{bus: bus, state: state, resolver: resolver, store: persistence, commander: commander, runner: runner, now: time.Unix(1_700_000_000, 0).UTC()}
	runner.now = func() time.Time { return fixture.now }
	ctx, cancel := context.WithCancel(context.Background())
	fixture.cancel = cancel
	fixture.done = make(chan struct{})
	go func() {
		runner.Run(ctx)
		close(fixture.done)
	}()
	t.Cleanup(func() {
		fixture.stop()
	})
	return fixture
}

func (f *runnerFixture) stop() {
	f.stopOnce.Do(func() {
		f.cancel()
		<-f.done
	})
}

func (f *runnerFixture) registerLight(id device.DeviceID) {
	f.state.Register(device.Device{ID: id, FriendlyName: string(id), Type: device.Light, Capabilities: []device.Capability{
		writableCap(device.CapOnOff), writableCap(device.CapBrightness), writableCap(device.CapColorTemp), writableCap(device.CapColor),
	}})
}

func TestRunnerApplyAndForeignDriftDeactivate(t *testing.T) {
	updated := time.Unix(1_699_999_000, 0).UTC()
	scene := store.Scene{ID: "scene-1", UpdatedAt: updated, Definition: manualDefinition(store.SceneTarget{Type: device.TargetDevice, ID: "light-1"})}
	fixture := newRunnerFixture(t, scene)
	fixture.registerLight("light-1")
	deactivated := fixture.bus.Subscribe(eventbus.EventSceneDeactivated)
	defer fixture.bus.Unsubscribe(deactivated)

	if _, err := fixture.runner.Apply(context.Background(), scene.ID); err != nil {
		t.Fatal(err)
	}
	if _, ok := fixture.store.run(scene.ID); !ok {
		t.Fatal("active run was not persisted")
	}
	fixture.now = fixture.now.Add(settleWindow + time.Second)
	fixture.state.UpdateDeviceState("light-1", device.DeviceState{Brightness: device.Ptr(20)})
	fixture.bus.Publish(eventbus.Event{
		Type: eventbus.EventDeviceStateChanged, DeviceID: "light-1", Timestamp: fixture.now,
		Payload: device.DeviceStateChange{State: device.DeviceState{Brightness: device.Ptr(20)}, Origin: device.CommandOrigin{Kind: "user", ID: "dashboard"}},
	})
	select {
	case event := <-deactivated:
		if event.Payload.(RunEvent).SceneID != scene.ID {
			t.Fatalf("event = %#v", event.Payload)
		}
	case <-time.After(time.Second):
		t.Fatal("foreign drift did not deactivate the Scene")
	}
	if _, ok := fixture.store.run(scene.ID); ok {
		t.Fatal("deactivated run remains persisted")
	}
}

func TestRunnerRefreshesVibeMembershipInPlace(t *testing.T) {
	updated := time.Unix(1_699_999_000, 0).UTC()
	field := lightfield.NewWhiteAmbience(2, 2, []lightfield.WhiteSample{
		{Brightness: 0.8, Mireds: 250}, {Brightness: 0.7, Mireds: 300},
		{Brightness: 0.6, Mireds: 350}, {Brightness: 0.9, Mireds: 400},
	})
	scene := store.Scene{ID: "vibe", UpdatedAt: updated, Definition: store.SceneDefinition{
		Targets: []store.SceneTarget{{Type: device.TargetRoom, ID: "living"}},
		Lighting: store.SceneLighting{
			Dynamic: &store.DynamicLighting{Field: field, Seed: 9, Brightness: 0.8, Movement: 0, Cycle: 10 * time.Minute, Provenance: lightfield.Provenance{Kind: lightfield.SourcePreset}},
		},
	}}
	fixture := newRunnerFixture(t, scene)
	fixture.registerLight("one")
	fixture.registerLight("two")
	fixture.resolver.set("living", "one")
	if _, err := fixture.runner.Apply(context.Background(), scene.ID); err != nil {
		t.Fatal(err)
	}
	fixture.runner.mu.Lock()
	active := fixture.runner.active[scene.ID]
	fixture.runner.mu.Unlock()
	fixture.resolver.set("living", "one", "two")
	if err := fixture.runner.refreshMembership(context.Background(), active); err != nil {
		t.Fatal(err)
	}
	fixture.runner.mu.Lock()
	if fixture.runner.active[scene.ID] != active {
		t.Fatal("membership refresh replaced the active runtime identity")
	}
	fixture.runner.mu.Unlock()
	active.mu.Lock()
	_, hasTwo := active.members["two"]
	runID := active.run.RunID
	active.mu.Unlock()
	if !hasTwo {
		t.Fatal("new room member was not added")
	}
	run, _ := fixture.store.run(scene.ID)
	if len(run.Members) != 2 {
		t.Fatalf("persisted members = %#v", run.Members)
	}
	if fixture.commander.count() != 2 {
		t.Fatalf("new dynamic member emitted %d total commands, want 2", fixture.commander.count())
	}
	if !fixture.runner.owners.Owns(sceneOwner(runID), "two") {
		t.Fatal("new dynamic member did not acquire output ownership")
	}
	fixture.resolver.set("living", "two")
	if err := fixture.runner.refreshMembership(context.Background(), active); err != nil {
		t.Fatal(err)
	}
	if fixture.runner.owners.Owns(sceneOwner(runID), "one") {
		t.Fatal("departed dynamic member retained output ownership")
	}
}

func TestRunnerRefreshesStaticMembershipWithoutRecommandingTheRoom(t *testing.T) {
	updated := time.Unix(1_699_999_000, 0).UTC()
	scene := store.Scene{ID: "static", UpdatedAt: updated, Definition: manualDefinition(store.SceneTarget{Type: device.TargetRoom, ID: "living"})}
	scene.Definition.Lighting.Overrides = staticOverrides("one", "two")
	fixture := newRunnerFixture(t, scene)
	fixture.registerLight("one")
	fixture.registerLight("two")
	fixture.resolver.set("living", "one")
	if _, err := fixture.runner.Apply(context.Background(), scene.ID); err != nil {
		t.Fatal(err)
	}
	if fixture.commander.count() != 1 {
		t.Fatalf("initial command count = %d", fixture.commander.count())
	}
	fixture.runner.mu.Lock()
	active := fixture.runner.active[scene.ID]
	fixture.runner.mu.Unlock()
	fixture.resolver.set("living", "one", "two")
	if err := fixture.runner.refreshMembership(context.Background(), active); err != nil {
		t.Fatal(err)
	}
	commands := fixture.commander.snapshot()
	if len(commands) != 2 || commands[1].TargetType != device.TargetDevice || commands[1].TargetID != "two" {
		t.Fatalf("membership commands = %#v", commands)
	}
	fixture.resolver.set("living", "two")
	if err := fixture.runner.refreshMembership(context.Background(), active); err != nil {
		t.Fatal(err)
	}
	run, _ := fixture.store.run(scene.ID)
	if len(run.Members) != 1 || run.Members[0].DeviceID != "two" {
		t.Fatalf("persisted members = %#v", run.Members)
	}
}

func TestRunnerReconcilesStaticMembershipFromRoomEvents(t *testing.T) {
	updated := time.Unix(1_699_999_000, 0).UTC()
	scene := store.Scene{ID: "static-event", UpdatedAt: updated, Definition: manualDefinition(store.SceneTarget{Type: device.TargetRoom, ID: "living"})}
	scene.Definition.Lighting.Overrides = staticOverrides("one", "two")
	fixture := newRunnerFixture(t, scene)
	fixture.registerLight("one")
	fixture.registerLight("two")
	fixture.resolver.set("living", "one")
	if _, err := fixture.runner.Apply(context.Background(), scene.ID); err != nil {
		t.Fatal(err)
	}

	fixture.resolver.set("living", "one", "two")
	fixture.bus.Publish(eventbus.Event{Type: eventbus.EventRoomMembershipChanged, Timestamp: fixture.now})
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		run, ok := fixture.store.run(scene.ID)
		if ok && len(run.Members) == 2 {
			commands := fixture.commander.snapshot()
			if len(commands) != 2 || commands[1].TargetType != device.TargetDevice || commands[1].TargetID != "two" {
				t.Fatalf("membership commands = %#v", commands)
			}
			return
		}
		time.Sleep(time.Millisecond)
	}
	t.Fatal("room membership event did not reconcile the active Scene")
}

func TestRunnerShutdownKeepsRunForHydration(t *testing.T) {
	updated := time.Unix(1_699_999_000, 0).UTC()
	scene := store.Scene{ID: "scene-1", UpdatedAt: updated, Definition: manualDefinition(store.SceneTarget{Type: device.TargetDevice, ID: "light-1"})}
	fixture := newRunnerFixture(t, scene)
	fixture.registerLight("light-1")
	if _, err := fixture.runner.Apply(context.Background(), scene.ID); err != nil {
		t.Fatal(err)
	}
	fixture.stop()
	if _, ok := fixture.store.run(scene.ID); !ok {
		t.Fatal("graceful shutdown deleted the persistent run")
	}
}

func vibeDefinition(target store.SceneTarget, movement float64) store.SceneDefinition {
	field := lightfield.NewFullColor(2, 2, []lightfield.ColorSample{
		{Lightness: 0.72, Chroma: 0.18, Hue: 20}, {Lightness: 0.65, Chroma: 0.2, Hue: 100},
		{Lightness: 0.68, Chroma: 0.19, Hue: 210}, {Lightness: 0.75, Chroma: 0.16, Hue: 310},
	})
	return store.SceneDefinition{
		Targets: []store.SceneTarget{target},
		Lighting: store.SceneLighting{
			Dynamic: &store.DynamicLighting{Field: field, Seed: 19, Brightness: 0.82, Movement: movement, Cycle: 30 * time.Second, Provenance: lightfield.Provenance{Kind: lightfield.SourcePreset}},
		},
	}
}

func staticOverrides(ids ...device.DeviceID) []store.SceneLightOverride {
	overrides := make([]store.SceneLightOverride, 0, len(ids))
	for _, id := range ids {
		overrides = append(overrides, store.SceneLightOverride{
			DeviceID: id,
			Kind:     store.SceneLightOverrideState,
			State:    &store.DesiredState{On: device.Ptr(true), Brightness: device.Ptr(180)},
		})
	}
	return overrides
}

func TestRunnerVibeSuppressesUnchangedFramesAndBoundsTransitions(t *testing.T) {
	updated := time.Unix(1_699_999_000, 0).UTC()
	scene := store.Scene{ID: "vibe", UpdatedAt: updated, Definition: vibeDefinition(store.SceneTarget{Type: device.TargetDevice, ID: "light-1"}, 1)}
	fixture := newRunnerFixture(t, scene)
	fixture.registerLight("light-1")
	if _, err := fixture.runner.Apply(context.Background(), scene.ID); err != nil {
		t.Fatal(err)
	}
	if fixture.commander.count() != 1 {
		t.Fatalf("initial commands = %d, want 1", fixture.commander.count())
	}
	fixture.runner.mu.Lock()
	active := fixture.runner.active[scene.ID]
	fixture.runner.mu.Unlock()
	if err := fixture.runner.renderFrame(context.Background(), active, fixture.now); err != nil {
		t.Fatal(err)
	}
	if fixture.commander.count() != 1 {
		t.Fatalf("unchanged frame emitted %d commands", fixture.commander.count())
	}
	if err := fixture.runner.renderFrame(context.Background(), active, fixture.now.Add(8*time.Second)); err != nil {
		t.Fatal(err)
	}
	commands := fixture.commander.snapshot()
	if len(commands) != 2 {
		t.Fatalf("moving frame commands = %d, want 2", len(commands))
	}
	transition := commands[1].State.Transition
	if transition == nil || *transition <= 0 || *transition > DynamicCadence.Seconds() {
		t.Fatalf("transition = %v, cadence = %s", transition, DynamicCadence)
	}
	if err := fixture.runner.renderFrame(context.Background(), active, fixture.now.Add(8*time.Second)); err != nil {
		t.Fatal(err)
	}
	if fixture.commander.count() != 2 {
		t.Fatalf("duplicate timestamp emitted %d commands", fixture.commander.count())
	}
}

func TestRunnerVibeRetainsRunAcrossTransientFrameFailure(t *testing.T) {
	updated := time.Unix(1_699_999_000, 0).UTC()
	scene := store.Scene{ID: "vibe", UpdatedAt: updated, Definition: vibeDefinition(store.SceneTarget{Type: device.TargetDevice, ID: "light-1"}, 1)}
	fixture := newRunnerFixture(t, scene)
	positions := &failingPositionResolver{}
	fixture.runner.positions = positions
	fixture.registerLight("light-1")
	if _, err := fixture.runner.Apply(context.Background(), scene.ID); err != nil {
		t.Fatal(err)
	}
	positions.setFail(true)
	deadline := time.Now().Add(DynamicCadence + time.Second)
	for positions.callCount() < 2 && time.Now().Before(deadline) {
		time.Sleep(10 * time.Millisecond)
	}
	if positions.callCount() < 2 {
		t.Fatal("Vibe renderer did not attempt the next frame")
	}
	fixture.runner.mu.Lock()
	_, active := fixture.runner.active[scene.ID]
	fixture.runner.mu.Unlock()
	if !active {
		t.Fatal("transient frame failure deactivated the Scene")
	}
	if _, persisted := fixture.store.run(scene.ID); !persisted {
		t.Fatal("transient frame failure removed the persistent run")
	}
}

func TestRunnerStillVibeOwnsWithoutTicker(t *testing.T) {
	updated := time.Unix(1_699_999_000, 0).UTC()
	scene := store.Scene{ID: "still", UpdatedAt: updated, Definition: vibeDefinition(store.SceneTarget{Type: device.TargetDevice, ID: "light-1"}, 0)}
	fixture := newRunnerFixture(t, scene)
	fixture.registerLight("light-1")
	if _, err := fixture.runner.Apply(context.Background(), scene.ID); err != nil {
		t.Fatal(err)
	}
	fixture.runner.mu.Lock()
	active := fixture.runner.active[scene.ID]
	fixture.runner.mu.Unlock()
	active.mu.Lock()
	done := active.done
	runID := active.run.RunID
	active.mu.Unlock()
	if done != nil {
		t.Fatal("Still Vibe started a renderer ticker")
	}
	if !fixture.runner.owners.Owns(sceneOwner(runID), "light-1") {
		t.Fatal("Still Vibe did not retain output ownership")
	}
}

func TestRunnerOverlappingVibePreemptsCompleteFirstScene(t *testing.T) {
	updated := time.Unix(1_699_999_000, 0).UTC()
	first := store.Scene{ID: "first", UpdatedAt: updated, Definition: vibeDefinition(store.SceneTarget{Type: device.TargetDevice, ID: "light-1"}, 0)}
	second := store.Scene{ID: "second", UpdatedAt: updated, Definition: vibeDefinition(store.SceneTarget{Type: device.TargetDevice, ID: "light-1"}, 0)}
	fixture := newRunnerFixture(t, first)
	fixture.store.scenes[second.ID] = second
	fixture.registerLight("light-1")
	if _, err := fixture.runner.Apply(context.Background(), first.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := fixture.runner.Apply(context.Background(), second.ID); err != nil {
		t.Fatal(err)
	}
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		fixture.runner.mu.Lock()
		_, firstActive := fixture.runner.active[first.ID]
		_, secondActive := fixture.runner.active[second.ID]
		fixture.runner.mu.Unlock()
		if !firstActive && secondActive {
			if _, ok := fixture.store.run(first.ID); ok {
				t.Fatal("preempted Scene retained persistent run")
			}
			return
		}
		time.Sleep(time.Millisecond)
	}
	t.Fatal("overlapping Vibe did not preempt the first Scene")
}

func TestRunnerHydrateVibeUsesAbsoluteTimeAndDropsEmptyRun(t *testing.T) {
	updated := time.Unix(1_699_999_000, 0).UTC()
	scene := store.Scene{ID: "vibe", UpdatedAt: updated, Definition: vibeDefinition(store.SceneTarget{Type: device.TargetDevice, ID: "light-1"}, 1)}
	fixture := newRunnerFixture(t, scene)
	fixture.registerLight("light-1")
	started := fixture.now.Add(-time.Hour)
	fixture.store.runs[scene.ID] = store.ActiveSceneRun{SceneID: scene.ID, RunID: "persisted-run", StartedAt: started, DefinitionUpdatedAt: updated, Members: []store.ActiveSceneMember{{DeviceID: "light-1", Kind: store.SceneMemberField}}}
	expected, err := BuildApplyPlan(context.Background(), fixture.resolver, fixture.state, nil, "persisted-run", scene.Definition, fixture.now)
	if err != nil {
		t.Fatal(err)
	}
	if err := fixture.runner.Hydrate(context.Background()); err != nil {
		t.Fatal(err)
	}
	commands := fixture.commander.snapshot()
	if len(commands) != 1 || len(expected.Commands) != 1 {
		t.Fatalf("hydrated=%#v expected=%#v", commands, expected.Commands)
	}
	want := expected.Commands[0]
	want.DeviceID = ""
	if got := commands[0].State; !equalCommandState(got, want) {
		t.Fatalf("hydrated command = %#v, want %#v", got, want)
	}

	fixture.stop()
	emptyState := device.NewMemoryStore()
	emptyBus := eventbus.NewChannelBus()
	emptyCommander := &recordingCommander{resolver: fixture.resolver, state: emptyState}
	emptyRunner := NewRunner(emptyBus, fixture.store, fixture.resolver, emptyCommander, emptyState, nil, &runnerEffectController{}, outputowner.New())
	emptyRunner.now = func() time.Time { return fixture.now }
	if err := emptyRunner.Hydrate(context.Background()); err != nil {
		t.Fatal(err)
	}
	if _, ok := fixture.store.run(scene.ID); ok {
		t.Fatal("run with no controllable members survived hydration")
	}
}

func equalCommandState(left, right device.Command) bool {
	left.DeviceID = ""
	right.DeviceID = ""
	return left.Origin == right.Origin &&
		pointerEqual(left.On, right.On) && pointerEqual(left.Brightness, right.Brightness) &&
		pointerEqual(left.ColorTemp, right.ColorTemp) && pointerEqual(left.Transition, right.Transition) &&
		colorEqual(left.Color, right.Color)
}

func pointerEqual[T comparable](left, right *T) bool {
	if left == nil || right == nil {
		return left == nil && right == nil
	}
	return *left == *right
}

func colorEqual(left, right *device.Color) bool {
	if left == nil || right == nil {
		return left == nil && right == nil
	}
	return *left == *right
}

func TestRunnerHydratesManualEffectBehavior(t *testing.T) {
	updated := time.Unix(1_699_999_000, 0).UTC()
	definition := manualDefinition(store.SceneTarget{Type: device.TargetDevice, ID: "light-1"})
	definition.Lighting.Overrides = []store.SceneLightOverride{{DeviceID: "light-1", Kind: store.SceneLightOverrideEffect, EffectID: "fireplace"}}
	scene := store.Scene{ID: "scene-1", UpdatedAt: updated, Definition: definition}
	fixture := newRunnerFixture(t, scene)
	fixture.registerLight("light-1")
	fixture.store.effects["fireplace"] = store.Effect{ID: "fireplace"}
	fixture.store.runs[scene.ID] = store.ActiveSceneRun{
		SceneID: scene.ID, RunID: "scene-run", StartedAt: fixture.now.Add(-time.Hour), DefinitionUpdatedAt: updated,
		Members: []store.ActiveSceneMember{{DeviceID: "light-1", Kind: store.SceneMemberEffect, EffectRunID: "old-effect-run"}},
	}
	if err := fixture.runner.Hydrate(context.Background()); err != nil {
		t.Fatal(err)
	}
	run, ok := fixture.store.run(scene.ID)
	if !ok || len(run.Members) != 1 || run.Members[0].EffectRunID == "" || run.Members[0].EffectRunID == "old-effect-run" {
		t.Fatalf("hydrated run = %#v", run)
	}
}
