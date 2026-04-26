package effect

import (
	"context"
	"errors"
	"fmt"
	"math/rand/v2"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
)

// Persistence and reboot recovery: Loop timeline runs are persisted to
// active_effects with Volatile=false so they survive a restart; Hydrate
// re-launches them from t=0. There is no mid-run resume — loops are intended
// to be ambient and idempotent. Native runs and non-loop timeline runs are
// persisted with Volatile=true and wiped at the next process startup before
// Hydrate runs.

var logger = logging.Named("effect")

// EffectStore is the narrow store contract the runner consumes. *store.DB
// satisfies this interface implicitly.
type EffectStore interface {
	LoadEffect(ctx context.Context, id string) (Effect, error)
	UpsertActiveEffect(ctx context.Context, params UpsertActiveEffectParams) error
	DeleteActiveEffect(ctx context.Context, targetType, targetID string) error
	ListActiveEffects(ctx context.Context) ([]ActiveEffectRecord, error)
	DeleteVolatileActiveEffects(ctx context.Context) (int64, error)
}

// NativeEffectStopper looks up the terminator name a device understands when
// it is told to stop a running native effect. The runner holds this as a
// separate interface so it does not import the zigbee adapter package.
type NativeEffectStopper interface {
	TerminatorFor(dev device.Device) string
}

// Target identifies what an effect runs against. Type is one of "device",
// "group", or "room"; ID is the corresponding entity identifier. Group and
// room targets are resolved to a device set at each iteration boundary so
// mid-run membership changes are observed by the next iteration.
type Target struct {
	Type device.TargetType
	ID   string
}

type targetKey struct {
	Type device.TargetType
	ID   string
}

func keyFor(t Target) targetKey {
	return targetKey{Type: t.Type, ID: t.ID}
}

type activeRun struct {
	runID    string
	effectID string
	kind     Kind
	target   Target
	cancel   context.CancelFunc
	done     chan struct{}

	// members is the device set the run is currently driving. Refreshed at
	// each iteration boundary by the timeline worker (and once at start by the
	// native worker) so the drift comparator has an up-to-date view of which
	// devices a foreign command must touch to stop the run. Guarded by mu.
	members map[device.DeviceID]struct{}
}

// Runner walks timeline effects across multi-track event lists or hands native
// effects to the adapter. It owns the in-memory registry of active runs keyed
// by target; starting a new run on a target preempts any run already there.
//
// A drift goroutine subscribes to EventCommandRequested and stops any run
// whose currently-resolved device set sees a command whose origin is not the
// run's own.
type Runner struct {
	bus     eventbus.EventBus
	targets device.TargetResolver
	reader  device.StateReader
	store   EffectStore
	term    NativeEffectStopper

	mu     sync.Mutex
	active map[targetKey]*activeRun

	driftCh <-chan eventbus.Event

	// rand seeds the per-clip random transition sampler. Tests can swap it for
	// a seeded source via NewRunnerWithRand for reproducibility.
	rand transitionSampler
}

// transitionSampler abstracts the random source used to pick a per-clip
// transition. Production runners use a global crypto-seeded rand; tests can
// inject a deterministic implementation.
type transitionSampler interface {
	IntN(n int) int
}

// defaultSampler delegates to math/rand/v2's package-level functions, which
// math/rand/v2 seeds at program start.
type defaultSampler struct{}

func (defaultSampler) IntN(n int) int { return rand.IntN(n) }

// NewRunner constructs a Runner and immediately subscribes its drift goroutine
// to the bus.
func NewRunner(bus eventbus.EventBus, targets device.TargetResolver, reader device.StateReader, st EffectStore, term NativeEffectStopper) *Runner {
	return NewRunnerWithRand(bus, targets, reader, st, term, defaultSampler{})
}

