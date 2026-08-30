// Package scene compiles typed Scene definitions into physical device output
// and owns the lifecycle of active Scene runs.
package scene

import (
	"context"
	"hash/fnv"
	"slices"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/lightfield"
	"github.com/saffronjam/saffron-hive/internal/spatial"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// DefaultTransitionSeconds is the fade time applied to Scene-driven commands.
const DefaultTransitionSeconds = 0.4

// PositionResolver maps a resolved target set onto the shared light field.
type PositionResolver interface {
	Resolve(context.Context, spatial.TargetContext, int64) ([]spatial.DevicePoint, spatial.Diagnostics, error)
}

// EffectRun is one stored or provider-native effect behaviour.
type EffectRun struct {
	DeviceID   device.DeviceID
	EffectID   string
	NativeName string
}

// ApplyPlan is one resolved frame of a Scene definition.
type ApplyPlan struct {
	Commands         []device.Command
	EffectRuns       []EffectRun
	DynamicDeviceIDs []device.DeviceID
}

// dispatchPlan sends a resolved plan, retaining structural multicast when a
// single target produces one uniform static state.
func dispatchPlan(
	ctx context.Context,
	commander device.TargetCommander,
	bus eventbus.Publisher,
	_ store.SceneDefinition,
	plan ApplyPlan,
) error {
	return dispatchDeviceCommands(ctx, commander, bus, plan.Commands)
}

func dispatchDeviceCommands(
	ctx context.Context,
	commander device.TargetCommander,
	bus eventbus.Publisher,
	commands []device.Command,
) error {
	if commander == nil {
		for _, command := range commands {
			bus.Publish(eventbus.Event{
				Type:      eventbus.EventCommandRequested,
				DeviceID:  string(command.DeviceID),
				Timestamp: time.Now(),
				Payload:   command,
			})
		}
		return nil
	}
	for _, command := range commands {
		id := command.DeviceID
		command.DeviceID = ""
		if err := commander.CommandTarget(ctx, device.TargetCommand{
			TargetType: device.TargetDevice,
			TargetID:   string(id),
			State:      command,
		}); err != nil {
			return err
		}
	}
	return nil
}

// BuildApplyPlan resolves a complete definition and renders its current frame.
// Per-light overrides are target-bound. Supporting states explicitly add
// non-light Scene members.
func BuildApplyPlan(
	ctx context.Context,
	targetResolver device.TargetResolver,
	stateReader device.StateReader,
	positionResolver PositionResolver,
	sceneID string,
	definition store.SceneDefinition,
	at time.Time,
) (ApplyPlan, error) {
	return buildApplyPlan(ctx, targetResolver, stateReader, positionResolver, sceneID, definition, at, 0)
}

func buildApplyPlan(
	ctx context.Context,
	targetResolver device.TargetResolver,
	stateReader device.StateReader,
	positionResolver PositionResolver,
	sceneID string,
	definition store.SceneDefinition,
	at time.Time,
	cadence time.Duration,
) (ApplyPlan, error) {
	targetContext := resolveTargetContext(ctx, targetResolver, stateReader, definition.Targets)
	targeted := make(map[device.DeviceID]bool, len(targetContext.DeviceIDs))
	for _, id := range targetContext.DeviceIDs {
		targeted[id] = true
	}

	commands := make(map[device.DeviceID]device.Command, len(targetContext.DeviceIDs)+len(definition.Supporting))
	plan := ApplyPlan{}
	if dynamic := definition.Lighting.Dynamic; dynamic != nil {
		points, err := resolvePoints(ctx, positionResolver, targetContext, dynamic.Seed)
		if err != nil {
			return ApplyPlan{}, err
		}
		motion := lightfield.Motion{
			Seed:     dynamic.Seed,
			Movement: dynamic.Movement,
			Cycle:    dynamic.Cycle,
		}
		for _, positioned := range points {
			target, ok := stateReader.GetDevice(positioned.DeviceID)
			if !ok {
				continue
			}
			sample, err := lightfield.SampleAtCadence(dynamic.Field, positioned.Point, motion, at, cadence)
			if err != nil {
				return ApplyPlan{}, err
			}
			intent, err := lightfield.Project(target, sample, dynamic.Brightness)
			if err != nil {
				return ApplyPlan{}, err
			}
			commands[positioned.DeviceID] = mergeCommand(commands[positioned.DeviceID], intent.Command(DefaultTransitionSeconds))
			plan.DynamicDeviceIDs = append(plan.DynamicDeviceIDs, positioned.DeviceID)
		}
	}

	for _, override := range definition.Lighting.Overrides {
		if !targeted[override.DeviceID] {
			continue
		}
		switch override.Kind {
		case store.SceneLightOverrideState:
			commands[override.DeviceID] = mergeCommand(commands[override.DeviceID], commandFromDesired(stateReader, override.DeviceID, *override.State))
		case store.SceneLightOverrideEffect:
			delete(commands, override.DeviceID)
			plan.DynamicDeviceIDs = deleteDeviceID(plan.DynamicDeviceIDs, override.DeviceID)
			plan.EffectRuns = append(plan.EffectRuns, EffectRun{DeviceID: override.DeviceID, EffectID: override.EffectID})
		case store.SceneLightOverrideNativeEffect:
			delete(commands, override.DeviceID)
			plan.DynamicDeviceIDs = deleteDeviceID(plan.DynamicDeviceIDs, override.DeviceID)
			plan.EffectRuns = append(plan.EffectRuns, EffectRun{DeviceID: override.DeviceID, NativeName: override.NativeEffectName})
		}
	}
	for _, supporting := range definition.Supporting {
		commands[supporting.DeviceID] = commandFromDesired(stateReader, supporting.DeviceID, supporting.State)
	}

	ids := make([]device.DeviceID, 0, len(commands))
	for id := range commands {
		ids = append(ids, id)
	}
	slices.Sort(ids)
	origin := device.OriginScene(sceneID)
	for _, id := range ids {
		command := commands[id]
		if isEmptyCommand(command) {
			continue
		}
		command.Origin = origin
		plan.Commands = append(plan.Commands, command)
	}
	return plan, nil
}

func mergeCommand(base, patch device.Command) device.Command {
	if patch.DeviceID != "" {
		base.DeviceID = patch.DeviceID
	}
	if patch.On != nil {
		base.On = patch.On
	}
	if patch.Brightness != nil {
		base.Brightness = patch.Brightness
	}
	if patch.Color != nil {
		base.Color = patch.Color
		base.ColorTemp = nil
	} else if patch.ColorTemp != nil {
		base.ColorTemp = patch.ColorTemp
		base.Color = nil
	}
	if patch.Transition != nil {
		base.Transition = patch.Transition
	}
	if patch.TargetTemperature != nil {
		base.TargetTemperature = patch.TargetTemperature
	}
	if patch.HvacMode != nil {
		base.HvacMode = patch.HvacMode
	}
	if patch.FanMode != nil {
		base.FanMode = patch.FanMode
	}
	if patch.Swing != nil {
		base.Swing = patch.Swing
	}
	return base
}

func deleteDeviceID(ids []device.DeviceID, target device.DeviceID) []device.DeviceID {
	return slices.DeleteFunc(ids, func(id device.DeviceID) bool { return id == target })
}

func resolveTargetContext(
	ctx context.Context,
	resolver device.TargetResolver,
	reader device.StateReader,
	targets []store.SceneTarget,
) spatial.TargetContext {
	seen := map[device.DeviceID]bool{}
	positiveRoots := map[device.DeviceID][]spatial.StructuralRoot{}
	for _, target := range targets {
		var ids []device.DeviceID
		if target.Type == device.TargetExpression {
			ids = device.EvaluateExpression(ctx, reader, resolver, target.Expression)
			addExpressionRoots(ctx, resolver, ids, target.Expression, positiveRoots)
		} else {
			ids = resolver.ResolveTargetDeviceIDs(ctx, target.Type, target.ID)
			if isStructuralTarget(target.Type) {
				for _, id := range ids {
					positiveRoots[id] = append(positiveRoots[id], spatial.StructuralRoot{Type: target.Type, ID: target.ID})
				}
			}
		}
		for _, id := range ids {
			target, ok := reader.GetDevice(id)
			if !ok || target.Removed || target.RuntimeDisabled() || !device.IsLightControlDevice(target) {
				delete(positiveRoots, id)
				continue
			}
			seen[id] = true
		}
	}
	ids := make([]device.DeviceID, 0, len(seen))
	for id := range seen {
		ids = append(ids, id)
	}
	slices.Sort(ids)
	return spatial.TargetContext{DeviceIDs: ids, PositiveRoots: positiveRoots}
}

func addExpressionRoots(
	ctx context.Context,
	resolver device.TargetResolver,
	selected []device.DeviceID,
	expression device.Expression,
	roots map[device.DeviceID][]spatial.StructuralRoot,
) {
	selectedSet := make(map[device.DeviceID]bool, len(selected))
	for _, id := range selected {
		selectedSet[id] = true
	}
	for _, clause := range expression {
		if clause.Op == device.OpIsNot || clause.Op == device.OpIsNotOneOf {
			continue
		}
		var targetType device.TargetType
		switch clause.Subject {
		case device.SubjectRoom:
			targetType = device.TargetRoom
		case device.SubjectGroup:
			targetType = device.TargetGroup
		case device.SubjectDevice:
			targetType = device.TargetDevice
		default:
			continue
		}
		for _, value := range clause.Values {
			for _, id := range resolver.ResolveTargetDeviceIDs(ctx, targetType, value) {
				if selectedSet[id] {
					roots[id] = append(roots[id], spatial.StructuralRoot{Type: targetType, ID: value})
				}
			}
		}
	}
}

func isStructuralTarget(targetType device.TargetType) bool {
	return targetType == device.TargetDevice || targetType == device.TargetGroup || targetType == device.TargetRoom
}

func resolvePoints(
	ctx context.Context,
	resolver PositionResolver,
	target spatial.TargetContext,
	seed int64,
) ([]spatial.DevicePoint, error) {
	if resolver != nil {
		points, _, err := resolver.Resolve(ctx, target, seed)
		return points, err
	}
	points := make([]spatial.DevicePoint, len(target.DeviceIDs))
	for i, id := range target.DeviceIDs {
		points[i] = spatial.DevicePoint{DeviceID: id, Point: fallbackPoint(id, seed), Source: spatial.PointSourceFallback}
	}
	return points, nil
}

func fallbackPoint(id device.DeviceID, seed int64) lightfield.Point {
	hash := fnv.New64a()
	_, _ = hash.Write([]byte(id))
	value := hash.Sum64() ^ uint64(seed)
	return lightfield.Point{
		X: float64(value&0xffff) / float64(0xffff),
		Y: float64((value>>16)&0xffff) / float64(0xffff),
	}
}

func isEmptyCommand(command device.Command) bool {
	return command.On == nil && command.Brightness == nil && command.ColorTemp == nil &&
		command.Color == nil && command.TargetTemperature == nil && command.HvacMode == nil &&
		command.FanMode == nil && command.Swing == nil
}

func commandFromDesired(reader device.StateReader, id device.DeviceID, desired store.DesiredState) device.Command {
	command := device.Command{DeviceID: id}
	target, exists := reader.GetDevice(id)
	if !exists || target.Removed || target.RuntimeDisabled() {
		return command
	}
	if desired.On != nil && hasWritableCapability(target, device.CapOnOff) {
		command.On = clone(desired.On)
	}
	if desired.Brightness != nil && hasWritableCapability(target, device.CapBrightness) {
		command.Brightness = clone(desired.Brightness)
	}
	if desired.Color != nil && hasWritableCapability(target, device.CapColor) {
		colour := *desired.Color
		command.Color = &colour
	} else if desired.ColorTemp != nil && hasWritableCapability(target, device.CapColorTemp) {
		command.ColorTemp = clone(desired.ColorTemp)
	}
	if desired.Transition != nil && hasWritableCapability(target, device.CapBrightness) {
		command.Transition = clone(desired.Transition)
	} else if command.Brightness != nil {
		command.Transition = device.Ptr(DefaultTransitionSeconds)
	}
	if desired.TargetTemperature != nil && hasWritableCapability(target, device.CapTargetTemperature) {
		command.TargetTemperature = clone(desired.TargetTemperature)
	}
	if desired.HvacMode != nil && hasWritableCapability(target, device.CapHvacMode) {
		command.HvacMode = clone(desired.HvacMode)
	}
	if desired.FanMode != nil && hasWritableCapability(target, device.CapFanMode) {
		command.FanMode = clone(desired.FanMode)
	}
	if desired.Swing != nil && hasWritableCapability(target, device.CapSwing) {
		command.Swing = clone(desired.Swing)
	}
	return command
}

func hasWritableCapability(target device.Device, name string) bool {
	capability, ok := target.Capability(name)
	return ok && capability.CanSet()
}

func clone[T any](value *T) *T {
	if value == nil {
		return nil
	}
	copy := *value
	return &copy
}
