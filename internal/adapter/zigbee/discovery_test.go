package zigbee

import (
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestDiscoverDevices_Light(t *testing.T) {
	adapter, mqtt, _, sw := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(`[{
		"ieee_address": "0x00158d0001a2b3c4",
		"friendly_name": "living_room_light",
		"type": "Router",
		"supported": true,
		"definition": {
			"model": "LED1545G12", "vendor": "IKEA", "description": "TRADFRI bulb",
			"exposes": [
				{"type": "light", "features": [
					{"type": "binary", "name": "state", "property": "state"},
					{"type": "numeric", "name": "brightness", "property": "brightness"}
				]}
			]
		}
	}]`))

	sw.mu.Lock()
	defer sw.mu.Unlock()

	dev, ok := sw.devices[device.DeviceID("0x00158d0001a2b3c4")]
	if !ok {
		t.Fatal("device not registered")
	}
	if dev.Type != device.Light {
		t.Fatalf("expected Light, got %s", dev.Type)
	}
	if dev.Name != "living_room_light" {
		t.Fatalf("expected living_room_light, got %s", dev.Name)
	}
}

func TestDiscoverDevices_Sensor(t *testing.T) {
	adapter, mqtt, _, sw := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(`[{
		"ieee_address": "0x00158d0001a2b3c5",
		"friendly_name": "temp_sensor",
		"type": "EndDevice",
		"supported": true,
		"definition": {
			"model": "WSDCGQ11LM", "vendor": "Aqara", "description": "Temperature sensor",
			"exposes": [
				{"type": "numeric", "name": "temperature", "property": "temperature"},
				{"type": "numeric", "name": "humidity", "property": "humidity"}
			]
		}
	}]`))

	sw.mu.Lock()
	defer sw.mu.Unlock()

	dev, ok := sw.devices[device.DeviceID("0x00158d0001a2b3c5")]
	if !ok {
		t.Fatal("device not registered")
	}
	if dev.Type != device.Sensor {
		t.Fatalf("expected Sensor, got %s", dev.Type)
	}
}

func TestDiscoverDevices_Button(t *testing.T) {
	adapter, mqtt, _, sw := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(`[{
		"ieee_address": "0x00158d0001a2b3c6",
		"friendly_name": "button_1",
		"type": "EndDevice",
		"supported": true,
		"definition": {
			"model": "WXKG01LM", "vendor": "Aqara", "description": "Button",
			"exposes": [
				{"type": "enum", "name": "action", "property": "action"}
			]
		}
	}]`))

	sw.mu.Lock()
	defer sw.mu.Unlock()

	dev, ok := sw.devices[device.DeviceID("0x00158d0001a2b3c6")]
	if !ok {
		t.Fatal("device not registered")
	}
	if dev.Type != device.Button {
		t.Fatalf("expected Button, got %s", dev.Type)
	}
}

func TestDiscoverDevices_Plug(t *testing.T) {
	adapter, mqtt, _, sw := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(`[{
		"ieee_address": "0x00158d000328303e",
		"friendly_name": "lava_lamp",
		"type": "Router",
		"supported": true,
		"definition": {
			"model": "SP 120", "vendor": "Innr", "description": "Smart plug",
			"exposes": [
				{"type": "switch", "features": [
					{"type": "binary", "name": "state", "property": "state"}
				]},
				{"type": "numeric", "name": "power", "property": "power", "unit": "W"},
				{"type": "numeric", "name": "voltage", "property": "voltage", "unit": "V"},
				{"type": "numeric", "name": "current", "property": "current", "unit": "A"},
				{"type": "numeric", "name": "energy", "property": "energy", "unit": "kWh"}
			]
		}
	}]`))

	sw.mu.Lock()
	defer sw.mu.Unlock()

	dev, ok := sw.devices[device.DeviceID("0x00158d000328303e")]
	if !ok {
		t.Fatal("device not registered")
	}
	if dev.Type != device.Plug {
		t.Fatalf("expected Plug, got %s", dev.Type)
	}
}

