package zigbee

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func TestProviderGroupCommandPublishesOneMQTTMessage(t *testing.T) {
	adapter, mqtt, bus, _ := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatalf("start adapter: %v", err)
	}
	defer adapter.Stop()

	bus.Publish(eventbus.Event{
		Type: eventbus.EventProviderGroupCommandRequested,
		Payload: device.ProviderGroupCommand{
			Provider:        string(device.SourceZigbee2MQTT),
			ProviderGroupID: "7",
			FriendlyName:    "Hall lights",
			MemberIDs:       []device.DeviceID{"a", "b"},
			State:           device.Command{On: device.Ptr(true), Brightness: device.Ptr(180), Origin: device.OriginUser()},
		},
	})

	deadline := time.Now().Add(time.Second)
	for len(mqtt.GetPublished()) == 0 && time.Now().Before(deadline) {
		time.Sleep(time.Millisecond)
	}
	published := mqtt.GetPublished()
	if len(published) != 1 {
		t.Fatalf("published %d messages, want 1", len(published))
	}
	if published[0].Topic != "zigbee2mqtt/Hall lights/set" || published[0].QoS != 0 || published[0].Retained {
		t.Fatalf("publish = %+v", published[0])
	}
	var payload map[string]any
	if err := json.Unmarshal(published[0].Payload, &payload); err != nil {
		t.Fatalf("decode payload: %v", err)
	}
	if payload["state"] != "ON" || payload["brightness"] != float64(180) {
		t.Fatalf("payload = %+v", payload)
	}
}

func TestProviderGroupCommandUsesDeviceBrightnessZeroConversion(t *testing.T) {
	adapter, mqtt, bus, _, reader := newTestAdapterWithReader()
	for _, id := range []device.DeviceID{"a", "b"} {
		reader.Set(device.Device{ID: id, Capabilities: []device.Capability{{Name: device.CapOnOff}}})
	}
	if err := adapter.Start(); err != nil {
		t.Fatalf("start adapter: %v", err)
	}
	defer adapter.Stop()

	bus.Publish(eventbus.Event{
		Type: eventbus.EventProviderGroupCommandRequested,
		Payload: device.ProviderGroupCommand{
			Provider:        string(device.SourceZigbee2MQTT),
			ProviderGroupID: "7",
			FriendlyName:    "Hall lights",
			MemberIDs:       []device.DeviceID{"a", "b"},
			State:           device.Command{On: device.Ptr(true), Brightness: device.Ptr(0)},
		},
	})

	deadline := time.Now().Add(time.Second)
	for len(mqtt.GetPublished()) == 0 && time.Now().Before(deadline) {
		time.Sleep(time.Millisecond)
	}
	published := mqtt.GetPublished()
	if len(published) != 1 {
		t.Fatalf("published %d messages, want 1", len(published))
	}
	var payload map[string]any
	if err := json.Unmarshal(published[0].Payload, &payload); err != nil {
		t.Fatalf("decode payload: %v", err)
	}
	if payload["state"] != "OFF" {
		t.Fatalf("state = %v, want OFF", payload["state"])
	}
	if _, exists := payload["brightness"]; exists {
		t.Fatalf("brightness zero was not collapsed: %+v", payload)
	}
}
