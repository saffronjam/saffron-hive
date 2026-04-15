package device

import "testing"

func TestLightStatePartial(t *testing.T) {
	s := LightState{
		Brightness: Ptr(80),
	}
	if s.On != nil {
		t.Fatal("On should be nil")
	}
	if s.ColorTemp != nil {
		t.Fatal("ColorTemp should be nil")
	}
	if s.Color != nil {
		t.Fatal("Color should be nil")
	}
	if s.Transition != nil {
		t.Fatal("Transition should be nil")
	}
	if *s.Brightness != 80 {
		t.Fatalf("expected brightness 80, got %d", *s.Brightness)
	}
}

func TestLightStateComplete(t *testing.T) {
	c := Color{R: 255, G: 128, B: 0, X: 0.5, Y: 0.4}
	s := LightState{
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

func TestLightCommandFields(t *testing.T) {
	cmd := LightCommand{
		On:         Ptr(false),
		Brightness: Ptr(50),
		ColorTemp:  Ptr(3000),
		Color:      &Color{R: 10, G: 20, B: 30, X: 0.1, Y: 0.2},
		Transition: Ptr(0.5),
	}
	if *cmd.On != false {
		t.Fatal("On should be false")
	}
	if *cmd.Brightness != 50 {
		t.Fatalf("expected 50, got %d", *cmd.Brightness)
	}
	if *cmd.ColorTemp != 3000 {
		t.Fatalf("expected 3000, got %d", *cmd.ColorTemp)
	}
	if cmd.Color.R != 10 {
		t.Fatalf("expected R=10, got %d", cmd.Color.R)
	}
	if *cmd.Transition != 0.5 {
		t.Fatalf("expected 0.5, got %f", *cmd.Transition)
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
