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

func TestDeviceTagValidation(t *testing.T) {
	if !IsValidDeviceTag(DeviceTagLight) {
		t.Fatal("LIGHT should be a valid device tag")
	}
	if IsValidDeviceTag(DeviceTag("UNKNOWN")) {
		t.Fatal("UNKNOWN should not be a valid device tag")
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
