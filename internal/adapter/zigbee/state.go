package zigbee

import (
	"encoding/json"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func mapLightState(raw json.RawMessage) (device.LightState, error) {
	var dto z2mDeviceState
	if err := json.Unmarshal(raw, &dto); err != nil {
		return device.LightState{}, err
	}

	var state device.LightState

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

	return state, nil
}

func mapSensorState(raw json.RawMessage) (device.SensorState, error) {
	var dto z2mDeviceState
	if err := json.Unmarshal(raw, &dto); err != nil {
		return device.SensorState{}, err
	}

	return device.SensorState{
		Temperature: dto.Temperature,
		Humidity:    dto.Humidity,
		Battery:     dto.Battery,
		Pressure:    dto.Pressure,
		Illuminance: dto.Illuminance,
	}, nil
}

func mapSwitchState(raw json.RawMessage) (device.SwitchState, error) {
	var dto z2mDeviceState
	if err := json.Unmarshal(raw, &dto); err != nil {
		return device.SwitchState{}, err
	}

	var state device.SwitchState
	if dto.Action != "" {
		state.Action = device.Ptr(dto.Action)
	}

	return state, nil
}
