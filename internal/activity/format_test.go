package activity

import (
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/automation"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func boolPtr(b bool) *bool      { return &b }
func intPtr(i int) *int         { return &i }
func f64Ptr(f float64) *float64 { return &f }

func TestFormatMessage(t *testing.T) {
	now := time.Now()

	cases := []struct {
		name      string
		evt       eventbus.Event
		devName   string
		sceneName string
		autoName  string
		wantExact string
	}{
		{
			name:      "light turned on",
			evt:       eventbus.Event{Type: eventbus.EventDeviceStateChanged, Timestamp: now, Payload: device.DeviceState{On: boolPtr(true)}},
			devName:   "Kitchen light",
			wantExact: "Kitchen light turned on",
		},
		{
			name:      "light turned off",
			evt:       eventbus.Event{Type: eventbus.EventDeviceStateChanged, Timestamp: now, Payload: device.DeviceState{On: boolPtr(false)}},
			devName:   "Kitchen light",
			wantExact: "Kitchen light turned off",
		},
		{
			name:      "light dimmed with brightness",
			evt:       eventbus.Event{Type: eventbus.EventDeviceStateChanged, Timestamp: now, Payload: device.DeviceState{On: boolPtr(true), Brightness: intPtr(127)}},
			devName:   "Lamp",
			wantExact: "Lamp set to on, 50%",
		},
		{
			name:      "sensor temperature",
			evt:       eventbus.Event{Type: eventbus.EventDeviceStateChanged, Timestamp: now, Payload: device.DeviceState{Temperature: f64Ptr(21.3)}},
			devName:   "Hallway sensor",
			wantExact: "Hallway sensor: 21.3°C",
		},
		{
			name:      "plug metering not pressed",
			evt:       eventbus.Event{Type: eventbus.EventDeviceStateChanged, Timestamp: now, Payload: device.DeviceState{On: boolPtr(true), Power: f64Ptr(42), Voltage: f64Ptr(230)}},
			devName:   "Lava lamp",
			wantExact: "Lava lamp on: 42 W, 230 V",
		},
		{
			name:      "plug metering off",
			evt:       eventbus.Event{Type: eventbus.EventDeviceStateChanged, Timestamp: now, Payload: device.DeviceState{On: boolPtr(false), Power: f64Ptr(0), Voltage: f64Ptr(230)}},
			devName:   "Lava lamp",
			wantExact: "Lava lamp off: 0 W, 230 V",
		},
		{
			name:      "button action event",
			evt:       eventbus.Event{Type: eventbus.EventDeviceActionFired, Timestamp: now, Payload: device.Action{Action: "single"}},
			devName:   "Bedroom button",
			wantExact: "Bedroom button: single",
		},
		{
			name:      "availability online",
			evt:       eventbus.Event{Type: eventbus.EventDeviceAvailabilityChanged, Timestamp: now, Payload: true},
			devName:   "Living room light",
			wantExact: "Living room light came online",
		},
		{
			name:      "availability offline",
			evt:       eventbus.Event{Type: eventbus.EventDeviceAvailabilityChanged, Timestamp: now, Payload: false},
			devName:   "Living room light",
			wantExact: "Living room light went offline",
		},
		{
			name:      "device added from payload",
			evt:       eventbus.Event{Type: eventbus.EventDeviceAdded, Timestamp: now, Payload: device.Device{Name: "New Bulb", Type: device.Light}},
			wantExact: "New device discovered: New Bulb",
		},
		{
			name:      "device removed",
			evt:       eventbus.Event{Type: eventbus.EventDeviceRemoved, Timestamp: now},
			devName:   "Old Sensor",
			wantExact: "Device removed: Old Sensor",
		},
		{
			name:      "command requested",
			evt:       eventbus.Event{Type: eventbus.EventCommandRequested, Timestamp: now},
			devName:   "Desk lamp",
			wantExact: "Command sent to Desk lamp",
		},
		{
			name:      "scene applied",
			evt:       eventbus.Event{Type: eventbus.EventSceneApplied, Timestamp: now, Payload: "scene-1"},
			sceneName: "Evening",
			wantExact: "Scene applied: Evening",
		},
		{
			name:      "automation triggered",
			evt:       eventbus.Event{Type: eventbus.EventAutomationTriggered, Timestamp: now},
			autoName:  "Motion dims lights",
			wantExact: "Automation fired: Motion dims lights",
		},
		{
			name:      "automation node activated",
			evt:       eventbus.Event{Type: eventbus.EventAutomationNodeActivated, Timestamp: now, Payload: automation.NodeActivation{AutomationID: "a", NodeID: "n", Active: true}},
			autoName:  "Motion dims lights",
			wantExact: "Motion dims lights: node activated",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := formatMessage(tc.evt, tc.devName, tc.sceneName, tc.autoName)
			if got != tc.wantExact {
				t.Errorf("got %q, want %q", got, tc.wantExact)
			}
		})
	}
}

// A plug reporting metering must never render as a button press. Plugs don't
// fire "pressed" events at all; any such string in the output is a bug.
func TestFormatDeviceState_PlugMetering_NotPressed(t *testing.T) {
	payload := device.DeviceState{
		On:      boolPtr(true),
		Power:   f64Ptr(12.5),
		Voltage: f64Ptr(230.1),
		Current: f64Ptr(0.05),
		Energy:  f64Ptr(1.234),
	}
	evt := eventbus.Event{Type: eventbus.EventDeviceStateChanged, Payload: payload}
	got := formatMessage(evt, "Lava lamp", "", "")
	if got == "Lava lamp pressed" {
		t.Fatal("regression: plug metering rendered as \"pressed\"")
	}
}
