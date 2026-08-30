package zigbee

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func TestMapConfiguration_AqaraP100(t *testing.T) {
	adapter, _, _, _ := newTestAdapter()
	id := device.DeviceID("0xp100")
	adapter.configurationFeatures[id] = map[string]z2mFeature{
		"orientation_detection": {
			Type:     "binary",
			Property: "orientation_detection",
			ValueOn:  json.RawMessage(`"ON"`),
			ValueOff: json.RawMessage(`"OFF"`),
		},
		"fall_detection": {
			Type:     "binary",
			Property: "fall_detection",
		},
	}

	values, err := adapter.mapConfiguration(id, json.RawMessage(`{"orientation_detection":"ON","fall_detection":false}`))
	if err != nil {
		t.Fatal(err)
	}
	if len(values) != 2 {
		t.Fatalf("expected two settings, got %d", len(values))
	}
	if values[0].Capability != "fall_detection" || values[0].BooleanValue == nil || *values[0].BooleanValue {
		t.Fatalf("unexpected fall_detection value: %+v", values[0])
	}
	if values[1].Capability != "orientation_detection" || values[1].BooleanValue == nil || !*values[1].BooleanValue {
		t.Fatalf("unexpected orientation_detection value: %+v", values[1])
	}
}

func TestConfigurationRequest_PublishesZigbeeSet(t *testing.T) {
	adapter, mqtt, _, sw, sr := newTestAdapterWithReader()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	id := device.DeviceID("0xp100")
	dev := device.Device{
		ID:           id,
		FriendlyName: "multistate_sensor",
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Sensor,
		Available:    true,
		Capabilities: []device.Capability{
			{
				Name:     "movement_detection",
				Type:     "binary",
				Category: device.CapabilityCategoryConfiguration,
				Access:   device.CapabilityAccessState | device.CapabilityAccessSet | device.CapabilityAccessGet,
			},
		},
	}
	sw.Register(dev)
	sr.Set(dev)
	adapter.mu.Lock()
	adapter.idToName[id] = dev.FriendlyName
	adapter.nameToID[dev.FriendlyName] = id
	adapter.configurationFeatures[id] = map[string]z2mFeature{
		"movement_detection": {
			Type:     "binary",
			Property: "movement_detection",
			ValueOn:  json.RawMessage(`"ON"`),
			ValueOff: json.RawMessage(`"OFF"`),
		},
	}
	adapter.mu.Unlock()

	if err := adapter.DispatchConfiguration(context.Background(), device.ConfigurationRequest{
		DeviceID: id,
		Values: []device.ConfigurationValue{
			{Capability: "movement_detection", BooleanValue: device.Ptr(true)},
		},
	}); err != nil {
		t.Fatal(err)
	}

	published := waitForPublish(mqtt, 1, 500*time.Millisecond)
	if len(published) != 1 {
		t.Fatalf("expected one publish, got %d", len(published))
	}
	if published[0].Topic != "zigbee2mqtt/multistate_sensor/set" {
		t.Fatalf("unexpected topic %q", published[0].Topic)
	}
	var payload map[string]string
	if err := json.Unmarshal(published[0].Payload, &payload); err != nil {
		t.Fatal(err)
	}
	if payload["movement_detection"] != "ON" {
		t.Fatalf("expected ON wire value, got %q", payload["movement_detection"])
	}
}

func TestConfigurationReport_PublishesTypedEvent(t *testing.T) {
	adapter, mqtt, bus, _ := setupAdapterWithDevice(t, "multistate_sensor", "0xp100", device.Sensor)
	defer adapter.Stop()
	id := device.DeviceID("0xp100")
	adapter.mu.Lock()
	adapter.configurationFeatures[id] = map[string]z2mFeature{
		"fall_detection": {Type: "binary", Property: "fall_detection"},
	}
	adapter.mu.Unlock()

	injectSync(adapter, mqtt, "zigbee2mqtt/multistate_sensor", []byte(`{"fall_detection":true}`))

	events := bus.getEvents()
	for _, event := range events {
		if event.Type != eventbus.EventDeviceConfigurationChanged {
			continue
		}
		change, ok := event.Payload.(device.ConfigurationChange)
		if !ok || len(change.Values) != 1 {
			t.Fatalf("unexpected configuration event: %#v", event.Payload)
		}
		value := change.Values[0]
		if value.Capability != "fall_detection" || value.BooleanValue == nil || !*value.BooleanValue {
			t.Fatalf("unexpected reported setting: %+v", value)
		}
		return
	}
	t.Fatal("expected device.configuration_changed event")
}
