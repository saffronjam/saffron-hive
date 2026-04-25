package effect

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
)

var logger = logging.Named("effect")

// EffectStore is the narrow store contract the runner consumes. It returns
// the domain effect.Effect with parsed StepConfig payloads so the runner does
// not depend on internal/store types — the store package already imports
// internal/effect for Kind / StepKind, so the reverse import would cycle.
// *store.DB satisfies this interface implicitly.
type EffectStore interface {
	LoadEffect(ctx context.Context, id string) (Effect, error)
}

// NativeEffectStopper looks up the terminator name a device understands when
// it is told to stop a running native effect. The runner holds this as a
// separate interface so it does not import the zigbee adapter package.
// The zigbee adapter's TerminatorFor function satisfies it once wrapped in a
// trivial value-receiver type at wiring time.
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

// targetKey is the registry key used to deduplicate active runs by target.
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

	// members is the device set the run is currently driving. It is refreshed
	// at each iteration boundary by the timeline worker (and once at start by
	// the native worker) so the drift comparator has an up-to-date view of
	// which devices a foreign command must touch to stop the run. Guarded by
	// the Runner's mu.
	members map[device.DeviceID]struct{}
}

// Runner walks timeline effects step by step or hands native effects to the
// adapter. It owns the in-memory registry of active runs keyed by target;
// starting a new run on a target preempts any run already there.
//
// A drift goroutine subscribes to EventCommandRequested and stops any run
// whose currently-resolved device set sees a command whose origin is not the
// run's own. EventCommandRequested is the signal because its origin is set
// authoritatively at the publisher (this runner, scenes, automations, the
// GraphQL setDeviceState mutation), making the comparator deterministic for
// every command flowing through the bus. Out-of-bus events (zigbee2mqtt UI,
// physical Zigbee remotes) bypass the bus and do not stop a run; that is an
// accepted v1 simplification.
type Runner struct {
	bus     eventbus.EventBus
	targets device.TargetResolver
	reader  device.StateReader
	store   EffectStore
	term    NativeEffectStopper

	mu     sync.Mutex
	active map[targetKey]*activeRun

	driftCh <-chan eventbus.Event
}

// NewRunner constructs a Runner and immediately subscribes its drift goroutine
// to the bus so any EventCommandRequested published after construction is
// buffered for Run to consume.
func NewRunner(bus eventbus.EventBus, targets device.TargetResolver, reader device.StateReader, st EffectStore, term NativeEffectStopper) *Runner {
	r := &Runner{
		bus:     bus,
		targets: targets,
		reader:  reader,
		store:   st,
		term:    term,
		active:  make(map[targetKey]*activeRun),
	}
	r.driftCh = bus.Subscribe(eventbus.EventCommandRequested)
	return r
}

// Run blocks until ctx is done, consuming EventCommandRequested events and
// stopping any active run whose device set matches a foreign command. The
// wiring layer is responsible for invoking Run; without it, drift detection
// is inert (commands still publish, runs still complete, but foreign drift
// will not preempt).
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
	}

	go r.run(runCtx, run, eff)

	return runID, nil
}

// Stop cancels any active run for the given target. Returns true if a run
// was active. For a native run, the appropriate terminator is published per
// device in the resolved set before this returns so the device's animation
// stops promptly.
func (r *Runner) Stop(target Target) bool {
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
	return true
}

// preempt cancels run's worker context, blocks until the worker has
// returned, and (for native runs) publishes the device's terminator. The
// blocking guarantees that no further publishes from this run can land
// after preempt returns, which is what callers of Start (preempting an
// existing run) and Stop both rely on.
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

// run dispatches to the timeline or native worker. Cleanup unregisters the
// run and signals done so any waiter (preempt) can proceed.
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

