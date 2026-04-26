package scene

import (
	"context"
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/effect"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
)

var logger = logging.Named("scene")

// WatcherStore is the narrow subset of store methods the watcher needs.
// *store.DB satisfies it implicitly.
type WatcherStore interface {
	ListSceneActions(ctx context.Context, sceneID string) ([]store.SceneAction, error)
	ListSceneDevicePayloads(ctx context.Context, sceneID string) ([]store.SceneDevicePayload, error)
	SetSceneActivatedAt(ctx context.Context, sceneID string, at time.Time) error
	ClearSceneActivatedAt(ctx context.Context, sceneID string) error
	ReplaceSceneExpectedStates(ctx context.Context, sceneID string, states []store.SceneExpectedState) error
	ListActiveScenesWithExpectedStates(ctx context.Context) ([]store.ActiveSceneSnapshot, error)
}

// EffectController is the narrow surface the watcher uses to start and stop
// effect runs on a per-device basis when a scene's payload selects an effect.
// *effect.Runner satisfies it implicitly.
type EffectController interface {
	Start(ctx context.Context, effectID string, target effect.Target) (string, error)
	StartNative(ctx context.Context, nativeName string, target effect.Target) (string, error)
	Stop(target effect.Target) bool
}

// ActivationEvent is the payload carried by EventSceneActivated and
// EventSceneDeactivated. ActivatedAt is non-nil for activated, nil for
// deactivated — one type keeps downstream subscribers' switch smaller.
type ActivationEvent struct {
	SceneID     string
	ActivatedAt *time.Time
}

// Watcher owns the activated_at lifecycle for every scene. It snapshots the
// scene-relevant state when a scene is applied, compares incoming device
// state against that snapshot, and flips activated_at when a device drifts
// out of the scene's state. State lives in SQLite so a page reload sees the
// current truth; an in-memory device→scenes index avoids a DB scan on every
// state change event.
//
// The watcher also drives effect-kind device payloads: when a scene applies,
// any effect-payload device starts a run via the EffectController and is
// flagged as "intentionally evolving" so its state changes are excluded from
// drift comparison. When a scene deactivates (manual or via drift on a
// static-payload device), every effect run the watcher started for that scene
// is stopped. EventEffectEnded notifies the watcher when a run terminates
// outside its control (preempt by another scene/automation, foreign drift,
// natural completion); a premature end on an effect device is treated as
// drift on that scene.
type Watcher struct {
	bus       eventbus.EventBus
	store     WatcherStore
	resolver  device.TargetResolver
	reader    device.StateReader
	effectCtl EffectController

	ch <-chan eventbus.Event

	mu          sync.RWMutex
	expected    map[string]map[device.DeviceID]store.SceneExpectedState
	deviceIndex map[device.DeviceID]map[string]struct{}

	effectByScene    map[string]map[device.DeviceID]string
	sceneByEffectRun map[string]string
}

// NewWatcher constructs a Watcher and subscribes it to the bus immediately, so
// any EventSceneApplied published after construction is buffered for Run to
// consume. Call Hydrate before Run to reconcile persisted active scenes
// against current device state. effectCtl may be nil in tests that do not
// exercise effect-kind scene payloads; effect-payload activation is then a
// no-op.
func NewWatcher(bus eventbus.EventBus, s WatcherStore, resolver device.TargetResolver, reader device.StateReader, effectCtl EffectController) *Watcher {
	w := &Watcher{
		bus:              bus,
		store:            s,
		resolver:         resolver,
		reader:           reader,
		effectCtl:        effectCtl,
		expected:         make(map[string]map[device.DeviceID]store.SceneExpectedState),
		deviceIndex:      make(map[device.DeviceID]map[string]struct{}),
		effectByScene:    make(map[string]map[device.DeviceID]string),
		sceneByEffectRun: make(map[string]string),
	}
	w.ch = bus.Subscribe(eventbus.EventSceneApplied, eventbus.EventDeviceStateChanged, eventbus.EventEffectEnded)
	return w
}

// Hydrate loads every scene with a non-nil activated_at from the store and
// checks each one's expected device states against the current in-memory
// state. Scenes whose devices have drifted (or whose state is unknown) are
// deactivated and their expected-state rows wiped. Scenes whose state still
// matches stay active and populate the in-memory index.
//
// This covers the "bulb changed via another app while hive was down" case —
// on restart we trust device state over the stale activated_at flag.
func (w *Watcher) Hydrate(ctx context.Context) error {
	snaps, err := w.store.ListActiveScenesWithExpectedStates(ctx)
	if err != nil {
		return err
	}
	for _, snap := range snaps {
		stillActive := true
		for _, exp := range snap.Expected {
			current, ok := w.reader.GetDeviceState(exp.DeviceID)
			if !ok || !ExpectedMatchesCurrent(exp, current) {
				stillActive = false
				break
			}
		}
		if !stillActive {
			if err := w.store.ClearSceneActivatedAt(ctx, snap.SceneID); err != nil {
				logger.Warn("clear activated_at during hydrate failed", "scene_id", snap.SceneID, "error", err)
			}
			if err := w.store.ReplaceSceneExpectedStates(ctx, snap.SceneID, nil); err != nil {
				logger.Warn("clear expected states during hydrate failed", "scene_id", snap.SceneID, "error", err)
			}
			continue
		}
		w.setActive(snap.SceneID, snap.Expected)
	}
	return nil
}

