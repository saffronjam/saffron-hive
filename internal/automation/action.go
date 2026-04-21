package automation

import (
	"context"
	"encoding/json"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

const (
	ActionSetDeviceState = "set_device_state"
	ActionActivateScene  = "activate_scene"
)

// ActionExecutor resolves automation actions into event bus commands.
type ActionExecutor struct {
	bus      eventbus.Publisher
	reader   device.StateReader
	store    automationStore
	resolver device.TargetResolver
}

// NewActionExecutor creates an ActionExecutor.
func NewActionExecutor(bus eventbus.Publisher, reader device.StateReader, s automationStore, resolver device.TargetResolver) *ActionExecutor {
	return &ActionExecutor{bus: bus, reader: reader, store: s, resolver: resolver}
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

		if a.stateMatches(deviceID, desired) {
			return
		}

		cmd := device.DeviceCommand{
			DeviceID: deviceID,
			Payload:  buildLightCommand(desired),
		}
		a.bus.Publish(eventbus.Event{
			Type:      eventbus.EventCommandRequested,
			DeviceID:  string(deviceID),
			Timestamp: time.Now(),
			Payload:   cmd,
		})
	case ActionActivateScene:
		a.executeActivateScene(cfg.Payload)
	}
}

func buildLightCommand(desired map[string]any) device.LightCommand {
	var cmd device.LightCommand
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
	return cmd
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
	ls, ok := a.reader.GetLightState(deviceID)
	if !ok || ls == nil {
		return false
	}

	for key, val := range desired {
		switch key {
		case "brightness":
			if ls.Brightness == nil || *ls.Brightness != toInt(val) {
				return false
			}
		case "on":
			b, ok := val.(bool)
			if !ok || ls.On == nil || *ls.On != b {
				return false
			}
		case "color_temp":
			if ls.ColorTemp == nil || *ls.ColorTemp != toInt(val) {
				return false
			}
		default:
			return false
		}
	}
	return true
}

func (a *ActionExecutor) executeActivateScene(sceneID string) {
	actions, err := a.store.ListSceneActions(context.Background(), sceneID)
	if err != nil {
		logger.Error("scene not found", "scene_id", sceneID, "error", err)
		return
	}
	if len(actions) == 0 {
		return
	}

	for _, sa := range actions {
		var desired map[string]any
		if err := json.Unmarshal([]byte(sa.Payload), &desired); err != nil {
			logger.Error("invalid scene action payload", "target_id", sa.TargetID, "error", err)
			continue
		}

		deviceIDs := a.resolveTargetDevices(sa.TargetType, sa.TargetID)
		for _, did := range deviceIDs {
			if a.stateMatches(did, desired) {
				continue
			}

			cmd := device.DeviceCommand{
				DeviceID: did,
				Payload:  buildLightCommand(desired),
			}
			a.bus.Publish(eventbus.Event{
				Type:      eventbus.EventCommandRequested,
				DeviceID:  string(did),
				Timestamp: time.Now(),
				Payload:   cmd,
			})
		}
	}
}

func (a *ActionExecutor) resolveTargetDevices(targetType string, targetID string) []device.DeviceID {
	return a.resolver.ResolveTargetDeviceIDs(context.Background(), device.TargetType(targetType), targetID)
}