// NewRunnerWithRand is NewRunner with an injected transitionSampler. Tests
// pass a seeded implementation to make per-clip transition picks reproducible.
func NewRunnerWithRand(bus eventbus.EventBus, targets device.TargetResolver, reader device.StateReader, st EffectStore, term NativeEffectStopper, sampler transitionSampler) *Runner {
	r := &Runner{
		bus:     bus,
		targets: targets,
		reader:  reader,
		store:   st,
		term:    term,
		active:  make(map[targetKey]*activeRun),
		rand:    sampler,
	}
	r.driftCh = bus.Subscribe(eventbus.EventCommandRequested)
	return r
}

// Run blocks until ctx is done, consuming EventCommandRequested events and
// stopping any active run whose device set matches a foreign command.
func (r *Runner) Run(ctx context.Context) {
	defer r.bus.Unsubscribe(r.driftCh)
	for {
		select {
		case <-ctx.Done():
			return
		case evt, ok := <-r.driftCh:
			if !ok {
				return
			}
			r.handleDrift(evt)
		}
	}
}

// Start launches an effect against a target. Group and room targets are
// resolved per-iteration; device targets resolve to themselves. Start preempts
// any run currently registered for the same target, returning the new run's
// id. For a preempted native run, the appropriate terminator is published per
// device in the preempted run's resolved set before the new run begins.
func (r *Runner) Start(ctx context.Context, effectID string, target Target) (string, error) {
	if target.ID == "" {
		return "", errors.New("effect runner: target id is empty")
	}

	eff, err := r.store.LoadEffect(ctx, effectID)
	if err != nil {
		return "", fmt.Errorf("effect runner: load effect %q: %w", effectID, err)
	}

	runID := uuid.New().String()

	runCtx, cancel := context.WithCancel(context.Background())
	run := &activeRun{
		runID:    runID,
		effectID: eff.ID,
		kind:     eff.Kind,
		target:   target,
		cancel:   cancel,
		done:     make(chan struct{}),
		members:  make(map[device.DeviceID]struct{}),
	}

	key := keyFor(target)

	r.mu.Lock()
	old := r.active[key]
	r.active[key] = run
	r.mu.Unlock()

	if old != nil {
		r.preempt(old)
		r.publishEnded(old, eventbus.EffectEndReasonPreempted)
	}

	go r.run(runCtx, run, eff)

	volatile := !(eff.Loop && eff.Kind == KindTimeline)
	if err := r.store.UpsertActiveEffect(ctx, UpsertActiveEffectParams{
		ID:         runID,
		EffectID:   eff.ID,
		TargetType: string(target.Type),
		TargetID:   target.ID,
		StartedAt:  time.Now(),
		Volatile:   volatile,
	}); err != nil {
		logger.Error("persist active effect failed",
			"run_id", runID,
			"effect_id", eff.ID,
			"target_type", target.Type,
			"target_id", target.ID,
			"error", err)
	}

	return runID, nil
}

// StartNative launches an ad-hoc native effect by name against a target with
// no Effect row backing it.
func (r *Runner) StartNative(ctx context.Context, nativeName string, target Target) (string, error) {
	if target.ID == "" {
		return "", errors.New("effect runner: target id is empty")
	}
	if nativeName == "" {
		return "", errors.New("effect runner: native name is empty")
	}

	eff := Effect{
		Kind:       KindNative,
		NativeName: nativeName,
	}

	runID := uuid.New().String()

	runCtx, cancel := context.WithCancel(context.Background())
	run := &activeRun{
		runID:    runID,
		effectID: "",
		kind:     eff.Kind,
		target:   target,
		cancel:   cancel,
		done:     make(chan struct{}),
		members:  make(map[device.DeviceID]struct{}),
	}

	key := keyFor(target)

	r.mu.Lock()
	old := r.active[key]
	r.active[key] = run
	r.mu.Unlock()

	if old != nil {
		r.preempt(old)
		r.publishEnded(old, eventbus.EffectEndReasonPreempted)
	}

	go r.run(runCtx, run, eff)

	_ = ctx
	return runID, nil
}

