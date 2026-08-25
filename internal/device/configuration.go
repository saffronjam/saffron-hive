package device

import (
	"fmt"
	"math"
	"sort"
)

// ConfigurationValue is one reported or requested device setting. Exactly one
// typed value is non-nil.
type ConfigurationValue struct {
	Capability   string   `json:"capability"`
	BooleanValue *bool    `json:"booleanValue,omitempty"`
	NumberValue  *float64 `json:"numberValue,omitempty"`
	StringValue  *string  `json:"stringValue,omitempty"`
}

// ConfigurationChange is a partial reported configuration update.
type ConfigurationChange struct {
	Values []ConfigurationValue `json:"values"`
	Origin CommandOrigin        `json:"origin,omitzero"`
}

// ConfigurationRequest asks an adapter to write one device's settings.
type ConfigurationRequest struct {
	DeviceID DeviceID             `json:"deviceId"`
	Values   []ConfigurationValue `json:"values"`
	Origin   CommandOrigin        `json:"origin,omitzero"`
}

// ConfigurationReader provides read-only access to confirmed device settings.
type ConfigurationReader interface {
	GetDeviceConfiguration(DeviceID) []ConfigurationValue
}

// ConfigurationWriter merges partial confirmed device settings.
type ConfigurationWriter interface {
	UpdateDeviceConfiguration(DeviceID, []ConfigurationValue)
}

// SortConfigurationValues returns a stable copy ordered by capability name.
func SortConfigurationValues(values []ConfigurationValue) []ConfigurationValue {
	out := append([]ConfigurationValue(nil), values...)
	sort.Slice(out, func(i, j int) bool { return out[i].Capability < out[j].Capability })
	return out
}

// ValidateConfigurationValues validates a non-empty configuration batch
// against one device's advertised settings.
func ValidateConfigurationValues(d Device, values []ConfigurationValue) error {
	if d.Removed {
		return fmt.Errorf("device %q has been removed", d.DisplayName())
	}
	if d.RuntimeDisabled() {
		return fmt.Errorf("device %q is disabled; enable it before sending commands", d.DisplayName())
	}
	if len(values) == 0 {
		return fmt.Errorf("at least one setting is required")
	}

	capabilities := make(map[string]Capability, len(d.Capabilities))
	for _, capability := range d.Capabilities {
		capabilities[capability.Name] = capability
	}
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		if value.Capability == "" {
			return fmt.Errorf("setting capability is required")
		}
		if _, duplicate := seen[value.Capability]; duplicate {
			return fmt.Errorf("setting %q is duplicated", value.Capability)
		}
		seen[value.Capability] = struct{}{}

		capability, ok := capabilities[value.Capability]
		if !ok {
			return fmt.Errorf("device %q does not expose setting %q", d.DisplayName(), value.Capability)
		}
		if capability.EffectiveCategory() != CapabilityCategoryConfiguration {
			return fmt.Errorf("capability %q is not device configuration", value.Capability)
		}
		if !capability.CanSet() {
			return fmt.Errorf("setting %q is read-only", value.Capability)
		}
		if err := validateConfigurationValue(capability, value); err != nil {
			return err
		}
	}
	return nil
}

func validateConfigurationValue(capability Capability, value ConfigurationValue) error {
	count := 0
	if value.BooleanValue != nil {
		count++
	}
	if value.NumberValue != nil {
		count++
	}
	if value.StringValue != nil {
		count++
	}
	if count != 1 {
		return fmt.Errorf("setting %q must contain exactly one typed value", value.Capability)
	}

	switch capability.Type {
	case "binary":
		if value.BooleanValue == nil {
			return fmt.Errorf("setting %q requires a boolean value", value.Capability)
		}
	case "numeric":
		if value.NumberValue == nil {
			return fmt.Errorf("setting %q requires a numeric value", value.Capability)
		}
		if math.IsNaN(*value.NumberValue) || math.IsInf(*value.NumberValue, 0) {
			return fmt.Errorf("setting %q must be finite", value.Capability)
		}
		if capability.ValueMin != nil && *value.NumberValue < *capability.ValueMin {
			return fmt.Errorf("setting %q must be at least %v", value.Capability, *capability.ValueMin)
		}
		if capability.ValueMax != nil && *value.NumberValue > *capability.ValueMax {
			return fmt.Errorf("setting %q must be at most %v", value.Capability, *capability.ValueMax)
		}
	case "enum":
		if value.StringValue == nil {
			return fmt.Errorf("setting %q requires a string value", value.Capability)
		}
		valid := false
		for _, allowed := range capability.Values {
			if *value.StringValue == allowed {
				valid = true
				break
			}
		}
		if !valid {
			return fmt.Errorf("setting %q has unsupported value %q", value.Capability, *value.StringValue)
		}
	case "text":
		if value.StringValue == nil {
			return fmt.Errorf("setting %q requires a string value", value.Capability)
		}
	default:
		return fmt.Errorf("setting %q has unsupported type %q", value.Capability, capability.Type)
	}
	return nil
}

// ConfigurationValuesEqual compares typed configuration values.
func ConfigurationValuesEqual(a, b ConfigurationValue) bool {
	if a.Capability != b.Capability {
		return false
	}
	if a.BooleanValue != nil || b.BooleanValue != nil {
		return a.BooleanValue != nil && b.BooleanValue != nil && *a.BooleanValue == *b.BooleanValue
	}
	if a.NumberValue != nil || b.NumberValue != nil {
		return a.NumberValue != nil && b.NumberValue != nil && *a.NumberValue == *b.NumberValue
	}
	if a.StringValue != nil || b.StringValue != nil {
		return a.StringValue != nil && b.StringValue != nil && *a.StringValue == *b.StringValue
	}
	return true
}

// ConfigurationChanges removes values already confirmed by a device.
func ConfigurationChanges(current, desired []ConfigurationValue) []ConfigurationValue {
	confirmed := make(map[string]ConfigurationValue, len(current))
	for _, value := range current {
		confirmed[value.Capability] = value
	}
	out := make([]ConfigurationValue, 0, len(desired))
	for _, value := range desired {
		if old, ok := confirmed[value.Capability]; ok && ConfigurationValuesEqual(old, value) {
			continue
		}
		out = append(out, value)
	}
	return out
}
