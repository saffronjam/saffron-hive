package device

import "testing"

func TestCapabilityAccessBits(t *testing.T) {
	capability := Capability{Access: CapabilityAccessState | CapabilityAccessSet}
	if !capability.ReportsValue() || !capability.CanSet() || capability.CanGet() {
		t.Fatalf("unexpected access semantics for %d", capability.Access)
	}
}

func TestValidateConfigurationValues(t *testing.T) {
	minimum := 1.0
	maximum := 10.0
	dev := Device{
		ID:           "sensor-1",
		FriendlyName: "Sensor",
		Capabilities: []Capability{
			{Name: "fall_detection", Type: "binary", Category: CapabilityCategoryConfiguration, Access: CapabilityAccessSet},
			{Name: "sensitivity", Type: "numeric", Category: CapabilityCategoryConfiguration, Access: CapabilityAccessSet, ValueMin: &minimum, ValueMax: &maximum},
			{Name: "posture_mode", Type: "enum", Category: CapabilityCategoryConfiguration, Access: CapabilityAccessSet, Values: []string{"normal", "strict"}},
		},
	}
	enabled := true
	sensitivity := 4.0
	mode := "strict"
	if err := ValidateConfigurationValues(dev, []ConfigurationValue{
		{Capability: "fall_detection", BooleanValue: &enabled},
		{Capability: "sensitivity", NumberValue: &sensitivity},
		{Capability: "posture_mode", StringValue: &mode},
	}); err != nil {
		t.Fatalf("expected valid configuration: %v", err)
	}

	outOfRange := 11.0
	if err := ValidateConfigurationValues(dev, []ConfigurationValue{{Capability: "sensitivity", NumberValue: &outOfRange}}); err == nil {
		t.Fatal("expected numeric range validation")
	}
	unsupported := "anything"
	if err := ValidateConfigurationValues(dev, []ConfigurationValue{{Capability: "posture_mode", StringValue: &unsupported}}); err == nil {
		t.Fatal("configuration enums must preserve the adapter-advertised value set")
	}
}

func TestConfigurationChangesSkipsConfirmedValues(t *testing.T) {
	currentValue := true
	changedValue := false
	current := []ConfigurationValue{{Capability: "fall_detection", BooleanValue: &currentValue}}
	desired := []ConfigurationValue{{Capability: "fall_detection", BooleanValue: &currentValue}}
	if changes := ConfigurationChanges(current, desired); len(changes) != 0 {
		t.Fatalf("expected confirmed value to be skipped, got %+v", changes)
	}
	desired[0].BooleanValue = &changedValue
	if changes := ConfigurationChanges(current, desired); len(changes) != 1 {
		t.Fatalf("expected changed value, got %+v", changes)
	}
}
