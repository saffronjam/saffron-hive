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
		Payload: device.Command{
			DeviceID:   device.DeviceID("0xabc"),
			On:         device.Ptr(true),
			Brightness: device.Ptr(200),
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

func TestCommandTranslation_LightOff(t *testing.T) {
	adapter, mqtt, bus, _ := setupAdapterWithDevice(t, "hall_light", "0xhall", device.Light)
	defer adapter.Stop()

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventCommandRequested,
		DeviceID:  "0xhall",
		Timestamp: time.Now(),
		Payload: device.Command{
			DeviceID: device.DeviceID("0xhall"),
			On:       device.Ptr(false),
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
	if payload.State != "OFF" {
		t.Fatalf("expected state OFF, got %s", payload.State)
	}
}

func TestCommandTranslation_ColorTemp(t *testing.T) {
	adapter, mqtt, bus, _ := setupAdapterWithDevice(t, "desk_lamp", "0xdef", device.Light)
	defer adapter.Stop()

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventCommandRequested,
		DeviceID:  "0xdef",
		Timestamp: time.Now(),
		Payload: device.Command{
			DeviceID:  device.DeviceID("0xdef"),
			ColorTemp: device.Ptr(400),
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
		Payload: device.Command{
			DeviceID: device.DeviceID("0xrgb"),
			Color:    &device.Color{R: 255, G: 0, B: 128},
		},
	})

	pubs := waitForPublish(mqtt, 1, 500*time.Millisecond)
	if len(pubs) == 0 {
		t.Fatal("expected at least one publish")
	}

	var raw struct {
		Color map[string]any `json:"color"`
	}
	if err := json.Unmarshal(pubs[0].Payload, &raw); err != nil {
		t.Fatal(err)
	}
	if raw.Color == nil {
		t.Fatal("expected color to be set")
	}
	if got := toInt(raw.Color["r"]); got != 255 {
		t.Fatalf("color.r = %d, want 255", got)
	}
	if got := toInt(raw.Color["g"]); got != 0 {
		t.Fatalf("color.g = %d, want 0", got)
	}
	if got := toInt(raw.Color["b"]); got != 128 {
		t.Fatalf("color.b = %d, want 128", got)
	}
	if _, hasX := raw.Color["x"]; hasX {
		t.Fatalf("RGB-only command must not include x: %v", raw.Color)
	}
	if _, hasY := raw.Color["y"]; hasY {
		t.Fatalf("RGB-only command must not include y: %v", raw.Color)
	}
}

func TestCommandTranslation_ColorXY(t *testing.T) {
	adapter, mqtt, bus, _ := setupAdapterWithDevice(t, "xy_light", "0xxy", device.Light)
	defer adapter.Stop()

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventCommandRequested,
		DeviceID:  "0xxy",
		Timestamp: time.Now(),
		Payload: device.Command{
			DeviceID: device.DeviceID("0xxy"),
			Color:    &device.Color{R: 0, G: 0, B: 0, X: 0.4, Y: 0.5},
		},
	})

	pubs := waitForPublish(mqtt, 1, 500*time.Millisecond)
	if len(pubs) == 0 {
		t.Fatal("expected at least one publish")
	}

	var raw struct {
		Color map[string]any `json:"color"`
	}
	if err := json.Unmarshal(pubs[0].Payload, &raw); err != nil {
		t.Fatal(err)
	}
	if raw.Color == nil {
		t.Fatal("expected color to be set")
	}
	if got, _ := raw.Color["x"].(float64); got != 0.4 {
		t.Fatalf("color.x = %v, want 0.4", raw.Color["x"])
	}
	if got, _ := raw.Color["y"].(float64); got != 0.5 {
		t.Fatalf("color.y = %v, want 0.5", raw.Color["y"])
	}
	for _, k := range []string{"r", "g", "b"} {
		if _, has := raw.Color[k]; has {
			t.Fatalf("XY-mode command must not include %s: %v", k, raw.Color)
		}
	}
}

func toInt(v any) int {
	switch n := v.(type) {
	case float64:
		return int(n)
	case int:
		return n
	}
	return 0
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
		Payload: device.Command{
			DeviceID: device.DeviceID("0xunknown"),
			On:       device.Ptr(true),
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
		Payload: device.Command{
			DeviceID:   device.DeviceID("0xbed"),
			On:         device.Ptr(true),
			Brightness: device.Ptr(150),
			Transition: device.Ptr(2.5),
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
