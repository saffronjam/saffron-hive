package scene

import (
	"context"
	"slices"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/lightfield"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// AuthoredState is a capability-filtered desired state for one resolved physical device.
type AuthoredState struct {
	DeviceID device.DeviceID
	Lighting bool
	State    store.DesiredState
}

// AuthorStates resolves targets and constructs editable states without issuing output.
func AuthorStates(ctx context.Context, reader device.StateReader, resolver device.TargetResolver, targets []store.SceneTarget, current, fallback bool, desired store.DesiredState) []AuthoredState {
	ids := map[device.DeviceID]bool{}
	for _, target := range targets {
		var resolved []device.DeviceID
		if target.Type == device.TargetExpression {
			resolved = device.EvaluateExpression(ctx, reader, resolver, target.Expression)
		} else {
			resolved = resolver.ResolveTargetDeviceIDs(ctx, target.Type, target.ID)
		}
		for _, id := range resolved {
			ids[id] = true
		}
	}
	ordered := make([]device.DeviceID, 0, len(ids))
	for id := range ids {
		ordered = append(ordered, id)
	}
	slices.Sort(ordered)
	result := make([]AuthoredState, 0, len(ordered))
	for _, id := range ordered {
		dev, ok := reader.GetDevice(id)
		if !ok || dev.Removed || dev.RuntimeDisabled() {
			continue
		}
		state := defaultAuthoringState(dev)
		if current {
			state = store.DesiredState{}
			if live, ok := reader.GetDeviceState(id); ok && live != nil {
				state = store.DesiredState{On: live.On, Brightness: live.Brightness, ColorTemp: live.ColorTemp, Color: live.Color, TargetTemperature: live.TargetTemperature, HvacMode: live.HvacMode, FanMode: live.FanMode, Swing: live.Swing}
			}
			state = authoringState(commandFromDesired(reader, id, state))
			if fallback && emptyAuthoringState(state) {
				state = defaultAuthoringState(dev)
			}
		}
		state = mergeAuthoringState(state, authoringState(commandFromDesired(reader, id, desired)))
		projected := authoringState(commandFromDesired(reader, id, state))
		if emptyAuthoringState(projected) {
			continue
		}
		result = append(result, AuthoredState{DeviceID: id, Lighting: device.IsLightControlDevice(dev), State: projected})
	}
	return result
}

func defaultAuthoringState(dev device.Device) store.DesiredState {
	state := store.DesiredState{}
	if hasWritableCapability(dev, device.CapOnOff) {
		state.On = device.Ptr(true)
	}
	if hasWritableCapability(dev, device.CapBrightness) {
		state.Brightness = device.Ptr(200)
	}
	if hasWritableCapability(dev, device.CapColorTemp) {
		temp := 370
		cap, _ := dev.Capability(device.CapColorTemp)
		if cap.ValueMin != nil && float64(temp) < *cap.ValueMin {
			temp = int(*cap.ValueMin)
		}
		if cap.ValueMax != nil && float64(temp) > *cap.ValueMax {
			temp = int(*cap.ValueMax)
		}
		state.ColorTemp = &temp
	} else if hasWritableCapability(dev, device.CapColor) {
		x, y := lightfield.RGBToXY(lightfield.RGB{R: 1, G: 1, B: 1})
		state.Color = &device.Color{R: 255, G: 255, B: 255, X: x, Y: y}
	}
	return state
}

func emptyAuthoringState(s store.DesiredState) bool {
	return s.On == nil && s.Brightness == nil && s.ColorTemp == nil && s.Color == nil && s.TargetTemperature == nil && s.HvacMode == nil && s.FanMode == nil && s.Swing == nil
}

func mergeAuthoringState(base, value store.DesiredState) store.DesiredState {
	if value.On != nil {
		base.On = value.On
	}
	if value.Brightness != nil {
		base.Brightness = value.Brightness
	}
	if value.ColorTemp != nil {
		base.ColorTemp = value.ColorTemp
		base.Color = nil
	}
	if value.Color != nil {
		base.Color = value.Color
		base.ColorTemp = nil
	}
	if value.Transition != nil {
		base.Transition = value.Transition
	}
	if value.TargetTemperature != nil {
		base.TargetTemperature = value.TargetTemperature
	}
	if value.HvacMode != nil {
		base.HvacMode = value.HvacMode
	}
	if value.FanMode != nil {
		base.FanMode = value.FanMode
	}
	if value.Swing != nil {
		base.Swing = value.Swing
	}
	return base
}

func authoringState(command device.Command) store.DesiredState {
	state := desiredState(command)
	state.Transition = command.Transition
	return state
}