// Stop cancels any active run for the given target. Returns true if a run
// was active. For a native run, the appropriate terminator is published per
// device in the resolved set before this returns.
func (r *Runner) Stop(target Target) bool {
	return r.stopWithReason(target, eventbus.EffectEndReasonStopped)
}

func (r *Runner) stopWithReason(target Target, reason eventbus.EffectEndReason) bool {
	key := keyFor(target)

	r.mu.Lock()
	run, ok := r.active[key]
	if ok {
		delete(r.active, key)
	}
	r.mu.Unlock()

	if !ok {
		return false
	}
	r.preempt(run)
	r.deleteActive(run.target)
	r.publishEnded(run, reason)
	return true
}

// Hydrate reconciles persisted active_effects rows after a restart. Volatile
// rows from any previous lifetime are wiped first; surviving rows are
// re-launched from t=0.
func (r *Runner) Hydrate(ctx context.Context) error {
	if _, err := r.store.DeleteVolatileActiveEffects(ctx); err != nil {
		return fmt.Errorf("effect runner: purge volatile active effects: %w", err)
	}

	rows, err := r.store.ListActiveEffects(ctx)
	if err != nil {
		return fmt.Errorf("effect runner: list active effects: %w", err)
	}

	for _, row := range rows {
		target := Target{Type: device.TargetType(row.TargetType), ID: row.TargetID}
		if _, err := r.Start(ctx, row.EffectID, target); err != nil {
			logger.Error("hydrate active effect failed",
				"row_id", row.ID,
				"effect_id", row.EffectID,
				"target_type", row.TargetType,
				"target_id", row.TargetID,
				"error", err)
		}
	}
	return nil
}

func (r *Runner) deleteActive(target Target) {
	if err := r.store.DeleteActiveEffect(context.Background(), string(target.Type), target.ID); err != nil {
		logger.Error("delete active effect failed",
			"target_type", target.Type,
			"target_id", target.ID,
			"error", err)
	}
}

func (r *Runner) preempt(run *activeRun) {
	run.cancel()
	<-run.done

	if run.kind != KindNative {
		return
	}
	if r.term == nil {
		logger.Warn("native preempt skipped: no terminator resolver configured", "run_id", run.runID)
		return
	}

	r.mu.Lock()
	members := make([]device.DeviceID, 0, len(run.members))
	for did := range run.members {
		members = append(members, did)
	}
	r.mu.Unlock()

	for _, did := range members {
		dev, ok := r.reader.GetDevice(did)
		if !ok {
			logger.Warn("native preempt skipped: device not found in state reader", "run_id", run.runID, "device_id", did)
			continue
		}
		terminator := r.term.TerminatorFor(dev)
		if terminator == "" {
			continue
		}
		device.RequestNativeEffect(r.bus, did, terminator, device.OriginEffect(run.runID))
	}
}

func (r *Runner) run(ctx context.Context, run *activeRun, eff Effect) {
	defer close(run.done)
	defer r.unregister(run)

	switch eff.Kind {
	case KindNative:
		r.runNative(ctx, run, eff)
	case KindTimeline:
		r.runTimeline(ctx, run, eff)
	default:
		logger.Error("unknown effect kind", "run_id", run.runID, "effect_id", eff.ID, "kind", eff.Kind)
	}
}

func (r *Runner) unregister(run *activeRun) {
	key := keyFor(run.target)
	r.mu.Lock()
	cur, ok := r.active[key]
	stillOwner := ok && cur == run
	if stillOwner {
		delete(r.active, key)
	}
	r.mu.Unlock()
	if stillOwner {
		r.deleteActive(run.target)
		r.publishEnded(run, eventbus.EffectEndReasonCompleted)
	}
}