// Run blocks until ctx is done, consuming scene.applied, device.state_changed
// and effect.ended events. Publishes EventSceneActivated /
// EventSceneDeactivated on transitions.
func (w *Watcher) Run(ctx context.Context) {
	defer w.bus.Unsubscribe(w.ch)

	for {
		select {
		case <-ctx.Done():
			return
		case evt, ok := <-w.ch:
			if !ok {
				return
			}
			switch evt.Type {
			case eventbus.EventSceneApplied:
				if sceneID, ok := evt.Payload.(string); ok && sceneID != "" {
					w.handleSceneApplied(ctx, sceneID, evt.Timestamp)
				}
			case eventbus.EventDeviceStateChanged:
				if evt.DeviceID == "" {
					continue
				}
				var origin device.CommandOrigin
				if change, ok := evt.Payload.(device.DeviceStateChange); ok {
					origin = change.Origin
				}
				w.handleDeviceStateChanged(ctx, device.DeviceID(evt.DeviceID), origin)
			case eventbus.EventEffectEnded:
				ended, ok := evt.Payload.(eventbus.EffectEndedEvent)
				if !ok {
					continue
				}
				w.handleEffectEnded(ctx, ended)
			}
		}
	}
}

func (w *Watcher) handleSceneApplied(ctx context.Context, sceneID string, appliedAt time.Time) {
	actions, err := w.store.ListSceneActions(ctx, sceneID)
	if err != nil {
		logger.Error("scene actions unavailable", "scene_id", sceneID, "error", err)
		return
	}
	if len(actions) == 0 {
		return
	}
	payloads, err := w.store.ListSceneDevicePayloads(ctx, sceneID)
	if err != nil {
		logger.Error("scene payloads unavailable", "scene_id", sceneID, "error", err)
		return
	}

	plan := BuildApplyCommands(ctx, w.resolver, w.reader, sceneID, actions, payloads)
	if len(plan.Commands) == 0 && len(plan.EffectRuns) == 0 {
		return
	}

	expected := make([]store.SceneExpectedState, 0, len(plan.Commands))
	for _, cmd := range plan.Commands {
		current, _ := w.reader.GetDeviceState(cmd.DeviceID)
		expected = append(expected, BuildExpected(sceneID, cmd, current))
	}

	if err := w.store.ReplaceSceneExpectedStates(ctx, sceneID, expected); err != nil {
		logger.Error("replace expected states failed", "scene_id", sceneID, "error", err)
		return
	}
	if err := w.store.SetSceneActivatedAt(ctx, sceneID, appliedAt); err != nil {
		logger.Error("set activated_at failed", "scene_id", sceneID, "error", err)
		return
	}

	w.setActive(sceneID, expected)
	w.startSceneEffects(ctx, sceneID, plan.EffectRuns)

	at := appliedAt
	w.bus.Publish(eventbus.Event{
		Type:      eventbus.EventSceneActivated,
		Timestamp: appliedAt,
		Payload:   ActivationEvent{SceneID: sceneID, ActivatedAt: &at},
	})
}

func (w *Watcher) startSceneEffects(ctx context.Context, sceneID string, runs []EffectRun) {
	if len(runs) == 0 || w.effectCtl == nil {
		return
	}
	for _, r := range runs {
		target := effect.Target{Type: device.TargetDevice, ID: string(r.DeviceID)}
		var (
			runID string
			err   error
		)
		if r.NativeName != "" {
			runID, err = w.effectCtl.StartNative(ctx, r.NativeName, target)
		} else {
			runID, err = w.effectCtl.Start(ctx, r.EffectID, target)
		}
		if err != nil {
			logger.Error("scene effect start failed",
				"scene_id", sceneID,
				"device_id", r.DeviceID,
				"effect_id", r.EffectID,
				"native_name", r.NativeName,
				"error", err)
			continue
		}
		w.recordSceneEffect(sceneID, r.DeviceID, runID)
	}
}