func TestDiscoverDevices_PlainPlug(t *testing.T) {
	adapter, mqtt, _, sw := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(`[{
		"ieee_address": "0xplainplug",
		"friendly_name": "bare_plug",
		"type": "Router",
		"supported": true,
		"definition": {
			"exposes": [
				{"type": "switch", "features": [
					{"type": "binary", "name": "state", "property": "state"}
				]}
			]
		}
	}]`))

	sw.mu.Lock()
	defer sw.mu.Unlock()

	dev, ok := sw.devices[device.DeviceID("0xplainplug")]
	if !ok {
		t.Fatal("device not registered")
	}
	if dev.Type != device.Plug {
		t.Fatalf("expected Plug, got %s", dev.Type)
	}
}

func TestDiscoverDevices_Unknown(t *testing.T) {
	adapter, mqtt, _, sw := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(`[{
		"ieee_address": "0x00158d0001a2b3c7",
		"friendly_name": "mystery_device",
		"type": "Router",
		"supported": true,
		"definition": {
			"model": "UNKNOWN", "vendor": "Unknown", "description": "Unknown",
			"exposes": [
				{"type": "numeric", "name": "linkquality", "property": "linkquality"}
			]
		}
	}]`))

	sw.mu.Lock()
	defer sw.mu.Unlock()

	dev, ok := sw.devices[device.DeviceID("0x00158d0001a2b3c7")]
	if !ok {
		t.Fatal("device not registered")
	}
	if dev.Type != device.Unknown {
		t.Fatalf("expected Unknown, got %s", dev.Type)
	}
}

func TestDiscoverDevices_Multiple(t *testing.T) {
	adapter, mqtt, _, sw := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(`[
		{"ieee_address": "0x01", "friendly_name": "light1", "type": "Router", "supported": true, "definition": {"exposes": [{"type":"light","features":[{"type":"binary","name":"state","property":"state"},{"type":"numeric","name":"brightness","property":"brightness"}]}]}},
		{"ieee_address": "0x02", "friendly_name": "light2", "type": "Router", "supported": true, "definition": {"exposes": [{"type":"light","features":[{"type":"binary","name":"state","property":"state"},{"type":"numeric","name":"brightness","property":"brightness"}]}]}},
		{"ieee_address": "0x03", "friendly_name": "sensor1", "type": "EndDevice", "supported": true, "definition": {"exposes": [{"type":"numeric","name":"temperature","property":"temperature"}]}},
		{"ieee_address": "0x04", "friendly_name": "button1", "type": "EndDevice", "supported": true, "definition": {"exposes": [{"type":"enum","name":"action","property":"action"}]}},
		{"ieee_address": "0x05", "friendly_name": "unknown1", "type": "Router", "supported": true, "definition": {"exposes": []}}
	]`))

	sw.mu.Lock()
	defer sw.mu.Unlock()

	if len(sw.devices) != 5 {
		t.Fatalf("expected 5 devices, got %d", len(sw.devices))
	}
	if sw.devices[device.DeviceID("0x01")].Type != device.Light {
		t.Fatal("device 0x01 should be Light")
	}
	if sw.devices[device.DeviceID("0x03")].Type != device.Sensor {
		t.Fatal("device 0x03 should be Sensor")
	}
	if sw.devices[device.DeviceID("0x04")].Type != device.Button {
		t.Fatal("device 0x04 should be Button")
	}
	if sw.devices[device.DeviceID("0x05")].Type != device.Unknown {
		t.Fatal("device 0x05 should be Unknown")
	}
}

func TestDiscoverDevices_SkipCoordinator(t *testing.T) {
	adapter, mqtt, _, sw := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(`[
		{"ieee_address": "0xcoord", "friendly_name": "Coordinator", "type": "Coordinator", "supported": true, "definition": {"exposes": []}},
		{"ieee_address": "0x01", "friendly_name": "light1", "type": "Router", "supported": true, "definition": {"exposes": [{"type":"light","features":[{"type":"binary","name":"state","property":"state"},{"type":"numeric","name":"brightness","property":"brightness"}]}]}}
	]`))

	sw.mu.Lock()
	defer sw.mu.Unlock()

	if len(sw.devices) != 1 {
		t.Fatalf("expected 1 device (coordinator skipped), got %d", len(sw.devices))
	}
	if _, ok := sw.devices[device.DeviceID("0xcoord")]; ok {
		t.Fatal("coordinator should have been skipped")
	}
}

