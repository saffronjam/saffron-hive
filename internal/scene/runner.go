package scene

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/effect"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/lightfield"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/outputowner"
	"github.com/saffronjam/saffron-hive/internal/store"
)

var logger = logging.Named("scene")

const (
	DynamicCadence = time.Second
	settleWindow   = 2 * time.Second
)

// RunnerStore is the persistence surface required by Scene runtime ownership.
type RunnerStore interface {
	GetScene(context.Context, string) (store.Scene, error)
	GetEffect(context.Context, string) (store.Effect, error)
	StartActiveSceneRun(context.Context, store.ActiveSceneRun) error
	UpdateActiveSceneMemberExpected(context.Context, string, device.DeviceID, store.DesiredState) error
	UpdateActiveSceneMemberEffectRun(context.Context, string, device.DeviceID, string) error
	StopActiveSceneRun(context.Context, string) (bool, error)
	ListActiveSceneRuns(context.Context) ([]store.ActiveSceneRun, error)
}

// EffectController starts and stops explicit effect overrides.
type EffectController interface {
	Start(context.Context, string, effect.Target) (string, error)
	StartNative(context.Context, string, effect.Target) (string, error)
	Stop(effect.Target) bool
}

// RunEvent describes one Scene runtime lifecycle transition.
type RunEvent struct {
	SceneID     string
	RunID       string
	ActivatedAt *time.Time
}

type activeScene struct {
	mu            sync.Mutex
	run           store.ActiveSceneRun
	definition    store.SceneDefinition
	members       map[device.DeviceID]store.ActiveSceneMember
	lastIntents   map[device.DeviceID]lightfield.LightIntent
	effectRuns    map[string]device.DeviceID
	effectTargets map[device.DeviceID]effect.Target
	cancel        context.CancelFunc
	done          chan struct{}
	settleUntil   time.Time
	closed        bool
}

// Runner owns Scene application, drift, dynamic rendering, and persistence.
type Runner struct {
	bus       eventbus.EventBus
	store     RunnerStore
	resolver  device.TargetResolver
	commander device.TargetCommander
	reader    device.StateReader
	positions PositionResolver
	effects   EffectController
	owners    *outputowner.Coordinator

	mu     sync.Mutex
	active map[string]*activeScene
	events <-chan eventbus.Event
	now    func() time.Time
}

// NewRunner constructs a Scene runner and subscribes it before activation can begin.
func NewRunner(
	bus eventbus.EventBus,
	store RunnerStore,
	resolver device.TargetResolver,
	commander device.TargetCommander,
	reader device.StateReader,
	positions PositionResolver,
	effects EffectController,
	owners *outputowner.Coordinator,
) *Runner {
	if owners == nil {
		owners = outputowner.New()
	}
	runner := &Runner{
		bus: bus, store: store, resolver: resolver, commander: commander, reader: reader,
		positions: positions, effects: effects, owners: owners, active: map[string]*activeScene{}, now: time.Now,
	}
	runner.events = bus.Subscribe(
		eventbus.EventDeviceStateChanged,
		eventbus.EventEffectEnded,
		eventbus.EventRoomMembershipChanged,
		eventbus.EventGroupMembershipChanged,
		eventbus.EventProviderGroupsSynced,
		eventbus.EventGroupSynced,
		eventbus.EventDeviceAdded,
		eventbus.EventDeviceUpdated,
		eventbus.EventDeviceSynced,
		eventbus.EventDeviceRemoved,
		eventbus.EventFloorplanUpdated,
	)
	return runner
}

