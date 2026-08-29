package device

import "testing"

func TestDeviceTypeConstants(t *testing.T) {
	tests := []struct {
		dt   DeviceType
		want string
	}{
		{Light, "light"},
		{Sensor, "sensor"},
		{Button, "button"},
		{Plug, "plug"},
		{Climate, "climate"},
		{Speaker, "speaker"},
		{Unknown, "unknown"},
	}
	for _, tt := range tests {
		if string(tt.dt) != tt.want {
			t.Errorf("DeviceType %q != %q", tt.dt, tt.want)
		}
	}
}

func TestDeviceRoleDefaultsAndValidation(t *testing.T) {
	plug := Device{
		Type: Plug,
		Capabilities: []Capability{{
			Name:   CapOnOff,
			Access: CapabilityAccessState | CapabilityAccessSet,
		}},
	}
	roles := DefaultDeviceRoles(plug)
	if roles.ControlledLoad == nil || *roles.ControlledLoad != ControlledLoadRoleAppliance {
		t.Fatalf("controlled load role = %v, want appliance", roles.ControlledLoad)
	}
	if err := ValidateDeviceRoles(plug, roles); err != nil {
		t.Fatalf("validate defaults: %v", err)
	}
	roles.ControlledLoad = Ptr(ControlledLoadRoleLight)
	if err := ValidateDeviceRoles(plug, roles); err != nil {
		t.Fatalf("validate light role: %v", err)
	}
	roles.Contact = Ptr(ContactRoleDoor)
	if err := ValidateDeviceRoles(plug, roles); err == nil {
		t.Fatal("contact role should be rejected without a reporting contact capability")
	}
}

func TestIsLightControlDeviceIncludesAssignedPlug(t *testing.T) {
	if !IsLightControlDevice(Device{Type: Light}) {
		t.Fatal("physical light was not classified as a lighting device")
	}
	if !IsLightControlDevice(Device{Type: Plug, Roles: DeviceRoles{ControlledLoad: Ptr(ControlledLoadRoleLight)}}) {
		t.Fatal("light-role plug was not classified as a lighting device")
	}
	if IsLightControlDevice(Device{Type: Plug, Roles: DeviceRoles{ControlledLoad: Ptr(ControlledLoadRoleAppliance)}}) {
		t.Fatal("appliance-role plug was classified as a lighting device")
	}
}

func TestSourceIsString(t *testing.T) {
	if string(SourceZigbee2MQTT) != "zigbee2mqtt" {
		t.Fatalf("expected zigbee2mqtt, got %s", SourceZigbee2MQTT)
	}
	if SourceZigbee2MQTT == SourceTuya {
		t.Fatal("different sources should not be equal")
	}
}

func TestDeviceIDIsString(t *testing.T) {
	id := DeviceID("abc-123")
	if string(id) != "abc-123" {
		t.Fatalf("expected abc-123, got %s", id)
	}

	id2 := DeviceID("abc-123")
	if id != id2 {
		t.Fatal("identical DeviceIDs should be equal")
	}

	id3 := DeviceID("xyz-789")
	if id == id3 {
		t.Fatal("different DeviceIDs should not be equal")
	}
}

// TestEnabledDevicesExcludesHub pins the chokepoint: a hub is placeable and
// room-assignable but must never reach command fan-out, selector evaluation
// or health monitoring, all of which filter through EnabledDevices.
func TestEnabledDevicesExcludesHub(t *testing.T) {
	devs := []Device{
		{ID: "light", Type: Light},
		{ID: "hub", Type: Hub},
		{ID: "removed", Type: Light, Removed: true},
		{ID: "disabled", Type: Light, Disabled: true},
	}
	got := EnabledDevices(devs)
	if len(got) != 1 || got[0].ID != "light" {
		t.Fatalf("want only the plain light, got %+v", got)
	}
}

func TestEnabledDevicesExcludesDeletedDevice(t *testing.T) {
	devices := []Device{
		{ID: "active", Type: Light},
		{ID: "deleted", Type: Light, Deleted: true},
	}
	got := EnabledDevices(devices)
	if len(got) != 1 || got[0].ID != "active" {
		t.Fatalf("enabled devices = %+v", got)
	}
}