func (r *Runner) runNative(ctx context.Context, run *activeRun, eff Effect) {
	if eff.NativeName == "" {
		logger.Error("native effect missing native_name", "run_id", run.runID, "effect_id", eff.ID)
		return
	}
	if ctx.Err() != nil {
		return
	}

	devices := r.resolveMembers(ctx, run)
	if len(devices) == 0 {
		logger.Debug("native effect skipped: target resolved to empty device set",
			"run_id", run.runID, "effect_id", eff.ID, "target_type", run.target.Type, "target_id", run.target.ID)
		<-ctx.Done()
		return
	}

	r.publishStep(run, 0, true)
	for _, did := range devices {
		device.RequestNativeEffect(r.bus, did, eff.NativeName, device.OriginEffect(run.runID))
	}
	r.publishStep(run, 0, false)

	<-ctx.Done()
}

// scheduledEvent is one clip flattened into the per-iteration ordered event
// list. Stable ordering across iterations is by (StartMs, Ordinal).
type scheduledEvent struct {
	StartMs int
	Ordinal int
	Clip    Clip
}

func flattenEvents(eff Effect) []scheduledEvent {
	var events []scheduledEvent
	for _, t := range eff.Tracks {
		for _, c := range t.Clips {
			events = append(events, scheduledEvent{
				StartMs: c.StartMs,
				Clip:    c,
			})
		}
	}
	sort.SliceStable(events, func(i, j int) bool {
		return events[i].StartMs < events[j].StartMs
	})
	for i := range events {
		events[i].Ordinal = i
	}
	return events
}

func (r *Runner) runTimeline(ctx context.Context, run *activeRun, eff Effect) {
	events := flattenEvents(eff)

	for {
		if ctx.Err() != nil {
			return
		}

		devices := r.resolveMembers(ctx, run)
		iterStart := time.Now()

		for _, ev := range events {
			if ctx.Err() != nil {
				return
			}
			waitUntil := iterStart.Add(time.Duration(ev.StartMs) * time.Millisecond)
			delay := time.Until(waitUntil)
			if delay > 0 {
				select {
				case <-ctx.Done():
					return
				case <-time.After(delay):
				}
			}
			r.publishClip(ctx, run, devices, ev)
		}

		if !eff.Loop {
			return
		}

		nextIter := iterStart.Add(time.Duration(eff.DurationMs) * time.Millisecond)
		delay := time.Until(nextIter)
		if delay > 0 {
			select {
			case <-ctx.Done():
				return
			case <-time.After(delay):
			}
		}
	}
}

// publishClip dispatches one event to the bus. Native-effect clips publish a
// NativeEffectRequest per resolved device; all other clip kinds build a
// device.Command, sample a transition, and publish per resolved device after
// capability fan-out filtering.
func (r *Runner) publishClip(ctx context.Context, run *activeRun, devices []device.DeviceID, ev scheduledEvent) {
	if ctx.Err() != nil {
		return
	}
	r.publishStep(run, ev.Ordinal, true)
	defer r.publishStep(run, ev.Ordinal, false)

	if ev.Clip.Kind == ClipNativeEffect {
		if ev.Clip.Config.NativeEffect == nil || ev.Clip.Config.NativeEffect.Name == "" {
			logger.Warn("native_effect clip skipped: missing name",
				"run_id", run.runID, "effect_id", run.effectID, "clip_id", ev.Clip.ID)
			return
		}
		name := ev.Clip.Config.NativeEffect.Name
		origin := device.OriginEffect(run.runID)
		for _, did := range devices {
			device.RequestNativeEffect(r.bus, did, name, origin)
		}
		return
	}

	tmpl := device.Command{}
	applyClipToCommand(&tmpl, ev.Clip)
	transitionMs := r.sampleTransitionMs(ev.Clip)
	if transitionMs > 0 {
		v := float64(transitionMs) / 1000.0
		tmpl.Transition = &v
	}
	tmpl.Origin = device.OriginEffect(run.runID)

	for _, did := range devices {
		cmd := r.commandForDevice(tmpl, did)
		if cmd == nil {
			logger.Debug("effect command filtered out: no supported fields",
				"run_id", run.runID, "effect_id", run.effectID, "device_id", did)
			continue
		}
		r.publishCommand(ctx, run, *cmd)
	}
}

