package effect

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func TestRunnerStart_PersistsLoopTimelineNonVolatile(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:   "loop",
		Kind: KindTimeline,
		Loop: true,
		Steps: []Step{
			{Index: 0, Kind: StepSetBrightness, Config: brightnessConfig(40, 0)},
			{Index: 1, Kind: StepWait, Config: waitConfig(20)},
		},
	})
	r := makeRunner(rec, st, newFakeReader(), nil)

	target := deviceTarget("dev-1")
	runID, err := r.Start(context.Background(), "loop", target)
	if err != nil {
		t.Fatalf("Start: %v", err)
	}
	t.Cleanup(func() { r.Stop(target) })

	rows := waitForActive(t, st, 1)
	if rows[0].ID != runID {
		t.Errorf("row id = %q, want %q", rows[0].ID, runID)
	}
	if rows[0].Volatile {
		t.Errorf("loop timeline run persisted volatile=true, want false")
	}
	if rows[0].EffectID != "loop" {
		t.Errorf("effect id = %q, want loop", rows[0].EffectID)
	}
	if rows[0].TargetType != string(device.TargetDevice) || rows[0].TargetID != "dev-1" {
		t.Errorf("target = (%s,%s), want (device,dev-1)", rows[0].TargetType, rows[0].TargetID)
	}
}

func TestRunnerStart_PersistsNonLoopTimelineVolatile(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:   "one-shot",
		Kind: KindTimeline,
		Steps: []Step{
			{Index: 0, Kind: StepWait, Config: waitConfig(60_000)},
		},
	})
	r := makeRunner(rec, st, newFakeReader(), nil)

	target := deviceTarget("dev-1")
	if _, err := r.Start(context.Background(), "one-shot", target); err != nil {
		t.Fatalf("Start: %v", err)
	}
	t.Cleanup(func() { r.Stop(target) })

	rows := waitForActive(t, st, 1)
	if !rows[0].Volatile {
		t.Errorf("non-loop timeline persisted volatile=false, want true")
	}
}

func TestRunnerStart_PersistsNativeVolatile(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "candle",
		Kind:       KindNative,
		NativeName: "candle",
		Loop:       true,
	})
	reader := newFakeReader()
	reader.addDevice(device.Device{
		ID: "dev-1",
		Capabilities: []device.Capability{
			{Name: device.CapEffect, Values: []string{"candle", "stop_effect"}},
		},
	})
	r := makeRunner(rec, st, reader, fakeStopper{terminator: "stop_effect"})

	target := deviceTarget("dev-1")
	if _, err := r.Start(context.Background(), "candle", target); err != nil {
		t.Fatalf("Start: %v", err)
	}
	t.Cleanup(func() { r.Stop(target) })

	rows := waitForActive(t, st, 1)
	if !rows[0].Volatile {
		t.Errorf("native run persisted volatile=false, want true (loop+native must still be volatile)")
	}
}

func TestRunnerStop_DeletesPersistedRow(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:   "loop",
		Kind: KindTimeline,
		Loop: true,
		Steps: []Step{
			{Index: 0, Kind: StepWait, Config: waitConfig(60_000)},
		},
	})
	r := makeRunner(rec, st, newFakeReader(), nil)

	target := deviceTarget("dev-1")
	if _, err := r.Start(context.Background(), "loop", target); err != nil {
		t.Fatalf("Start: %v", err)
	}
	waitForActive(t, st, 1)

	if !r.Stop(target) {
		t.Fatal("Stop returned false")
	}
	waitForActive(t, st, 0)
}

func TestRunnerStart_UpsertCollapsesByTarget(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:   "a",
		Kind: KindTimeline,
		Loop: true,
		Steps: []Step{
			{Index: 0, Kind: StepSetBrightness, Config: brightnessConfig(50, 0)},
			{Index: 1, Kind: StepWait, Config: waitConfig(30)},
		},
	})
	st.put(Effect{
		ID:   "b",
		Kind: KindTimeline,
		Loop: true,
		Steps: []Step{
			{Index: 0, Kind: StepSetBrightness, Config: brightnessConfig(150, 0)},
			{Index: 1, Kind: StepWait, Config: waitConfig(30)},
		},
	})
	r := makeRunner(rec, st, newFakeReader(), nil)

	target := deviceTarget("dev-1")
	if _, err := r.Start(context.Background(), "a", target); err != nil {
		t.Fatalf("Start a: %v", err)
	}
	waitForActive(t, st, 1)

	runB, err := r.Start(context.Background(), "b", target)
	if err != nil {
		t.Fatalf("Start b: %v", err)
	}
	t.Cleanup(func() { r.Stop(target) })

	rows := waitForActiveBy(t, st, func(rows []ActiveEffectRecord) bool {
		return len(rows) == 1 && rows[0].EffectID == "b"
	}, "second start overwrites first by target")
	if rows[0].ID != runB {
		t.Errorf("row id = %q, want runB %q", rows[0].ID, runB)
	}
}

