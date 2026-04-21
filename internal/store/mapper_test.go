package store

import (
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestMapSceneActionPayloadRoundTrip(t *testing.T) {
	cmd := device.Command{
		DeviceID:   device.DeviceID("light-1"),
		On:         device.Ptr(true),
		Brightness: device.Ptr(200),
		ColorTemp:  device.Ptr(350),
		Color:      &device.Color{R: 255, G: 128, B: 0, X: 0.5, Y: 0.3},
		Transition: device.Ptr(1.5),
	}

	data, err := MarshalCommand(cmd)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	restored, err := UnmarshalCommand(data)
	if err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if restored.On == nil || *restored.On != true {
		t.Errorf("On: got %v, want true", restored.On)
	}
	if restored.Brightness == nil || *restored.Brightness != 200 {
		t.Errorf("Brightness: got %v, want 200", restored.Brightness)
	}
	if restored.ColorTemp == nil || *restored.ColorTemp != 350 {
		t.Errorf("ColorTemp: got %v, want 350", restored.ColorTemp)
	}
	if restored.Color == nil {
		t.Fatal("expected Color to be non-nil")
	}
	if restored.Color.R != 255 || restored.Color.G != 128 || restored.Color.B != 0 {
		t.Errorf("Color RGB: got (%d,%d,%d), want (255,128,0)", restored.Color.R, restored.Color.G, restored.Color.B)
	}
	if restored.Color.X != 0.5 || restored.Color.Y != 0.3 {
		t.Errorf("Color XY: got (%f,%f), want (0.5,0.3)", restored.Color.X, restored.Color.Y)
	}
	if restored.Transition == nil || *restored.Transition != 1.5 {
		t.Errorf("Transition: got %v, want 1.5", restored.Transition)
	}
}
