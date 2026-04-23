// Package history persists device state samples into SQLite and exposes a
// retention loop that prunes them on a fixed interval. The recorder
// decomposes each EventDeviceStateChanged into one row per non-nil scalar
// field so cross-device time series share a single shape and can be plotted
// on the same chart regardless of device type.
package history

// Field names used on wire and in the database. Keep aligned with the scalar
// fields on device.DeviceState; booleans are recorded as 0 or 1.
const (
	FieldOn          = "on"
	FieldBrightness  = "brightness"
	FieldColorTemp   = "colorTemp"
	FieldTemperature = "temperature"
	FieldHumidity    = "humidity"
	FieldPressure    = "pressure"
	FieldIlluminance = "illuminance"
	FieldBattery     = "battery"
	FieldPower       = "power"
	FieldVoltage     = "voltage"
	FieldCurrent     = "current"
	FieldEnergy      = "energy"
)

// AllFields is the full set of recordable scalar fields, in a stable display
// order. Consumers that need a whitelist (the GraphQL resolver, the frontend
// field picker) depend on this list.
var AllFields = []string{
	FieldOn,
	FieldBrightness,
	FieldColorTemp,
	FieldTemperature,
	FieldHumidity,
	FieldPressure,
	FieldIlluminance,
	FieldBattery,
	FieldPower,
	FieldVoltage,
	FieldCurrent,
	FieldEnergy,
}

var fieldSet = func() map[string]struct{} {
	m := make(map[string]struct{}, len(AllFields))
	for _, f := range AllFields {
		m[f] = struct{}{}
	}
	return m
}()

// IsKnownField reports whether f is one of AllFields.
func IsKnownField(f string) bool {
	_, ok := fieldSet[f]
	return ok
}