func TestRunnerHydrate_RelaunchesNonVolatileRow(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:   "loop",
		Kind: KindTimeline,
		Loop: true,
		Steps: []Step{
			{Index: 0, Kind: StepSetBrightness, Config: brightnessConfig(80, 0)},
			{Index: 1, Kind: StepWait, Config: waitConfig(10)},
		},
	})

	if err := st.UpsertActiveEffect(context.Background(), UpsertActiveEffectParams{
		ID:         "row-1",
		EffectID:   "loop",
		TargetType: string(device.TargetDevice),
		TargetID:   "dev-1",
		StartedAt:  time.Now(),
		Volatile:   false,
	}); err != nil {
		t.Fatalf("seed active row: %v", err)
	}

	r := makeRunner(rec, st, newFakeReader(), nil)
	if err := r.Hydrate(context.Background()); err != nil {
		t.Fatalf("Hydrate: %v", err)
	}
	t.Cleanup(func() { r.Stop(deviceTarget("dev-1")) })

	waitFor(t, 2, func() int { return len(rec.commands()) }, "loop publishes after hydrate")

	r.mu.Lock()
	_, active := r.active[keyFor(deviceTarget("dev-1"))]
	r.mu.Unlock()
	if !active {
		t.Fatal("run not active after hydrate")
	}
}

func TestRunnerHydrate_PurgesVolatileRowsAndDoesNotRelaunch(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:   "one-shot",
		Kind: KindTimeline,
		Steps: []Step{
			{Index: 0, Kind: StepSetBrightness, Config: brightnessConfig(80, 0)},
		},
	})
	st.put(Effect{
		ID:         "candle",
		Kind:       KindNative,
		NativeName: "candle",
	})

	ctx := context.Background()
	if err := st.UpsertActiveEffect(ctx, UpsertActiveEffectParams{
		ID: "v-1", EffectID: "one-shot",
		TargetType: string(device.TargetDevice), TargetID: "dev-1",
		StartedAt: time.Now(), Volatile: true,
	}); err != nil {
		t.Fatalf("seed v-1: %v", err)
	}
	if err := st.UpsertActiveEffect(ctx, UpsertActiveEffectParams{
		ID: "v-2", EffectID: "candle",
		TargetType: string(device.TargetDevice), TargetID: "dev-2",
		StartedAt: time.Now(), Volatile: true,
	}); err != nil {
		t.Fatalf("seed v-2: %v", err)
	}

	r := makeRunner(rec, st, newFakeReader(), fakeStopper{terminator: "stop_effect"})
	if err := r.Hydrate(ctx); err != nil {
		t.Fatalf("Hydrate: %v", err)
	}

	rows := st.activeSnapshot()
	if len(rows) != 0 {
		t.Errorf("active rows after hydrate = %d, want 0 (volatile rows purged)", len(rows))
	}

	time.Sleep(40 * time.Millisecond)
	r.mu.Lock()
	count := len(r.active)
	r.mu.Unlock()
	if count != 0 {
		t.Errorf("active in-memory runs = %d, want 0", count)
	}
	if got := len(rec.commands()); got != 0 {
		t.Errorf("commands published after hydrate = %d, want 0 (volatile rows must not relaunch)", got)
	}
}

