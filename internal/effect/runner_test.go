package effect

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

type fakeStore struct {
	mu        sync.Mutex
	effects   map[string]Effect
	active    map[string]ActiveEffectRecord
	err       error
	upsertErr error
}

func newFakeStore() *fakeStore {
	return &fakeStore{
		effects: make(map[string]Effect),
		active:  make(map[string]ActiveEffectRecord),
	}
}

func (f *fakeStore) put(eff Effect) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.effects[eff.ID] = eff
}

func (f *fakeStore) LoadEffect(_ context.Context, id string) (Effect, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.err != nil {
		return Effect{}, f.err
	}
	eff, ok := f.effects[id]
	if !ok {
		return Effect{}, errors.New("not found")
	}
	return eff, nil
}

func activeKey(targetType, targetID string) string {
	return targetType + "\x00" + targetID
}

func (f *fakeStore) UpsertActiveEffect(_ context.Context, params UpsertActiveEffectParams) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.upsertErr != nil {
		return f.upsertErr
	}
	f.active[activeKey(params.TargetType, params.TargetID)] = ActiveEffectRecord{
		ID:         params.ID,
		EffectID:   params.EffectID,
		TargetType: params.TargetType,
		TargetID:   params.TargetID,
		StartedAt:  params.StartedAt,
		Volatile:   params.Volatile,
	}
	return nil
}

func (f *fakeStore) DeleteActiveEffect(_ context.Context, targetType, targetID string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	delete(f.active, activeKey(targetType, targetID))
	return nil
}

func (f *fakeStore) ListActiveEffects(_ context.Context) ([]ActiveEffectRecord, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	out := make([]ActiveEffectRecord, 0, len(f.active))
	for _, r := range f.active {
		out = append(out, r)
	}
	return out, nil
}

func (f *fakeStore) DeleteVolatileActiveEffects(_ context.Context) (int64, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	var n int64
	for k, r := range f.active {
		if r.Volatile {
			delete(f.active, k)
			n++
		}
	}
	return n, nil
}

func (f *fakeStore) activeSnapshot() []ActiveEffectRecord {
	f.mu.Lock()
	defer f.mu.Unlock()
	out := make([]ActiveEffectRecord, 0, len(f.active))
	for _, r := range f.active {
		out = append(out, r)
	}
	return out
}

func (f *fakeStore) setUpsertErr(err error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.upsertErr = err
}

type fakeReader struct {
	mu      sync.Mutex
	devices map[device.DeviceID]device.Device
}

func newFakeReader() *fakeReader {
	return &fakeReader{devices: make(map[device.DeviceID]device.Device)}
}

func (f *fakeReader) addDevice(d device.Device) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.devices[d.ID] = d
}

func (f *fakeReader) GetDevice(id device.DeviceID) (device.Device, bool) {
	f.mu.Lock()
	defer f.mu.Unlock()
	d, ok := f.devices[id]
	return d, ok
}

func (f *fakeReader) GetDeviceState(_ device.DeviceID) (*device.DeviceState, bool) {
	return nil, false
}

func (f *fakeReader) ListDevices() []device.Device {
	f.mu.Lock()
	defer f.mu.Unlock()
	out := make([]device.Device, 0, len(f.devices))
	for _, d := range f.devices {
		out = append(out, d)
	}
	return out
}

func (f *fakeReader) GetGroup(_ device.GroupID) (device.Group, bool) { return device.Group{}, false }
func (f *fakeReader) ListGroups() []device.Group                     { return nil }
func (f *fakeReader) ListGroupMembers(_ device.GroupID) []device.GroupMember {
	return nil
}
func (f *fakeReader) ResolveGroupDevices(_ device.GroupID) []device.DeviceID { return nil }

type fakeTargets struct{}

func (fakeTargets) ResolveTargetDeviceIDs(_ context.Context, _ device.TargetType, id string) []device.DeviceID {
	return []device.DeviceID{device.DeviceID(id)}
}

type programmableTargets struct {
	mu      sync.Mutex
	members map[string][]device.DeviceID
	calls   map[string]int
}

func newProgrammableTargets() *programmableTargets {
	return &programmableTargets{
		members: make(map[string][]device.DeviceID),
		calls:   make(map[string]int),
	}
}

func (p *programmableTargets) set(targetID string, members []device.DeviceID) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.members[targetID] = members
}

func (p *programmableTargets) ResolveTargetDeviceIDs(_ context.Context, _ device.TargetType, id string) []device.DeviceID {
	p.mu.Lock()
	p.calls[id]++
	out := make([]device.DeviceID, len(p.members[id]))
	copy(out, p.members[id])
	p.mu.Unlock()
	return out
}

