package device

// MergeLightState merges a partial update into an existing LightState.
// Non-nil pointer fields in update overwrite the corresponding fields in current.
func MergeLightState(current, update LightState) LightState {
	if update.On != nil {
		current.On = update.On
	}
	if update.Brightness != nil {
		current.Brightness = update.Brightness
	}
	if update.ColorTemp != nil {
		current.ColorTemp = update.ColorTemp
	}
	if update.Color != nil {
		current.Color = update.Color
	}
	if update.Transition != nil {
		current.Transition = update.Transition
	}
	return current
}

// MergeSensorState merges a partial update into an existing SensorState.
// Non-nil pointer fields in update overwrite the corresponding fields in current.
func MergeSensorState(current, update SensorState) SensorState {
	if update.Temperature != nil {
		current.Temperature = update.Temperature
	}
	if update.Humidity != nil {
		current.Humidity = update.Humidity
	}
	if update.Battery != nil {
		current.Battery = update.Battery
	}
	if update.Pressure != nil {
		current.Pressure = update.Pressure
	}
	if update.Illuminance != nil {
		current.Illuminance = update.Illuminance
	}
	return current
}