func TestRunnerHydrate_CrashSimulationVolatileRowPurged(t *testing.T) {
	st := newFakeStore()
	st.put(Effect{
		ID:   "one-shot",
		Kind: KindTimeline,
		Steps: []Step{
			{Index: 0, Kind: StepWait, Config: waitConfig(60_000)},
		},
	})

	rec1 := newRecorder()
	r1 := makeRunner(rec1, st, newFakeReader(), nil)
	if _, err := r1.Start(context.Background(), "one-shot", deviceTarget("dev-1")); err != nil {
		t.Fatalf("Start: %v", err)
	}
	waitForActive(t, st, 1)
	rows := st.activeSnapshot()
	if !rows[0].Volatile {
		t.Fatalf("expected volatile=true seed, got %+v", rows[0])
	}

	rec2 := newRecorder()
	r2 := makeRunner(rec2, st, newFakeReader(), nil)
	if err := r2.Hydrate(context.Background()); err != nil {
		t.Fatalf("Hydrate: %v", err)
	}

	if rows := st.activeSnapshot(); len(rows) != 0 {
		t.Errorf("active rows after crash + hydrate = %d, want 0", len(rows))
	}
	r2.mu.Lock()
	count := len(r2.active)
	r2.mu.Unlock()
	if count != 0 {
		t.Errorf("active runs after crash + hydrate = %d, want 0", count)
	}
	if got := len(rec2.commands()); got != 0 {
		t.Errorf("commands on second runner = %d, want 0", got)
	}
}

func TestRunnerHydrate_SkipsDeletedEffect(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:   "good",
		Kind: KindTimeline,
		Loop: true,
		Steps: []Step{
			{Index: 0, Kind: StepSetBrightness, Config: brightnessConfig(60, 0)},
			{Index: 1, Kind: StepWait, Config: waitConfig(10)},
		},
	})

	ctx := context.Background()
	if err := st.UpsertActiveEffect(ctx, UpsertActiveEffectParams{
		ID: "row-good", EffectID: "good",
		TargetType: string(device.TargetDevice), TargetID: "dev-good",
		StartedAt: time.Now(), Volatile: false,
	}); err != nil {
		t.Fatalf("seed good: %v", err)
	}
	if err := st.UpsertActiveEffect(ctx, UpsertActiveEffectParams{
		ID: "row-missing", EffectID: "missing-effect",
		TargetType: string(device.TargetDevice), TargetID: "dev-missing",
		StartedAt: time.Now(), Volatile: false,
	}); err != nil {
		t.Fatalf("seed missing: %v", err)
	}

	r := makeRunner(rec, st, newFakeReader(), nil)
	if err := r.Hydrate(ctx); err != nil {
		t.Fatalf("Hydrate: %v", err)
	}
	t.Cleanup(func() { r.Stop(deviceTarget("dev-good")) })

	waitFor(t, 1, func() int { return len(rec.commands()) }, "good run launched")

	r.mu.Lock()
	_, goodActive := r.active[keyFor(deviceTarget("dev-good"))]
	_, missingActive := r.active[keyFor(deviceTarget("dev-missing"))]
	r.mu.Unlock()
	if !goodActive {
		t.Error("good run not active after hydrate")
	}
	if missingActive {
		t.Error("missing-effect run is active after hydrate; should have been skipped")
	}
}

func TestRunnerStart_ToleratesPersistenceFailure(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:   "e1",
		Kind: KindTimeline,
		Steps: []Step{
			{Index: 0, Kind: StepSetBrightness, Config: brightnessConfig(50, 0)},
		},
	})
	st.setUpsertErr(errors.New("disk full"))
	r := makeRunner(rec, st, newFakeReader(), nil)

	target := deviceTarget("dev-1")
	runID, err := r.Start(context.Background(), "e1", target)
	if err != nil {
		t.Fatalf("Start returned error despite persistence failure being expected to be swallowed: %v", err)
	}
	if runID == "" {
		t.Fatal("Start returned empty runID despite a persistence failure")
	}
	t.Cleanup(func() { r.Stop(target) })

	waitFor(t, 1, func() int { return len(rec.commands()) }, "command published despite persistence failure")
	if got := len(st.activeSnapshot()); got != 0 {
		t.Errorf("persisted rows = %d, want 0 (upsert failed)", got)
	}
}

// poll-helpers used only by Phase 7 persistence tests.

func waitForActive(t *testing.T, st *fakeStore, want int) []ActiveEffectRecord {
	t.Helper()
	return waitForActiveBy(t, st, func(rows []ActiveEffectRecord) bool {
		return len(rows) == want
	}, "active row count")
}

func waitForActiveBy(t *testing.T, st *fakeStore, pred func([]ActiveEffectRecord) bool, msg string) []ActiveEffectRecord {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	var rows []ActiveEffectRecord
	for time.Now().Before(deadline) {
		rows = st.activeSnapshot()
		if pred(rows) {
			return rows
		}
		time.Sleep(2 * time.Millisecond)
	}
	t.Fatalf("%s: predicate not satisfied within 2s; rows=%+v", msg, rows)
	return nil
}

// silence unused-import check if eventbus drops out of scope.
var _ = eventbus.EventCommandRequested