func TestDiscoverDevices_MalformedJSON(t *testing.T) {
	adapter, mqtt, _, sw := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(`not json`))

	sw.mu.Lock()
	defer sw.mu.Unlock()

	if len(sw.devices) != 0 {
		t.Fatal("no devices should be registered on malformed JSON")
	}
}

func TestExtractCapabilities_Light(t *testing.T) {
	exposes := []z2mFeature{
		{
			Type: "light",
			Features: []z2mFeature{
				{Type: "binary", Property: "state", Access: 7},
				{Type: "numeric", Property: "brightness", Access: 7, ValueMin: ptr(0.0), ValueMax: ptr(254.0)},
				{Type: "numeric", Property: "color_temp", Access: 7, ValueMin: ptr(150.0), ValueMax: ptr(500.0)},
			},
		},
		{Property: "linkquality"},
	}
	caps := extractCapabilities(exposes)
	assertCapNames(t, caps, []string{device.CapOnOff, device.CapBrightness, device.CapColorTemp})
}

func TestExtractCapabilities_LightWithColor(t *testing.T) {
	exposes := []z2mFeature{
		{
			Type: "light",
			Features: []z2mFeature{
				{Type: "binary", Property: "state", Access: 7},
				{Type: "numeric", Property: "brightness", Access: 7},
				{Type: "numeric", Property: "color_temp", Access: 7},
				{Type: "composite", Property: "color", Access: 7},
			},
		},
	}
	caps := extractCapabilities(exposes)
	assertCapNames(t, caps, []string{device.CapOnOff, device.CapBrightness, device.CapColorTemp, device.CapColor})
}

func TestExtractCapabilities_Sensor(t *testing.T) {
	exposes := []z2mFeature{
		{Type: "numeric", Property: "temperature", Access: 1, Unit: "°C", ValueMin: ptr(-20.0), ValueMax: ptr(60.0)},
		{Type: "numeric", Property: "humidity", Access: 1, Unit: "%", ValueMin: ptr(0.0), ValueMax: ptr(100.0)},
		{Type: "numeric", Property: "battery", Access: 1, Unit: "%", ValueMin: ptr(0.0), ValueMax: ptr(100.0)},
		{Property: "linkquality"},
	}
	caps := extractCapabilities(exposes)
	assertCapNames(t, caps, []string{device.CapTemperature, device.CapHumidity, device.CapBattery})
}

func TestExtractCapabilities_SmartPlug(t *testing.T) {
	exposes := []z2mFeature{
		{
			Type: "switch",
			Features: []z2mFeature{
				{Type: "binary", Property: "state", Access: 7},
			},
		},
		{Type: "numeric", Property: "power", Access: 1, Unit: "W"},
		{Type: "numeric", Property: "voltage", Access: 1, Unit: "V"},
		{Type: "numeric", Property: "current", Access: 1, Unit: "A"},
		{Type: "numeric", Property: "energy", Access: 1, Unit: "kWh"},
		{Property: "linkquality"},
	}
	caps := extractCapabilities(exposes)
	assertCapNames(t, caps, []string{device.CapOnOff, device.CapPower, device.CapVoltage, device.CapCurrent, device.CapEnergy})
}

func TestExtractCapabilities_Switch(t *testing.T) {
	exposes := []z2mFeature{
		{Type: "enum", Property: "action", Access: 1, Values: []string{"single", "double", "hold"}},
		{Type: "numeric", Property: "battery", Access: 1, Unit: "%"},
		{Property: "linkquality"},
	}
	caps := extractCapabilities(exposes)
	assertCapNames(t, caps, []string{device.CapAction, device.CapBattery})
}

func TestExtractCapabilities_Empty(t *testing.T) {
	caps := extractCapabilities(nil)
	if len(caps) != 0 {
		t.Fatalf("expected empty capabilities, got %v", capNames(caps))
	}
}