// Apply resolves and starts one fresh Scene run.
func (r *Runner) Apply(ctx context.Context, sceneID string) (store.Scene, error) {
	storedScene, err := r.store.GetScene(ctx, sceneID)
	if err != nil {
		return store.Scene{}, err
	}
	if err := r.validateDefinition(ctx, storedScene.Definition); err != nil {
		return store.Scene{}, err
	}
	if err := r.Deactivate(ctx, sceneID); err != nil {
		return store.Scene{}, err
	}
	startedAt := r.now().UTC()
	runID := uuid.NewString()
	plan, err := BuildApplyPlan(ctx, r.resolver, r.reader, r.positions, runID, storedScene.Definition, startedAt)
	if err != nil {
		return store.Scene{}, err
	}
	active := r.newActive(storedScene, runID, startedAt, plan)
	if len(active.run.Members) == 0 {
		return store.Scene{}, errors.New("Scene resolves to no controllable devices")
	}
	if err := r.store.StartActiveSceneRun(ctx, active.run); err != nil {
		return store.Scene{}, err
	}
	r.register(active)
	r.acquireDynamic(active)
	if err := dispatchPlan(ctx, r.commander, r.bus, storedScene.Definition, plan); err != nil {
		_ = r.Deactivate(ctx, sceneID)
		return store.Scene{}, err
	}
	if err := r.startEffects(ctx, active, plan.EffectRuns); err != nil {
		_ = r.Deactivate(ctx, sceneID)
		return store.Scene{}, err
	}
	r.publishActivated(active)
	if dynamic := storedScene.Definition.Lighting.Dynamic; dynamic != nil && dynamic.Movement > 0 {
		r.startTicker(active)
	}
	storedScene.ActivatedAt = &startedAt
	return storedScene, nil
}

// Deactivate stops one Scene runtime without changing physical device state.
func (r *Runner) Deactivate(ctx context.Context, sceneID string) error {
	r.mu.Lock()
	active := r.active[sceneID]
	if active != nil {
		delete(r.active, sceneID)
	}
	r.mu.Unlock()
	if active == nil {
		_, err := r.store.StopActiveSceneRun(ctx, sceneID)
		return err
	}
	active.mu.Lock()
	active.closed = true
	cancel := active.cancel
	done := active.done
	effectTargets := make([]effect.Target, 0, len(active.effectTargets))
	for _, target := range active.effectTargets {
		effectTargets = append(effectTargets, target)
	}
	active.mu.Unlock()
	cancel()
	if done != nil {
		<-done
	}
	r.owners.Release(sceneOwner(active.run.RunID))
	for _, target := range effectTargets {
		if r.effects != nil {
			r.effects.Stop(target)
		}
	}
	if _, err := r.store.StopActiveSceneRun(ctx, sceneID); err != nil {
		return err
	}
	r.publishDeactivated(active)
	return nil
}

// Hydrate restores persisted Scene runs against current definitions and memberships.
func (r *Runner) Hydrate(ctx context.Context) error {
	runs, err := r.store.ListActiveSceneRuns(ctx)
	if err != nil {
		return err
	}
	for _, run := range runs {
		storedScene, err := r.store.GetScene(ctx, run.SceneID)
		if err != nil || !storedScene.UpdatedAt.Equal(run.DefinitionUpdatedAt) {
			_, _ = r.store.StopActiveSceneRun(ctx, run.SceneID)
			continue
		}
		if err := r.validateDefinition(ctx, storedScene.Definition); err != nil {
			_, _ = r.store.StopActiveSceneRun(ctx, run.SceneID)
			continue
		}
		plan, err := BuildApplyPlan(ctx, r.resolver, r.reader, r.positions, run.RunID, storedScene.Definition, r.now().UTC())
		if err != nil {
			_, _ = r.store.StopActiveSceneRun(ctx, run.SceneID)
			continue
		}
		active := r.newActive(storedScene, run.RunID, run.StartedAt, plan)
		if len(active.run.Members) == 0 {
			_, _ = r.store.StopActiveSceneRun(ctx, run.SceneID)
			continue
		}
		if err := r.store.StartActiveSceneRun(ctx, active.run); err != nil {
			return err
		}
		r.register(active)
		r.acquireDynamic(active)
		if err := dispatchPlan(ctx, r.commander, r.bus, storedScene.Definition, plan); err != nil {
			_ = r.Deactivate(ctx, run.SceneID)
			continue
		}
		if err := r.startEffects(ctx, active, plan.EffectRuns); err != nil {
			_ = r.Deactivate(ctx, run.SceneID)
			continue
		}
		if dynamic := storedScene.Definition.Lighting.Dynamic; dynamic != nil && dynamic.Movement > 0 {
			r.startTicker(active)
		}
	}
	return nil
}

