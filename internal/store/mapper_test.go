package store

import (
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestMapDeviceRowToDomain(t *testing.T) {
	now := time.Now().UTC().Truncate(time.Second)
	row := DeviceRow{
		ID:        "dev-1",
		Name:      "Living Room Light",
		Source:    "zigbee",
		Type:      "light",
		Available: true,
		Removed:   false,
		LastSeen:  &now,
	}

	d := MapDeviceRowToDomain(row)

	if d.ID != "dev-1" {
		t.Errorf("got ID %q, want %q", d.ID, "dev-1")
	}
	if d.Name != "Living Room Light" {
		t.Errorf("got Name %q, want %q", d.Name, "Living Room Light")
	}
	if d.Source != "zigbee" {
		t.Errorf("got Source %q, want %q", d.Source, "zigbee")
	}
	if d.Type != device.Light {
		t.Errorf("got Type %q, want %q", d.Type, device.Light)
	}
	if !d.Available {
		t.Error("expected Available to be true")
	}
	if d.Removed {
		t.Error("expected Removed to be false")
	}
	if !d.LastSeen.Equal(now) {
		t.Errorf("got LastSeen %v, want %v", d.LastSeen, now)
	}
}

func TestMapDomainToDeviceRow(t *testing.T) {
	now := time.Now().UTC().Truncate(time.Second)
	d := device.Device{
		ID:        "dev-1",
		Name:      "Sensor",
		Source:    "wifi",
		Type:      device.Sensor,
		Available: false,
		Removed:   true,
		LastSeen:  now,
	}

	row := MapDomainToDeviceRow(d)

	if row.ID != "dev-1" {
		t.Errorf("got ID %q, want %q", row.ID, "dev-1")
	}
	if row.Source != "wifi" {
		t.Errorf("got Source %q, want %q", row.Source, "wifi")
	}
	if row.Type != "sensor" {
		t.Errorf("got Type %q, want %q", row.Type, "sensor")
	}
	if !row.Removed {
		t.Error("expected Removed to be true")
	}
	if row.LastSeen == nil || !row.LastSeen.Equal(now) {
		t.Errorf("got LastSeen %v, want %v", row.LastSeen, now)
	}
}

func TestMapSceneActionPayloadRoundTrip(t *testing.T) {
	cmd := device.LightCommand{
		On:         device.Ptr(true),
		Brightness: device.Ptr(200),
		ColorTemp:  device.Ptr(350),
		Color:      &device.Color{R: 255, G: 128, B: 0, X: 0.5, Y: 0.3},
		Transition: device.Ptr(1.5),
	}

	data, err := MarshalLightCommand(cmd)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	restored, err := UnmarshalLightCommand(data)
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
