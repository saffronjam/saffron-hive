package eventbus

import (
	"sync"
	"testing"
	"time"
)

func TestConcurrentPublish(t *testing.T) {
	bus := NewChannelBus()
	ch := bus.Subscribe(EventDeviceStateChanged)

	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			bus.Publish(Event{
				Type:      EventDeviceStateChanged,
				DeviceID:  "light-1",
				Timestamp: time.Now(),
			})
		}()
	}

	wg.Wait()

	count := 0
	for {
		select {
		case <-ch:
			count++
		default:
			if count == 0 {
				t.Fatal("expected at least one event")
			}
			return
		}
	}
}

func TestConcurrentSubscribeUnsubscribe(t *testing.T) {
	bus := NewChannelBus()

	var wg sync.WaitGroup

	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			ch := bus.Subscribe(EventDeviceAdded)
			time.Sleep(time.Millisecond)
			bus.Unsubscribe(ch)
		}()
	}

	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			bus.Publish(Event{
				Type:      EventDeviceAdded,
				DeviceID:  "sensor-1",
				Timestamp: time.Now(),
			})
		}()
	}

	wg.Wait()
}

func TestPublishDuringUnsubscribe(t *testing.T) {
	bus := NewChannelBus()
	ch := bus.Subscribe(EventSceneApplied)

	done := make(chan struct{})
	go func() {
		defer close(done)
		for i := 0; i < 1000; i++ {
			bus.Publish(Event{
				Type:      EventSceneApplied,
				DeviceID:  "scene-1",
				Timestamp: time.Now(),
			})
		}
	}()

	time.Sleep(time.Millisecond)
	bus.Unsubscribe(ch)

	select {
	case <-done:
	case <-time.After(5 * time.Second):
		t.Fatal("deadlock: publish blocked during unsubscribe")
	}
}
