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
		ID:           "dev-1",
		FriendlyName: "Living Room Light",
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	if d.ID != "dev-1" {
		t.Errorf("got ID %q, want %q", d.ID, "dev-1")
	}
	if d.DisplayName() != "Living Room Light" {
		t.Errorf("got DisplayName %q, want %q", d.DisplayName(), "Living Room Light")
	}
	if d.Name != nil {
		t.Errorf("CreateDevice must not set a name override, got %q", *d.Name)
	}
	if d.Source != "zigbee2mqtt" {
		t.Errorf("got Source %q, want %q", d.Source, "zigbee2mqtt")
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
		ID:           "dev-1",
		FriendlyName: "Sensor",
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Sensor,
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
	if d.DisplayName() != "Sensor" {
		t.Errorf("got DisplayName %q, want %q", d.DisplayName(), "Sensor")
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
			ID:           device.DeviceID("dev-" + string(rune('1'+i))),
			FriendlyName: name,
			Source:       device.SourceZigbee2MQTT,
			Type:         device.Light,
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

	_, err := s.CreateDevice(ctx, CreateDeviceParams{ID: "z1", FriendlyName: "Z1", Source: device.SourceZigbee2MQTT, Type: device.Light})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	_, err = s.CreateDevice(ctx, CreateDeviceParams{ID: "z2", FriendlyName: "Z2", Source: device.SourceZigbee2MQTT, Type: device.Sensor})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	_, err = s.CreateDevice(ctx, CreateDeviceParams{ID: "w1", FriendlyName: "W1", Source: "wifi", Type: device.Light})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	zigbee, err := s.ListDevicesBySource(ctx, device.SourceZigbee2MQTT)
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
		ID:           "dev-1",
		FriendlyName: "Old Name",
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	updated, err := s.UpdateDevice(ctx, UpdateDeviceParams{
		ID:        "dev-1",
		Available: true,
	})
	if err != nil {
		t.Fatalf("update device: %v", err)
	}
	if !updated.Available {
		t.Error("expected Available to be true")
	}

	updated, err = s.SetDeviceName(ctx, "dev-1", device.Ptr("New Name"))
	if err != nil {
		t.Fatalf("set device name: %v", err)
	}
	if updated.DisplayName() != "New Name" {
		t.Errorf("got DisplayName %q, want %q", updated.DisplayName(), "New Name")
	}

	updated, err = s.SetDeviceName(ctx, "dev-1", nil)
	if err != nil {
		t.Fatalf("clear device name: %v", err)
	}
	if updated.DisplayName() != "Old Name" {
		t.Errorf("clearing the override should fall back to the adapter name, got %q", updated.DisplayName())
	}
}

func TestUpdateDeviceRoles(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID:           "dev-1",
		FriendlyName: "Lava lamp",
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Plug,
		Capabilities: []device.Capability{{Name: device.CapOnOff, Access: 3}},
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	updated, err := s.UpdateDevice(ctx, UpdateDeviceParams{
		ID:        "dev-1",
		Available: true,
		SetRoles:  true,
		Roles: device.DeviceRoles{
			ControlledLoad: device.Ptr(device.ControlledLoadRoleLight),
		},
	})
	if err != nil {
		t.Fatalf("set roles: %v", err)
	}
	if updated.Roles.ControlledLoad == nil || *updated.Roles.ControlledLoad != device.ControlledLoadRoleLight {
		t.Fatalf("got roles %#v, want light", updated.Roles)
	}

	listed, err := s.ListDevices(ctx)
	if err != nil {
		t.Fatalf("list devices: %v", err)
	}
	if len(listed) != 1 || listed[0].Roles.ControlledLoad == nil || *listed[0].Roles.ControlledLoad != device.ControlledLoadRoleLight {
		t.Fatalf("listed roles %#v, want light", listed)
	}

	_, err = s.UpdateDevice(ctx, UpdateDeviceParams{
		ID:       "dev-1",
		SetRoles: true,
	})
	if err == nil {
		t.Fatal("expected a missing applicable role to be rejected")
	}
}

func TestUpsertDeviceReconcilesRoles(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	controlledCapabilities := []device.Capability{{Name: device.CapOnOff, Access: 3}}

	created, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID:           "dev-1",
		FriendlyName: "Plug",
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Plug,
		Capabilities: controlledCapabilities,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}
	if created.Roles.ControlledLoad == nil || *created.Roles.ControlledLoad != device.ControlledLoadRoleAppliance {
		t.Fatalf("created role = %v, want appliance", created.Roles.ControlledLoad)
	}

	if _, err := s.UpdateDevice(ctx, UpdateDeviceParams{
		ID:       "dev-1",
		SetRoles: true,
		Roles:    device.DeviceRoles{ControlledLoad: device.Ptr(device.ControlledLoadRoleLight)},
	}); err != nil {
		t.Fatalf("set light role: %v", err)
	}
	if err := s.UpsertDevice(ctx, CreateDeviceParams{
		ID:           "dev-1",
		FriendlyName: "Plug",
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Plug,
		Capabilities: controlledCapabilities,
	}); err != nil {
		t.Fatalf("re-sync plug: %v", err)
	}
	preserved, err := s.GetDevice(ctx, "dev-1")
	if err != nil {
		t.Fatalf("get preserved device: %v", err)
	}
	if preserved.Roles.ControlledLoad == nil || *preserved.Roles.ControlledLoad != device.ControlledLoadRoleLight {
		t.Fatalf("preserved role = %v, want light", preserved.Roles.ControlledLoad)
	}

	if err := s.UpsertDevice(ctx, CreateDeviceParams{
		ID:           "dev-1",
		FriendlyName: "Contact",
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Sensor,
		Capabilities: []device.Capability{{Name: device.CapContact, Access: 1}},
	}); err != nil {
		t.Fatalf("reclassify device: %v", err)
	}
	reclassified, err := s.GetDevice(ctx, "dev-1")
	if err != nil {
		t.Fatalf("get reclassified device: %v", err)
	}
	if reclassified.Roles.ControlledLoad != nil {
		t.Fatalf("controlled-load role = %v, want inapplicable", reclassified.Roles.ControlledLoad)
	}
	if reclassified.Roles.Contact == nil || *reclassified.Roles.Contact != device.ContactRoleGeneral {
		t.Fatalf("contact role = %v, want general", reclassified.Roles.Contact)
	}
}

