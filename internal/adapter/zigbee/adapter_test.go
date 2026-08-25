package zigbee

import (
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func setupAdapterWithDevice(t *testing.T, friendlyName, ieee string, devType device.DeviceType) (*ZigbeeAdapter, *FakeMQTTClient, *mockEventBus, *mockStateWriter) {
	t.Helper()
	adapter, mqtt, bus, sw, reader := newTestAdapterWithReader()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}

	id := device.DeviceID(ieee)
	dev := device.Device{ID: id, FriendlyName: friendlyName, Source: device.SourceZigbee2MQTT, Type: devType, Available: true}
	sw.Register(dev)
	reader.Set(dev)

	adapter.mu.Lock()
	adapter.nameToID[friendlyName] = id
	adapter.idToName[id] = friendlyName
	adapter.ieeeToID[ieee] = id
	adapter.mu.Unlock()
	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/state", []byte(`{"state":"online"}`))

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

func TestOccupancyOnlyPayloadPublishesEvent(t *testing.T) {
	adapter, mqtt, bus, _ := setupAdapterWithDevice(t, "hallway_motion", "0xmotion", device.Sensor)
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/hallway_motion", []byte(`{"occupancy":false}`))

	events := waitForEvents(bus, 1, 500*time.Millisecond)

	found := false
	for _, e := range events {
		if e.Type == eventbus.EventDeviceStateChanged {
			found = true
			change, ok := e.Payload.(device.DeviceStateChange)
			if !ok {
				t.Fatal("expected DeviceStateChange payload")
			}
			if change.State.Occupancy == nil || *change.State.Occupancy {
				t.Fatalf("expected Occupancy=false, got %v", change.State.Occupancy)
			}
		}
	}
	if !found {
		t.Fatal("EventDeviceStateChanged not found for occupancy-only payload")
	}
}

func TestStateMessageDropsFieldsOutsideDeviceCapabilities(t *testing.T) {
	adapter, mqtt, bus, sw, reader := newTestAdapterWithReader()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	id := device.DeviceID("0xdoor")
	dev := device.Device{
		ID:           id,
		FriendlyName: "bedroom_door",
		Type:         device.Sensor,
		Capabilities: []device.Capability{
			{Name: device.CapContact, Access: device.CapabilityAccessState},
			{Name: device.CapBattery, Access: device.CapabilityAccessState},
		},
	}
	sw.Register(dev)
	reader.Set(dev)
	adapter.mu.Lock()
	adapter.nameToID[dev.FriendlyName] = id
	adapter.idToName[id] = dev.FriendlyName
	adapter.ieeeToID[string(id)] = id
	adapter.mu.Unlock()

	injectSync(adapter, mqtt, "zigbee2mqtt/bedroom_door", []byte(`{"state":"ON","contact":false,"battery":100}`))

	events := waitForEvents(bus, 1, 500*time.Millisecond)
	for _, event := range events {
		if event.Type != eventbus.EventDeviceStateChanged {
			continue
		}
		change, ok := event.Payload.(device.DeviceStateChange)
		if !ok {
			t.Fatal("expected DeviceStateChange payload")
		}
		if change.State.On != nil {
			t.Fatalf("expected undeclared on state to be dropped, got %v", *change.State.On)
		}
		if change.State.Contact == nil || *change.State.Contact {
			t.Fatalf("expected contact=false, got %v", change.State.Contact)
		}
		if change.State.Battery == nil || *change.State.Battery != 100 {
			t.Fatalf("expected battery=100, got %v", change.State.Battery)
		}
		return
	}
	t.Fatal("EventDeviceStateChanged not found")
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
	adapter := NewZigbeeAdapter(mqtt, bus, slow, newMockStateReader())
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
