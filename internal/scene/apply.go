// Package scene owns everything about "a scene is currently the state of its
// devices": applying a scene (building the fan-out commands), snapshotting the
// expected scene-relevant state at apply time, comparing incoming device-state
// events against that snapshot, and flipping scenes.activated_at in response.
//
// The shared apply helpers (BuildApplyCommands, DefaultScenePayload) live here
// so the GraphQL resolver, the automation action executor, and the watcher
// agree on one definition of "what does this scene send to each device."
package scene

import (
	"context"
	"encoding/json"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// DefaultTransitionSeconds is the fade time applied to scene-driven commands
// for lights with brightness capability so on/off and level changes ease
// instead of snapping.
const DefaultTransitionSeconds = 0.4

// BuildApplyCommands resolves a scene's target membership to a unique device
// set (preserving action order, deduplicating across overlapping groups/rooms)
// and produces one command per device: the explicit per-device payload if one
// exists, else the capability-filtered warm-white default.
func BuildApplyCommands(
	ctx context.Context,
	tr device.TargetResolver,
	sr device.StateReader,
	actions []store.SceneAction,
	payloads []store.SceneDevicePayload,
) []device.Command {
	payloadByDevice := make(map[device.DeviceID]string, len(payloads))
	for _, p := range payloads {
		payloadByDevice[p.DeviceID] = p.Payload
	}

	seen := make(map[device.DeviceID]struct{})
	var order []device.DeviceID
	for _, a := range actions {
		for _, did := range tr.ResolveTargetDeviceIDs(ctx, device.TargetType(a.TargetType), a.TargetID) {
			if _, ok := seen[did]; ok {
				continue
			}
			seen[did] = struct{}{}
			order = append(order, did)
		}
	}

	cmds := make([]device.Command, 0, len(order))
	for _, did := range order {
		if raw, ok := payloadByDevice[did]; ok {
			var desired map[string]any
			if err := json.Unmarshal([]byte(raw), &desired); err == nil {
				cmds = append(cmds, commandFromDesired(sr, did, desired))
				continue
			}
		}
		cmds = append(cmds, DefaultScenePayload(sr, did))
	}
	return cmds
}

// DefaultScenePayload produces the warm-white "on" command a scene sends to a
// device that has no explicit per-device override. Fields are gated by the
// device's writable capabilities so commands the device can't accept are
// omitted rather than silently ignored downstream.
func DefaultScenePayload(sr device.StateReader, deviceID device.DeviceID) device.Command {
	cmd := device.Command{DeviceID: deviceID}
	d, ok := sr.GetDevice(deviceID)
	if !ok {
		cmd.On = device.Ptr(true)
		return cmd
	}
	if hasWritableCapability(d, device.CapOnOff) {
		cmd.On = device.Ptr(true)
	}
	if hasWritableCapability(d, device.CapBrightness) {
		cmd.Brightness = device.Ptr(200)
		cmd.Transition = device.Ptr(DefaultTransitionSeconds)
	}
	if hasWritableCapability(d, device.CapColorTemp) {
		cmd.ColorTemp = device.Ptr(370)
	}
	return cmd
}

// CommandToDesired reduces a scene's Command back into the map form used for
// state-match pre-checks in the automation executor. Exported so callers that
// need to compare "what the scene wants" against "what the device reports" can
// share one source of truth.
func CommandToDesired(cmd device.Command) map[string]any {
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
		out["color"] = map[string]any{
			"r": cmd.Color.R,
			"g": cmd.Color.G,
			"b": cmd.Color.B,
			"x": cmd.Color.X,
			"y": cmd.Color.Y,
		}
	}
	if cmd.Transition != nil {
		out["transition"] = *cmd.Transition
	}
	return out
}

func commandFromDesired(sr device.StateReader, deviceID device.DeviceID, desired map[string]any) device.Command {
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
		if m, ok := v.(map[string]any); ok {
			c := &device.Color{
				R: toInt(m["r"]),
				G: toInt(m["g"]),
				B: toInt(m["b"]),
			}
			if x, ok := toFloat(m["x"]); ok {
				c.X = x
			}
			if y, ok := toFloat(m["y"]); ok {
				c.Y = y
			}
			cmd.Color = c
		}
	}
	if v, ok := desired["transition"]; ok {
		if f, ok := toFloat(v); ok {
			cmd.Transition = device.Ptr(f)
		}
	} else if d, ok := sr.GetDevice(deviceID); ok && hasWritableCapability(d, device.CapBrightness) {
		cmd.Transition = device.Ptr(DefaultTransitionSeconds)
	}
	return cmd
}

func hasWritableCapability(d device.Device, name string) bool {
	for _, c := range d.Capabilities {
		if c.Name == name && c.Access&2 != 0 {
			return true
		}
	}
	return false
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