// Run handles drift and structural changes until shutdown.
func (r *Runner) Run(ctx context.Context) {
	defer r.bus.Unsubscribe(r.events)
	defer r.shutdown()
	for {
		select {
		case <-ctx.Done():
			return
		case event, ok := <-r.events:
			if !ok {
				return
			}
			r.handleEvent(ctx, event)
		}
	}
}

func (r *Runner) validateDefinition(ctx context.Context, definition store.SceneDefinition) error {
	if err := store.ValidateSceneDefinition(definition); err != nil {
		return err
	}
	for _, override := range definition.Lighting.Overrides {
		target, ok := r.reader.GetDevice(override.DeviceID)
		if !ok {
			return fmt.Errorf("Scene light override device %q is unavailable", override.DeviceID)
		}
		if !device.IsLightControlDevice(target) {
			return fmt.Errorf("Scene light override device %q is not a light", override.DeviceID)
		}
		if override.Kind == store.SceneLightOverrideEffect {
			if _, err := r.store.GetEffect(ctx, override.EffectID); err != nil {
				return fmt.Errorf("Scene effect %q: %w", override.EffectID, err)
			}
		}
	}
	for _, supporting := range definition.Supporting {
		target, ok := r.reader.GetDevice(supporting.DeviceID)
		if !ok {
			return fmt.Errorf("Scene supporting device %q is unavailable", supporting.DeviceID)
		}
		if device.IsLightControlDevice(target) {
			return fmt.Errorf("Scene supporting device %q is a light", supporting.DeviceID)
		}
		if target.Type == device.Sensor {
			return fmt.Errorf("Scene supporting device %q is a sensor", supporting.DeviceID)
		}
	}
	return nil
}

func (r *Runner) newActive(storedScene store.Scene, runID string, startedAt time.Time, plan ApplyPlan) *activeScene {
	members := make(map[device.DeviceID]store.ActiveSceneMember)
	lastIntents := make(map[device.DeviceID]lightfield.LightIntent)
	dynamic := make(map[device.DeviceID]bool, len(plan.DynamicDeviceIDs))
	for _, id := range plan.DynamicDeviceIDs {
		dynamic[id] = true
	}
	for _, command := range plan.Commands {
		kind := store.SceneMemberState
		if dynamic[command.DeviceID] {
			kind = store.SceneMemberField
		}
		members[command.DeviceID] = memberFromCommand(command, kind)
		if kind == store.SceneMemberField {
			lastIntents[command.DeviceID] = intentFromCommand(command)
		}
	}
	for _, effectRun := range plan.EffectRuns {
		kind := store.SceneMemberEffect
		if effectRun.NativeName != "" {
			kind = store.SceneMemberNativeEffect
		}
		members[effectRun.DeviceID] = store.ActiveSceneMember{DeviceID: effectRun.DeviceID, Kind: kind}
	}
	return &activeScene{
		run: store.ActiveSceneRun{
			SceneID: storedScene.ID, RunID: runID, StartedAt: startedAt,
			DefinitionUpdatedAt: storedScene.UpdatedAt, Members: sortedMemberList(members),
		},
		definition: storedScene.Definition, members: members, lastIntents: lastIntents,
		effectRuns: map[string]device.DeviceID{}, effectTargets: map[device.DeviceID]effect.Target{},
		cancel: func() {}, settleUntil: startedAt.Add(settleWindow),
	}
}

func sortedMemberList(members map[device.DeviceID]store.ActiveSceneMember) []store.ActiveSceneMember {
	result := make([]store.ActiveSceneMember, 0, len(members))
	for _, member := range members {
		result = append(result, member)
	}
	slices.SortFunc(result, func(left, right store.ActiveSceneMember) int {
		return stringCompare(string(left.DeviceID), string(right.DeviceID))
	})
	return result
}

func (r *Runner) register(active *activeScene) {
	r.mu.Lock()
	r.active[active.run.SceneID] = active
	r.mu.Unlock()
}

