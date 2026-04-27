package zigbee

import (
	"encoding/json"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// defaultTransitionSeconds is applied to every visual-state command that
// doesn't specify one, so on/off/brightness/color changes fade smoothly on
// the device rather than snapping. Callers that want a different duration
// (or an instant change, 0) set Transition explicitly.
const defaultTransitionSeconds = 0.6

type z2mSetPayload struct {
	State      string       `json:"state,omitempty"`
	Brightness *int         `json:"brightness,omitempty"`
	ColorTemp  *int         `json:"color_temp,omitempty"`
	Color      *z2mSetColor `json:"color,omitempty"`
	Transition *float64     `json:"transition,omitempty"`
}

// z2mSetColor is the outbound color shape. It marshals as either {r,g,b}
// or {x,y}, never both: zigbee2mqtt prefers x/y when both are present, and
// (0,0) is invalid CIE 1931 — sending {r,g,b,x:0,y:0} causes some bulbs to
// silently ignore the command. Inbound state parsing uses z2mColor instead,
// which carries every field z2m reports.
type z2mSetColor struct {
	R int
	G int
	B int
	X float64
	Y float64
}

func (c z2mSetColor) MarshalJSON() ([]byte, error) {
	if c.X > 0 || c.Y > 0 {
		return json.Marshal(struct {
			X float64 `json:"x"`
			Y float64 `json:"y"`
		}{c.X, c.Y})
	}
	return json.Marshal(struct {
		R int `json:"r"`
		G int `json:"g"`
		B int `json:"b"`
	}{c.R, c.G, c.B})
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
		p.Color = &z2mSetColor{
			R: cmd.Color.R,
			G: cmd.Color.G,
			B: cmd.Color.B,
			X: cmd.Color.X,
			Y: cmd.Color.Y,
		}
	}

	if p.Transition == nil {
		t := defaultTransitionSeconds
		p.Transition = &t
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

	a.recordPendingOrigin(cmd.DeviceID, cmd.Origin)

	topic := "zigbee2mqtt/" + friendlyName + "/set"
	if err := a.mqtt.Publish(topic, 0, false, data); err != nil {
		logger.Error("failed to publish command", "topic", topic, "error", err)
	}
}
