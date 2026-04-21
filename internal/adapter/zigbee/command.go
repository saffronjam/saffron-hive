package zigbee

import (
	"encoding/json"

	"github.com/saffronjam/saffron-hive/internal/device"
)

type z2mSetPayload struct {
	State      string    `json:"state,omitempty"`
	Brightness *int      `json:"brightness,omitempty"`
	ColorTemp  *int      `json:"color_temp,omitempty"`
	Color      *z2mColor `json:"color,omitempty"`
	Transition *float64  `json:"transition,omitempty"`
}

func translateCommand(cmd device.Command) z2mSetPayload {
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

func (a *ZigbeeAdapter) handleCommand(cmd device.Command) {
	a.mu.RLock()
	friendlyName, ok := a.idToName[cmd.DeviceID]
	a.mu.RUnlock()

	if !ok {
		logger.Warn("command for unknown device", "device_id", cmd.DeviceID)
		return
	}

	payload := translateCommand(cmd)
	data, err := json.Marshal(payload)
	if err != nil {
		logger.Error("failed to marshal command", "error", err)
		return
	}

	topic := "zigbee2mqtt/" + friendlyName + "/set"
	if err := a.mqtt.Publish(topic, 0, false, data); err != nil {
		logger.Error("failed to publish command", "topic", topic, "error", err)
	}
}