type fakeStopper struct {
	terminator string
}

func (f fakeStopper) TerminatorFor(_ device.Device) string { return f.terminator }

// recorder is an in-memory EventBus that records every published event and
// forwards publishes to subscribers.
type recorder struct {
	bus    *eventbus.ChannelBus
	mu     sync.Mutex
	events []eventbus.Event
}

func newRecorder() *recorder {
	return &recorder{bus: eventbus.NewChannelBus()}
}

func (r *recorder) Publish(e eventbus.Event) {
	r.mu.Lock()
	r.events = append(r.events, e)
	r.mu.Unlock()
	r.bus.Publish(e)
}

func (r *recorder) Subscribe(types ...eventbus.EventType) <-chan eventbus.Event {
	return r.bus.Subscribe(types...)
}

func (r *recorder) Unsubscribe(ch <-chan eventbus.Event) {
	r.bus.Unsubscribe(ch)
}

func (r *recorder) snapshot() []eventbus.Event {
	r.mu.Lock()
	defer r.mu.Unlock()
	out := make([]eventbus.Event, len(r.events))
	copy(out, r.events)
	return out
}

func (r *recorder) commands() []device.Command {
	var out []device.Command
	for _, e := range r.snapshot() {
		if e.Type != eventbus.EventCommandRequested {
			continue
		}
		if cmd, ok := e.Payload.(device.Command); ok {
			out = append(out, cmd)
		}
	}
	return out
}

func (r *recorder) nativeRequests() []device.NativeEffectRequest {
	var out []device.NativeEffectRequest
	for _, e := range r.snapshot() {
		if e.Type != eventbus.EventNativeEffectRequested {
			continue
		}
		if req, ok := e.Payload.(device.NativeEffectRequest); ok {
			out = append(out, req)
		}
	}
	return out
}

func waitFor(t *testing.T, want int, get func() int, msg string) {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if get() >= want {
			return
		}
		time.Sleep(2 * time.Millisecond)
	}
	if got := get(); got < want {
		t.Fatalf("%s: got %d, want >= %d", msg, got, want)
	}
}

// brightnessClip builds a SET_BRIGHTNESS clip with deterministic transition.
func brightnessClip(startMs, transitionMs, value int) Clip {
	return Clip{
		StartMs:         startMs,
		TransitionMinMs: transitionMs,
		TransitionMaxMs: transitionMs,
		Kind:            ClipSetBrightness,
		Config:          ClipConfig{SetBrightness: &SetBrightnessClipConfig{Value: value}},
	}
}

func colorClip(startMs, transitionMs, r, g, b int) Clip {
	return Clip{
		StartMs:         startMs,
		TransitionMinMs: transitionMs,
		TransitionMaxMs: transitionMs,
		Kind:            ClipSetColorRGB,
		Config:          ClipConfig{SetColorRGB: &SetColorRGBClipConfig{R: r, G: g, B: b}},
	}
}

func makeRunner(rec *recorder, store EffectStore, reader device.StateReader, term NativeEffectStopper) *Runner {
	return NewRunner(rec, fakeTargets{}, reader, store, term)
}

func makeRunnerWithTargets(rec *recorder, store EffectStore, reader device.StateReader, targets device.TargetResolver, term NativeEffectStopper) *Runner {
	return NewRunner(rec, targets, reader, store, term)
}

func deviceTarget(id string) Target {
	return Target{Type: device.TargetDevice, ID: id}
}

func groupTarget(id string) Target {
	return Target{Type: device.TargetGroup, ID: id}
}

func startDriftLoop(t *testing.T, r *Runner) (cancel context.CancelFunc, done <-chan struct{}) {
	t.Helper()
	ctx, c := context.WithCancel(context.Background())
	d := make(chan struct{})
	go func() {
		r.Run(ctx)
		close(d)
	}()
	t.Cleanup(func() {
		c()
		<-d
	})
	return c, d
}

