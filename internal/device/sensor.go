package device

// SensorState represents the current readings from a sensor device.
// All fields are pointers because not every sensor reports every value.
type SensorState struct {
	Temperature *float64 `json:"temperature,omitempty"`
	Humidity    *float64 `json:"humidity,omitempty"`
	Battery     *int     `json:"battery,omitempty"`
	Pressure    *float64 `json:"pressure,omitempty"`
	Illuminance *float64 `json:"illuminance,omitempty"`
}
