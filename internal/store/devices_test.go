package store

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestCreateDevice(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	d, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID:     "dev-1",
		Name:   "Living Room Light",
		Source: "zigbee",
		Type:   device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

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
	if d.Available {
		t.Error("expected Available to be false")
	}
	if d.Removed {
		t.Error("expected Removed to be false")
	}
}

func TestGetDeviceByID(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID:     "dev-1",
		Name:   "Sensor",
		Source: "zigbee",
		Type:   device.Sensor,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	d, err := s.GetDevice(ctx, "dev-1")
	if err != nil {
		t.Fatalf("get device: %v", err)
	}
	if d.ID != "dev-1" {
		t.Errorf("got ID %q, want %q", d.ID, "dev-1")
	}
	if d.Name != "Sensor" {
		t.Errorf("got Name %q, want %q", d.Name, "Sensor")
	}
}

func TestGetDeviceNotFound(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.GetDevice(ctx, "nonexistent")
	if err == nil {
		t.Fatal("expected error for non-existent device")
	}
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows, got: %v", err)
	}
}

func TestListDevices(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	for i, name := range []string{"A", "B", "C"} {
		_, err := s.CreateDevice(ctx, CreateDeviceParams{
			ID:     device.DeviceID("dev-" + string(rune('1'+i))),
			Name:   name,
			Source: "zigbee",
			Type:   device.Light,
		})
		if err != nil {
			t.Fatalf("create device %s: %v", name, err)
		}
	}

	devices, err := s.ListDevices(ctx)
	if err != nil {
		t.Fatalf("list devices: %v", err)
	}
	if len(devices) != 3 {
		t.Fatalf("got %d devices, want 3", len(devices))
	}
}

func TestListDevicesBySource(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateDevice(ctx, CreateDeviceParams{ID: "z1", Name: "Z1", Source: "zigbee", Type: device.Light})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	_, err = s.CreateDevice(ctx, CreateDeviceParams{ID: "z2", Name: "Z2", Source: "zigbee", Type: device.Sensor})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	_, err = s.CreateDevice(ctx, CreateDeviceParams{ID: "w1", Name: "W1", Source: "wifi", Type: device.Light})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	zigbee, err := s.ListDevicesBySource(ctx, "zigbee")
	if err != nil {
		t.Fatalf("list by source: %v", err)
	}
	if len(zigbee) != 2 {
		t.Fatalf("got %d zigbee devices, want 2", len(zigbee))
	}

	wifi, err := s.ListDevicesBySource(ctx, "wifi")
	if err != nil {
		t.Fatalf("list by source: %v", err)
	}
	if len(wifi) != 1 {
		t.Fatalf("got %d wifi devices, want 1", len(wifi))
	}
}

func TestUpdateDevice(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID:     "dev-1",
		Name:   "Old Name",
		Source: "zigbee",
		Type:   device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	updated, err := s.UpdateDevice(ctx, UpdateDeviceParams{
		ID:        "dev-1",
		Name:      "New Name",
		Available: true,
	})
	if err != nil {
		t.Fatalf("update device: %v", err)
	}
	if updated.Name != "New Name" {
		t.Errorf("got Name %q, want %q", updated.Name, "New Name")
	}
	if !updated.Available {
		t.Error("expected Available to be true")
	}
}

func TestSoftDeleteDevice(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID:     "dev-1",
		Name:   "Light",
		Source: "zigbee",
		Type:   device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	_, err = s.UpdateDevice(ctx, UpdateDeviceParams{
		ID:      "dev-1",
		Name:    "Light",
		Removed: true,
	})
	if err != nil {
		t.Fatalf("soft delete: %v", err)
	}

	d, err := s.GetDevice(ctx, "dev-1")
	if err != nil {
		t.Fatalf("get device: %v", err)
	}
	if !d.Removed {
		t.Error("expected Removed to be true")
	}
}
