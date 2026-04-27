package device

import "testing"

func TestDeviceStateLightFields(t *testing.T) {
	c := Color{R: 255, G: 128, B: 0, X: 0.5, Y: 0.4}
	s := DeviceState{
		On:         Ptr(true),
		Brightness: Ptr(100),
		ColorTemp:  Ptr(4000),
		Color:      &c,
		Transition: Ptr(1.5),
	}
	if *s.On != true {
		t.Fatal("On should be true")
	}
	if *s.Brightness != 100 {
		t.Fatalf("expected 100, got %d", *s.Brightness)
	}
	if *s.ColorTemp != 4000 {
		t.Fatalf("expected 4000, got %d", *s.ColorTemp)
	}
	if s.Color.R != 255 || s.Color.G != 128 || s.Color.B != 0 {
		t.Fatal("unexpected RGB values")
	}
	if *s.Transition != 1.5 {
		t.Fatalf("expected 1.5, got %f", *s.Transition)
	}
}

func TestDeviceStateSensorFields(t *testing.T) {
	s := DeviceState{
		Temperature: Ptr(21.0),
		Humidity:    Ptr(55.0),
		Battery:     Ptr(87.0),
		Pressure:    Ptr(1013.25),
		Illuminance: Ptr(340.0),
	}
	if *s.Temperature != 21.0 {
		t.Fatalf("expected 21.0, got %f", *s.Temperature)
	}
	if *s.Humidity != 55.0 {
		t.Fatalf("expected 55.0, got %f", *s.Humidity)
	}
	if *s.Battery != 87 {
		t.Fatalf("expected 87, got %g", *s.Battery)
	}
	if *s.Pressure != 1013.25 {
		t.Fatalf("expected 1013.25, got %f", *s.Pressure)
	}
	if *s.Illuminance != 340.0 {
		t.Fatalf("expected 340.0, got %f", *s.Illuminance)
	}
}

func TestDeviceStateMeteringFields(t *testing.T) {
	s := DeviceState{
		On:      Ptr(true),
		Power:   Ptr(42.5),
		Voltage: Ptr(230.1),
		Current: Ptr(0.18),
		Energy:  Ptr(12.3),
	}
	if *s.On != true {
		t.Fatal("On should be true")
	}
	if *s.Power != 42.5 {
		t.Fatalf("expected 42.5, got %f", *s.Power)
	}
	if *s.Voltage != 230.1 {
		t.Fatalf("expected 230.1, got %f", *s.Voltage)
	}
	if *s.Current != 0.18 {
		t.Fatalf("expected 0.18, got %f", *s.Current)
	}
	if *s.Energy != 12.3 {
		t.Fatalf("expected 12.3, got %f", *s.Energy)
	}
}

func TestDeviceStateMixedCapabilities(t *testing.T) {
	// A plug that also reports ambient temperature from a built-in probe.
	s := DeviceState{
		On:          Ptr(true),
		Power:       Ptr(30.0),
		Temperature: Ptr(24.5),
	}
	if s.On == nil || !*s.On {
		t.Fatal("On should be true")
	}
	if s.Power == nil || *s.Power != 30.0 {
		t.Fatal("Power mismatch")
	}
	if s.Temperature == nil || *s.Temperature != 24.5 {
		t.Fatal("Temperature mismatch")
	}
	if s.Brightness != nil {
		t.Fatal("Brightness should be nil")
	}
}

func TestColorConstruction(t *testing.T) {
	c := Color{R: 200, G: 100, B: 50, X: 0.65, Y: 0.33}
	if c.R != 200 || c.G != 100 || c.B != 50 {
		t.Fatal("unexpected RGB")
	}
	if c.X != 0.65 || c.Y != 0.33 {
		t.Fatal("unexpected XY")
	}
}

func TestAction(t *testing.T) {
	a := Action{Action: "single"}
	if a.Action != "single" {
		t.Fatalf("expected single, got %s", a.Action)
	}
}
