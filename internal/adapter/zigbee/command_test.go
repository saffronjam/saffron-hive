package zigbee

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func waitForPublish(mqtt *FakeMQTTClient, count int, timeout time.Duration) []FakePublish {
	deadline := time.After(timeout)
	for {
		pubs := mqtt.GetPublished()
		if len(pubs) >= count {
			return pubs
		}
		select {
		case <-deadline:
			return mqtt.GetPublished()
		case <-time.After(5 * time.Millisecond):
		}
	}
}

func TestCommandTranslation_LightOn(t *testing.T) {
	adapter, mqtt, bus, _ := setupAdapterWithDevice(t, "living_room_light", "0xabc", device.Light)
	defer adapter.Stop()

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventCommandRequested,
		DeviceID:  "0xabc",
		Timestamp: time.Now(),
		Payload: device.DeviceCommand{
			DeviceID: device.DeviceID("0xabc"),
			Payload: device.LightCommand{
				On:         device.Ptr(true),
				Brightness: device.Ptr(200),
			},
		},
	})

	pubs := waitForPublish(mqtt, 1, 500*time.Millisecond)
	if len(pubs) == 0 {
		t.Fatal("expected at least one publish")
	}

	pub := pubs[0]
	if pub.Topic != "zigbee2mqtt/living_room_light/set" {
		t.Fatalf("expected topic zigbee2mqtt/living_room_light/set, got %s", pub.Topic)
	}

	var payload z2mSetPayload
	if err := json.Unmarshal(pub.Payload, &payload); err != nil {
		t.Fatal(err)
	}
	if payload.State != "ON" {
		t.Fatalf("expected state ON, got %s", payload.State)
	}
	if payload.Brightness == nil || *payload.Brightness != 200 {
		t.Fatalf("expected brightness 200, got %v", payload.Brightness)
	}
}

func TestCommandTranslation_ColorTemp(t *testing.T) {
	adapter, mqtt, bus, _ := setupAdapterWithDevice(t, "desk_lamp", "0xdef", device.Light)
	defer adapter.Stop()

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventCommandRequested,
		DeviceID:  "0xdef",
		Timestamp: time.Now(),
		Payload: device.DeviceCommand{
			DeviceID: device.DeviceID("0xdef"),
			Payload: device.LightCommand{
				ColorTemp: device.Ptr(400),
			},
		},
	})

	pubs := waitForPublish(mqtt, 1, 500*time.Millisecond)
	if len(pubs) == 0 {
		t.Fatal("expected at least one publish")
	}

	var payload z2mSetPayload
	if err := json.Unmarshal(pubs[0].Payload, &payload); err != nil {
		t.Fatal(err)
	}
	if payload.ColorTemp == nil || *payload.ColorTemp != 400 {
		t.Fatalf("expected color_temp 400, got %v", payload.ColorTemp)
	}
}

func TestCommandTranslation_Color(t *testing.T) {
	adapter, mqtt, bus, _ := setupAdapterWithDevice(t, "rgb_light", "0xrgb", device.Light)
	defer adapter.Stop()

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventCommandRequested,
		DeviceID:  "0xrgb",
		Timestamp: time.Now(),
		Payload: device.DeviceCommand{
			DeviceID: device.DeviceID("0xrgb"),
			Payload: device.LightCommand{
				Color: &device.Color{R: 255, G: 0, B: 128},
			},
		},
	})

	pubs := waitForPublish(mqtt, 1, 500*time.Millisecond)
	if len(pubs) == 0 {
		t.Fatal("expected at least one publish")
	}

	var payload z2mSetPayload
	if err := json.Unmarshal(pubs[0].Payload, &payload); err != nil {
		t.Fatal(err)
	}
	if payload.Color == nil {
		t.Fatal("expected color to be set")
	}
	if payload.Color.R != 255 || payload.Color.G != 0 || payload.Color.B != 128 {
		t.Fatalf("expected RGB 255,0,128 got %d,%d,%d", payload.Color.R, payload.Color.G, payload.Color.B)
	}
}

func TestCommandTranslation_UnknownDevice(t *testing.T) {
	adapter, mqtt, bus, _ := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventCommandRequested,
		DeviceID:  "0xunknown",
		Timestamp: time.Now(),
		Payload: device.DeviceCommand{
			DeviceID: device.DeviceID("0xunknown"),
			Payload: device.LightCommand{
				On: device.Ptr(true),
			},
		},
	})

	time.Sleep(50 * time.Millisecond)

	pubs := mqtt.GetPublished()
	if len(pubs) != 0 {
		t.Fatalf("expected no publishes for unknown device, got %d", len(pubs))
	}
}

func TestCommandTranslation_WithTransition(t *testing.T) {
	adapter, mqtt, bus, _ := setupAdapterWithDevice(t, "bedroom_light", "0xbed", device.Light)
	defer adapter.Stop()

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventCommandRequested,
		DeviceID:  "0xbed",
		Timestamp: time.Now(),
		Payload: device.DeviceCommand{
			DeviceID: device.DeviceID("0xbed"),
			Payload: device.LightCommand{
				On:         device.Ptr(true),
				Brightness: device.Ptr(150),
				Transition: device.Ptr(2.5),
			},
		},
	})

	pubs := waitForPublish(mqtt, 1, 500*time.Millisecond)
	if len(pubs) == 0 {
		t.Fatal("expected at least one publish")
	}

	var payload z2mSetPayload
	if err := json.Unmarshal(pubs[0].Payload, &payload); err != nil {
		t.Fatal(err)
	}
	if payload.Transition == nil || *payload.Transition != 2.5 {
		t.Fatalf("expected transition 2.5, got %v", payload.Transition)
	}
	if payload.State != "ON" {
		t.Fatalf("expected state ON, got %s", payload.State)
	}
}