func TestExtractCapabilities_DiagnosticOnly(t *testing.T) {
	exposes := []z2mFeature{
		{Property: "linkquality"},
		{Property: "color_temp_startup"},
	}
	caps := extractCapabilities(exposes)
	if len(caps) != 0 {
		t.Fatalf("expected empty capabilities for diagnostic-only features, got %v", capNames(caps))
	}
}

func TestExtractCapabilities_NoDuplicates(t *testing.T) {
	exposes := []z2mFeature{
		{
			Type: "light",
			Features: []z2mFeature{
				{Type: "binary", Property: "state", Access: 7},
				{Type: "numeric", Property: "brightness", Access: 7},
			},
		},
		{Type: "binary", Property: "state", Access: 7},
		{Type: "numeric", Property: "brightness", Access: 7},
	}
	caps := extractCapabilities(exposes)
	assertCapNames(t, caps, []string{device.CapOnOff, device.CapBrightness})
}

func TestExtractCapabilities_RichMetadata(t *testing.T) {
	exposes := []z2mFeature{
		{
			Type: "enum", Property: "action", Access: 1,
			Values: []string{"single", "double", "hold"},
		},
		{
			Type: "numeric", Property: "battery", Access: 1,
			ValueMin: ptr(0.0), ValueMax: ptr(100.0), Unit: "%",
		},
		{
			Type: "numeric", Property: "temperature", Access: 1,
			ValueMin: ptr(-20.0), ValueMax: ptr(60.0), Unit: "°C",
		},
	}
	caps := extractCapabilities(exposes)

	action := findCap(t, caps, device.CapAction)
	if action.Type != "enum" {
		t.Fatalf("expected action type enum, got %s", action.Type)
	}
	if len(action.Values) != 3 || action.Values[0] != "single" {
		t.Fatalf("expected action values [single double hold], got %v", action.Values)
	}
	if action.Access != 1 {
		t.Fatalf("expected action access 1, got %d", action.Access)
	}

	battery := findCap(t, caps, device.CapBattery)
	if battery.Unit != "%" {
		t.Fatalf("expected battery unit %%, got %s", battery.Unit)
	}
	if battery.ValueMin == nil || *battery.ValueMin != 0 {
		t.Fatalf("expected battery min 0, got %v", battery.ValueMin)
	}
	if battery.ValueMax == nil || *battery.ValueMax != 100 {
		t.Fatalf("expected battery max 100, got %v", battery.ValueMax)
	}

	temp := findCap(t, caps, device.CapTemperature)
	if temp.Unit != "°C" {
		t.Fatalf("expected temperature unit °C, got %s", temp.Unit)
	}
	if temp.ValueMin == nil || *temp.ValueMin != -20 {
		t.Fatalf("expected temperature min -20, got %v", temp.ValueMin)
	}
}

func TestDiscoverDevices_HueBulbEffectCapability(t *testing.T) {
	adapter, mqtt, _, sw := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(`[{
		"ieee_address": "0xhuebulb",
		"friendly_name": "hue_bulb",
		"type": "Router",
		"supported": true,
		"definition": {
			"model": "9290022166", "vendor": "Philips", "description": "Hue white and color ambiance",
			"exposes": [
				{"type": "light", "features": [
					{"type": "binary", "name": "state", "property": "state", "access": 7},
					{"type": "numeric", "name": "brightness", "property": "brightness", "access": 7}
				]},
				{"type": "enum", "name": "effect", "property": "effect", "access": 2,
					"values": ["blink","breathe","okay","channel_change","candle","fireplace","colorloop","finish_effect","stop_effect","stop_hue_effect"]}
			]
		}
	}]`))

	sw.mu.Lock()
	defer sw.mu.Unlock()

	dev, ok := sw.devices[device.DeviceID("0xhuebulb")]
	if !ok {
		t.Fatal("device not registered")
	}

	effect := findCap(t, dev.Capabilities, device.CapEffect)
	if effect.Type != "enum" {
		t.Fatalf("expected effect type enum, got %s", effect.Type)
	}
	want := []string{"blink", "breathe", "okay", "channel_change", "candle", "fireplace", "colorloop", "finish_effect", "stop_effect", "stop_hue_effect"}
	if len(effect.Values) != len(want) {
		t.Fatalf("expected %d effect values %v, got %d %v", len(want), want, len(effect.Values), effect.Values)
	}
	for i, v := range want {
		if effect.Values[i] != v {
			t.Fatalf("effect values[%d]: expected %q, got %q (full: %v)", i, v, effect.Values[i], effect.Values)
		}
	}
}

