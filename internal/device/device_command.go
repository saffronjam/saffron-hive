package device

import (
	"fmt"
	"slices"
)

// DeviceCommandRequest asks a device to run one write-only operation, such as
// identify or restart, exposed as a command-category capability. The device
// never reports the value back, so the request is delivered once and has no
// confirmation step.
type DeviceCommandRequest struct {
	DeviceID   DeviceID      `json:"deviceId"`
	Capability string        `json:"capability"`
	Value      string        `json:"value"`
	Origin     CommandOrigin `json:"origin,omitzero"`
}

// ValidateDeviceCommand checks a command request against the device's
// advertised command capabilities.
func ValidateDeviceCommand(d Device, request DeviceCommandRequest) error {
	if d.Removed {
		return fmt.Errorf("device %q has been removed", d.DisplayName())
	}
	if d.RuntimeDisabled() {
		return fmt.Errorf("device %q is disabled; enable it before sending commands", d.DisplayName())
	}
	capability, ok := d.Capability(request.Capability)
	if !ok {
		return fmt.Errorf("device %q does not expose command %q", d.DisplayName(), request.Capability)
	}
	if capability.EffectiveCategory() != CapabilityCategoryCommand {
		return fmt.Errorf("capability %q is not a device command", request.Capability)
	}
	switch capability.Type {
	case "enum":
		if !slices.Contains(capability.Values, request.Value) {
			return fmt.Errorf("command %q has unsupported value %q", request.Capability, request.Value)
		}
	case "binary":
		if _, err := ParseCommandBoolean(request.Value); err != nil {
			return fmt.Errorf("command %q: %w", request.Capability, err)
		}
	default:
		return fmt.Errorf("command %q has unsupported type %q", request.Capability, capability.Type)
	}
	return nil
}

// ParseCommandBoolean reads the value of a binary command.
func ParseCommandBoolean(value string) (bool, error) {
	switch value {
	case "true", "ON", "on":
		return true, nil
	case "false", "OFF", "off":
		return false, nil
	}
	return false, fmt.Errorf("value %q is not a boolean", value)
}
