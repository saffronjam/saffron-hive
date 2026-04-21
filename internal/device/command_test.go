package device

import "testing"

func TestCommandFields(t *testing.T) {
	cmd := Command{
		DeviceID:   DeviceID("light-1"),
		On:         Ptr(true),
		Brightness: Ptr(75),
		ColorTemp:  Ptr(3000),
		Color:      &Color{R: 10, G: 20, B: 30, X: 0.1, Y: 0.2},
		Transition: Ptr(0.5),
	}
	if cmd.DeviceID != "light-1" {
		t.Fatalf("expected light-1, got %s", cmd.DeviceID)
	}
	if *cmd.On != true {
		t.Fatal("expected On=true")
	}
	if *cmd.Brightness != 75 {
		t.Fatalf("expected 75, got %d", *cmd.Brightness)
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

func TestCommandPartial(t *testing.T) {
	cmd := Command{
		DeviceID: DeviceID("plug-1"),
		On:       Ptr(false),
	}
	if *cmd.On != false {
		t.Fatal("expected On=false")
	}
	if cmd.Brightness != nil {
		t.Fatal("Brightness should be nil")
	}
	if cmd.Color != nil {
		t.Fatal("Color should be nil")
	}
}
