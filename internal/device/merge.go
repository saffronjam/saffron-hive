package device

// MergeDeviceState merges a partial update into an existing DeviceState.
// Non-nil pointer fields in update overwrite the corresponding fields in
// current; nil fields in update leave current untouched. This preserves the
// convention that "absent field" means "no change reported," so the store
// always holds the most recent known value for every capability a device has
// ever reported.
func MergeDeviceState(current, update DeviceState) DeviceState {
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
	if update.Temperature != nil {
		current.Temperature = update.Temperature
	}
	if update.Humidity != nil {
		current.Humidity = update.Humidity
	}
	if update.Pressure != nil {
		current.Pressure = update.Pressure
	}
	if update.Illuminance != nil {
		current.Illuminance = update.Illuminance
	}
	if update.Battery != nil {
		current.Battery = update.Battery
	}
	if update.Power != nil {
		current.Power = update.Power
	}
	if update.Voltage != nil {
		current.Voltage = update.Voltage
	}
	if update.Current != nil {
		current.Current = update.Current
	}
	if update.Energy != nil {
		current.Energy = update.Energy
	}
	return current
}