func (r *Runner) acquireDynamic(active *activeScene) {
	active.mu.Lock()
	ids := make([]device.DeviceID, 0, len(active.members))
	for id, member := range active.members {
		if member.Kind == store.SceneMemberField {
			ids = append(ids, id)
		}
	}
	runID := active.run.RunID
	sceneID := active.run.SceneID
	closed := active.closed
	active.mu.Unlock()
	owner := sceneOwner(runID)
	if closed || len(ids) == 0 {
		r.owners.Release(owner)
		return
	}
	r.owners.Acquire(owner, ids, func(outputowner.Loss) {
		go func() { _ = r.Deactivate(context.Background(), sceneID) }()
	})
}

func sceneOwner(runID string) outputowner.Owner {
	return outputowner.Owner{Kind: outputowner.KindScene, RunID: runID}
}

func (r *Runner) startEffects(ctx context.Context, active *activeScene, effects []EffectRun) error {
	if len(effects) > 0 && r.effects == nil {
		return errors.New("Scene effect controller is unavailable")
	}
	for _, override := range effects {
		target := effect.Target{Type: device.TargetDevice, ID: string(override.DeviceID)}
		var runID string
		var err error
		if override.NativeName != "" {
			runID, err = r.effects.StartNative(ctx, override.NativeName, target)
		} else {
			runID, err = r.effects.Start(ctx, override.EffectID, target)
		}
		if err != nil {
			return err
		}
		active.mu.Lock()
		if active.closed {
			active.mu.Unlock()
			r.effects.Stop(target)
			return context.Canceled
		}
		active.effectRuns[runID] = override.DeviceID
		active.effectTargets[override.DeviceID] = target
		member := active.members[override.DeviceID]
		member.EffectRunID = runID
		active.members[override.DeviceID] = member
		active.run.Members = sortedMemberList(active.members)
		active.mu.Unlock()
		if err := r.store.UpdateActiveSceneMemberEffectRun(ctx, active.run.SceneID, override.DeviceID, runID); err != nil {
			return err
		}
	}
	return nil
}

func (r *Runner) startTicker(active *activeScene) {
	ctx, cancel := context.WithCancel(context.Background())
	active.mu.Lock()
	if active.closed {
		active.mu.Unlock()
		cancel()
		return
	}
	active.cancel = cancel
	active.done = make(chan struct{})
	done := active.done
	active.mu.Unlock()
	go func() {
		defer close(done)
		ticker := time.NewTicker(DynamicCadence)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case at := <-ticker.C:
				if err := r.renderFrame(ctx, active, at.UTC()); err != nil {
					logger.Warn("Dynamic Scene frame retained the current output", "scene_id", active.run.SceneID, "run_id", active.run.RunID, "error", err)
				}
			}
		}
	}()
}

func (r *Runner) renderFrame(ctx context.Context, active *activeScene, at time.Time) error {
	plan, err := BuildApplyPlan(ctx, r.resolver, r.reader, r.positions, active.run.RunID, active.definition, at)
	if err != nil {
		return err
	}
	transition := lightfield.TransitionDuration(DynamicCadence, DynamicCadence).Seconds()
	active.mu.Lock()
	defer active.mu.Unlock()
	if active.closed {
		return context.Canceled
	}
	for _, command := range plan.Commands {
		member, ok := active.members[command.DeviceID]
		if !ok || member.Kind != store.SceneMemberField {
			continue
		}
		intent := intentFromCommand(command)
		if previous, exists := active.lastIntents[command.DeviceID]; exists && !lightfield.SignificantDelta(previous, intent, lightfield.DefaultDeltaThresholds) {
			continue
		}
		command.Transition = &transition
		active.lastIntents[command.DeviceID] = intent
		member = memberFromCommand(command, store.SceneMemberField)
		active.members[command.DeviceID] = member
		if err := r.store.UpdateActiveSceneMemberExpected(ctx, active.run.SceneID, command.DeviceID, member.Expected); err != nil {
			return err
		}
		if err := dispatchPlan(ctx, r.commander, r.bus, active.definition, ApplyPlan{Commands: []device.Command{command}}); err != nil {
			return err
		}
	}
	active.run.Members = sortedMemberList(active.members)
	return nil
}

