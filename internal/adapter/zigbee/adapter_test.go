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

	id := device.DeviceID(ieee)
	sw.Register(device.Device{ID: id, Name: friendlyName, Type: devType, Available: true})

	adapter.mu.Lock()
	adapter.nameToID[friendlyName] = id
	adapter.idToName[id] = friendlyName
	adapter.ieeeToID[ieee] = id
	adapter.mu.Unlock()

	return adapter, mqtt, bus, sw
}

func TestStateChangePublishesEvent(t *testing.T) {
	adapter, mqtt, bus, _ := setupAdapterWithDevice(t, "living_room_light", "0xabc", device.Light)
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/living_room_light", []byte(`{"state":"ON","brightness":200}`))

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
			change, ok := e.Payload.(device.DeviceStateChange)
			if !ok {
				t.Fatal("expected DeviceStateChange payload")
			}
			if change.State.On == nil || !*change.State.On {
				t.Fatal("expected On=true")
			}
			if change.State.Brightness == nil || *change.State.Brightness != 200 {
				t.Fatalf("expected Brightness=200, got %v", change.State.Brightness)
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

	injectSync(adapter, mqtt, "zigbee2mqtt/living_room_light/availability", []byte(`{"state":"offline"}`))

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

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/log", []byte(`{"type":"device_joined","message":"0xnew"}`))

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

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/log", []byte(`{"type":"device_removed","message":"0xold"}`))

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

	injectSync(adapter, mqtt, "some/random/topic", []byte(`{"data":"irrelevant"}`))

	time.Sleep(50 * time.Millisecond)
	events := bus.getEvents()
	if len(events) != 0 {
		t.Fatalf("expected no events, got %d", len(events))
	}
}

type slowStateWriter struct {
	*mockStateWriter
	delay time.Duration
}

func (s *slowStateWriter) UpdateDeviceState(id device.DeviceID, state device.DeviceState) {
	time.Sleep(s.delay)
	s.mockStateWriter.UpdateDeviceState(id, state)
}

func TestPahoCallbackDoesNotBlockOnSlowHandler(t *testing.T) {
	mqtt := NewFakeMQTTClient()
	bus := newMockEventBus()
	base := newMockStateWriter()
	slow := &slowStateWriter{mockStateWriter: base, delay: 200 * time.Millisecond}
	adapter := NewZigbeeAdapter(mqtt, bus, slow, &mockStateReader{})
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	adapter.mu.Lock()
	adapter.nameToID["bulb"] = "0xbulb"
	adapter.mu.Unlock()

	start := time.Now()
	for i := 0; i < 10; i++ {
		mqtt.Inject("zigbee2mqtt/bulb", []byte(`{"state":"ON"}`))
	}
	elapsed := time.Since(start)

	// 10 messages × 200ms delay = 2s if the reader goroutine were blocked.
	// With the dispatch channel decoupling, Inject should return in under 50ms.
	if elapsed > 50*time.Millisecond {
		t.Fatalf("paho callbacks blocked on slow handler: 10 injects took %v", elapsed)
	}
}
