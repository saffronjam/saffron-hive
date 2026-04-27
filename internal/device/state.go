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
	State  DeviceState   `json:"state"`
	Origin CommandOrigin `json:"origin,omitzero"`
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
	On          *bool    `json:"on,omitempty"`
	Brightness  *int     `json:"brightness,omitempty"`
	ColorTemp   *int     `json:"colorTemp,omitempty"`
	Color       *Color   `json:"color,omitempty"`
	Transition  *float64 `json:"transition,omitempty"`
	Temperature *float64 `json:"temperature,omitempty"`
	Humidity    *float64 `json:"humidity,omitempty"`
	Pressure    *float64 `json:"pressure,omitempty"`
	Illuminance *float64 `json:"illuminance,omitempty"`
	Battery     *float64 `json:"battery,omitempty"`
	Power       *float64 `json:"power,omitempty"`
	Voltage     *float64 `json:"voltage,omitempty"`
	Current     *float64 `json:"current,omitempty"`
	Energy      *float64 `json:"energy,omitempty"`
}