func (r *Runner) handleEvent(ctx context.Context, event eventbus.Event) {
	switch event.Type {
	case eventbus.EventDeviceStateChanged:
		r.handleStateChanged(ctx, event)
	case eventbus.EventEffectEnded:
		ended, ok := event.Payload.(eventbus.EffectEndedEvent)
		if !ok {
			return
		}
		for _, active := range r.activeSnapshot() {
			active.mu.Lock()
			_, tracked := active.effectRuns[ended.RunID]
			sceneID := active.run.SceneID
			active.mu.Unlock()
			if tracked {
				_ = r.Deactivate(ctx, sceneID)
			}
		}
	default:
		for _, active := range r.activeSnapshot() {
			if err := r.refreshMembership(ctx, active); err != nil {
				logger.Warn("Scene membership refresh retained the current plan", "scene_id", active.run.SceneID, "error", err)
			}
		}
	}
}

func (r *Runner) handleStateChanged(ctx context.Context, event eventbus.Event) {
	change, _ := event.Payload.(device.DeviceStateChange)
	id := device.DeviceID(event.DeviceID)
	for _, active := range r.activeSnapshot() {
		active.mu.Lock()
		member, ok := active.members[id]
		if !ok || member.Kind == store.SceneMemberEffect || member.Kind == store.SceneMemberNativeEffect {
			active.mu.Unlock()
			continue
		}
		if change.Origin.Kind == device.OriginKindScene && change.Origin.ID == active.run.RunID {
			active.mu.Unlock()
			continue
		}
		if r.now().Before(active.settleUntil) {
			active.mu.Unlock()
			continue
		}
		sceneID := active.run.SceneID
		active.mu.Unlock()
		if memberConflictsWithChange(member, change.State) {
			_ = r.Deactivate(ctx, sceneID)
		}
	}
}

func (r *Runner) refreshMembership(ctx context.Context, active *activeScene) error {
	active.mu.Lock()
	if active.closed {
		active.mu.Unlock()
		return nil
	}
	runID := active.run.RunID
	sceneID := active.run.SceneID
	startedAt := active.run.StartedAt
	definitionUpdatedAt := active.run.DefinitionUpdatedAt
	definition := active.definition
	oldMembers := make(map[device.DeviceID]store.ActiveSceneMember, len(active.members))
	for id, member := range active.members {
		oldMembers[id] = member
	}
	active.mu.Unlock()

	at := r.now().UTC()
	plan, err := BuildApplyPlan(ctx, r.resolver, r.reader, r.positions, runID, definition, at)
	if err != nil {
		return err
	}
	refreshed := r.newActive(store.Scene{ID: sceneID, UpdatedAt: definitionUpdatedAt, Definition: definition}, runID, startedAt, plan)
	added := make(map[device.DeviceID]bool)
	for id := range refreshed.members {
		if _, existed := oldMembers[id]; !existed {
			added[id] = true
		}
	}

	var stoppedTargets []effect.Target
	active.mu.Lock()
	if active.closed {
		active.mu.Unlock()
		return nil
	}
	for id, oldMember := range active.members {
		newMember, retained := refreshed.members[id]
		if retained && newMember.Kind == oldMember.Kind {
			newMember.EffectRunID = oldMember.EffectRunID
			refreshed.members[id] = newMember
			continue
		}
		if target, ok := active.effectTargets[id]; ok {
			stoppedTargets = append(stoppedTargets, target)
			delete(active.effectTargets, id)
			for effectRunID, deviceID := range active.effectRuns {
				if deviceID == id {
					delete(active.effectRuns, effectRunID)
				}
			}
		}
	}
	active.members = refreshed.members
	active.run.Members = sortedMemberList(active.members)
	for id := range active.lastIntents {
		if member, retained := active.members[id]; !retained || member.Kind != store.SceneMemberField {
			delete(active.lastIntents, id)
		}
	}
	for id := range added {
		if intent, ok := refreshed.lastIntents[id]; ok {
			active.lastIntents[id] = intent
		}
	}
	active.settleUntil = at.Add(settleWindow)
	active.mu.Unlock()

	for _, target := range stoppedTargets {
		if r.effects != nil {
			r.effects.Stop(target)
		}
	}
	if err := r.store.StartActiveSceneRun(ctx, active.run); err != nil {
		return err
	}
	r.acquireDynamic(active)

	addedPlan := ApplyPlan{}
	for _, command := range plan.Commands {
		if added[command.DeviceID] {
			addedPlan.Commands = append(addedPlan.Commands, command)
		}
	}
	if len(addedPlan.Commands) > 0 {
		if err := dispatchDeviceCommands(ctx, r.commander, r.bus, addedPlan.Commands); err != nil {
			return err
		}
	}
	var newEffects []EffectRun
	for _, effectRun := range plan.EffectRuns {
		active.mu.Lock()
		_, running := active.effectTargets[effectRun.DeviceID]
		active.mu.Unlock()
		if !running {
			newEffects = append(newEffects, effectRun)
		}
	}
	if err := r.startEffects(ctx, active, newEffects); err != nil {
		return err
	}
	if definition.Lighting.Dynamic != nil {
		return r.renderFrame(ctx, active, at)
	}
	return nil
}