func TestDiscoverDevices_IdentifyOnlyEffectCapability(t *testing.T) {
	adapter, mqtt, _, sw := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(`[{
		"ieee_address": "0xgenericbulb",
		"friendly_name": "generic_bulb",
		"type": "Router",
		"supported": true,
		"definition": {
			"model": "GENERIC", "vendor": "Generic", "description": "Generic bulb with Identify cluster",
			"exposes": [
				{"type": "light", "features": [
					{"type": "binary", "name": "state", "property": "state", "access": 7},
					{"type": "numeric", "name": "brightness", "property": "brightness", "access": 7}
				]},
				{"type": "enum", "name": "effect", "property": "effect", "access": 2,
					"values": ["blink","breathe","okay","channel_change","finish_effect","stop_effect"]}
			]
		}
	}]`))

	sw.mu.Lock()
	defer sw.mu.Unlock()

	dev, ok := sw.devices[device.DeviceID("0xgenericbulb")]
	if !ok {
		t.Fatal("device not registered")
	}

	effect := findCap(t, dev.Capabilities, device.CapEffect)
	if effect.Type != "enum" {
		t.Fatalf("expected effect type enum, got %s", effect.Type)
	}
	want := []string{"blink", "breathe", "okay", "channel_change", "finish_effect", "stop_effect"}
	if len(effect.Values) != len(want) {
		t.Fatalf("expected %d effect values %v, got %d %v", len(want), want, len(effect.Values), effect.Values)
	}
	for i, v := range want {
		if effect.Values[i] != v {
			t.Fatalf("effect values[%d]: expected %q, got %q (full: %v)", i, v, effect.Values[i], effect.Values)
		}
	}
}

func TestDiscoverDevices_NonLightHasNoEffectCapability(t *testing.T) {
	adapter, mqtt, _, sw := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(`[{
		"ieee_address": "0xbutton_no_effect",
		"friendly_name": "wall_switch",
		"type": "EndDevice",
		"supported": true,
		"definition": {
			"model": "WXKG01LM", "vendor": "Aqara", "description": "Button",
			"exposes": [
				{"type": "enum", "name": "action", "property": "action", "access": 1,
					"values": ["single","double","hold"]},
				{"type": "numeric", "name": "battery", "property": "battery", "access": 1, "unit": "%"}
			]
		}
	}]`))

	sw.mu.Lock()
	defer sw.mu.Unlock()

	dev, ok := sw.devices[device.DeviceID("0xbutton_no_effect")]
	if !ok {
		t.Fatal("device not registered")
	}
	for _, c := range dev.Capabilities {
		if c.Name == device.CapEffect {
			t.Fatalf("expected no effect capability on non-light device, got %v", capNames(dev.Capabilities))
		}
	}
}

func assertCapNames(t *testing.T, got []device.Capability, wantNames []string) {
	t.Helper()
	gotNames := capNames(got)
	if len(got) != len(wantNames) {
		t.Fatalf("expected %d capabilities %v, got %d %v", len(wantNames), wantNames, len(got), gotNames)
	}
	wantSet := make(map[string]struct{}, len(wantNames))
	for _, w := range wantNames {
		wantSet[w] = struct{}{}
	}
	for _, g := range got {
		if _, ok := wantSet[g.Name]; !ok {
			t.Fatalf("unexpected capability %q in %v (want %v)", g.Name, gotNames, wantNames)
		}
	}
}

func capNames(caps []device.Capability) []string {
	names := make([]string, len(caps))
	for i, c := range caps {
		names[i] = c.Name
	}
	return names
}

func findCap(t *testing.T, caps []device.Capability, name string) device.Capability {
	t.Helper()
	for _, c := range caps {
		if c.Name == name {
			return c
		}
	}
	t.Fatalf("capability %q not found in %v", name, capNames(caps))
	return device.Capability{}
}

func ptr(f float64) *float64 {
	return &f
}
