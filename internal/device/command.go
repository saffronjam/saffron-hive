package device

// Command represents a desired state to push to a device. It is the payload
// for eventbus.EventCommandRequested. Each field is a pointer so that only
// explicitly set attributes are applied — unset fields leave the target's
// current state untouched.
//
// A light typically uses On/Brightness/ColorTemp/Color/Transition. A plug
// uses only On. Sensors and buttons are read-only and are not commanded.
type Command struct {
	DeviceID   DeviceID `json:"deviceId"`
	On         *bool    `json:"on,omitempty"`
	Brightness *int     `json:"brightness,omitempty"`
	ColorTemp  *int     `json:"colorTemp,omitempty"`
	Color      *Color   `json:"color,omitempty"`
	Transition *float64 `json:"transition,omitempty"`
}