func (r *Runner) activeSnapshot() []*activeScene {
	r.mu.Lock()
	defer r.mu.Unlock()
	result := make([]*activeScene, 0, len(r.active))
	for _, active := range r.active {
		result = append(result, active)
	}
	return result
}

func (r *Runner) shutdown() {
	r.mu.Lock()
	activeScenes := make([]*activeScene, 0, len(r.active))
	for _, active := range r.active {
		activeScenes = append(activeScenes, active)
	}
	r.active = map[string]*activeScene{}
	r.mu.Unlock()
	for _, active := range activeScenes {
		active.mu.Lock()
		active.closed = true
		cancel := active.cancel
		done := active.done
		targets := make([]effect.Target, 0, len(active.effectTargets))
		for _, target := range active.effectTargets {
			targets = append(targets, target)
		}
		runID := active.run.RunID
		active.mu.Unlock()
		cancel()
		if done != nil {
			<-done
		}
		r.owners.Release(sceneOwner(runID))
		for _, target := range targets {
			if r.effects != nil {
				r.effects.Stop(target)
			}
		}
	}
}

func (r *Runner) publishActivated(active *activeScene) {
	at := active.run.StartedAt
	event := RunEvent{SceneID: active.run.SceneID, RunID: active.run.RunID, ActivatedAt: &at}
	r.bus.Publish(eventbus.Event{Type: eventbus.EventSceneApplied, Timestamp: at, Payload: event})
	r.bus.Publish(eventbus.Event{Type: eventbus.EventSceneActivated, Timestamp: at, Payload: event})
}

func (r *Runner) publishDeactivated(active *activeScene) {
	r.bus.Publish(eventbus.Event{Type: eventbus.EventSceneDeactivated, Timestamp: r.now(), Payload: RunEvent{SceneID: active.run.SceneID, RunID: active.run.RunID}})
}

func memberFromCommand(command device.Command, kind store.SceneMemberKind) store.ActiveSceneMember {
	return store.ActiveSceneMember{DeviceID: command.DeviceID, Kind: kind, Owned: ownedFields(command), Expected: desiredState(command)}
}

func ownedFields(command device.Command) store.SceneOwnedFields {
	return store.SceneOwnedFields{
		On: command.On != nil, Brightness: command.Brightness != nil, ColorTemp: command.ColorTemp != nil,
		Color: command.Color != nil, TargetTemperature: command.TargetTemperature != nil,
		HvacMode: command.HvacMode != nil, FanMode: command.FanMode != nil, Swing: command.Swing != nil,
	}
}

func desiredState(command device.Command) store.DesiredState {
	return store.DesiredState{
		On: command.On, Brightness: command.Brightness, ColorTemp: command.ColorTemp, Color: command.Color,
		TargetTemperature: command.TargetTemperature, HvacMode: command.HvacMode, FanMode: command.FanMode, Swing: command.Swing,
	}
}

func intentFromCommand(command device.Command) lightfield.LightIntent {
	return lightfield.LightIntent{DeviceID: command.DeviceID, On: command.On, Brightness: command.Brightness, ColorTemp: command.ColorTemp, Color: command.Color}
}

func stringCompare(left, right string) int {
	if left < right {
		return -1
	}
	if left > right {
		return 1
	}
	return 0
}
