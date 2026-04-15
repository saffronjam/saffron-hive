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

	mqtt.Inject("zigbee2mqtt/bridge/devices", []byte(`[{
		"ieee_address": "0x00158d0001a2b3c4",
		"friendly_name": "living_room_light",
		"type": "Router",
		"supported": true,
		"definition": {"model": "LED1545G12", "vendor": "IKEA", "description": "TRADFRI bulb"},
		"features": [
			{"type": "binary", "name": "state", "property": "state"},
			{"type": "numeric", "name": "brightness", "property": "brightness"}
		]
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

	mqtt.Inject("zigbee2mqtt/bridge/devices", []byte(`[{
		"ieee_address": "0x00158d0001a2b3c5",
		"friendly_name": "temp_sensor",
		"type": "EndDevice",
		"supported": true,
		"definition": {"model": "WSDCGQ11LM", "vendor": "Aqara", "description": "Temperature sensor"},
		"features": [
			{"type": "numeric", "name": "temperature", "property": "temperature"},
			{"type": "numeric", "name": "humidity", "property": "humidity"}
		]
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

func TestDiscoverDevices_Switch(t *testing.T) {
	adapter, mqtt, _, sw := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	mqtt.Inject("zigbee2mqtt/bridge/devices", []byte(`[{
		"ieee_address": "0x00158d0001a2b3c6",
		"friendly_name": "button_1",
		"type": "EndDevice",
		"supported": true,
		"definition": {"model": "WXKG01LM", "vendor": "Aqara", "description": "Button"},
		"features": [
			{"type": "enum", "name": "action", "property": "action"}
		]
	}]`))

	sw.mu.Lock()
	defer sw.mu.Unlock()

	dev, ok := sw.devices[device.DeviceID("0x00158d0001a2b3c6")]
	if !ok {
		t.Fatal("device not registered")
	}
	if dev.Type != device.Switch {
		t.Fatalf("expected Switch, got %s", dev.Type)
	}
}

func TestDiscoverDevices_Unknown(t *testing.T) {
	adapter, mqtt, _, sw := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	mqtt.Inject("zigbee2mqtt/bridge/devices", []byte(`[{
		"ieee_address": "0x00158d0001a2b3c7",
		"friendly_name": "mystery_device",
		"type": "Router",
		"supported": true,
		"definition": {"model": "UNKNOWN", "vendor": "Unknown", "description": "Unknown"},
		"features": [
			{"type": "numeric", "name": "linkquality", "property": "linkquality"}
		]
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

	mqtt.Inject("zigbee2mqtt/bridge/devices", []byte(`[
		{"ieee_address": "0x01", "friendly_name": "light1", "type": "Router", "supported": true, "definition": {}, "features": [{"type":"binary","name":"state","property":"state"},{"type":"numeric","name":"brightness","property":"brightness"}]},
		{"ieee_address": "0x02", "friendly_name": "light2", "type": "Router", "supported": true, "definition": {}, "features": [{"type":"binary","name":"state","property":"state"},{"type":"numeric","name":"brightness","property":"brightness"}]},
		{"ieee_address": "0x03", "friendly_name": "sensor1", "type": "EndDevice", "supported": true, "definition": {}, "features": [{"type":"numeric","name":"temperature","property":"temperature"}]},
		{"ieee_address": "0x04", "friendly_name": "button1", "type": "EndDevice", "supported": true, "definition": {}, "features": [{"type":"enum","name":"action","property":"action"}]},
		{"ieee_address": "0x05", "friendly_name": "unknown1", "type": "Router", "supported": true, "definition": {}, "features": []}
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
	if sw.devices[device.DeviceID("0x04")].Type != device.Switch {
		t.Fatal("device 0x04 should be Switch")
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

	mqtt.Inject("zigbee2mqtt/bridge/devices", []byte(`[
		{"ieee_address": "0xcoord", "friendly_name": "Coordinator", "type": "Coordinator", "supported": true, "definition": {}, "features": []},
		{"ieee_address": "0x01", "friendly_name": "light1", "type": "Router", "supported": true, "definition": {}, "features": [{"type":"binary","name":"state","property":"state"},{"type":"numeric","name":"brightness","property":"brightness"}]}
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

	mqtt.Inject("zigbee2mqtt/bridge/devices", []byte(`not json`))

	sw.mu.Lock()
	defer sw.mu.Unlock()

	if len(sw.devices) != 0 {
		t.Fatal("no devices should be registered on malformed JSON")
	}
}
