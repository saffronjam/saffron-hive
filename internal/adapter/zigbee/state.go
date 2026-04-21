package zigbee

import (
	"encoding/json"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// mapDeviceState parses a zigbee2mqtt state payload into a device.DeviceState.
// Every known field is populated independently; a single payload may report
// light, sensor, and metering values simultaneously. Action is handled by
// mapAction and published as a separate event.
func mapDeviceState(raw json.RawMessage) (device.DeviceState, error) {
	var dto z2mDeviceState
	if err := json.Unmarshal(raw, &dto); err != nil {
		return device.DeviceState{}, err
	}

	var state device.DeviceState

	if dto.State != "" {
		on := dto.State == "ON"
		state.On = &on
	}
	if dto.Brightness != 0 {
		state.Brightness = device.Ptr(dto.Brightness)
	}
	if dto.ColorTemp != 0 {
		state.ColorTemp = device.Ptr(dto.ColorTemp)
	}
	if dto.Color != nil {
		state.Color = &device.Color{
			R: dto.Color.R,
			G: dto.Color.G,
			B: dto.Color.B,
			X: dto.Color.X,
			Y: dto.Color.Y,
		}
	}

	state.Temperature = dto.Temperature
	state.Humidity = dto.Humidity
	state.Pressure = dto.Pressure
	state.Illuminance = dto.Illuminance
	state.Battery = dto.Battery

	state.Power = dto.Power
	state.Voltage = dto.Voltage
	state.Current = dto.Current
	state.Energy = dto.Energy

	return state, nil
}

// mapAction extracts a button action from a zigbee2mqtt state payload. Returns
// ("", false) when the payload contains no action field or it is empty.
func mapAction(raw json.RawMessage) (string, bool) {
	var dto z2mDeviceState
	if err := json.Unmarshal(raw, &dto); err != nil {
		return "", false
	}
	if dto.Action == "" {
		return "", false
	}
	return dto.Action, true
}