func TestRunnerTimeline_PublishesClipsInOrder(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "e1",
		Kind:       KindTimeline,
		DurationMs: 30,
		Tracks: []Track{{
			Clips: []Clip{
				brightnessClip(0, 0, 50),
				brightnessClip(20, 0, 150),
			},
		}},
	})
	r := makeRunner(rec, st, newFakeReader(), nil)

	runID, err := r.Start(context.Background(), "e1", deviceTarget("dev-1"))
	if err != nil {
		t.Fatalf("Start: %v", err)
	}
	if runID == "" {
		t.Fatal("expected non-empty runID")
	}

	waitFor(t, 2, func() int { return len(rec.commands()) }, "two timeline commands")

	cmds := rec.commands()
	if len(cmds) != 2 {
		t.Fatalf("expected 2 commands, got %d", len(cmds))
	}
	if cmds[0].Brightness == nil || *cmds[0].Brightness != 50 {
		t.Fatalf("first cmd brightness = %v, want 50", cmds[0].Brightness)
	}
	if cmds[1].Brightness == nil || *cmds[1].Brightness != 150 {
		t.Fatalf("second cmd brightness = %v, want 150", cmds[1].Brightness)
	}
	if cmds[0].Origin.Kind != device.OriginKindEffect || cmds[0].Origin.ID != runID {
		t.Fatalf("origin = %+v, want effect/%s", cmds[0].Origin, runID)
	}
}

func TestRunnerTimeline_ParallelTracksFireConcurrently(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "e1",
		Kind:       KindTimeline,
		DurationMs: 100,
		Tracks: []Track{
			{Clips: []Clip{brightnessClip(0, 0, 80)}},
			{Clips: []Clip{colorClip(0, 0, 200, 100, 50)}},
		},
	})
	reader := newFakeReader()
	reader.addDevice(device.Device{
		ID: "dev-1",
		Capabilities: []device.Capability{
			{Name: device.CapBrightness, Access: 7},
			{Name: device.CapColor, Access: 7},
		},
	})
	r := makeRunner(rec, st, reader, nil)

	if _, err := r.Start(context.Background(), "e1", deviceTarget("dev-1")); err != nil {
		t.Fatalf("Start: %v", err)
	}
	waitFor(t, 2, func() int { return len(rec.commands()) }, "two parallel publishes")
	time.Sleep(20 * time.Millisecond)

	cmds := rec.commands()
	if len(cmds) != 2 {
		t.Fatalf("expected 2 commands (one per track), got %d", len(cmds))
	}
	hasBrightness := false
	hasColor := false
	for _, c := range cmds {
		if c.Brightness != nil && *c.Brightness == 80 {
			hasBrightness = true
		}
		if c.Color != nil && c.Color.R == 200 {
			hasColor = true
		}
	}
	if !hasBrightness || !hasColor {
		t.Fatalf("expected one brightness + one color command, got %+v", cmds)
	}
}

// fixedSampler implements transitionSampler with a deterministic sequence so
// random transitions are reproducible in tests.
type fixedSampler struct {
	values []int
	idx    int
	mu     sync.Mutex
}

func (s *fixedSampler) IntN(n int) int {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.values) == 0 {
		return 0
	}
	v := s.values[s.idx%len(s.values)]
	s.idx++
	if v >= n {
		v = n - 1
	}
	if v < 0 {
		v = 0
	}
	return v
}

func TestRunnerTimeline_RandomTransitionWithinBounds(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "e1",
		Kind:       KindTimeline,
		DurationMs: 500,
		Tracks: []Track{{
			Clips: []Clip{{
				StartMs:         0,
				TransitionMinMs: 200,
				TransitionMaxMs: 400,
				Kind:            ClipSetBrightness,
				Config:          ClipConfig{SetBrightness: &SetBrightnessClipConfig{Value: 100}},
			}},
		}},
	})
	sampler := &fixedSampler{values: []int{50}}
	r := NewRunnerWithRand(rec, fakeTargets{}, newFakeReader(), st, nil, sampler)

	if _, err := r.Start(context.Background(), "e1", deviceTarget("dev-1")); err != nil {
		t.Fatalf("Start: %v", err)
	}
	waitFor(t, 1, func() int { return len(rec.commands()) }, "one command")

	cmds := rec.commands()
	if len(cmds) != 1 {
		t.Fatalf("expected 1 command, got %d", len(cmds))
	}
	if cmds[0].Transition == nil {
		t.Fatal("expected transition to be set")
	}
	got := *cmds[0].Transition
	if got < 0.2 || got > 0.4 {
		t.Errorf("transition out of bounds: got %f, want 0.2..0.4", got)
	}
	wantSec := float64(200+50) / 1000.0
	if got != wantSec {
		t.Errorf("seeded transition = %f, want %f", got, wantSec)
	}
}

