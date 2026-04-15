package device

// StateReader provides read-only access to device state.
type StateReader interface {
	GetDevice(DeviceID) (Device, bool)
	GetLightState(DeviceID) (*LightState, bool)
	GetSensorState(DeviceID) (*SensorState, bool)
	GetSwitchState(DeviceID) (*SwitchState, bool)
	ListDevices() []Device
}

// StateWriter provides write access to device state.
type StateWriter interface {
	Register(Device)
	Remove(DeviceID)
	UpdateLightState(DeviceID, LightState)
	UpdateSensorState(DeviceID, SensorState)
	UpdateSwitchState(DeviceID, SwitchState)
	SetAvailability(DeviceID, bool)
}

// StateStore combines read and write access.
type StateStore interface {
	StateReader
	StateWriter
}
