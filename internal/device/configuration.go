package device

import (
	"fmt"
	"math"
	"sort"
)

// AttributeValue is one reported or requested value of a generic device
// attribute: a setting (configuration capability) or a reading Hive does not
// model as typed state (diagnostic capability). Exactly one typed value is
// non-nil.
type AttributeValue struct {
	Capability   string   `json:"capability"`
	BooleanValue *bool    `json:"booleanValue,omitempty"`
	NumberValue  *float64 `json:"numberValue,omitempty"`
	StringValue  *string  `json:"stringValue,omitempty"`
}

// AttributeChange is a partial reported attribute update.
type AttributeChange struct {
	Values []AttributeValue `json:"values"`
	Origin CommandOrigin    `json:"origin,omitzero"`
}

// ConfigurationRequest asks an adapter to write one device's settings.
type ConfigurationRequest struct {
	DeviceID DeviceID         `json:"deviceId"`
	Values   []AttributeValue `json:"values"`
	Origin   CommandOrigin    `json:"origin,omitzero"`
}

// AttributeReader provides read-only access to reported device attributes.
type AttributeReader interface {
	GetDeviceAttributes(DeviceID) []AttributeValue
}

// AttributeWriter merges partial reported device attributes.
type AttributeWriter interface {
	UpdateDeviceAttributes(DeviceID, []AttributeValue)
}

// SortAttributeValues returns a stable copy ordered by capability name.
func SortAttributeValues(values []AttributeValue) []AttributeValue {
	out := append([]AttributeValue(nil), values...)
	sort.Slice(out, func(i, j int) bool { return out[i].Capability < out[j].Capability })
	return out
}

// ValidateConfigurationValues validates a non-empty configuration batch
// against one device's advertised settings.
func ValidateConfigurationValues(d Device, values []AttributeValue) error {
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

func validateConfigurationValue(capability Capability, value AttributeValue) error {
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
	case CapabilityTypeFlags:
		if value.NumberValue == nil {
			return fmt.Errorf("setting %q requires a numeric bitmask", value.Capability)
		}
		if !ValidFlagsMask(*value.NumberValue, len(capability.Values)) {
			return fmt.Errorf("setting %q must be a bitmask of %d flags", value.Capability, len(capability.Values))
		}
	default:
		return fmt.Errorf("setting %q has unsupported type %q", value.Capability, capability.Type)
	}
	return nil
}

// AttributeValuesEqual compares typed attribute values.
func AttributeValuesEqual(a, b AttributeValue) bool {
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
func ConfigurationChanges(current, desired []AttributeValue) []AttributeValue {
	confirmed := make(map[string]AttributeValue, len(current))
	for _, value := range current {
		confirmed[value.Capability] = value
	}
	out := make([]AttributeValue, 0, len(desired))
	for _, value := range desired {
		if old, ok := confirmed[value.Capability]; ok && AttributeValuesEqual(old, value) {
			continue
		}
		out = append(out, value)
	}
	return out
}

// MaxFlags bounds a flags capability so its bitmask stays exact in the float64
// that AttributeValue.NumberValue and GraphQL Float carry.
const MaxFlags = 52

// ValidFlagsMask reports whether mask is a whole-number bitmask that sets no
// bit beyond the first count flags.
func ValidFlagsMask(mask float64, count int) bool {
	if count <= 0 || count > MaxFlags || mask < 0 || mask != math.Trunc(mask) {
		return false
	}
	return mask < math.Exp2(float64(count))
}
