package eventbus

import (
	"testing"
	"time"
)

func TestUnsubscribeUnknownChannel(t *testing.T) {
	bus := NewChannelBus()
	unknown := make(chan Event, 1)
	bus.Unsubscribe(unknown)
}

func TestUnsubscribeTwice(t *testing.T) {
	bus := NewChannelBus()
	ch := bus.Subscribe(EventDeviceAdded)
	bus.Unsubscribe(ch)
	bus.Unsubscribe(ch)
}

func TestSubscribeNoEventTypes(t *testing.T) {
	bus := NewChannelBus()
	ch := bus.Subscribe()

	bus.Publish(Event{
		Type:      EventDeviceStateChanged,
		DeviceID:  "light-1",
		Timestamp: time.Now(),
	})

	select {
	case e := <-ch:
		t.Fatalf("expected no events, got %+v", e)
	case <-time.After(50 * time.Millisecond):
	}
}

func TestPublishNoSubscribers(t *testing.T) {
	bus := NewChannelBus()

	done := make(chan struct{})
	go func() {
		defer close(done)
		bus.Publish(Event{
			Type:      EventDeviceRemoved,
			DeviceID:  "light-1",
			Timestamp: time.Now(),
		})
	}()

	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("Publish blocked with no subscribers")
	}
}

func TestCustomBufferSize(t *testing.T) {
	bus := NewChannelBus(WithBufferSize(4))
	ch := bus.Subscribe(EventCommandRequested)

	for i := 0; i < 4; i++ {
		bus.Publish(Event{
			Type:      EventCommandRequested,
			DeviceID:  "cmd",
			Timestamp: time.Now(),
		})
	}

	if len(ch) != 4 {
		t.Fatalf("expected buffer to hold 4 events, got %d", len(ch))
	}
	if cap(ch) != 4 {
		t.Fatalf("expected channel capacity 4, got %d", cap(ch))
	}
}
