package automation

import (
	"context"
	"encoding/json"
	"fmt"
	"sync/atomic"
	"time"

	"github.com/saffronjam/saffron-hive/internal/alarms"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/effect"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/scene"
	"github.com/saffronjam/saffron-hive/internal/store"
)

const (
	ActionSetDeviceState = "set_device_state"
	ActionActivateScene  = "activate_scene"
	ActionRaiseAlarm     = "raise_alarm"
	ActionClearAlarm     = "clear_alarm"
	ActionRunEffect      = "run_effect"
)

// AlarmRaiser is the narrow surface the action executor needs to raise and
// clear alarms. alarms.Service satisfies it.
type AlarmRaiser interface {
	Raise(ctx context.Context, p alarms.RaiseParams) (alarms.Alarm, error)
	DeleteByAlarmID(ctx context.Context, alarmID string) (bool, error)
}

// EffectRunner is the narrow surface the automation action executor needs to
// start and stop effect runs. *effect.Runner satisfies it implicitly.
type EffectRunner interface {
	Start(ctx context.Context, effectID string, target effect.Target) (string, error)
	StartNative(ctx context.Context, nativeName string, target effect.Target) (string, error)
	Stop(target effect.Target) bool
}

// ActionExecutor resolves automation actions into event bus commands (or, for
// alarm actions, into alarm service calls).
type ActionExecutor struct {
	bus      eventbus.Publisher
	reader   device.StateReader
	store    automationStore
	resolver device.TargetResolver
	alarms   AlarmRaiser
	runner   EffectRunner

	// baseCtx scopes every side-effect initiated by an action. Set by
	// SetBaseContext at engine startup so shutdown cancels in-flight
	// resolver lookups, scene expansions, and alarm service calls.
	baseCtx context.Context

	// stateMatchSkips counts how many commands were suppressed because the
	// device already matched the desired state (loop-prevention mechanism
	// #1). Exposed to operators via engine.Stats().
	stateMatchSkips atomic.Int64
}

// NewActionExecutor creates an ActionExecutor. runner may be nil for tests
// that do not exercise run_effect actions or scene-payload effect dispatch.
func NewActionExecutor(bus eventbus.Publisher, reader device.StateReader, s automationStore, resolver device.TargetResolver, alarmSvc AlarmRaiser, runner EffectRunner) *ActionExecutor {
	return &ActionExecutor{
		bus:      bus,
		reader:   reader,
		store:    s,
		resolver: resolver,
		alarms:   alarmSvc,
		runner:   runner,
		baseCtx:  context.Background(),
	}
}

// SetBaseContext attaches a context whose cancellation propagates into every
// downstream lookup and service call the executor initiates.
func (a *ActionExecutor) SetBaseContext(ctx context.Context) {
	a.baseCtx = ctx
}

// ExecuteGraphAction processes a graph-based action config. For
// set_device_state, it compares desired state with current state and skips
// no-ops. For activate_scene, it expands the scene into individual commands.
func (a *ActionExecutor) ExecuteGraphAction(cfg ActionConfig) {
	switch cfg.ActionType {
	case ActionSetDeviceState:
		if cfg.TargetID == "" {
			return
		}
		deviceID := device.DeviceID(cfg.TargetID)

		var desired map[string]any
		if err := json.Unmarshal([]byte(cfg.Payload), &desired); err != nil {
			logger.Error("invalid action payload", "device_id", deviceID, "error", err)
			return
		}

		// Best-effort per-capability filter: group/room fan-out delivers the
		// same payload to each member. A plug must not receive a stray
		// "brightness" field. Unknown devices pass through unchanged.
		if dev, ok := a.reader.GetDevice(deviceID); ok {
			desired = device.FilterCommandFields(desired, dev)
		}
		if len(desired) == 0 {
			return
		}

		if a.stateMatches(deviceID, desired) {
			a.stateMatchSkips.Add(1)
			logger.Debug("action skipped: device already matches desired state",
				"device_id", deviceID,
				"automation_id", cfg.AutomationID)
			return
		}

		cmd := buildCommand(deviceID, desired)
		cmd.Origin = device.OriginAutomation(cfg.AutomationID)
		a.bus.Publish(eventbus.Event{
			Type:      eventbus.EventCommandRequested,
			DeviceID:  string(deviceID),
			Timestamp: time.Now(),
			Payload:   cmd,
		})
	case ActionActivateScene:
		a.executeActivateScene(cfg.Payload)
	case ActionRaiseAlarm:
		a.executeRaiseAlarm(cfg)
	case ActionClearAlarm:
		a.executeClearAlarm(cfg)
	case ActionRunEffect:
		a.executeRunEffect(cfg)
	}
}

