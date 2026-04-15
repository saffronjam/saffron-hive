package eventbus

import (
	"testing"
	"time"
)

func newTestEvent(et EventType, deviceID string) Event {
	return Event{
		Type:      et,
		DeviceID:  deviceID,
		Timestamp: time.Now(),
		Payload:   nil,
	}
}

func TestPublishSubscribeBasic(t *testing.T) {
	bus := NewChannelBus()
	ch := bus.Subscribe(EventDeviceStateChanged)

	event := newTestEvent(EventDeviceStateChanged, "light-1")
	bus.Publish(event)

	select {
	case got := <-ch:
		if got.DeviceID != "light-1" {
			t.Fatalf("expected device id light-1, got %s", got.DeviceID)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for event")
	}
}

func TestMultipleSubscribersSameType(t *testing.T) {
	bus := NewChannelBus()
	ch1 := bus.Subscribe(EventDeviceAdded)
	ch2 := bus.Subscribe(EventDeviceAdded)

	event := newTestEvent(EventDeviceAdded, "sensor-1")
	bus.Publish(event)

	for i, ch := range []<-chan Event{ch1, ch2} {
		select {
		case got := <-ch:
			if got.DeviceID != "sensor-1" {
				t.Fatalf("subscriber %d: expected sensor-1, got %s", i, got.DeviceID)
			}
		case <-time.After(time.Second):
			t.Fatalf("subscriber %d: timed out", i)
		}
	}
}

func TestSubscriberFiltering(t *testing.T) {
	bus := NewChannelBus()
	ch := bus.Subscribe(EventDeviceRemoved)

	bus.Publish(newTestEvent(EventDeviceAdded, "light-1"))
	bus.Publish(newTestEvent(EventDeviceRemoved, "light-2"))

	select {
	case got := <-ch:
		if got.Type != EventDeviceRemoved {
			t.Fatalf("expected EventDeviceRemoved, got %s", got.Type)
		}
		if got.DeviceID != "light-2" {
			t.Fatalf("expected light-2, got %s", got.DeviceID)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for event")
	}

	select {
	case e := <-ch:
		t.Fatalf("unexpected event: %+v", e)
	case <-time.After(50 * time.Millisecond):
	}
}

func TestUnsubscribe(t *testing.T) {
	bus := NewChannelBus()
	ch := bus.Subscribe(EventSceneApplied)

	bus.Unsubscribe(ch)

	bus.Publish(newTestEvent(EventSceneApplied, "scene-1"))

	select {
	case _, ok := <-ch:
		if ok {
			t.Fatal("expected channel to be closed")
		}
	case <-time.After(50 * time.Millisecond):
		t.Fatal("channel was not closed after unsubscribe")
	}
}

func TestFullChannelDropsEvent(t *testing.T) {
	bus := NewChannelBus(WithBufferSize(1))
	ch := bus.Subscribe(EventCommandRequested)

	bus.Publish(newTestEvent(EventCommandRequested, "cmd-1"))
	bus.Publish(newTestEvent(EventCommandRequested, "cmd-2"))

	done := make(chan struct{})
	go func() {
		defer close(done)
		bus.Publish(newTestEvent(EventCommandRequested, "cmd-3"))
	}()

	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("Publish blocked on full channel")
	}

	got := <-ch
	if got.DeviceID != "cmd-1" {
		t.Fatalf("expected cmd-1, got %s", got.DeviceID)
	}
}

func TestMultipleEventTypes(t *testing.T) {
	bus := NewChannelBus()
	ch := bus.Subscribe(EventDeviceStateChanged, EventDeviceAvailabilityChanged)

	bus.Publish(newTestEvent(EventDeviceStateChanged, "d1"))
	bus.Publish(newTestEvent(EventDeviceAvailabilityChanged, "d2"))
	bus.Publish(newTestEvent(EventDeviceAdded, "d3"))

	received := 0
	for i := 0; i < 2; i++ {
		select {
		case <-ch:
			received++
		case <-time.After(time.Second):
			t.Fatal("timed out")
		}
	}
	if received != 2 {
		t.Fatalf("expected 2 events, got %d", received)
	}

	select {
	case e := <-ch:
		t.Fatalf("unexpected event: %+v", e)
	case <-time.After(50 * time.Millisecond):
	}
}

func TestInterfaceCompliance(t *testing.T) {
	var _ EventBus = (*ChannelBus)(nil)
	var _ Publisher = (*ChannelBus)(nil)
	var _ Subscriber = (*ChannelBus)(nil)
}