func TestRunnerStart_PreemptsExistingRun(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "long",
		Kind:       KindTimeline,
		DurationMs: 5000,
		Tracks: []Track{{
			Clips: []Clip{
				brightnessClip(0, 0, 50),
				brightnessClip(2000, 0, 100),
				brightnessClip(4000, 0, 150),
			},
		}},
	})
	st.put(Effect{
		ID:         "short",
		Kind:       KindTimeline,
		DurationMs: 0,
		Tracks: []Track{{
			Clips: []Clip{brightnessClip(0, 0, 220)},
		}},
	})
	r := makeRunner(rec, st, newFakeReader(), nil)

	target := deviceTarget("dev-1")

	runA, err := r.Start(context.Background(), "long", target)
	if err != nil {
		t.Fatalf("Start A: %v", err)
	}
	waitFor(t, 1, func() int { return len(rec.commands()) }, "first cmd from A")

	runB, err := r.Start(context.Background(), "short", target)
	if err != nil {
		t.Fatalf("Start B: %v", err)
	}
	if runA == runB {
		t.Fatal("runA == runB")
	}
	waitFor(t, 2, func() int { return len(rec.commands()) }, "second cmd from B")

	time.Sleep(150 * time.Millisecond)

	cmds := rec.commands()
	if len(cmds) != 2 {
		t.Fatalf("expected exactly 2 commands (A's first + B's only), got %d", len(cmds))
	}
	if cmds[0].Origin.ID != runA {
		t.Fatalf("first cmd origin = %s, want runA %s", cmds[0].Origin.ID, runA)
	}
	if cmds[1].Origin.ID != runB {
		t.Fatalf("second cmd origin = %s, want runB %s", cmds[1].Origin.ID, runB)
	}
	if *cmds[1].Brightness != 220 {
		t.Fatalf("B's command brightness = %d, want 220", *cmds[1].Brightness)
	}
}

func TestRunnerStop_NoLeakAfterCancel(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "e1",
		Kind:       KindTimeline,
		DurationMs: 5000,
		Tracks: []Track{{
			Clips: []Clip{
				brightnessClip(0, 0, 50),
				brightnessClip(5000, 0, 150),
			},
		}},
	})
	r := makeRunner(rec, st, newFakeReader(), nil)

	target := deviceTarget("dev-1")
	if _, err := r.Start(context.Background(), "e1", target); err != nil {
		t.Fatalf("Start: %v", err)
	}
	waitFor(t, 1, func() int { return len(rec.commands()) }, "first cmd")

	if !r.Stop(target) {
		t.Fatal("Stop returned false; expected active run")
	}

	beforeStop := len(rec.commands())
	time.Sleep(100 * time.Millisecond)
	if got := len(rec.commands()); got != beforeStop {
		t.Fatalf("commands grew after Stop: %d -> %d", beforeStop, got)
	}
}

func TestRunnerStop_ReturnsFalseWhenNoActiveRun(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	r := makeRunner(rec, st, newFakeReader(), nil)
	if r.Stop(deviceTarget("missing")) {
		t.Fatal("Stop returned true for unknown target")
	}
}

func TestRunnerStartStop_QuickShutdown(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "e1",
		Kind:       KindTimeline,
		DurationMs: 10_000,
		Tracks: []Track{{
			Clips: []Clip{brightnessClip(9000, 0, 100)},
		}},
	})
	r := makeRunner(rec, st, newFakeReader(), nil)

	target := deviceTarget("dev-1")
	if _, err := r.Start(context.Background(), "e1", target); err != nil {
		t.Fatalf("Start: %v", err)
	}

	done := make(chan struct{})
	go func() {
		r.Stop(target)
		close(done)
	}()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("Stop did not return promptly during a long iteration")
	}
}

func TestRunnerNative_StartPublishesRequest(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "candle",
		Kind:       KindNative,
		NativeName: "candle",
	})
	reader := newFakeReader()
	reader.addDevice(device.Device{
		ID: "dev-1",
		Capabilities: []device.Capability{
			{Name: device.CapEffect, Values: []string{"candle", "stop_effect"}},
		},
	})
	r := makeRunner(rec, st, reader, fakeStopper{terminator: "stop_effect"})

	runID, err := r.Start(context.Background(), "candle", deviceTarget("dev-1"))
	if err != nil {
		t.Fatalf("Start: %v", err)
	}
	waitFor(t, 1, func() int { return len(rec.nativeRequests()) }, "native request")

	reqs := rec.nativeRequests()
	if len(reqs) != 1 {
		t.Fatalf("expected 1 native request, got %d", len(reqs))
	}
	req := reqs[0]
	if req.Name != "candle" {
		t.Fatalf("name = %q, want candle", req.Name)
	}
	if req.DeviceID != "dev-1" {
		t.Fatalf("deviceID = %q, want dev-1", req.DeviceID)
	}
	if req.Origin.Kind != device.OriginKindEffect || req.Origin.ID != runID {
		t.Fatalf("origin = %+v, want effect/%s", req.Origin, runID)
	}
}

