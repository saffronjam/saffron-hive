package lightfield

import (
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func writable(name string) device.Capability {
	return device.Capability{Name: name, Access: device.CapabilityAccessSet}
}

func testLight(id string, capabilities ...device.Capability) device.Device {
	return device.Device{ID: device.DeviceID(id), Type: device.Light, Capabilities: capabilities}
}

func TestProjectCapabilityMatrix(t *testing.T) {
	colour := Sample{Color: &ColorSample{Lightness: 0.7, Chroma: 0.18, Hue: 25}}
	lightRole := device.ControlledLoadRoleLight
	applianceRole := device.ControlledLoadRoleAppliance
	tests := []struct {
		name       string
		device     device.Device
		wantOn     bool
		wantBright bool
		wantColor  bool
		wantTemp   bool
		wantEmpty  bool
	}{
		{name: "full colour", device: testLight("rgb", writable(device.CapOnOff), writable(device.CapBrightness), writable(device.CapColor)), wantOn: true, wantBright: true, wantColor: true},
		{name: "temperature", device: testLight("ct", writable(device.CapColorTemp)), wantTemp: true},
		{name: "dim only", device: testLight("dim", writable(device.CapBrightness)), wantBright: true},
		{name: "switch only", device: testLight("switch", writable(device.CapOnOff)), wantOn: true},
		{name: "light plug", device: device.Device{ID: "plug-light", Type: device.Plug, Roles: device.DeviceRoles{ControlledLoad: &lightRole}, Capabilities: []device.Capability{writable(device.CapOnOff)}}, wantOn: true},
		{name: "appliance plug", device: device.Device{ID: "plug-appliance", Type: device.Plug, Roles: device.DeviceRoles{ControlledLoad: &applianceRole}, Capabilities: []device.Capability{writable(device.CapOnOff)}}, wantEmpty: true},
		{name: "unclassified plug", device: device.Device{ID: "plug", Type: device.Plug, Capabilities: []device.Capability{writable(device.CapOnOff)}}, wantEmpty: true},
		{name: "sensor", device: device.Device{ID: "sensor", Type: device.Sensor, Capabilities: []device.Capability{writable(device.CapOnOff)}}, wantEmpty: true},
		{name: "reported only", device: testLight("readonly", device.Capability{Name: device.CapColor, Access: device.CapabilityAccessState}), wantEmpty: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Project(tt.device, colour, 0.8)
			if err != nil {
				t.Fatal(err)
			}
			if got.Empty() != tt.wantEmpty || (got.On != nil) != tt.wantOn || (got.Brightness != nil) != tt.wantBright ||
				(got.Color != nil) != tt.wantColor || (got.ColorTemp != nil) != tt.wantTemp {
				t.Fatalf("intent = %#v", got)
			}
		})
	}
}

func TestProjectWhitePrefersTemperatureAndClampsRanges(t *testing.T) {
	brightnessMin, brightnessMax := 10.0, 110.0
	tempMin, tempMax := 200.0, 400.0
	target := testLight("both",
		writable(device.CapOnOff),
		device.Capability{Name: device.CapBrightness, Access: device.CapabilityAccessSet, ValueMin: &brightnessMin, ValueMax: &brightnessMax},
		device.Capability{Name: device.CapColorTemp, Access: device.CapabilityAccessSet, ValueMin: &tempMin, ValueMax: &tempMax},
		writable(device.CapColor),
	)
	intent, err := Project(target, Sample{White: &WhiteSample{Brightness: 0.75, Mireds: 500}}, 0.5)
	if err != nil {
		t.Fatal(err)
	}
	if intent.Color != nil || intent.ColorTemp == nil || *intent.ColorTemp != 400 {
		t.Fatalf("white projection = %#v", intent)
	}
	if intent.Brightness == nil || *intent.Brightness != 48 {
		t.Fatalf("brightness = %v, want 48", intent.Brightness)
	}
	rgbOnly, _ := Project(testLight("rgb", writable(device.CapColor)), Sample{White: &WhiteSample{Brightness: 0.8, Mireds: 370}}, 1)
	if rgbOnly.Color == nil || rgbOnly.ColorTemp != nil {
		t.Fatalf("RGB white projection = %#v", rgbOnly)
	}
}

func TestProjectRejectsInvalidInputAndDisabledDevice(t *testing.T) {
	target := testLight("light", writable(device.CapColor))
	if _, err := Project(target, Sample{}, 1); err == nil {
		t.Fatal("empty sample accepted")
	}
	if _, err := Project(target, Sample{Color: &ColorSample{Lightness: 0.5}}, 1.1); err == nil {
		t.Fatal("invalid brightness scale accepted")
	}
	target.Disabled = true
	intent, err := Project(target, Sample{Color: &ColorSample{Lightness: 0.5}}, 1)
	if err != nil || !intent.Empty() {
		t.Fatalf("disabled intent = %#v, %v", intent, err)
	}
}
