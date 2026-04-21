package zigbee

import (
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

type mockStateWriter struct {
	mu      sync.Mutex
	devices map[device.DeviceID]device.Device
	states  map[device.DeviceID]device.DeviceState
	avail   map[device.DeviceID]bool
}

func newMockStateWriter() *mockStateWriter {
	return &mockStateWriter{
		devices: make(map[device.DeviceID]device.Device),
		states:  make(map[device.DeviceID]device.DeviceState),
		avail:   make(map[device.DeviceID]bool),
	}
}

func (m *mockStateWriter) Register(dev device.Device) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.devices[dev.ID] = dev
}

func (m *mockStateWriter) Remove(id device.DeviceID) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.devices, id)
}

func (m *mockStateWriter) UpdateDeviceState(id device.DeviceID, state device.DeviceState) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.states[id] = device.MergeDeviceState(m.states[id], state)
}

func (m *mockStateWriter) SetAvailability(id device.DeviceID, available bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.avail[id] = available
}

type mockStateReader struct{}

func (m *mockStateReader) GetDevice(_ device.DeviceID) (device.Device, bool) {
	return device.Device{}, false
}

func (m *mockStateReader) GetDeviceState(_ device.DeviceID) (*device.DeviceState, bool) {
	return nil, false
}

func (m *mockStateReader) ListDevices() []device.Device { return nil }

type mockEventBus struct {
	mu     sync.Mutex
	events []eventbus.Event
	subs   map[chan eventbus.Event]struct{}
}

func newMockEventBus() *mockEventBus {
	return &mockEventBus{
		subs: make(map[chan eventbus.Event]struct{}),
	}
}

func (b *mockEventBus) Publish(event eventbus.Event) {
	b.mu.Lock()
	b.events = append(b.events, event)
	subs := make([]chan eventbus.Event, 0, len(b.subs))
	for ch := range b.subs {
		subs = append(subs, ch)
	}
	b.mu.Unlock()

	for _, ch := range subs {
		select {
		case ch <- event:
		default:
		}
	}
}

func (b *mockEventBus) Subscribe(_ ...eventbus.EventType) <-chan eventbus.Event {
	ch := make(chan eventbus.Event, 100)
	b.mu.Lock()
	b.subs[ch] = struct{}{}
	b.mu.Unlock()
	return ch
}

func (b *mockEventBus) Unsubscribe(ch <-chan eventbus.Event) {
	b.mu.Lock()
	defer b.mu.Unlock()
	for sub := range b.subs {
		var readOnly <-chan eventbus.Event = sub
		if readOnly == ch {
			close(sub)
			delete(b.subs, sub)
			return
		}
	}
}

func (b *mockEventBus) getEvents() []eventbus.Event {
	b.mu.Lock()
	defer b.mu.Unlock()
	cp := make([]eventbus.Event, len(b.events))
	copy(cp, b.events)
	return cp
}

func waitForEvents(bus *mockEventBus, count int, timeout time.Duration) []eventbus.Event {
	deadline := time.After(timeout)
	for {
		events := bus.getEvents()
		if len(events) >= count {
			return events
		}
		select {
		case <-deadline:
			return bus.getEvents()
		case <-time.After(5 * time.Millisecond):
		}
	}
}

func newTestAdapter() (*ZigbeeAdapter, *FakeMQTTClient, *mockEventBus, *mockStateWriter) {
	mqtt := NewFakeMQTTClient()
	bus := newMockEventBus()
	sw := newMockStateWriter()
	sr := &mockStateReader{}
	adapter := NewZigbeeAdapter(mqtt, bus, sw, sr)
	return adapter, mqtt, bus, sw
}
