package scene

import (
	"context"
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
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
type Watcher struct {
	bus      eventbus.EventBus
	store    WatcherStore
	resolver device.TargetResolver
	reader   device.StateReader

	ch <-chan eventbus.Event

	mu          sync.RWMutex
	expected    map[string]map[device.DeviceID]store.SceneExpectedState
	deviceIndex map[device.DeviceID]map[string]struct{}
}

// NewWatcher constructs a Watcher and subscribes it to the bus immediately, so
// any EventSceneApplied published after construction is buffered for Run to
// consume. Call Hydrate before Run to reconcile persisted active scenes
// against current device state.
func NewWatcher(bus eventbus.EventBus, s WatcherStore, resolver device.TargetResolver, reader device.StateReader) *Watcher {
	w := &Watcher{
		bus:         bus,
		store:       s,
		resolver:    resolver,
		reader:      reader,
		expected:    make(map[string]map[device.DeviceID]store.SceneExpectedState),
		deviceIndex: make(map[device.DeviceID]map[string]struct{}),
	}
	w.ch = bus.Subscribe(eventbus.EventSceneApplied, eventbus.EventDeviceStateChanged)
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

// Run blocks until ctx is done, consuming scene.applied and device.state_changed
// events. Publishes EventSceneActivated / EventSceneDeactivated on transitions.
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

	commands := BuildApplyCommands(ctx, w.resolver, w.reader, sceneID, actions, payloads)
	if len(commands) == 0 {
		return
	}

	expected := make([]store.SceneExpectedState, 0, len(commands))
	for _, cmd := range commands {
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

	at := appliedAt
	w.bus.Publish(eventbus.Event{
		Type:      eventbus.EventSceneActivated,
		Timestamp: appliedAt,
		Payload:   ActivationEvent{SceneID: sceneID, ActivatedAt: &at},
	})
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

func (w *Watcher) deactivate(ctx context.Context, sceneID string) {
	if err := w.store.ClearSceneActivatedAt(ctx, sceneID); err != nil {
		logger.Error("clear activated_at failed", "scene_id", sceneID, "error", err)
		return
	}
	if err := w.store.ReplaceSceneExpectedStates(ctx, sceneID, nil); err != nil {
		logger.Error("clear expected states failed", "scene_id", sceneID, "error", err)
	}
	w.clearActive(sceneID)

	w.bus.Publish(eventbus.Event{
		Type:      eventbus.EventSceneDeactivated,
		Timestamp: time.Now(),
		Payload:   ActivationEvent{SceneID: sceneID},
	})
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
