package store

import (
	"context"
	"strings"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestRegisterZigbeeDevice(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "Light", Source: "zigbee", Type: device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	zd, err := s.RegisterZigbeeDevice(ctx, RegisterZigbeeDeviceParams{
		DeviceID:     "dev-1",
		IEEEAddress:  "0x00158d0001a2b3c4",
		FriendlyName: "living_room_light",
	})
	if err != nil {
		t.Fatalf("register zigbee device: %v", err)
	}

	if zd.DeviceID != "dev-1" {
		t.Errorf("got DeviceID %q, want %q", zd.DeviceID, "dev-1")
	}
	if zd.IEEEAddress != "0x00158d0001a2b3c4" {
		t.Errorf("got IEEEAddress %q, want %q", zd.IEEEAddress, "0x00158d0001a2b3c4")
	}
	if zd.FriendlyName != "living_room_light" {
		t.Errorf("got FriendlyName %q, want %q", zd.FriendlyName, "living_room_light")
	}
}

func TestLookupByIEEEAddress(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "Light", Source: "zigbee", Type: device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}
	_, err = s.RegisterZigbeeDevice(ctx, RegisterZigbeeDeviceParams{
		DeviceID:     "dev-1",
		IEEEAddress:  "0x00158d0001a2b3c4",
		FriendlyName: "living_room_light",
	})
	if err != nil {
		t.Fatalf("register: %v", err)
	}

	zd, err := s.GetZigbeeDeviceByIEEEAddress(ctx, "0x00158d0001a2b3c4")
	if err != nil {
		t.Fatalf("lookup: %v", err)
	}
	if zd.DeviceID != "dev-1" {
		t.Errorf("got DeviceID %q, want %q", zd.DeviceID, "dev-1")
	}
}

func TestLookupByFriendlyName(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "Light", Source: "zigbee", Type: device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}
	_, err = s.RegisterZigbeeDevice(ctx, RegisterZigbeeDeviceParams{
		DeviceID:     "dev-1",
		IEEEAddress:  "0x00158d0001a2b3c4",
		FriendlyName: "living_room_light",
	})
	if err != nil {
		t.Fatalf("register: %v", err)
	}

	zd, err := s.GetZigbeeDeviceByFriendlyName(ctx, "living_room_light")
	if err != nil {
		t.Fatalf("lookup: %v", err)
	}
	if zd.DeviceID != "dev-1" {
		t.Errorf("got DeviceID %q, want %q", zd.DeviceID, "dev-1")
	}
}

func TestIEEEAddressUnique(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "Light 1", Source: "zigbee", Type: device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}
	_, err = s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-2", Name: "Light 2", Source: "zigbee", Type: device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	_, err = s.RegisterZigbeeDevice(ctx, RegisterZigbeeDeviceParams{
		DeviceID:     "dev-1",
		IEEEAddress:  "0x00158d0001a2b3c4",
		FriendlyName: "light_1",
	})
	if err != nil {
		t.Fatalf("register first: %v", err)
	}

	_, err = s.RegisterZigbeeDevice(ctx, RegisterZigbeeDeviceParams{
		DeviceID:     "dev-2",
		IEEEAddress:  "0x00158d0001a2b3c4",
		FriendlyName: "light_2",
	})
	if err == nil {
		t.Fatal("expected constraint error for duplicate ieee_address")
	}
	if !strings.Contains(err.Error(), "UNIQUE") {
		t.Errorf("expected UNIQUE constraint error, got: %v", err)
	}
}