// sampleTransitionMs returns a transition duration uniformly chosen in
// [TransitionMinMs, TransitionMaxMs]. Equal bounds collapse to a deterministic
// value; a zero TransitionMaxMs yields zero (no transition).
func (r *Runner) sampleTransitionMs(c Clip) int {
	if c.TransitionMaxMs <= 0 {
		return 0
	}
	if c.TransitionMinMs >= c.TransitionMaxMs {
		return c.TransitionMinMs
	}
	span := c.TransitionMaxMs - c.TransitionMinMs + 1
	return c.TransitionMinMs + r.rand.IntN(span)
}

// resolveMembers re-resolves the run's target to a device set, updates the
// activeRun's mu-protected member view, and returns the resolved slice.
func (r *Runner) resolveMembers(ctx context.Context, run *activeRun) []device.DeviceID {
	var devices []device.DeviceID
	if run.target.Type == device.TargetDevice {
		devices = []device.DeviceID{device.DeviceID(run.target.ID)}
	} else {
		devices = r.targets.ResolveTargetDeviceIDs(ctx, run.target.Type, run.target.ID)
	}

	set := make(map[device.DeviceID]struct{}, len(devices))
	for _, did := range devices {
		set[did] = struct{}{}
	}
	r.mu.Lock()
	run.members = set
	r.mu.Unlock()

	return devices
}

// commandForDevice returns the command to publish for did derived from tmpl,
// with capability-aware field filtering applied. Returns nil when filtering
// drops every commandable field for the device.
func (r *Runner) commandForDevice(tmpl device.Command, did device.DeviceID) *device.Command {
	dev, ok := r.reader.GetDevice(did)
	if !ok {
		cmd := tmpl
		cmd.DeviceID = did
		return &cmd
	}

	fields := commandToFields(tmpl)
	filtered := device.FilterCommandFields(fields, dev)

	hasCommand := false
	for k := range filtered {
		if k == "transition" {
			continue
		}
		hasCommand = true
		break
	}
	if !hasCommand {
		return nil
	}

	cmd := fieldsToCommand(filtered)
	cmd.DeviceID = did
	cmd.Origin = tmpl.Origin
	return &cmd
}

func commandToFields(cmd device.Command) map[string]any {
	out := map[string]any{}
	if cmd.On != nil {
		out["on"] = *cmd.On
	}
	if cmd.Brightness != nil {
		out["brightness"] = *cmd.Brightness
	}
	if cmd.ColorTemp != nil {
		out["color_temp"] = *cmd.ColorTemp
	}
	if cmd.Color != nil {
		c := *cmd.Color
		out["color"] = &c
	}
	if cmd.Transition != nil {
		out["transition"] = *cmd.Transition
	}
	return out
}

func fieldsToCommand(fields map[string]any) device.Command {
	var cmd device.Command
	if v, ok := fields["on"]; ok {
		if b, ok := v.(bool); ok {
			cmd.On = &b
		}
	}
	if v, ok := fields["brightness"]; ok {
		if i, ok := v.(int); ok {
			cmd.Brightness = &i
		}
	}
	if v, ok := fields["color_temp"]; ok {
		if i, ok := v.(int); ok {
			cmd.ColorTemp = &i
		}
	}
	if v, ok := fields["color"]; ok {
		if c, ok := v.(*device.Color); ok && c != nil {
			cc := *c
			cmd.Color = &cc
		}
	}
	if v, ok := fields["transition"]; ok {
		if f, ok := v.(float64); ok {
			cmd.Transition = &f
		}
	}
	return cmd
}