type runEffectPayload struct {
	EffectID   string `json:"effect_id"`
	NativeName string `json:"native_name"`
}

func (a *ActionExecutor) executeRunEffect(cfg ActionConfig) {
	if a.runner == nil {
		logger.Error("run_effect action with no effect runner configured",
			"automation_id", cfg.AutomationID)
		return
	}
	var p runEffectPayload
	if err := json.Unmarshal([]byte(cfg.Payload), &p); err != nil {
		logger.Error("invalid run_effect payload", "automation_id", cfg.AutomationID, "error", err)
		return
	}
	hasEffect := p.EffectID != ""
	hasNative := p.NativeName != ""
	if hasEffect == hasNative {
		logger.Error("run_effect payload requires exactly one of effect_id or native_name",
			"automation_id", cfg.AutomationID,
			"effect_id", p.EffectID,
			"native_name", p.NativeName)
		return
	}
	tt := device.TargetType(cfg.TargetType)
	switch tt {
	case device.TargetDevice, device.TargetGroup, device.TargetRoom:
	default:
		logger.Error("run_effect invalid target_type",
			"automation_id", cfg.AutomationID,
			"target_type", cfg.TargetType)
		return
	}
	if cfg.TargetID == "" {
		logger.Error("run_effect missing target_id", "automation_id", cfg.AutomationID)
		return
	}
	target := effect.Target{Type: tt, ID: cfg.TargetID}
	var err error
	if hasNative {
		_, err = a.runner.StartNative(a.baseCtx, p.NativeName, target)
	} else {
		_, err = a.runner.Start(a.baseCtx, p.EffectID, target)
	}
	if err != nil {
		logger.Error("run_effect start failed",
			"automation_id", cfg.AutomationID,
			"effect_id", p.EffectID,
			"native_name", p.NativeName,
			"target_type", cfg.TargetType,
			"target_id", cfg.TargetID,
			"error", err)
	}
}

type raiseAlarmPayload struct {
	AlarmID  string `json:"alarm_id"`
	Severity string `json:"severity"`
	Kind     string `json:"kind"`
	Message  string `json:"message"`
}

type clearAlarmPayload struct {
	AlarmID string `json:"alarm_id"`
}

func (a *ActionExecutor) executeRaiseAlarm(cfg ActionConfig) {
	if a.alarms == nil {
		logger.Error("raise_alarm action with no alarm service configured")
		return
	}
	var p raiseAlarmPayload
	if err := json.Unmarshal([]byte(cfg.Payload), &p); err != nil {
		logger.Error("invalid raise_alarm payload", "error", err)
		return
	}
	source := "automation"
	if cfg.AutomationID != "" {
		source = fmt.Sprintf("automation.%s", cfg.AutomationID)
	}
	_, err := a.alarms.Raise(a.baseCtx, alarms.RaiseParams{
		AlarmID:  p.AlarmID,
		Severity: store.AlarmSeverity(p.Severity),
		Kind:     store.AlarmKind(p.Kind),
		Message:  p.Message,
		Source:   source,
	})
	if err != nil {
		logger.Error("raise_alarm failed", "alarm_id", p.AlarmID, "error", err)
	}
}

func (a *ActionExecutor) executeClearAlarm(cfg ActionConfig) {
	if a.alarms == nil {
		logger.Error("clear_alarm action with no alarm service configured")
		return
	}
	var p clearAlarmPayload
	if err := json.Unmarshal([]byte(cfg.Payload), &p); err != nil {
		logger.Error("invalid clear_alarm payload", "error", err)
		return
	}
	if _, err := a.alarms.DeleteByAlarmID(a.baseCtx, p.AlarmID); err != nil {
		logger.Error("clear_alarm failed", "alarm_id", p.AlarmID, "error", err)
	}
}

func buildCommand(deviceID device.DeviceID, desired map[string]any) device.Command {
	cmd := device.Command{DeviceID: deviceID}
	if v, ok := desired["on"]; ok {
		if b, ok := v.(bool); ok {
			cmd.On = device.Ptr(b)
		}
	}
	if v, ok := desired["brightness"]; ok {
		cmd.Brightness = device.Ptr(toInt(v))
	}
	if v, ok := desired["color_temp"]; ok {
		cmd.ColorTemp = device.Ptr(toInt(v))
	}
	if v, ok := desired["color"]; ok {
		if c, ok := parseColor(v); ok {
			cmd.Color = &c
		}
	}
	if v, ok := desired["transition"]; ok {
		if f, ok := toFloat(v); ok {
			cmd.Transition = device.Ptr(f)
		}
	}
	return cmd
}