func TestRunnerNative_StopPublishesTerminator(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "candle",
		Kind:       KindNative,
		NativeName: "candle",
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
	waitFor(t, 1, func() int { return len(rec.nativeRequests()) }, "initial native request")

	if !r.Stop(target) {
		t.Fatal("Stop returned false")
	}
	waitFor(t, 2, func() int { return len(rec.nativeRequests()) }, "terminator request")

	reqs := rec.nativeRequests()
	if len(reqs) != 2 {
		t.Fatalf("expected 2 native requests, got %d", len(reqs))
	}
	if reqs[1].Name != "stop_effect" {
		t.Fatalf("terminator name = %q, want stop_effect", reqs[1].Name)
	}
}

func TestRunnerNative_PreemptedByTimelinePublishesTerminatorFirst(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "fireplace",
		Kind:       KindNative,
		NativeName: "fireplace",
	})
	st.put(Effect{
		ID:         "ramp",
		Kind:       KindTimeline,
		DurationMs: 0,
		Tracks: []Track{{
			Clips: []Clip{brightnessClip(0, 0, 80)},
		}},
	})
	reader := newFakeReader()
	reader.addDevice(device.Device{
		ID: "dev-1",
		Capabilities: []device.Capability{
			{Name: device.CapOnOff, Access: 7},
			{Name: device.CapBrightness, Access: 7},
			{Name: device.CapEffect, Values: []string{"fireplace", "stop_hue_effect"}},
		},
	})
	r := makeRunner(rec, st, reader, fakeStopper{terminator: "stop_hue_effect"})

	target := deviceTarget("dev-1")
	if _, err := r.Start(context.Background(), "fireplace", target); err != nil {
		t.Fatalf("Start native: %v", err)
	}
	waitFor(t, 1, func() int { return len(rec.nativeRequests()) }, "native start")

	if _, err := r.Start(context.Background(), "ramp", target); err != nil {
		t.Fatalf("Start ramp: %v", err)
	}
	waitFor(t, 1, func() int { return len(rec.commands()) }, "timeline cmd")

	events := rec.snapshot()
	var terminatorIdx, firstCmdIdx int = -1, -1
	for i, e := range events {
		switch e.Type {
		case eventbus.EventNativeEffectRequested:
			req := e.Payload.(device.NativeEffectRequest)
			if req.Name == "stop_hue_effect" && terminatorIdx == -1 {
				terminatorIdx = i
			}
		case eventbus.EventCommandRequested:
			if firstCmdIdx == -1 {
				firstCmdIdx = i
			}
		}
	}
	if terminatorIdx == -1 {
		t.Fatal("terminator not published")
	}
	if firstCmdIdx == -1 {
		t.Fatal("timeline command not published")
	}
	if terminatorIdx >= firstCmdIdx {
		t.Fatalf("terminator at %d not before timeline cmd at %d", terminatorIdx, firstCmdIdx)
	}
}

func TestRunner_StartStopLeakSmoke(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping leak smoke test in short mode")
	}
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "e1",
		Kind:       KindTimeline,
		DurationMs: 1_000_000,
		Tracks: []Track{{
			Clips: []Clip{brightnessClip(900_000, 0, 100)},
		}},
	})
	r := makeRunner(rec, st, newFakeReader(), nil)

	target := deviceTarget("dev-1")
	for i := 0; i < 1000; i++ {
		if _, err := r.Start(context.Background(), "e1", target); err != nil {
			t.Fatalf("iter %d: Start: %v", i, err)
		}
		if !r.Stop(target) {
			t.Fatalf("iter %d: Stop returned false", i)
		}
	}

	r.mu.Lock()
	count := len(r.active)
	r.mu.Unlock()
	if count != 0 {
		t.Fatalf("active map not empty after start/stop loop: %d entries", count)
	}
}

func TestRunnerTimeline_LoopRunsRepeatedly(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "loop",
		Kind:       KindTimeline,
		Loop:       true,
		DurationMs: 10,
		Tracks: []Track{{
			Clips: []Clip{
				brightnessClip(0, 0, 40),
				brightnessClip(5, 0, 120),
			},
		}},
	})
	r := makeRunner(rec, st, newFakeReader(), nil)

	target := deviceTarget("dev-1")
	if _, err := r.Start(context.Background(), "loop", target); err != nil {
		t.Fatalf("Start: %v", err)
	}
	t.Cleanup(func() { r.Stop(target) })

	waitFor(t, 6, func() int { return len(rec.commands()) }, "≥3 loop cycles (6 commands)")

	cmds := rec.commands()
	if len(cmds) < 6 {
		t.Fatalf("expected ≥6 publishes across loop cycles, got %d", len(cmds))
	}
	for i := 0; i+1 < len(cmds) && i < 5; i += 2 {
		if cmds[i].Brightness == nil || *cmds[i].Brightness != 40 {
			t.Fatalf("cycle %d first cmd brightness = %v, want 40", i/2, cmds[i].Brightness)
		}
		if cmds[i+1].Brightness == nil || *cmds[i+1].Brightness != 120 {
			t.Fatalf("cycle %d second cmd brightness = %v, want 120", i/2, cmds[i+1].Brightness)
		}
	}
}

