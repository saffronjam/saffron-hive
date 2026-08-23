package device

// commandFieldCapabilities maps command-payload field names to the capability
// constant a device must expose to accept that field. Fields not listed here
// (e.g. "transition") are treated as protocol-level modifiers and always
// pass through.
var commandFieldCapabilities = map[string]string{
	"on":                CapOnOff,
	"brightness":        CapBrightness,
	"colorTemp":         CapColorTemp,
	"color":             CapColor,
	"targetTemperature": CapTargetTemperature,
	"hvacMode":          CapHvacMode,
	"fanMode":           CapFanMode,
	"swing":             CapSwing,
}

// FilterCommandFields returns a copy of fields containing only those entries
// the given device can write. Best-effort: fields requiring a capability the
// device cannot set are dropped; unknown fields pass through.
// Used when a single payload fans out to a heterogeneous group/room so a
// plug in a mixed group never receives a stray "brightness" field.
//
// Devices with no reported capabilities (unknown / not yet discovered) are
// treated as permissive and the full payload passes through — the filter
// only tightens behavior when we have positive capability evidence.
func FilterCommandFields(fields map[string]any, dev Device) map[string]any {
	if len(dev.Capabilities) == 0 {
		out := make(map[string]any, len(fields))
		for k, v := range fields {
			out[k] = v
		}
		return out
	}
	out := make(map[string]any, len(fields))
	for k, v := range fields {
		if req, ok := commandFieldCapabilities[k]; ok {
			capability, found := dev.Capability(req)
			if !found || !capability.CanSet() {
				continue
			}
		}
		out[k] = v
	}
	return out
}

// FilterReportedState drops values the device does not declare as reportable.
// Devices without capability metadata pass through unchanged because their
// discovery information may not be available yet.
func FilterReportedState(state DeviceState, dev Device) DeviceState {
	if len(dev.Capabilities) == 0 {
		return state
	}

	reports := func(name string) bool {
		capability, ok := dev.Capability(name)
		return ok && capability.ReportsValue()
	}
	if !reports(CapOnOff) {
		state.On = nil
	}
	if !reports(CapBrightness) {
		state.Brightness = nil
	}
	if !reports(CapColorTemp) {
		state.ColorTemp = nil
	}
	if !reports(CapColor) {
		state.Color = nil
	}
	if !reports(CapTemperature) {
		state.Temperature = nil
	}
	if !reports(CapHumidity) {
		state.Humidity = nil
	}
	if !reports(CapPressure) {
		state.Pressure = nil
	}
	if !reports(CapIlluminance) {
		state.Illuminance = nil
	}
	if !reports(CapOccupancy) {
		state.Occupancy = nil
	}
	if !reports(CapContact) {
		state.Contact = nil
	}
	if !reports(CapOrientation) {
		state.Orientation = nil
	}
	if !reports(CapDevicePosture) {
		state.DevicePosture = nil
	}
	if !reports(CapLinkQuality) {
		state.LinkQuality = nil
	}
	if !reports(CapBattery) {
		state.Battery = nil
	}
	if !reports(CapPower) {
		state.Power = nil
	}
	if !reports(CapVoltage) {
		state.Voltage = nil
	}
	if !reports(CapCurrent) {
		state.Current = nil
	}
	if !reports(CapEnergy) {
		state.Energy = nil
	}
	if !reports(CapTargetTemperature) {
		state.TargetTemperature = nil
	}
	if !reports(CapHvacMode) {
		state.HvacMode = nil
	}
	if !reports(CapFanMode) {
		state.FanMode = nil
	}
	if !reports(CapSwing) {
		state.Swing = nil
	}
	return state
}
