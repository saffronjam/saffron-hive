// Package history persists device state samples into SQLite and exposes a
// retention loop that prunes them on a fixed interval.
package history

// ValueKind controls storage, aggregation, and presentation for a field.
type ValueKind string

const (
	ValueKindNumber  ValueKind = "number"
	ValueKindBoolean ValueKind = "boolean"
	ValueKindText    ValueKind = "text"
)

const (
	FieldOn            = "on"
	FieldBrightness    = "brightness"
	FieldColorTemp     = "colorTemp"
	FieldTargetTemp    = "targetTemperature"
	FieldTemperature   = "temperature"
	FieldHumidity      = "humidity"
	FieldPressure      = "pressure"
	FieldIlluminance   = "illuminance"
	FieldBattery       = "battery"
	FieldPower         = "power"
	FieldVoltage       = "voltage"
	FieldCurrent       = "current"
	FieldEnergy        = "energy"
	FieldOccupancy     = "occupancy"
	FieldContact       = "contact"
	FieldOrientation   = "orientation"
	FieldDevicePosture = "devicePosture"
	FieldLinkQuality   = "linkQuality"
	FieldHvacMode      = "hvacMode"
	FieldFanMode       = "fanMode"
	FieldSwing         = "swing"
)

var fieldKinds = map[string]ValueKind{
	FieldOn:            ValueKindBoolean,
	FieldBrightness:    ValueKindNumber,
	FieldColorTemp:     ValueKindNumber,
	FieldTargetTemp:    ValueKindNumber,
	FieldTemperature:   ValueKindNumber,
	FieldHumidity:      ValueKindNumber,
	FieldPressure:      ValueKindNumber,
	FieldIlluminance:   ValueKindNumber,
	FieldBattery:       ValueKindNumber,
	FieldPower:         ValueKindNumber,
	FieldVoltage:       ValueKindNumber,
	FieldCurrent:       ValueKindNumber,
	FieldEnergy:        ValueKindNumber,
	FieldOccupancy:     ValueKindBoolean,
	FieldContact:       ValueKindBoolean,
	FieldOrientation:   ValueKindText,
	FieldDevicePosture: ValueKindText,
	FieldLinkQuality:   ValueKindNumber,
	FieldHvacMode:      ValueKindText,
	FieldFanMode:       ValueKindText,
	FieldSwing:         ValueKindText,
}

var AllFields = []string{
	FieldOn,
	FieldBrightness,
	FieldColorTemp,
	FieldTargetTemp,
	FieldTemperature,
	FieldHumidity,
	FieldPressure,
	FieldIlluminance,
	FieldBattery,
	FieldPower,
	FieldVoltage,
	FieldCurrent,
	FieldEnergy,
	FieldOccupancy,
	FieldContact,
	FieldOrientation,
	FieldDevicePosture,
	FieldLinkQuality,
	FieldHvacMode,
	FieldFanMode,
	FieldSwing,
}

func IsKnownField(field string) bool {
	_, ok := fieldKinds[field]
	return ok
}

func Kind(field string) ValueKind {
	return fieldKinds[field]
}

func IsStatefulField(field string) bool {
	kind := Kind(field)
	return kind == ValueKindBoolean || kind == ValueKindText
}

func StatefulFields() []string {
	out := make([]string, 0, len(AllFields))
	for _, field := range AllFields {
		if IsStatefulField(field) {
			out = append(out, field)
		}
	}
	return out
}

func NumericFields() []string {
	out := make([]string, 0, len(AllFields))
	for _, field := range AllFields {
		if Kind(field) == ValueKindNumber {
			out = append(out, field)
		}
	}
	return out
}
