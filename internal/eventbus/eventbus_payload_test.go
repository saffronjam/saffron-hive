package eventbus_test

import (
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func ptr[T any](v T) *T { return &v }

func TestPayloadWithDomainTypes(t *testing.T) {
	bus := eventbus.NewChannelBus()
	ch := bus.Subscribe(eventbus.EventDeviceStateChanged, eventbus.EventDeviceActionFired)

	light := device.DeviceState{
		On:         ptr(true),
		Brightness: ptr(80),
		Color:      &device.Color{R: 255, G: 128, B: 0, X: 0.5, Y: 0.4},
	}
	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "light-1",
		Timestamp: time.Now(),
		Payload:   light,
	})

	got := <-ch
	ls, ok := got.Payload.(device.DeviceState)
	if !ok {
		t.Fatal("payload type assertion to DeviceState failed")
	}
	if *ls.Brightness != 80 {
		t.Fatalf("expected brightness 80, got %d", *ls.Brightness)
	}
	if ls.Color.R != 255 {
		t.Fatalf("expected color R 255, got %d", ls.Color.R)
	}

	sensor := device.DeviceState{
		Temperature: ptr(21.5),
		Humidity:    ptr(55.0),
		Battery:     ptr(87),
	}
	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "sensor-1",
		Timestamp: time.Now(),
		Payload:   sensor,
	})

	got = <-ch
	ss, ok := got.Payload.(device.DeviceState)
	if !ok {
		t.Fatal("payload type assertion to DeviceState failed")
	}
	if *ss.Temperature != 21.5 {
		t.Fatalf("expected temperature 21.5, got %f", *ss.Temperature)
	}
	if *ss.Battery != 87 {
		t.Fatalf("expected battery 87, got %d", *ss.Battery)
	}

	action := device.Action{Action: "toggle"}
	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceActionFired,
		DeviceID:  "switch-1",
		Timestamp: time.Now(),
		Payload:   action,
	})

	got = <-ch
	act, ok := got.Payload.(device.Action)
	if !ok {
		t.Fatal("payload type assertion to Action failed")
	}
	if act.Action != "toggle" {
		t.Fatalf("expected action toggle, got %s", act.Action)
	}
}

func TestPayloadNil(t *testing.T) {
	bus := eventbus.NewChannelBus()
	ch := bus.Subscribe(eventbus.EventDeviceRemoved)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceRemoved,
		DeviceID:  "light-1",
		Timestamp: time.Now(),
		Payload:   nil,
	})

	select {
	case got := <-ch:
		if got.Payload != nil {
			t.Fatalf("expected nil payload, got %v", got.Payload)
		}
		if got.DeviceID != "light-1" {
			t.Fatalf("expected device id light-1, got %s", got.DeviceID)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for event")
	}
}