func parseColor(v any) (device.Color, bool) {
	m, ok := v.(map[string]any)
	if !ok {
		return device.Color{}, false
	}
	var c device.Color
	if r, ok := m["r"]; ok {
		c.R = toInt(r)
	}
	if g, ok := m["g"]; ok {
		c.G = toInt(g)
	}
	if b, ok := m["b"]; ok {
		c.B = toInt(b)
	}
	if x, ok := toFloat(m["x"]); ok {
		c.X = x
	}
	if y, ok := toFloat(m["y"]); ok {
		c.Y = y
	}
	return c, true
}

func toFloat(v any) (float64, bool) {
	switch n := v.(type) {
	case float64:
		return n, true
	case int:
		return float64(n), true
	case json.Number:
		f, err := n.Float64()
		return f, err == nil
	default:
		return 0, false
	}
}

func toInt(v any) int {
	switch n := v.(type) {
	case float64:
		return int(n)
	case int:
		return n
	case json.Number:
		i, _ := n.Int64()
		return int(i)
	default:
		return 0
	}
}

func (a *ActionExecutor) stateMatches(deviceID device.DeviceID, desired map[string]any) bool {
	st, ok := a.reader.GetDeviceState(deviceID)
	if !ok || st == nil {
		return false
	}

	for key, val := range desired {
		switch key {
		case "brightness":
			if st.Brightness == nil || *st.Brightness != toInt(val) {
				return false
			}
		case "on":
			b, ok := val.(bool)
			if !ok || st.On == nil || *st.On != b {
				return false
			}
		case "color_temp":
			if st.ColorTemp == nil || *st.ColorTemp != toInt(val) {
				return false
			}
		case "color":
			// Color compares by RGB only; xy is a derived space and devices
			// round differently. An exact match in RGB is good enough to
			// skip a redundant command.
			want, ok := parseColor(val)
			if !ok || st.Color == nil {
				return false
			}
			if st.Color.R != want.R || st.Color.G != want.G || st.Color.B != want.B {
				return false
			}
		case "transition":
			// transition is a command modifier, not a state field — skip
			// it during the comparison. A command that only differs by
			// transition is still a no-op when the device is already at
			// the commanded state.
			continue
		default:
			return false
		}
	}
	return true
}

func (a *ActionExecutor) executeActivateScene(sceneID string) {
	ctx := a.baseCtx
	actions, err := a.store.ListSceneActions(ctx, sceneID)
	if err != nil {
		logger.Error("scene not found", "scene_id", sceneID, "error", err)
		return
	}
	payloads, err := a.store.ListSceneDevicePayloads(ctx, sceneID)
	if err != nil {
		logger.Error("scene payloads unavailable", "scene_id", sceneID, "error", err)
		return
	}
	if len(actions) == 0 {
		return
	}

	plan := scene.BuildApplyCommands(ctx, a.resolver, a.reader, sceneID, actions, payloads)
	for _, cmd := range plan.Commands {
		if a.stateMatches(cmd.DeviceID, scene.CommandToDesired(cmd)) {
			a.stateMatchSkips.Add(1)
			logger.Debug("scene action skipped: device already matches desired state",
				"device_id", cmd.DeviceID, "scene_id", sceneID)
			continue
		}
		a.bus.Publish(eventbus.Event{
			Type:      eventbus.EventCommandRequested,
			DeviceID:  string(cmd.DeviceID),
			Timestamp: time.Now(),
			Payload:   cmd,
		})
	}
	if len(plan.EffectRuns) > 0 && a.runner != nil {
		for _, r := range plan.EffectRuns {
			target := effect.Target{Type: device.TargetDevice, ID: string(r.DeviceID)}
			var err error
			if r.NativeName != "" {
				_, err = a.runner.StartNative(ctx, r.NativeName, target)
			} else {
				_, err = a.runner.Start(ctx, r.EffectID, target)
			}
			if err != nil {
				logger.Error("scene effect start from automation failed",
					"scene_id", sceneID,
					"device_id", r.DeviceID,
					"effect_id", r.EffectID,
					"native_name", r.NativeName,
					"error", err)
			}
		}
	}
}