// TestUpsertDevicePreservesName covers the split: a re-sync refreshes every
// adapter-owned column including the friendly name, and never touches the
// user's override.
func TestUpsertDevicePreservesName(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID:           "dev-1",
		FriendlyName: "old_friendly",
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	if _, err := s.SetDeviceName(ctx, "dev-1", device.Ptr("User Name")); err != nil {
		t.Fatalf("set device name: %v", err)
	}

	_, err = s.UpdateDevice(ctx, UpdateDeviceParams{
		ID:      "dev-1",
		Removed: true,
	})
	if err != nil {
		t.Fatalf("mark removed: %v", err)
	}

	err = s.UpsertDevice(ctx, CreateDeviceParams{
		ID:           "dev-1",
		FriendlyName: "Adapter Name",
		Source:       "tuya",
		Type:         device.Climate,
		Capabilities: []device.Capability{
			{Name: device.CapOnOff, Type: "binary", Access: 7},
		},
	})
	if err != nil {
		t.Fatalf("upsert device: %v", err)
	}

	d, err := s.GetDevice(ctx, "dev-1")
	if err != nil {
		t.Fatalf("get device: %v", err)
	}
	if d.Name == nil || *d.Name != "User Name" {
		t.Fatalf("re-sync clobbered the user override: got %v", d.Name)
	}
	if d.FriendlyName != "Adapter Name" {
		t.Fatalf("re-sync did not refresh the friendly name: got %q", d.FriendlyName)
	}
	if d.DisplayName() != "User Name" {
		t.Fatalf("override must win over the adapter name, got %q", d.DisplayName())
	}
	if d.Source != "tuya" {
		t.Fatalf("got source %q, want tuya", d.Source)
	}
	if d.Type != device.Climate {
		t.Fatalf("got type %q, want %q", d.Type, device.Climate)
	}
	if d.Removed {
		t.Fatal("expected device to be active")
	}
	if len(d.Capabilities) != 1 || d.Capabilities[0].Name != device.CapOnOff {
		t.Fatalf("got capabilities %#v, want on_off", d.Capabilities)
	}
}

func TestMarkDeviceRemoved(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID:           "dev-1",
		FriendlyName: "Light",
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Light,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	_, err = s.UpdateDevice(ctx, UpdateDeviceParams{
		ID:      "dev-1",
		Removed: true,
	})
	if err != nil {
		t.Fatalf("mark removed: %v", err)
	}

	d, err := s.GetDevice(ctx, "dev-1")
	if err != nil {
		t.Fatalf("get device: %v", err)
	}
	if !d.Removed {
		t.Error("expected Removed to be true")
	}
}
