package scene

import (
	"context"
	"strconv"
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/effect"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
)

var logger = logging.Named("scene")

// settleWindow is how long after a scene apply the watcher tolerates state
// mismatches before treating them as drift. Bulb transitions (z2m sends
// `transition` to the device) plus the asynchronous nature of multi-attribute
// state echoes mean a freshly-applied scene's device may briefly report
// stale-merged values that don't match the snapshotted expected state. After
// the window, mismatches deactivate as foreign drift. Exposed as a var so
// tests can override.
var settleWindow = 2 * time.Second

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

	// lastAppliedAt records the most recent EventSceneApplied timestamp per
	// scene. handleDeviceStateChanged consults it to grant a settle window
	// during which transition-stage mismatches are tolerated. Hydrated scenes
	// have no entry — they're long settled, so the first mismatch is real
	// drift.
	lastAppliedAt map[string]time.Time

	// settleTimers fires settleExpiredCh exactly once per apply, settleWindow
	// after the apply timestamp. The Run loop drains settleExpiredCh and
	// calls handleSettleExpired so re-evaluation runs in the same goroutine
	// as every other state mutation. pendingMismatch tracks whether any
	// in-window state event mismatched expected; only then does the
	// post-settle re-check try to deactivate (devices that never reported
	// during the window are left alone, not deactivated on a stale snapshot).
	settleTimers    map[string]*time.Timer
	settleExpiredCh chan string
	pendingMismatch map[string]bool
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
		lastAppliedAt:    make(map[string]time.Time),
		settleTimers:     make(map[string]*time.Timer),
		settleExpiredCh:  make(chan string, 16),
		pendingMismatch:  make(map[string]bool),
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
		case sceneID := <-w.settleExpiredCh:
			w.handleSettleExpired(ctx, sceneID)
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
	w.scheduleSettleExpiry(sceneID, appliedAt)
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
		w.mu.RLock()
		appliedAt, hasApplied := w.lastAppliedAt[sceneID]
		w.mu.RUnlock()
		if hasApplied && time.Since(appliedAt) < settleWindow {
			w.mu.Lock()
			w.pendingMismatch[sceneID] = true
			w.mu.Unlock()
			logger.Debug("scene mismatch within settle window; tolerating",
				"scene_id", sceneID,
				"device_id", string(deviceID),
				"since_apply", time.Since(appliedAt))
			continue
		}
		logger.Info("scene drift detected; deactivating",
			"scene_id", sceneID,
			"device_id", string(deviceID),
			"expected_on", boolPtrStr(exp.On), "current_on", boolPtrStr(current.On),
			"expected_brightness", intPtrStr(exp.Brightness), "current_brightness", intPtrStr(current.Brightness),
			"expected_color_temp", intPtrStr(exp.ColorTemp), "current_color_temp", intPtrStr(current.ColorTemp))
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
	delete(w.lastAppliedAt, sceneID)
	delete(w.pendingMismatch, sceneID)
	if t, ok := w.settleTimers[sceneID]; ok {
		t.Stop()
		delete(w.settleTimers, sceneID)
	}
}

// scheduleSettleExpiry records the apply timestamp and arms a timer that
// posts the scene id to settleExpiredCh after settleWindow. Re-applying a
// scene cancels the previous timer.
func (w *Watcher) scheduleSettleExpiry(sceneID string, appliedAt time.Time) {
	w.mu.Lock()
	w.lastAppliedAt[sceneID] = appliedAt
	if t, ok := w.settleTimers[sceneID]; ok {
		t.Stop()
	}
	w.settleTimers[sceneID] = time.AfterFunc(settleWindow, func() {
		// Channel is buffered; if Run is gone we'd block forever — use a
		// non-blocking send to drop the signal in that case.
		select {
		case w.settleExpiredCh <- sceneID:
		default:
		}
	})
	w.mu.Unlock()
}

// handleSettleExpired re-evaluates a scene's expected vs current state once
// its settle window has elapsed. If any device drifted during the window
// (and the post-settle state still mismatches), the scene deactivates now —
// catching real drift the settle window initially tolerated.
func (w *Watcher) handleSettleExpired(ctx context.Context, sceneID string) {
	w.mu.Lock()
	delete(w.settleTimers, sceneID)
	delete(w.lastAppliedAt, sceneID)
	hadMismatch := w.pendingMismatch[sceneID]
	delete(w.pendingMismatch, sceneID)
	expectedForScene, present := w.expected[sceneID]
	if !present || !hadMismatch {
		w.mu.Unlock()
		return
	}
	snapshot := make(map[device.DeviceID]store.SceneExpectedState, len(expectedForScene))
	for did, exp := range expectedForScene {
		snapshot[did] = exp
	}
	w.mu.Unlock()

	for did, exp := range snapshot {
		if w.isSceneEffectDevice(sceneID, did) {
			continue
		}
		current, ok := w.reader.GetDeviceState(did)
		if !ok {
			continue
		}
		if ExpectedMatchesCurrent(exp, current) {
			continue
		}
		logger.Info("post-settle drift detected; deactivating",
			"scene_id", sceneID,
			"device_id", string(did),
			"expected_on", boolPtrStr(exp.On), "current_on", boolPtrStr(current.On),
			"expected_brightness", intPtrStr(exp.Brightness), "current_brightness", intPtrStr(current.Brightness),
			"expected_color_temp", intPtrStr(exp.ColorTemp), "current_color_temp", intPtrStr(current.ColorTemp))
		w.deactivate(ctx, sceneID)
		return
	}
}

func boolPtrStr(p *bool) string {
	if p == nil {
		return "nil"
	}
	if *p {
		return "true"
	}
	return "false"
}

func intPtrStr(p *int) string {
	if p == nil {
		return "nil"
	}
	return strconv.Itoa(*p)
}
