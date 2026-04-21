package device

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func TestRunHandlesDeviceStateChanged(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "l1", Type: Light})

	bus := eventbus.NewChannelBus()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	s.RunAsync(ctx, bus)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "l1",
		Timestamp: time.Now(),
		Payload:   DeviceState{Brightness: Ptr(150)},
	})

	assertEventually(t, func() bool {
		ls, ok := s.GetDeviceState("l1")
		return ok && ls.Brightness != nil && *ls.Brightness == 150
	})
}

func TestRunHandlesDeviceAdded(t *testing.T) {
	s := NewMemoryStore()
	bus := eventbus.NewChannelBus()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	s.RunAsync(ctx, bus)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceAdded,
		DeviceID:  "new-1",
		Timestamp: time.Now(),
		Payload:   Device{ID: "new-1", Name: "New Light", Type: Light},
	})

	assertEventually(t, func() bool {
		_, ok := s.GetDevice("new-1")
		return ok
	})
}

func TestRunHandlesDeviceRemoved(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "r1", Type: Light})

	bus := eventbus.NewChannelBus()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	s.RunAsync(ctx, bus)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceRemoved,
		DeviceID:  "r1",
		Timestamp: time.Now(),
	})

	assertEventually(t, func() bool {
		d, ok := s.GetDevice("r1")
		return ok && d.Removed
	})
}

func TestRunHandlesAvailabilityChanged(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "a1", Type: Sensor})

	bus := eventbus.NewChannelBus()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	s.RunAsync(ctx, bus)

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceAvailabilityChanged,
		DeviceID:  "a1",
		Timestamp: time.Now(),
		Payload:   true,
	})

	assertEventually(t, func() bool {
		d, ok := s.GetDevice("a1")
		return ok && d.Available
	})
}

func TestRunStopsOnContextCancel(t *testing.T) {
	s := NewMemoryStore()
	bus := eventbus.NewChannelBus()
	ctx, cancel := context.WithCancel(context.Background())

	done := make(chan struct{})
	go func() {
		s.Run(ctx, bus)
		close(done)
	}()

	cancel()

	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("Run did not exit after context cancellation")
	}
}

func assertEventually(t *testing.T, condition func() bool) {
	t.Helper()
	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if condition() {
			return
		}
		time.Sleep(5 * time.Millisecond)
	}
	t.Fatal("condition not met within timeout")
}
