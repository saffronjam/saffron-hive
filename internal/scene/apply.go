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

// EffectRun is one effect-kind device payload resolved against a scene's
// target set: the runner is asked to start a stored effect (EffectID) or an
// auto-discovered native effect (NativeName) on this device when the scene
// activates. Exactly one of EffectID / NativeName is set. The watcher uses
// the same record to track which devices are intentionally evolving so their
// state changes do not register as drift.
type EffectRun struct {
	DeviceID   device.DeviceID
	EffectID   string
	NativeName string
}

// ApplyPlan is the result of resolving a scene's actions and payloads against
// the live device set. Commands are static-payload device commands ready to
// publish; EffectRuns identify effect-payload devices the runner must start
// runs on. The two slices are independent — a single scene activation can
// produce both.
type ApplyPlan struct {
	Commands   []device.Command
	EffectRuns []EffectRun
}

// BuildApplyCommands resolves a scene's target membership to a unique device
// set (preserving action order, deduplicating across overlapping groups/rooms)
// and produces an ApplyPlan: one static command per static-payload device
// (capability-gated, stamped with OriginScene(sceneID)) plus one EffectRun
// entry per effect-payload device. Devices without an explicit payload fall
// back to the capability-filtered warm-white default static command.
func BuildApplyCommands(
	ctx context.Context,
	tr device.TargetResolver,
	sr device.StateReader,
	sceneID string,
	actions []store.SceneAction,
	payloads []store.SceneDevicePayload,
) ApplyPlan {
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

	origin := device.OriginScene(sceneID)
	plan := ApplyPlan{
		Commands:   make([]device.Command, 0, len(order)),
		EffectRuns: nil,
	}
	for _, did := range order {
		var cmd device.Command
		if raw, ok := payloadByDevice[did]; ok {
			parsed, err := store.ParseScenePayload(raw)
			if err != nil {
				cmd = DefaultScenePayload(sr, did)
			} else {
				switch parsed.Kind {
				case store.ScenePayloadEffect:
					plan.EffectRuns = append(plan.EffectRuns, EffectRun{DeviceID: did, EffectID: parsed.EffectID})
					continue
				case store.ScenePayloadNativeEffect:
					plan.EffectRuns = append(plan.EffectRuns, EffectRun{DeviceID: did, NativeName: parsed.NativeName})
					continue
				case store.ScenePayloadStatic:
					cmd = commandFromDesired(sr, did, parsed.Static)
				default:
					cmd = DefaultScenePayload(sr, did)
				}
			}
		} else {
			cmd = DefaultScenePayload(sr, did)
		}
		if isEmptyCommand(cmd) {
			continue
		}
		cmd.Origin = origin
		plan.Commands = append(plan.Commands, cmd)
	}
	return plan
}

// isEmptyCommand returns true when capability gating has stripped every
// state-changing field from a command. Scenes targeting a room or group can
// reach devices that aren't controllable (buttons, sensors); the apply path
// silently drops their commands so the watcher doesn't track an expected
// state the device can never report. Transition is excluded from the check —
// a transition-only command isn't useful on its own and doesn't make a device
// "controllable" by itself.
func isEmptyCommand(c device.Command) bool {
	return c.On == nil && c.Brightness == nil && c.ColorTemp == nil && c.Color == nil
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
	d, hasDevice := sr.GetDevice(deviceID)
	allow := func(cap string) bool { return hasDevice && hasWritableCapability(d, cap) }

	if v, ok := desired["on"]; ok && allow(device.CapOnOff) {
		if b, ok := v.(bool); ok {
			cmd.On = device.Ptr(b)
		}
	}
	if v, ok := desired["brightness"]; ok && allow(device.CapBrightness) {
		cmd.Brightness = device.Ptr(toInt(v))
	}
	if v, ok := desired["color_temp"]; ok && allow(device.CapColorTemp) {
		cmd.ColorTemp = device.Ptr(toInt(v))
	}
	if v, ok := desired["color"]; ok && allow(device.CapColor) {
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
	if v, ok := desired["transition"]; ok && allow(device.CapBrightness) {
		if f, ok := toFloat(v); ok {
			cmd.Transition = device.Ptr(f)
		}
	} else if allow(device.CapBrightness) {
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
