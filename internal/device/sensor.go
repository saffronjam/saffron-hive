package device

// SensorState represents the current readings from a sensor device.
// All fields are pointers because not every sensor reports every value.
type SensorState struct {
	Temperature *float64
	Humidity    *float64
	Battery     *int
	Pressure    *float64
	Illuminance *float64
}
