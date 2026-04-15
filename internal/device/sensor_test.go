package device

import "testing"

func TestSensorStatePartial(t *testing.T) {
	s := SensorState{
		Temperature: Ptr(22.5),
	}
	if *s.Temperature != 22.5 {
		t.Fatalf("expected 22.5, got %f", *s.Temperature)
	}
	if s.Humidity != nil {
		t.Fatal("Humidity should be nil")
	}
	if s.Battery != nil {
		t.Fatal("Battery should be nil")
	}
	if s.Pressure != nil {
		t.Fatal("Pressure should be nil")
	}
	if s.Illuminance != nil {
		t.Fatal("Illuminance should be nil")
	}
}

func TestSensorStateComplete(t *testing.T) {
	s := SensorState{
		Temperature: Ptr(21.0),
		Humidity:    Ptr(55.0),
		Battery:     Ptr(87),
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
		t.Fatalf("expected 87, got %d", *s.Battery)
	}
	if *s.Pressure != 1013.25 {
		t.Fatalf("expected 1013.25, got %f", *s.Pressure)
	}
	if *s.Illuminance != 340.0 {
		t.Fatalf("expected 340.0, got %f", *s.Illuminance)
	}
}
