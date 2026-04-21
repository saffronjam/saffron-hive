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
		{Speaker, "speaker"},
		{Unknown, "unknown"},
	}
	for _, tt := range tests {
		if string(tt.dt) != tt.want {
			t.Errorf("DeviceType %q != %q", tt.dt, tt.want)
		}
	}
}

func TestSourceIsString(t *testing.T) {
	s := Source("zigbee")
	if string(s) != "zigbee" {
		t.Fatalf("expected zigbee, got %s", s)
	}
	s2 := Source("wifi")
	if s == s2 {
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