func TestRunnerTimeline_GroupFanOut(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "grp",
		Kind:       KindTimeline,
		DurationMs: 0,
		Tracks: []Track{{
			Clips: []Clip{brightnessClip(0, 0, 60)},
		}},
	})

	tr := newProgrammableTargets()
	tr.set("group-1", []device.DeviceID{"dev-a", "dev-b", "dev-c"})

	reader := newFakeReader()
	for _, id := range []device.DeviceID{"dev-a", "dev-b", "dev-c"} {
		reader.addDevice(device.Device{
			ID: id,
			Capabilities: []device.Capability{
				{Name: device.CapOnOff, Access: 7},
				{Name: device.CapBrightness, Access: 7},
			},
		})
	}

	r := makeRunnerWithTargets(rec, st, reader, tr, nil)

	target := groupTarget("group-1")
	if _, err := r.Start(context.Background(), "grp", target); err != nil {
		t.Fatalf("Start: %v", err)
	}
	t.Cleanup(func() { r.Stop(target) })

	waitFor(t, 3, func() int { return len(rec.commands()) }, "one publish per resolved device")

	cmds := rec.commands()
	if len(cmds) != 3 {
		t.Fatalf("expected 3 commands (one per device), got %d", len(cmds))
	}
	seen := map[device.DeviceID]bool{}
	for _, c := range cmds {
		seen[c.DeviceID] = true
		if c.Brightness == nil || *c.Brightness != 60 {
			t.Fatalf("cmd to %s brightness = %v, want 60", c.DeviceID, c.Brightness)
		}
	}
	for _, want := range []device.DeviceID{"dev-a", "dev-b", "dev-c"} {
		if !seen[want] {
			t.Fatalf("missing command for %s", want)
		}
	}
}

func TestRunnerTimeline_MidLoopMembershipChange(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "loop",
		Kind:       KindTimeline,
		Loop:       true,
		DurationMs: 15,
		Tracks: []Track{{
			Clips: []Clip{brightnessClip(0, 0, 80)},
		}},
	})

	tr := newProgrammableTargets()
	tr.set("group-1", []device.DeviceID{"dev-a"})

	reader := newFakeReader()
	for _, id := range []device.DeviceID{"dev-a", "dev-b"} {
		reader.addDevice(device.Device{
			ID: id,
			Capabilities: []device.Capability{
				{Name: device.CapOnOff, Access: 7},
				{Name: device.CapBrightness, Access: 7},
			},
		})
	}

	r := makeRunnerWithTargets(rec, st, reader, tr, nil)

	target := groupTarget("group-1")
	if _, err := r.Start(context.Background(), "loop", target); err != nil {
		t.Fatalf("Start: %v", err)
	}
	t.Cleanup(func() { r.Stop(target) })

	waitFor(t, 1, func() int { return countCommandsTo(rec, "dev-a") }, "first iteration commands dev-a")

	tr.set("group-1", []device.DeviceID{"dev-a", "dev-b"})

	waitFor(t, 1, func() int { return countCommandsTo(rec, "dev-b") }, "next iteration includes dev-b")

	preRemoveB := countCommandsTo(rec, "dev-b")

	tr.set("group-1", []device.DeviceID{"dev-b"})

	waitFor(t, preRemoveB+1, func() int { return countCommandsTo(rec, "dev-b") }, "dev-b still commanded after remove dev-a")

	preRemoveA := countCommandsTo(rec, "dev-a")
	time.Sleep(120 * time.Millisecond)
	postRemoveA := countCommandsTo(rec, "dev-a")
	if postRemoveA-preRemoveA > 1 {
		t.Fatalf("dev-a still commanded after removal: pre=%d post=%d", preRemoveA, postRemoveA)
	}
}

func countCommandsTo(rec *recorder, did device.DeviceID) int {
	n := 0
	for _, c := range rec.commands() {
		if c.DeviceID == did {
			n++
		}
	}
	return n
}

