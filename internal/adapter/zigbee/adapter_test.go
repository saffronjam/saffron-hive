package zigbee

import (
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func setupAdapterWithDevice(t *testing.T, friendlyName, ieee string, devType device.DeviceType) (*ZigbeeAdapter, *FakeMQTTClient, *mockEventBus, *mockStateWriter) {
	t.Helper()
	adapter, mqtt, bus, sw := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}

	adapter.mu.Lock()
	id := device.DeviceID(ieee)
	adapter.nameToID[friendlyName] = id
	adapter.idToName[id] = friendlyName
	adapter.ieeeToID[ieee] = id
	adapter.deviceTypes[id] = devType
	adapter.mu.Unlock()

	return adapter, mqtt, bus, sw
}

func TestStateChangePublishesEvent(t *testing.T) {
	adapter, mqtt, bus, _ := setupAdapterWithDevice(t, "living_room_light", "0xabc", device.Light)
	defer adapter.Stop()

	mqtt.Inject("zigbee2mqtt/living_room_light", []byte(`{"state":"ON","brightness":200}`))

	events := waitForEvents(bus, 1, 500*time.Millisecond)
	if len(events) == 0 {
		t.Fatal("expected at least one event")
	}

	found := false
	for _, e := range events {
		if e.Type == eventbus.EventDeviceStateChanged {
			found = true
			if e.DeviceID != "0xabc" {
				t.Fatalf("expected device ID 0xabc, got %s", e.DeviceID)
			}
			state, ok := e.Payload.(device.LightState)
			if !ok {
				t.Fatal("expected LightState payload")
			}
			if state.On == nil || !*state.On {
				t.Fatal("expected On=true")
			}
			if state.Brightness == nil || *state.Brightness != 200 {
				t.Fatalf("expected Brightness=200, got %v", state.Brightness)
			}
		}
	}
	if !found {
		t.Fatal("EventDeviceStateChanged not found")
	}
}

func TestAvailabilityPublishesEvent(t *testing.T) {
	adapter, mqtt, bus, sw := setupAdapterWithDevice(t, "living_room_light", "0xabc", device.Light)
	defer adapter.Stop()

	mqtt.Inject("zigbee2mqtt/living_room_light/availability", []byte(`{"state":"offline"}`))

	events := waitForEvents(bus, 1, 500*time.Millisecond)
	found := false
	for _, e := range events {
		if e.Type == eventbus.EventDeviceAvailabilityChanged {
			found = true
			if e.DeviceID != "0xabc" {
				t.Fatalf("expected device ID 0xabc, got %s", e.DeviceID)
			}
			online, ok := e.Payload.(bool)
			if !ok {
				t.Fatal("expected bool payload")
			}
			if online {
				t.Fatal("expected offline")
			}
		}
	}
	if !found {
		t.Fatal("EventDeviceAvailabilityChanged not found")
	}

	sw.mu.Lock()
	defer sw.mu.Unlock()
	if avail, ok := sw.avail[device.DeviceID("0xabc")]; !ok || avail {
		t.Fatal("expected availability to be set to false")
	}
}

func TestDeviceJoinedPublishesEvent(t *testing.T) {
	adapter, mqtt, bus, _ := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	mqtt.Inject("zigbee2mqtt/bridge/log", []byte(`{"type":"device_joined","message":"0xnew"}`))

	events := waitForEvents(bus, 1, 500*time.Millisecond)
	found := false
	for _, e := range events {
		if e.Type == eventbus.EventDeviceAdded {
			found = true
			msg, ok := e.Payload.(string)
			if !ok {
				t.Fatal("expected string payload")
			}
			if msg != "0xnew" {
				t.Fatalf("expected 0xnew, got %s", msg)
			}
		}
	}
	if !found {
		t.Fatal("EventDeviceAdded not found")
	}
}

func TestDeviceRemovedPublishesEvent(t *testing.T) {
	adapter, mqtt, bus, _ := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	mqtt.Inject("zigbee2mqtt/bridge/log", []byte(`{"type":"device_removed","message":"0xold"}`))

	events := waitForEvents(bus, 1, 500*time.Millisecond)
	found := false
	for _, e := range events {
		if e.Type == eventbus.EventDeviceRemoved {
			found = true
			msg, ok := e.Payload.(string)
			if !ok {
				t.Fatal("expected string payload")
			}
			if msg != "0xold" {
				t.Fatalf("expected 0xold, got %s", msg)
			}
		}
	}
	if !found {
		t.Fatal("EventDeviceRemoved not found")
	}
}

func TestIgnoresUnknownTopics(t *testing.T) {
	adapter, mqtt, bus, _ := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	mqtt.Inject("some/random/topic", []byte(`{"data":"irrelevant"}`))

	time.Sleep(50 * time.Millisecond)
	events := bus.getEvents()
	if len(events) != 0 {
		t.Fatalf("expected no events, got %d", len(events))
	}
}
