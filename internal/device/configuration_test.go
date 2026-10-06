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
	if err := ValidateConfigurationValues(dev, []AttributeValue{
		{Capability: "fall_detection", BooleanValue: &enabled},
		{Capability: "sensitivity", NumberValue: &sensitivity},
		{Capability: "posture_mode", StringValue: &mode},
	}); err != nil {
		t.Fatalf("expected valid configuration: %v", err)
	}

	outOfRange := 11.0
	if err := ValidateConfigurationValues(dev, []AttributeValue{{Capability: "sensitivity", NumberValue: &outOfRange}}); err == nil {
		t.Fatal("expected numeric range validation")
	}
	unsupported := "anything"
	if err := ValidateConfigurationValues(dev, []AttributeValue{{Capability: "posture_mode", StringValue: &unsupported}}); err == nil {
		t.Fatal("configuration enums must preserve the adapter-advertised value set")
	}
}

func TestConfigurationChangesSkipsConfirmedValues(t *testing.T) {
	currentValue := true
	changedValue := false
	current := []AttributeValue{{Capability: "fall_detection", BooleanValue: &currentValue}}
	desired := []AttributeValue{{Capability: "fall_detection", BooleanValue: &currentValue}}
	if changes := ConfigurationChanges(current, desired); len(changes) != 0 {
		t.Fatalf("expected confirmed value to be skipped, got %+v", changes)
	}
	desired[0].BooleanValue = &changedValue
	if changes := ConfigurationChanges(current, desired); len(changes) != 1 {
		t.Fatalf("expected changed value, got %+v", changes)
	}
}

func TestValidateConfigurationValuesFlags(t *testing.T) {
	d := Device{ID: "sensor", Capabilities: []Capability{{
		Name: "zones", Type: CapabilityTypeFlags, Values: []string{"near", "mid", "far"},
		Category: CapabilityCategoryConfiguration, Access: CapabilityAccessState | CapabilityAccessSet,
	}}}
	for _, mask := range []float64{0, 5, 7} {
		if err := ValidateConfigurationValues(d, []AttributeValue{{Capability: "zones", NumberValue: &mask}}); err != nil {
			t.Fatalf("mask %v rejected: %v", mask, err)
		}
	}
	for _, mask := range []float64{-1, 8, 2.5} {
		if err := ValidateConfigurationValues(d, []AttributeValue{{Capability: "zones", NumberValue: &mask}}); err == nil {
			t.Fatalf("mask %v accepted", mask)
		}
	}
}

func TestValidateDeviceCommand(t *testing.T) {
	d := Device{ID: "sensor", Capabilities: []Capability{
		{Name: "identify", Type: "enum", Values: []string{"identify"}, Category: CapabilityCategoryCommand, Access: CapabilityAccessSet},
		{Name: "led", Type: "binary", Category: CapabilityCategoryConfiguration, Access: CapabilityAccessState | CapabilityAccessSet},
	}}
	if err := ValidateDeviceCommand(d, DeviceCommandRequest{DeviceID: "sensor", Capability: "identify", Value: "identify"}); err != nil {
		t.Fatal(err)
	}
	rejected := []DeviceCommandRequest{
		{DeviceID: "sensor", Capability: "identify", Value: "blink"},
		{DeviceID: "sensor", Capability: "led", Value: "true"},
		{DeviceID: "sensor", Capability: "restart", Value: "restart"},
	}
	for _, request := range rejected {
		if err := ValidateDeviceCommand(d, request); err == nil {
			t.Fatalf("request %+v accepted", request)
		}
	}
	d.Disabled = true
	if err := ValidateDeviceCommand(d, DeviceCommandRequest{DeviceID: "sensor", Capability: "identify", Value: "identify"}); err == nil {
		t.Fatal("disabled device accepted a command")
	}
}
