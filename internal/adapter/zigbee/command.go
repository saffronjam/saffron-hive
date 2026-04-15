package zigbee

import (
	"encoding/json"
	"log"

	"github.com/saffronjam/saffron-hive/internal/device"
)

type z2mSetPayload struct {
	State      string    `json:"state,omitempty"`
	Brightness *int      `json:"brightness,omitempty"`
	ColorTemp  *int      `json:"color_temp,omitempty"`
	Color      *z2mColor `json:"color,omitempty"`
	Transition *float64  `json:"transition,omitempty"`
}

func translateLightCommand(cmd device.LightCommand) z2mSetPayload {
	var p z2mSetPayload

	if cmd.On != nil {
		if *cmd.On {
			p.State = "ON"
		} else {
			p.State = "OFF"
		}
	}

	p.Brightness = cmd.Brightness
	p.ColorTemp = cmd.ColorTemp
	p.Transition = cmd.Transition

	if cmd.Color != nil {
		p.Color = &z2mColor{
			R: cmd.Color.R,
			G: cmd.Color.G,
			B: cmd.Color.B,
			X: cmd.Color.X,
			Y: cmd.Color.Y,
		}
	}

	return p
}

func (a *ZigbeeAdapter) handleCommand(cmd device.DeviceCommand) {
	a.mu.RLock()
	friendlyName, ok := a.idToName[cmd.DeviceID]
	a.mu.RUnlock()

	if !ok {
		log.Printf("zigbee: command for unknown device %s", cmd.DeviceID)
		return
	}

	lightCmd, ok := cmd.Payload.(device.LightCommand)
	if !ok {
		log.Printf("zigbee: unsupported command payload type for device %s", cmd.DeviceID)
		return
	}

	payload := translateLightCommand(lightCmd)
	data, err := json.Marshal(payload)
	if err != nil {
		log.Printf("zigbee: failed to marshal command: %v", err)
		return
	}

	topic := "zigbee2mqtt/" + friendlyName + "/set"
	if err := a.mqtt.Publish(topic, 0, false, data); err != nil {
		log.Printf("zigbee: failed to publish command to %s: %v", topic, err)
	}
}