func TestRunnerDrift_SelfPublishDoesNotStop(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "loop",
		Kind:       KindTimeline,
		Loop:       true,
		DurationMs: 15,
		Tracks: []Track{{
			Clips: []Clip{
				brightnessClip(0, 0, 40),
				brightnessClip(10, 0, 120),
			},
		}},
	})
	r := makeRunner(rec, st, newFakeReader(), nil)
	startDriftLoop(t, r)

	target := deviceTarget("dev-1")
	if _, err := r.Start(context.Background(), "loop", target); err != nil {
		t.Fatalf("Start: %v", err)
	}
	t.Cleanup(func() { r.Stop(target) })

	waitFor(t, 4, func() int { return len(rec.commands()) }, "loop is publishing self-commands")

	r.mu.Lock()
	_, stillActive := r.active[keyFor(target)]
	r.mu.Unlock()
	if !stillActive {
		t.Fatal("run stopped on its own self-publishes — drift comparator bug")
	}
}

func TestRunnerDrift_ForeignCommandStopsDeviceRun(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "loop",
		Kind:       KindTimeline,
		Loop:       true,
		DurationMs: 20,
		Tracks: []Track{{
			Clips: []Clip{brightnessClip(0, 0, 60)},
		}},
	})
	r := makeRunner(rec, st, newFakeReader(), nil)
	startDriftLoop(t, r)

	target := deviceTarget("dev-1")
	if _, err := r.Start(context.Background(), "loop", target); err != nil {
		t.Fatalf("Start: %v", err)
	}
	waitFor(t, 1, func() int { return len(rec.commands()) }, "first self-command")

	rec.Publish(eventbus.Event{
		Type:      eventbus.EventCommandRequested,
		DeviceID:  "dev-1",
		Timestamp: time.Now(),
		Payload: device.Command{
			DeviceID: "dev-1",
			On:       boolPtr(false),
			Origin:   device.OriginUser(),
		},
	})

	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		r.mu.Lock()
		_, active := r.active[keyFor(target)]
		r.mu.Unlock()
		if !active {
			return
		}
		time.Sleep(2 * time.Millisecond)
	}
	t.Fatal("run did not stop after foreign command within 2s")
}

func TestRunnerDrift_ForeignCommandStopsGroupRun(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "loop",
		Kind:       KindTimeline,
		Loop:       true,
		DurationMs: 20,
		Tracks: []Track{{
			Clips: []Clip{brightnessClip(0, 0, 60)},
		}},
	})

	tr := newProgrammableTargets()
	tr.set("group-1", []device.DeviceID{"dev-a", "dev-b"})

	reader := newFakeReader()
	for _, id := range []device.DeviceID{"dev-a", "dev-b"} {
		reader.addDevice(device.Device{
			ID: id,
			Capabilities: []device.Capability{
				{Name: device.CapOnOff, Access: 7},
				{Name: device.CapBrightness, Access: 7},
			},
		})
	}
	r := makeRunnerWithTargets(rec, st, reader, tr, nil)
	startDriftLoop(t, r)

	target := groupTarget("group-1")
	if _, err := r.Start(context.Background(), "loop", target); err != nil {
		t.Fatalf("Start: %v", err)
	}
	waitFor(t, 2, func() int { return len(rec.commands()) }, "group fan-out commands")

	rec.Publish(eventbus.Event{
		Type:      eventbus.EventCommandRequested,
		DeviceID:  "dev-b",
		Timestamp: time.Now(),
		Payload: device.Command{
			DeviceID: "dev-b",
			On:       boolPtr(false),
			Origin:   device.OriginUser(),
		},
	})

	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		r.mu.Lock()
		_, active := r.active[keyFor(target)]
		r.mu.Unlock()
		if !active {
			return
		}
		time.Sleep(2 * time.Millisecond)
	}
	t.Fatal("group run did not stop after foreign command on a member within 2s")
}

func TestRunnerDrift_ForeignCommandStopsNativeAndPublishesTerminator(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "fireplace",
		Kind:       KindNative,
		NativeName: "fireplace",
	})
	reader := newFakeReader()
	reader.addDevice(device.Device{
		ID: "dev-1",
		Capabilities: []device.Capability{
			{Name: device.CapEffect, Values: []string{"fireplace", "stop_hue_effect"}},
		},
	})
	r := makeRunner(rec, st, reader, fakeStopper{terminator: "stop_hue_effect"})
	startDriftLoop(t, r)

	target := deviceTarget("dev-1")
	if _, err := r.Start(context.Background(), "fireplace", target); err != nil {
		t.Fatalf("Start native: %v", err)
	}
	waitFor(t, 1, func() int { return len(rec.nativeRequests()) }, "native start request")

	rec.Publish(eventbus.Event{
		Type:      eventbus.EventCommandRequested,
		DeviceID:  "dev-1",
		Timestamp: time.Now(),
		Payload: device.Command{
			DeviceID: "dev-1",
			On:       boolPtr(false),
			Origin:   device.OriginUser(),
		},
	})

	waitFor(t, 2, func() int { return len(rec.nativeRequests()) }, "terminator native request")

	reqs := rec.nativeRequests()
	last := reqs[len(reqs)-1]
	if last.Name != "stop_hue_effect" {
		t.Fatalf("last native request name = %q, want stop_hue_effect", last.Name)
	}
}

