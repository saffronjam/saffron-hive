package device

import "testing"

func TestMergeDeviceState_SingleField(t *testing.T) {
	current := DeviceState{Brightness: Ptr(200)}
	update := DeviceState{ColorTemp: Ptr(350)}

	result := MergeDeviceState(current, update)

	if result.Brightness == nil || *result.Brightness != 200 {
		t.Fatalf("expected brightness 200, got %v", result.Brightness)
	}
	if result.ColorTemp == nil || *result.ColorTemp != 350 {
		t.Fatalf("expected color_temp 350, got %v", result.ColorTemp)
	}
}

func TestMergeDeviceState_OverwriteField(t *testing.T) {
	current := DeviceState{Brightness: Ptr(200)}
	update := DeviceState{Brightness: Ptr(100)}

	result := MergeDeviceState(current, update)

	if result.Brightness == nil || *result.Brightness != 100 {
		t.Fatalf("expected brightness 100, got %v", result.Brightness)
	}
}

func TestMergeDeviceState_NilUpdateNoChange(t *testing.T) {
	current := DeviceState{Brightness: Ptr(200), On: Ptr(true)}
	update := DeviceState{}

	result := MergeDeviceState(current, update)

	if result.Brightness == nil || *result.Brightness != 200 {
		t.Fatalf("expected brightness 200, got %v", result.Brightness)
	}
	if result.On == nil || *result.On != true {
		t.Fatalf("expected on true, got %v", result.On)
	}
}

func TestMergeDeviceState_BothEmpty(t *testing.T) {
	result := MergeDeviceState(DeviceState{}, DeviceState{})

	if result.On != nil || result.Brightness != nil || result.ColorTemp != nil || result.Color != nil || result.Transition != nil {
		t.Fatal("expected all light fields nil for merge of two zero-value states")
	}
	if result.Temperature != nil || result.Humidity != nil || result.Battery != nil || result.Pressure != nil || result.Illuminance != nil {
		t.Fatal("expected all sensor fields nil for merge of two zero-value states")
	}
	if result.Power != nil || result.Voltage != nil || result.Current != nil || result.Energy != nil {
		t.Fatal("expected all metering fields nil for merge of two zero-value states")
	}
}

func TestMergeDeviceState_ColorMerge(t *testing.T) {
	current := DeviceState{Brightness: Ptr(200)}
	color := Color{R: 255, G: 0, B: 0}
	update := DeviceState{Color: &color}

	result := MergeDeviceState(current, update)

	if result.Color == nil || result.Color.R != 255 {
		t.Fatalf("expected color R=255, got %v", result.Color)
	}
	if result.Brightness == nil || *result.Brightness != 200 {
		t.Fatalf("expected brightness preserved, got %v", result.Brightness)
	}
}

func TestMergeDeviceState_SensorFieldsPreserved(t *testing.T) {
	current := DeviceState{Temperature: Ptr(22.5), Humidity: Ptr(45.0)}
	update := DeviceState{Temperature: Ptr(23.0)}

	result := MergeDeviceState(current, update)

	if result.Temperature == nil || *result.Temperature != 23.0 {
		t.Fatalf("expected temperature 23.0, got %v", result.Temperature)
	}
	if result.Humidity == nil || *result.Humidity != 45.0 {
		t.Fatalf("expected humidity preserved at 45.0, got %v", result.Humidity)
	}
}

func TestMergeDeviceState_MeteringFields(t *testing.T) {
	current := DeviceState{}
	update := DeviceState{
		On:      Ptr(true),
		Power:   Ptr(42.5),
		Voltage: Ptr(230.1),
		Current: Ptr(0.18),
		Energy:  Ptr(12.3),
	}
	result := MergeDeviceState(current, update)

	if result.On == nil || !*result.On {
		t.Fatal("expected On=true")
	}
	if result.Power == nil || *result.Power != 42.5 {
		t.Fatal("expected Power=42.5")
	}
	if result.Voltage == nil || *result.Voltage != 230.1 {
		t.Fatal("expected Voltage=230.1")
	}
	if result.Current == nil || *result.Current != 0.18 {
		t.Fatal("expected Current=0.18")
	}
	if result.Energy == nil || *result.Energy != 12.3 {
		t.Fatal("expected Energy=12.3")
	}
}

func TestMergeDeviceState_AllFields(t *testing.T) {
	current := DeviceState{}
	update := DeviceState{
		On:          Ptr(true),
		Brightness:  Ptr(128),
		ColorTemp:   Ptr(2700),
		Transition:  Ptr(0.5),
		Temperature: Ptr(20.0),
		Humidity:    Ptr(50.0),
		Battery:     Ptr(95.0),
		Pressure:    Ptr(1013.0),
		Illuminance: Ptr(300.0),
		Power:       Ptr(10.0),
		Voltage:     Ptr(230.0),
		Current:     Ptr(0.05),
		Energy:      Ptr(1.2),
	}

	result := MergeDeviceState(current, update)

	if result.On == nil || !*result.On {
		t.Fatal("On not merged")
	}
	if result.Brightness == nil || *result.Brightness != 128 {
		t.Fatal("Brightness not merged")
	}
	if result.Temperature == nil || *result.Temperature != 20.0 {
		t.Fatal("Temperature not merged")
	}
	if result.Power == nil || *result.Power != 10.0 {
		t.Fatal("Power not merged")
	}
}
