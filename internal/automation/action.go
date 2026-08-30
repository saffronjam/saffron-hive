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
	"github.com/saffronjam/saffron-hive/internal/store"
)

const (
	ActionSetDeviceState    = "set_device_state"
	ActionToggleDeviceState = "toggle_device_state"
	ActionChangeValue       = "change_value"
	ActionConfigureDevice   = "configure_device"
	ActionActivateScene     = "activate_scene"
	ActionCycleScenes       = "cycle_scenes"
	ActionRaiseAlarm        = "raise_alarm"
	ActionClearAlarm        = "clear_alarm"
	ActionRunEffect         = "run_effect"
)

const cycleIndexStateKey = "cycle_index"

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

// SceneRunner owns Scene activation for automation actions.
type SceneRunner interface {
	Apply(context.Context, string) (store.Scene, error)
}

// ActionExecutor resolves automation actions into shared output requests or
// service calls.
type ActionExecutor struct {
	bus        eventbus.Publisher
	reader     device.StateReader
	store      automationStore
	resolver   device.TargetResolver
	alarms     AlarmRaiser
	runner     EffectRunner
	scenes     SceneRunner
	commander  device.TargetCommander
	configurer device.ConfigurationCommander

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
func NewActionExecutor(bus eventbus.Publisher, reader device.StateReader, s automationStore, resolver device.TargetResolver, alarmSvc AlarmRaiser, runner EffectRunner, scenes SceneRunner) *ActionExecutor {
	executor := &ActionExecutor{
		bus:      bus,
		reader:   reader,
		store:    s,
		resolver: resolver,
		alarms:   alarmSvc,
		runner:   runner,
		scenes:   scenes,
		baseCtx:  context.Background(),
	}
	if commander, ok := resolver.(device.TargetCommander); ok {
		executor.commander = commander
	}
	if configurer, ok := resolver.(device.ConfigurationCommander); ok {
		executor.configurer = configurer
	}
	return executor
}

func (a *ActionExecutor) executeTargetState(cfg ActionConfig, targetType device.TargetType, memberIDs []device.DeviceID) {
	var desired map[string]any
	if err := json.Unmarshal([]byte(cfg.Payload), &desired); err != nil {
		logger.Error("invalid action payload", "target_id", cfg.TargetID, "error", err)
		return
	}
	if len(desired) == 0 {
		return
	}
	allMatch := len(memberIDs) > 0
	for _, id := range memberIDs {
		if !a.stateMatches(id, desired) {
			allMatch = false
			break
		}
	}
	if allMatch {
		a.stateMatchSkips.Add(int64(len(memberIDs)))
		return
	}
	cmd := buildCommand("", desired)
	cmd.Origin = device.OriginAutomation(cfg.AutomationID)
	if err := a.commander.CommandTarget(a.baseCtx, device.TargetCommand{
		TargetType: targetType,
		TargetID:   cfg.TargetID,
		State:      cmd,
	}); err != nil {
		logger.Error("automation target command failed", "automation_id", cfg.AutomationID, "target_type", targetType, "target_id", cfg.TargetID, "error", err)
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
		a.dispatchCommand(cmd)
	case ActionToggleDeviceState:
		if cfg.TargetID == "" {
			return
		}
		deviceID := device.DeviceID(cfg.TargetID)
		desired := a.toggleDesired(deviceID)
		if len(desired) == 0 {
			return
		}
		if a.stateMatches(deviceID, desired) {
			a.stateMatchSkips.Add(1)
			logger.Debug("toggle skipped: device already matches desired state",
				"device_id", deviceID,
				"automation_id", cfg.AutomationID)
			return
		}
		cmd := buildCommand(deviceID, desired)
		cmd.Origin = device.OriginAutomation(cfg.AutomationID)
		a.dispatchCommand(cmd)
	case ActionChangeValue:
		a.executeChangeValue(cfg)
	case ActionConfigureDevice:
		a.executeConfigureDevice(cfg)
	case ActionActivateScene:
		a.executeActivateScene(cfg.Payload)
	case ActionCycleScenes:
		a.executeCycleScenes(cfg)
	case ActionRaiseAlarm:
		a.executeRaiseAlarm(cfg)
	case ActionClearAlarm:
		a.executeClearAlarm(cfg)
	case ActionRunEffect:
		a.executeRunEffect(cfg)
	}
}

type configureDevicePayload struct {
	Settings []device.ConfigurationValue `json:"settings"`
}

func (a *ActionExecutor) executeConfigureDevice(cfg ActionConfig) {
	if cfg.TargetType != TargetDevice || cfg.TargetID == "" {
		return
	}
	id := device.DeviceID(cfg.TargetID)
	d, ok := a.reader.GetDevice(id)
	if !ok {
		logger.Warn("configure_device target not found", "device_id", id, "automation_id", cfg.AutomationID)
		return
	}
	var payload configureDevicePayload
	if err := json.Unmarshal([]byte(cfg.Payload), &payload); err != nil {
		logger.Error("invalid configure_device payload", "device_id", id, "automation_id", cfg.AutomationID, "error", err)
		return
	}
	if err := device.ValidateConfigurationValues(d, payload.Settings); err != nil {
		logger.Warn("configure_device validation failed", "device_id", id, "automation_id", cfg.AutomationID, "error", err)
		return
	}
	settings := payload.Settings
	if reader, ok := a.reader.(device.ConfigurationReader); ok {
		settings = device.ConfigurationChanges(reader.GetDeviceConfiguration(id), settings)
	}
	if len(settings) == 0 {
		return
	}
	request := device.ConfigurationRequest{
		DeviceID: id,
		Values:   settings,
		Origin:   device.OriginAutomation(cfg.AutomationID),
	}
	if a.configurer != nil {
		if err := a.configurer.CommandConfiguration(a.baseCtx, request); err != nil {
			logger.Warn("configure_device dispatch failed", "device_id", id, "automation_id", cfg.AutomationID, "error", err)
		}
		return
	}
	a.bus.Publish(eventbus.Event{
		Type:      eventbus.EventConfigurationRequested,
		DeviceID:  string(id),
		Timestamp: time.Now(),
		Payload:   request,
	})
}

type changeValuePayload struct {
	Field string  `json:"field"`
	Delta float64 `json:"delta"`
	Mode  string  `json:"mode"`
}

// numericFieldDef ties a settable numeric capability (by capability name) to
// the command-payload key buildCommand understands and a reader for the
// current value in DeviceState. New numeric fields are added by appending an
// entry here (and, if not already present, an arm in buildCommand and
// commandFieldCapabilities).
type numericFieldDef struct {
	capName  string
	cmdField string
	read     func(*device.DeviceState) (float64, bool)
}

var numericFields = []numericFieldDef{
	{
		capName:  device.CapBrightness,
		cmdField: "brightness",
		read: func(st *device.DeviceState) (float64, bool) {
			if st == nil || st.Brightness == nil {
				return 0, false
			}
			return float64(*st.Brightness), true
		},
	},
	{
		capName:  device.CapTargetTemperature,
		cmdField: "targetTemperature",
		read: func(st *device.DeviceState) (float64, bool) {
			if st == nil || st.TargetTemperature == nil {
				return 0, false
			}
			return *st.TargetTemperature, true
		},
	},
}

func numericFieldByCap(name string) (numericFieldDef, bool) {
	for _, f := range numericFields {
		if f.capName == name {
			return f, true
		}
	}
	return numericFieldDef{}, false
}

// executeChangeValue applies a signed delta to a numeric, settable capability
// on a single device. Mode "percent" interprets Delta as a percentage of the
// device's own (valueMax-valueMin) range; mode "absolute" (default for any
// other value) takes Delta as raw units. The resulting value is clamped to
// the capability's range and dispatched as an absolute set command, so loop
// prevention via stateMatches still applies.
func (a *ActionExecutor) executeChangeValue(cfg ActionConfig) {
	if cfg.TargetID == "" {
		return
	}
	deviceID := device.DeviceID(cfg.TargetID)

	var p changeValuePayload
	if err := json.Unmarshal([]byte(cfg.Payload), &p); err != nil {
		logger.Error("invalid change_value payload",
			"automation_id", cfg.AutomationID, "device_id", deviceID, "error", err)
		return
	}
	if p.Field == "" {
		return
	}
	if p.Delta == 0 {
		return
	}

	def, ok := numericFieldByCap(p.Field)
	if !ok {
		logger.Debug("change_value: unsupported field",
			"automation_id", cfg.AutomationID, "field", p.Field)
		return
	}

	dev, ok := a.reader.GetDevice(deviceID)
	if !ok {
		logger.Debug("change_value: unknown device",
			"automation_id", cfg.AutomationID, "device_id", deviceID)
		return
	}
	var capability device.Capability
	capFound := false
	for _, c := range dev.Capabilities {
		if c.Name == p.Field {
			capability = c
			capFound = true
			break
		}
	}
	if !capFound || capability.Type != "numeric" || !capability.CanSet() || capability.ValueMin == nil || capability.ValueMax == nil {
		logger.Debug("change_value: device does not expose settable numeric field",
			"automation_id", cfg.AutomationID, "device_id", deviceID, "field", p.Field)
		return
	}

	st, ok := a.reader.GetDeviceState(deviceID)
	if !ok {
		logger.Debug("change_value: no current state",
			"automation_id", cfg.AutomationID, "device_id", deviceID, "field", p.Field)
		return
	}
	current, ok := def.read(st)
	if !ok {
		logger.Debug("change_value: field not currently reported",
			"automation_id", cfg.AutomationID, "device_id", deviceID, "field", p.Field)
		return
	}

	minV := *capability.ValueMin
	maxV := *capability.ValueMax
	var effective float64
	if p.Mode == "percent" {
		effective = (p.Delta / 100.0) * (maxV - minV)
	} else {
		effective = p.Delta
	}
	next := current + effective
	if next < minV {
		next = minV
	}
	if next > maxV {
		next = maxV
	}

	desired := map[string]any{def.cmdField: next}
	desired = device.FilterCommandFields(desired, dev)
	if len(desired) == 0 {
		return
	}
	if a.stateMatches(deviceID, desired) {
		a.stateMatchSkips.Add(1)
		logger.Debug("change_value skipped: device already matches desired state",
			"device_id", deviceID, "automation_id", cfg.AutomationID, "field", p.Field)
		return
	}

	cmd := buildCommand(deviceID, desired)
	cmd.Origin = device.OriginAutomation(cfg.AutomationID)
	a.dispatchCommand(cmd)
}

func (a *ActionExecutor) dispatchCommand(command device.Command) {
	if a.commander != nil {
		id := command.DeviceID
		command.DeviceID = ""
		if err := a.commander.CommandTarget(a.baseCtx, device.TargetCommand{
			TargetType: device.TargetDevice,
			TargetID:   string(id),
			State:      command,
		}); err != nil {
			logger.Warn("automation command dispatch failed", "device_id", id, "error", err)
		}
		return
	}
	a.bus.Publish(eventbus.Event{
		Type:      eventbus.EventCommandRequested,
		DeviceID:  string(command.DeviceID),
		Timestamp: time.Now(),
		Payload:   command,
	})
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
	targetType := device.TargetType(cfg.TargetType)
	var targets []effect.Target
	if targetType == device.TargetExpression {
		for _, id := range device.EvaluateExpression(a.baseCtx, a.reader, a.resolver, cfg.TargetExpr) {
			targets = append(targets, effect.Target{Type: device.TargetDevice, ID: string(id)})
		}
	} else {
		switch targetType {
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
		targets = append(targets, effect.Target{Type: targetType, ID: cfg.TargetID})
	}

	for _, target := range targets {
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
				"target_type", target.Type,
				"target_id", target.ID,
				"error", err)
		}
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
	if v, ok := desired["colorTemp"]; ok {
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
	if v, ok := desired["targetTemperature"]; ok {
		if f, ok := toFloat(v); ok {
			cmd.TargetTemperature = device.Ptr(f)
		}
	}
	if v, ok := desired["hvacMode"]; ok {
		if s, ok := v.(string); ok {
			cmd.HvacMode = device.Ptr(s)
		}
	}
	if v, ok := desired["fanMode"]; ok {
		if s, ok := v.(string); ok {
			cmd.FanMode = device.Ptr(s)
		}
	}
	if v, ok := desired["swing"]; ok {
		if s, ok := v.(string); ok {
			cmd.Swing = device.Ptr(s)
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

// toggleDesired returns the desired state map for flipping a single device's
// on/off state: {"on": !current.on}. Defaults to on=true when the device's
// state is unknown (matches the on-by-default convention used by scene
// payloads). The returned map is filtered to fields the device's capabilities
// support.
func (a *ActionExecutor) toggleDesired(deviceID device.DeviceID) map[string]any {
	nextOn := true
	if st, ok := a.reader.GetDeviceState(deviceID); ok && st != nil && st.On != nil && *st.On {
		nextOn = false
	}
	desired := map[string]any{"on": nextOn}
	if dev, ok := a.reader.GetDevice(deviceID); ok {
		desired = device.FilterCommandFields(desired, dev)
	}
	return desired
}

// aggregateOn returns true iff at least one of the given devices currently
// reports on=true. Devices with unknown state contribute false. Used by the
// engine's toggle override to compute target-aggregate desired state and by
// the expr accessor for group/room conditions.
func aggregateOn(reader device.StateReader, ids []device.DeviceID) bool {
	for _, id := range ids {
		if st, ok := reader.GetDeviceState(id); ok && st != nil && st.On != nil && *st.On {
			return true
		}
	}
	return false
}

// aggregateControllableOn reports the aggregate state of devices that accept
// on/off commands and whether the target contains any such device.
func aggregateControllableOn(reader device.StateReader, ids []device.DeviceID) (bool, bool) {
	hasTarget := false
	for _, id := range ids {
		dev, ok := reader.GetDevice(id)
		if !ok {
			continue
		}
		capability, ok := dev.Capability(device.CapOnOff)
		if !ok || !capability.CanSet() {
			continue
		}
		hasTarget = true
		if st, ok := reader.GetDeviceState(id); ok && st != nil && st.On != nil && *st.On {
			return true, true
		}
	}
	return false, hasTarget
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
		case "colorTemp":
			if st.ColorTemp == nil || *st.ColorTemp != toInt(val) {
				return false
			}
		case "targetTemperature":
			want, ok := toFloat(val)
			if !ok || st.TargetTemperature == nil || *st.TargetTemperature != want {
				return false
			}
		case "hvacMode":
			want, ok := val.(string)
			if !ok || st.HvacMode == nil || *st.HvacMode != want {
				return false
			}
		case "fanMode":
			want, ok := val.(string)
			if !ok || st.FanMode == nil || *st.FanMode != want {
				return false
			}
		case "swing":
			want, ok := val.(string)
			if !ok || st.Swing == nil || *st.Swing != want {
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
	if a.scenes == nil {
		logger.Error("Scene runner unavailable", "scene_id", sceneID)
		return
	}
	if _, err := a.scenes.Apply(a.baseCtx, sceneID); err != nil {
		logger.Error("Scene activation failed", "scene_id", sceneID, "error", err)
	}
}

type cycleScenesPayload struct {
	Scenes []string `json:"scenes"`
}

// executeCycleScenes advances the per-node cycle index and applies the next
// existing scene. Scenes that no longer exist are filtered out at fire time;
// the index counts positions in the filtered list. If every referenced scene
// has been deleted the action is a no-op. Persists the next index back to
// automation_node_state under cycleIndexStateKey.
func (a *ActionExecutor) executeCycleScenes(cfg ActionConfig) {
	var p cycleScenesPayload
	if err := json.Unmarshal([]byte(cfg.Payload), &p); err != nil {
		logger.Error("invalid cycle_scenes payload", "automation_id", cfg.AutomationID, "node_id", cfg.NodeID, "error", err)
		return
	}
	if len(p.Scenes) == 0 {
		return
	}

	ctx := a.baseCtx
	valid := make([]string, 0, len(p.Scenes))
	for _, sid := range p.Scenes {
		if _, err := a.store.GetScene(ctx, sid); err == nil {
			valid = append(valid, sid)
		}
	}
	if len(valid) == 0 {
		logger.Warn("cycle_scenes: no valid scenes remain", "automation_id", cfg.AutomationID, "node_id", cfg.NodeID)
		return
	}

	idx := 0
	if raw, found, err := a.store.GetAutomationNodeState(ctx, cfg.AutomationID, string(cfg.NodeID), cycleIndexStateKey); err != nil {
		logger.Warn("cycle_scenes: read state failed; defaulting to 0", "automation_id", cfg.AutomationID, "node_id", cfg.NodeID, "error", err)
	} else if found {
		_ = json.Unmarshal([]byte(raw), &idx)
	}
	if idx < 0 || idx >= len(valid) {
		idx = 0
	}

	a.executeActivateScene(valid[idx])

	next := (idx + 1) % len(valid)
	nextRaw, _ := json.Marshal(next)
	if err := a.store.SetAutomationNodeState(ctx, cfg.AutomationID, string(cfg.NodeID), cycleIndexStateKey, string(nextRaw)); err != nil {
		logger.Error("cycle_scenes: write state failed", "automation_id", cfg.AutomationID, "node_id", cfg.NodeID, "error", err)
	}
}