func TestRunnerTimeline_CapabilityFanOut(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "rgb",
		Kind:       KindTimeline,
		DurationMs: 0,
		Tracks: []Track{{
			Clips: []Clip{colorClip(0, 0, 255, 100, 50)},
		}},
	})

	tr := newProgrammableTargets()
	tr.set("group-1", []device.DeviceID{"rgb-bulb", "ct-bulb", "plug"})

	reader := newFakeReader()
	reader.addDevice(device.Device{
		ID: "rgb-bulb",
		Capabilities: []device.Capability{
			{Name: device.CapOnOff, Access: 7},
			{Name: device.CapBrightness, Access: 7},
			{Name: device.CapColor, Access: 7},
		},
	})
	reader.addDevice(device.Device{
		ID: "ct-bulb",
		Capabilities: []device.Capability{
			{Name: device.CapOnOff, Access: 7},
			{Name: device.CapBrightness, Access: 7},
			{Name: device.CapColorTemp, Access: 7},
		},
	})
	reader.addDevice(device.Device{
		ID: "plug",
		Capabilities: []device.Capability{
			{Name: device.CapOnOff, Access: 7},
		},
	})

	r := makeRunnerWithTargets(rec, st, reader, tr, nil)

	target := groupTarget("group-1")
	if _, err := r.Start(context.Background(), "rgb", target); err != nil {
		t.Fatalf("Start: %v", err)
	}
	t.Cleanup(func() { r.Stop(target) })

	waitFor(t, 1, func() int { return len(rec.commands()) }, "at least one command published")
	time.Sleep(40 * time.Millisecond)

	cmds := rec.commands()
	var rgb, ct, plug *device.Command
	for i := range cmds {
		switch cmds[i].DeviceID {
		case "rgb-bulb":
			rgb = &cmds[i]
		case "ct-bulb":
			ct = &cmds[i]
		case "plug":
			plug = &cmds[i]
		}
	}
	if rgb == nil {
		t.Fatal("no command for rgb-bulb")
	}
	if rgb.Color == nil || rgb.Color.R != 255 || rgb.Color.G != 100 || rgb.Color.B != 50 {
		t.Fatalf("rgb-bulb color = %+v, want {255,100,50}", rgb.Color)
	}
	if ct != nil && ct.Color != nil {
		t.Fatalf("ct-bulb received color field, should have been filtered: %+v", ct)
	}
	if plug != nil && plug.Color != nil {
		t.Fatalf("plug received color field, should have been filtered: %+v", plug)
	}
}

func TestRunnerTimeline_NativeEffectClipPublishesNativeRequest(t *testing.T) {
	rec := newRecorder()
	st := newFakeStore()
	st.put(Effect{
		ID:         "mixed",
		Kind:       KindTimeline,
		DurationMs: 0,
		Tracks: []Track{{
			Clips: []Clip{{
				StartMs:         0,
				TransitionMinMs: 0,
				TransitionMaxMs: 0,
				Kind:            ClipNativeEffect,
				Config:          ClipConfig{NativeEffect: &NativeEffectClipConfig{Name: "candle"}},
			}},
		}},
	})
	r := makeRunner(rec, st, newFakeReader(), nil)

	runID, err := r.Start(context.Background(), "mixed", deviceTarget("dev-1"))
	if err != nil {
		t.Fatalf("Start: %v", err)
	}
	t.Cleanup(func() { r.Stop(deviceTarget("dev-1")) })

	waitFor(t, 1, func() int { return len(rec.nativeRequests()) }, "native_effect clip request")

	reqs := rec.nativeRequests()
	if reqs[0].Name != "candle" {
		t.Errorf("name = %q, want candle", reqs[0].Name)
	}
	if reqs[0].DeviceID != "dev-1" {
		t.Errorf("deviceID = %q, want dev-1", reqs[0].DeviceID)
	}
	if reqs[0].Origin.Kind != device.OriginKindEffect || reqs[0].Origin.ID != runID {
		t.Errorf("origin = %+v, want effect/%s", reqs[0].Origin, runID)
	}
}

func boolPtr(b bool) *bool { return &b }
