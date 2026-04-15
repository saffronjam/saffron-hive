package device

// DeviceCommand represents a command to be sent to a specific device.
// Payload holds the typed command (e.g. LightCommand) and is one of the two
// allowed uses of any in the codebase.
type DeviceCommand struct {
	DeviceID DeviceID
	Payload  any
}
