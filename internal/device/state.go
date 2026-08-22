package device

// Color represents a light color in both RGB and CIE xy color spaces.
type Color struct {
	R int     `json:"r"`
	G int     `json:"g"`
	B int     `json:"b"`
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// DeviceStateChange is the payload carried by eventbus.EventDeviceStateChanged.
// State holds the (partial) reported snapshot from the device; Origin propagates
// the upstream command's origin onto the resulting echo so consumers can match
// echoes to the source that produced them. Origin is zero for unsolicited
// state changes (drift, foreign apps, manual toggles at the device).
type DeviceStateChange struct {
	State  DeviceState   `json:"state" expr:"state"`
	Origin CommandOrigin `json:"origin,omitzero" expr:"origin"`
}

// DeviceState is the current snapshot of a device across every capability it
// reports. Each field is a pointer; nil means the device does not report (or
// has not yet reported) that value. Partial updates arrive on the event bus
// and are merged into the stored state by MemoryStore.UpdateDeviceState.
//
// The set of non-nil fields reflects what the device actually publishes, not
// its DeviceType — a button with a voltmeter may populate both Action-adjacent
// metering fields and a sensor reading; fields are independent.
//
// Button presses are carried by eventbus.EventDeviceActionFired (payload
// device.Action), not by this struct.
type DeviceState struct {
	On                *bool    `json:"on,omitempty" expr:"on"`
	Brightness        *int     `json:"brightness,omitempty" expr:"brightness"`
	ColorTemp         *int     `json:"colorTemp,omitempty" expr:"colorTemp"`
	Color             *Color   `json:"color,omitempty" expr:"color"`
	Transition        *float64 `json:"transition,omitempty" expr:"transition"`
	Temperature       *float64 `json:"temperature,omitempty" expr:"temperature"`
	Humidity          *float64 `json:"humidity,omitempty" expr:"humidity"`
	Pressure          *float64 `json:"pressure,omitempty" expr:"pressure"`
	Illuminance       *float64 `json:"illuminance,omitempty" expr:"illuminance"`
	Occupancy         *bool    `json:"occupancy,omitempty" expr:"occupancy"`
	Contact           *bool    `json:"contact,omitempty" expr:"contact"`
	Orientation       *string  `json:"orientation,omitempty" expr:"orientation"`
	DevicePosture     *string  `json:"devicePosture,omitempty" expr:"devicePosture"`
	LinkQuality       *float64 `json:"linkQuality,omitempty" expr:"linkQuality"`
	Battery           *float64 `json:"battery,omitempty" expr:"battery"`
	Power             *float64 `json:"power,omitempty" expr:"power"`
	Voltage           *float64 `json:"voltage,omitempty" expr:"voltage"`
	Current           *float64 `json:"current,omitempty" expr:"current"`
	Energy            *float64 `json:"energy,omitempty" expr:"energy"`
	TargetTemperature *float64 `json:"targetTemperature,omitempty" expr:"targetTemperature"`
	HvacMode          *string  `json:"hvacMode,omitempty" expr:"hvacMode"`
	FanMode           *string  `json:"fanMode,omitempty" expr:"fanMode"`
	Swing             *string  `json:"swing,omitempty" expr:"swing"`
}

// DeviceStateField identifies a clearable field on DeviceState. Used by
// adapters that learn a previously-cached value is no longer authoritative
// and need to nil it out — the merge protocol on its own can only overwrite,
// not clear, since a nil pointer in an update means "no change reported".
type DeviceStateField int

const (
	FieldColorTemp DeviceStateField = iota
	FieldColor
)
