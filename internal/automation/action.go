package automation

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

const (
	ActionSetDeviceState = "set_device_state"
	ActionActivateScene  = "activate_scene"
)

// ActionExecutor resolves automation actions into event bus commands.
type ActionExecutor struct {
	bus    eventbus.Publisher
	reader device.StateReader
	store  store.Store
}

// NewActionExecutor creates an ActionExecutor.
func NewActionExecutor(bus eventbus.Publisher, reader device.StateReader, s store.Store) *ActionExecutor {
	return &ActionExecutor{bus: bus, reader: reader, store: s}
}

// Execute processes a single automation action. For set_device_state, it
// compares desired state with current state and skips no-ops. For
// activate_scene, it expands the scene into individual commands.
func (a *ActionExecutor) Execute(action store.AutomationAction) {
	switch action.ActionType {
	case ActionSetDeviceState:
		a.executeSetDeviceState(action)
	case ActionActivateScene:
		a.executeActivateScene(action)
	}
}

func (a *ActionExecutor) executeSetDeviceState(action store.AutomationAction) {
	if action.DeviceID == nil {
		return
	}
	deviceID := *action.DeviceID

	var desired map[string]any
	if err := json.Unmarshal([]byte(action.Payload), &desired); err != nil {
		log.Printf("automation: invalid action payload for device %s: %v", deviceID, err)
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

func (a *ActionExecutor) executeActivateScene(action store.AutomationAction) {
	sceneID := action.Payload
	actions, err := a.store.ListSceneActions(context.Background(), sceneID)
	if err != nil {
		log.Printf("automation: scene %s not found: %v", sceneID, err)
		return
	}
	if len(actions) == 0 {
		return
	}

	for _, sa := range actions {
		var desired map[string]any
		if err := json.Unmarshal([]byte(sa.Payload), &desired); err != nil {
			log.Printf("automation: invalid scene action payload for device %s: %v", sa.DeviceID, err)
			continue
		}

		if a.stateMatches(sa.DeviceID, desired) {
			continue
		}

		cmd := device.DeviceCommand{
			DeviceID: sa.DeviceID,
			Payload:  buildLightCommand(desired),
		}
		a.bus.Publish(eventbus.Event{
			Type:      eventbus.EventCommandRequested,
			DeviceID:  string(sa.DeviceID),
			Timestamp: time.Now(),
			Payload:   cmd,
		})
	}
}