// unregister removes run from the active registry only if it is still the
// owner of its target slot. A preempting Start call has already swapped the
// slot to the new run; clearing it here would race with the new run.
func (r *Runner) unregister(run *activeRun) {
	key := keyFor(run.target)
	r.mu.Lock()
	defer r.mu.Unlock()
	if cur, ok := r.active[key]; ok && cur == run {
		delete(r.active, key)
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

	// Native runs have no per-step work after the initial publish — the
	// device owns the animation. The worker parks on ctx.Done() so the run
	// stays registered until Stop or a preempting Start cancels it; that's
	// what triggers the terminator publish in preempt().
	<-ctx.Done()
}

func (r *Runner) runTimeline(ctx context.Context, run *activeRun, eff Effect) {
	for {
		if ctx.Err() != nil {
			return
		}

		devices := r.resolveMembers(ctx, run)

		for i := 0; i < len(eff.Steps); {
			if ctx.Err() != nil {
				return
			}
			step := eff.Steps[i]
			if step.Kind == StepWait {
				d := waitDuration(step.Config)
				if d <= 0 {
					i++
					continue
				}
				select {
				case <-ctx.Done():
					return
				case <-time.After(d):
				}
				i++
				continue
			}

			end := i
			tmpl := device.Command{}
			for end < len(eff.Steps) && eff.Steps[end].Kind != StepWait {
				applyStepToCommand(&tmpl, eff.Steps[end])
				end++
			}

			origin := device.OriginEffect(run.runID)
			tmpl.Origin = origin

			for k := i; k < end; k++ {
				r.publishStep(run, eff.Steps[k].Index, true)
			}
			for _, did := range devices {
				cmd := r.commandForDevice(tmpl, did)
				if cmd == nil {
					logger.Debug("effect command filtered out: no supported fields",
						"run_id", run.runID, "effect_id", run.effectID, "device_id", did)
					continue
				}
				r.publishCommand(ctx, run, *cmd)
			}
			for k := i; k < end; k++ {
				r.publishStep(run, eff.Steps[k].Index, false)
			}

			i = end
		}

		if !eff.Loop {
			return
		}
	}
}

// resolveMembers re-resolves the run's target to a device set, updates the
// activeRun's mu-protected member view (so the drift goroutine sees the new
// set), and returns the resolved slice. A device target resolves to itself
// without consulting the resolver.
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
// with capability-aware field filtering applied so a step's RGB payload does
// not reach a CT-only bulb in a mixed group. Returns nil when filtering drops
// every commandable field for the device.
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

// handleDrift inspects an EventCommandRequested and stops any active run
// whose currently-resolved device set contains the command's device when the
// origin does not match the run's own OriginEffect(runID).
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
		if r.Stop(t) {
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

func (r *Runner) publishStep(run *activeRun, stepIndex int, active bool) {
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
			StepIndex: stepIndex,
			Active:    active,
		},
	})
}

func waitDuration(cfg StepConfig) time.Duration {
	if cfg.Wait == nil {
		return 0
	}
	return time.Duration(cfg.Wait.DurationMS) * time.Millisecond
}

// applyStepToCommand merges step's typed config into cmd. Coalescing is the
// caller's responsibility; this only fills the appropriate Command fields.
// A later step's value overwrites an earlier step's value for the same
// field, which is the documented coalesce semantic.
func applyStepToCommand(cmd *device.Command, step Step) {
	switch step.Kind {
	case StepSetOnOff:
		if step.Config.SetOnOff == nil {
			return
		}
		v := step.Config.SetOnOff.Value
		cmd.On = &v
		applyTransition(cmd, step.Config.SetOnOff.TransitionMS)
	case StepSetBrightness:
		if step.Config.SetBrightness == nil {
			return
		}
		v := step.Config.SetBrightness.Value
		cmd.Brightness = &v
		applyTransition(cmd, step.Config.SetBrightness.TransitionMS)
	case StepSetColorRGB:
		if step.Config.SetColorRGB == nil {
			return
		}
		c := step.Config.SetColorRGB
		cmd.Color = &device.Color{R: c.R, G: c.G, B: c.B}
		applyTransition(cmd, c.TransitionMS)
	case StepSetColorTemp:
		if step.Config.SetColorTemp == nil {
			return
		}
		v := step.Config.SetColorTemp.Mireds
		cmd.ColorTemp = &v
		applyTransition(cmd, step.Config.SetColorTemp.TransitionMS)
	}
}

// applyTransition stamps the command's transition only when the step
// supplies a positive value. Coalesced steps with conflicting transitions
// keep the later step's value, matching the field-overwrite rule above.
func applyTransition(cmd *device.Command, transitionMS int) {
	if transitionMS <= 0 {
		return
	}
	v := float64(transitionMS) / 1000.0
	cmd.Transition = &v
}
