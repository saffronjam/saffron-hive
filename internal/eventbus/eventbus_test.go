package eventbus

import (
	"testing"
	"time"
)

func TestEventTypeConstants(t *testing.T) {
	expected := map[EventType]string{
		EventDeviceStateChanged:        "device.state_changed",
		EventDeviceAvailabilityChanged: "device.availability_changed",
		EventDeviceAdded:               "device.added",
		EventDeviceRemoved:             "device.removed",
		EventCommandRequested:          "command.requested",
		EventSceneApplied:              "scene.applied",
		EventAutomationTriggered:       "automation.triggered",
	}
	for et, want := range expected {
		if string(et) != want {
			t.Errorf("EventType %q != %q", et, want)
		}
	}
}

func TestEventStruct(t *testing.T) {
	now := time.Now()
	e := Event{
		Type:      EventDeviceStateChanged,
		DeviceID:  "light-1",
		Timestamp: now,
		Payload:   map[string]int{"brightness": 80},
	}
	if e.Type != EventDeviceStateChanged {
		t.Fatalf("unexpected type: %s", e.Type)
	}
	if e.DeviceID != "light-1" {
		t.Fatalf("unexpected device id: %s", e.DeviceID)
	}
	if !e.Timestamp.Equal(now) {
		t.Fatalf("unexpected timestamp")
	}
	payload, ok := e.Payload.(map[string]int)
	if !ok {
		t.Fatal("payload type assertion failed")
	}
	if payload["brightness"] != 80 {
		t.Fatalf("unexpected brightness: %d", payload["brightness"])
	}
}
