package zigbee

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestProviderGroupCommandPublishesOneMQTTMessage(t *testing.T) {
	adapter, mqtt, _, _ := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatalf("start adapter: %v", err)
	}
	defer adapter.Stop()

	if err := adapter.DispatchGroupState(context.Background(), device.ProviderGroupCommand{
		Provider:        string(device.SourceZigbee2MQTT),
		ProviderGroupID: "7",
		FriendlyName:    "Hall lights",
		MemberIDs:       []device.DeviceID{"a", "b"},
		State:           device.Command{On: device.Ptr(true), Brightness: device.Ptr(180), Origin: device.OriginUser()},
	}); err != nil {
		t.Fatal(err)
	}
	published := mqtt.GetPublished()
	if len(published) != 1 {
		t.Fatalf("published %d messages, want 1", len(published))
	}
	if published[0].Topic != "zigbee2mqtt/Hall lights/set" || published[0].QoS != 1 || published[0].Retained {
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
	adapter, mqtt, _, _, reader := newTestAdapterWithReader()
	for _, id := range []device.DeviceID{"a", "b"} {
		reader.Set(device.Device{ID: id, Capabilities: []device.Capability{{Name: device.CapOnOff}}})
	}
	if err := adapter.Start(); err != nil {
		t.Fatalf("start adapter: %v", err)
	}
	defer adapter.Stop()

	if err := adapter.DispatchGroupState(context.Background(), device.ProviderGroupCommand{
		Provider:        string(device.SourceZigbee2MQTT),
		ProviderGroupID: "7",
		FriendlyName:    "Hall lights",
		MemberIDs:       []device.DeviceID{"a", "b"},
		State:           device.Command{On: device.Ptr(true), Brightness: device.Ptr(0)},
	}); err != nil {
		t.Fatal(err)
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