func (w *Watcher) handleDeviceStateChanged(ctx context.Context, deviceID device.DeviceID, _ device.CommandOrigin) {
	w.mu.RLock()
	sceneIDs := make([]string, 0, len(w.deviceIndex[deviceID]))
	for id := range w.deviceIndex[deviceID] {
		sceneIDs = append(sceneIDs, id)
	}
	w.mu.RUnlock()
	if len(sceneIDs) == 0 {
		return
	}

	current, ok := w.reader.GetDeviceState(deviceID)
	if !ok {
		return
	}

	for _, sceneID := range sceneIDs {
		if w.isSceneEffectDevice(sceneID, deviceID) {
			continue
		}
		w.mu.RLock()
		exp, ok := w.expected[sceneID][deviceID]
		w.mu.RUnlock()
		if !ok {
			continue
		}
		if ExpectedMatchesCurrent(exp, current) {
			continue
		}
		w.deactivate(ctx, sceneID)
	}
}

// handleEffectEnded reacts to an effect run terminating outside the watcher's
// control. If the run was spawned by an active scene, the device it was
// driving is treated as drift on that scene: the scene deactivates. The
// watcher's own Stop calls (during deactivate) preempt before this handler
// runs, but the bookkeeping is removed there too so the EventEffectEnded for
// those runs is a no-op.
func (w *Watcher) handleEffectEnded(ctx context.Context, ev eventbus.EffectEndedEvent) {
	w.mu.Lock()
	sceneID, ok := w.sceneByEffectRun[ev.RunID]
	if ok {
		delete(w.sceneByEffectRun, ev.RunID)
		if devs, present := w.effectByScene[sceneID]; present {
			delete(devs, device.DeviceID(ev.TargetID))
			if len(devs) == 0 {
				delete(w.effectByScene, sceneID)
			}
		}
	}
	w.mu.Unlock()
	if !ok {
		return
	}
	if ev.Reason == eventbus.EffectEndReasonStopped {
		return
	}
	logger.Info("scene effect ended outside watcher; deactivating scene",
		"scene_id", sceneID, "run_id", ev.RunID, "reason", ev.Reason)
	w.deactivate(ctx, sceneID)
}

func (w *Watcher) deactivate(ctx context.Context, sceneID string) {
	if err := w.store.ClearSceneActivatedAt(ctx, sceneID); err != nil {
		logger.Error("clear activated_at failed", "scene_id", sceneID, "error", err)
		return
	}
	if err := w.store.ReplaceSceneExpectedStates(ctx, sceneID, nil); err != nil {
		logger.Error("clear expected states failed", "scene_id", sceneID, "error", err)
	}
	w.stopSceneEffects(sceneID)
	w.clearActive(sceneID)

	w.bus.Publish(eventbus.Event{
		Type:      eventbus.EventSceneDeactivated,
		Timestamp: time.Now(),
		Payload:   ActivationEvent{SceneID: sceneID},
	})
}

func (w *Watcher) stopSceneEffects(sceneID string) {
	w.mu.Lock()
	devs := w.effectByScene[sceneID]
	delete(w.effectByScene, sceneID)
	targets := make([]effect.Target, 0, len(devs))
	for did, runID := range devs {
		delete(w.sceneByEffectRun, runID)
		targets = append(targets, effect.Target{Type: device.TargetDevice, ID: string(did)})
	}
	w.mu.Unlock()
	if w.effectCtl == nil {
		return
	}
	for _, t := range targets {
		w.effectCtl.Stop(t)
	}
}

func (w *Watcher) recordSceneEffect(sceneID string, deviceID device.DeviceID, runID string) {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.effectByScene[sceneID] == nil {
		w.effectByScene[sceneID] = make(map[device.DeviceID]string)
	}
	w.effectByScene[sceneID][deviceID] = runID
	w.sceneByEffectRun[runID] = sceneID
}

func (w *Watcher) isSceneEffectDevice(sceneID string, deviceID device.DeviceID) bool {
	w.mu.RLock()
	defer w.mu.RUnlock()
	_, ok := w.effectByScene[sceneID][deviceID]
	return ok
}

func (w *Watcher) setActive(sceneID string, expected []store.SceneExpectedState) {
	w.mu.Lock()
	defer w.mu.Unlock()
	if old, ok := w.expected[sceneID]; ok {
		for did := range old {
			if m, ok := w.deviceIndex[did]; ok {
				delete(m, sceneID)
				if len(m) == 0 {
					delete(w.deviceIndex, did)
				}
			}
		}
	}
	m := make(map[device.DeviceID]store.SceneExpectedState, len(expected))
	for _, e := range expected {
		m[e.DeviceID] = e
		if w.deviceIndex[e.DeviceID] == nil {
			w.deviceIndex[e.DeviceID] = make(map[string]struct{})
		}
		w.deviceIndex[e.DeviceID][sceneID] = struct{}{}
	}
	w.expected[sceneID] = m
}

func (w *Watcher) clearActive(sceneID string) {
	w.mu.Lock()
	defer w.mu.Unlock()
	for did := range w.expected[sceneID] {
		if m, ok := w.deviceIndex[did]; ok {
			delete(m, sceneID)
			if len(m) == 0 {
				delete(w.deviceIndex, did)
			}
		}
	}
	delete(w.expected, sceneID)
}