func (r *Runner) handleDrift(evt eventbus.Event) {
	cmd, ok := evt.Payload.(device.Command)
	if !ok {
		return
	}
	if cmd.DeviceID == "" {
		return
	}

	r.mu.Lock()
	var toStop []Target
	for _, run := range r.active {
		if _, member := run.members[cmd.DeviceID]; !member {
			continue
		}
		if cmd.Origin.Kind == device.OriginKindEffect && cmd.Origin.ID == run.runID {
			continue
		}
		toStop = append(toStop, run.target)
	}
	r.mu.Unlock()

	for _, t := range toStop {
		if r.stopWithReason(t, eventbus.EffectEndReasonDrift) {
			logger.Info("effect run stopped by foreign drift",
				"target_type", t.Type,
				"target_id", t.ID,
				"foreign_origin_kind", cmd.Origin.Kind,
				"foreign_origin_id", cmd.Origin.ID,
				"device_id", cmd.DeviceID)
		}
	}
}

func (r *Runner) publishCommand(ctx context.Context, run *activeRun, cmd device.Command) {
	if ctx.Err() != nil {
		return
	}
	r.bus.Publish(eventbus.Event{
		Type:      eventbus.EventCommandRequested,
		DeviceID:  string(cmd.DeviceID),
		Timestamp: time.Now(),
		Payload:   cmd,
	})
	logger.Debug("effect command published",
		"run_id", run.runID,
		"effect_id", run.effectID,
		"device_id", cmd.DeviceID)
}

func (r *Runner) publishEnded(run *activeRun, reason eventbus.EffectEndReason) {
	deviceID := ""
	if run.target.Type == device.TargetDevice {
		deviceID = run.target.ID
	}
	r.bus.Publish(eventbus.Event{
		Type:      eventbus.EventEffectEnded,
		DeviceID:  deviceID,
		Timestamp: time.Now(),
		Payload: eventbus.EffectEndedEvent{
			RunID:      run.runID,
			EffectID:   run.effectID,
			TargetType: string(run.target.Type),
			TargetID:   run.target.ID,
			Reason:     reason,
		},
	})
}

// publishStep emits an enter/exit pair around a clip's dispatch. The event's
// StepIndex field carries the clip's ordinal in the flat sorted-by-startMs
// event list — clients use it to highlight the active clip in the live view.
func (r *Runner) publishStep(run *activeRun, ordinal int, active bool) {
	deviceID := ""
	if run.target.Type == device.TargetDevice {
		deviceID = run.target.ID
	}
	r.bus.Publish(eventbus.Event{
		Type:      eventbus.EventEffectStepActivated,
		DeviceID:  deviceID,
		Timestamp: time.Now(),
		Payload: eventbus.EffectStepActivatedEvent{
			RunID:     run.runID,
			EffectID:  run.effectID,
			StepIndex: ordinal,
			Active:    active,
		},
	})
}

// applyClipToCommand merges clip's typed config into cmd. Last-writer-wins
// when multiple clips of the same iteration touch the same field; this
// matters only if a future change reintroduces coalescing — v2 publishes one
// command per clip event, so coalescing is a no-op today.
func applyClipToCommand(cmd *device.Command, c Clip) {
	switch c.Kind {
	case ClipSetOnOff:
		if c.Config.SetOnOff == nil {
			return
		}
		v := c.Config.SetOnOff.Value
		cmd.On = &v
	case ClipSetBrightness:
		if c.Config.SetBrightness == nil {
			return
		}
		v := c.Config.SetBrightness.Value
		cmd.Brightness = &v
	case ClipSetColorRGB:
		if c.Config.SetColorRGB == nil {
			return
		}
		cc := c.Config.SetColorRGB
		cmd.Color = &device.Color{R: cc.R, G: cc.G, B: cc.B}
	case ClipSetColorTemp:
		if c.Config.SetColorTemp == nil {
			return
		}
		v := c.Config.SetColorTemp.Mireds
		cmd.ColorTemp = &v
	}
}
