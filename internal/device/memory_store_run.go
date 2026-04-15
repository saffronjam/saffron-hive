package device

import (
	"context"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

// Run subscribes to device-related events on the bus and updates the store
// until the context is cancelled. It blocks until ctx.Done().
func (s *MemoryStore) Run(ctx context.Context, bus eventbus.EventBus) {
	ch := bus.Subscribe(
		eventbus.EventDeviceStateChanged,
		eventbus.EventDeviceAvailabilityChanged,
		eventbus.EventDeviceAdded,
		eventbus.EventDeviceRemoved,
	)
	defer bus.Unsubscribe(ch)

	for {
		select {
		case <-ctx.Done():
			return
		case evt := <-ch:
			s.handleEvent(evt)
		}
	}
}

// RunAsync starts event processing in a background goroutine and returns
// once the subscription is active. The goroutine exits when ctx is cancelled.
func (s *MemoryStore) RunAsync(ctx context.Context, bus eventbus.EventBus) {
	ch := bus.Subscribe(
		eventbus.EventDeviceStateChanged,
		eventbus.EventDeviceAvailabilityChanged,
		eventbus.EventDeviceAdded,
		eventbus.EventDeviceRemoved,
	)

	go func() {
		defer bus.Unsubscribe(ch)
		for {
			select {
			case <-ctx.Done():
				return
			case evt := <-ch:
				s.handleEvent(evt)
			}
		}
	}()
}

func (s *MemoryStore) handleEvent(evt eventbus.Event) {
	id := DeviceID(evt.DeviceID)

	switch evt.Type {
	case eventbus.EventDeviceAdded:
		if d, ok := evt.Payload.(Device); ok {
			s.Register(d)
		}
	case eventbus.EventDeviceRemoved:
		s.Remove(id)
	case eventbus.EventDeviceAvailabilityChanged:
		if avail, ok := evt.Payload.(bool); ok {
			s.SetAvailability(id, avail)
		}
	case eventbus.EventDeviceStateChanged:
		switch payload := evt.Payload.(type) {
		case LightState:
			s.UpdateLightState(id, payload)
		case SensorState:
			s.UpdateSensorState(id, payload)
		case SwitchState:
			s.UpdateSwitchState(id, payload)
		}
	}
}
