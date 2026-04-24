package pubsub

import (
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestFanoutPublishesToAllSubscribers(t *testing.T) {
	f := NewFanout[int]()
	a, _ := f.Subscribe()
	b, _ := f.Subscribe()

	f.Publish(42)

	for _, ch := range []<-chan int{a, b} {
		select {
		case v := <-ch:
			if v != 42 {
				t.Fatalf("want 42, got %d", v)
			}
		case <-time.After(100 * time.Millisecond):
			t.Fatal("subscriber did not receive value")
		}
	}
}

func TestFanoutUnsubscribeStopsDelivery(t *testing.T) {
	f := NewFanout[string]()
	ch, unsub := f.Subscribe()

	unsub()
	f.Publish("hello")

	select {
	case v, ok := <-ch:
		if ok {
			t.Fatalf("unexpected delivery after unsubscribe: %q", v)
		}
	case <-time.After(50 * time.Millisecond):
	}
}

func TestFanoutUnsubscribeIsIdempotent(t *testing.T) {
	f := NewFanout[int]()
	_, unsub := f.Subscribe()
	unsub()
	unsub()
}

func TestFanoutDropsOnSlowSubscriber(t *testing.T) {
	f := NewFanoutWithBuffer[int](2)
	_, _ = f.Subscribe()

	done := make(chan struct{})
	go func() {
		for i := 0; i < 1000; i++ {
			f.Publish(i)
		}
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(500 * time.Millisecond):
		t.Fatal("Publish blocked on slow subscriber")
	}
}

func TestFanoutConcurrentPublishAndSubscribe(t *testing.T) {
	f := NewFanout[int]()

	var received atomic.Int64

	for i := 0; i < 4; i++ {
		ch, unsub := f.Subscribe()
		go func() {
			for range ch {
				received.Add(1)
			}
		}()
		go func() {
			time.Sleep(20 * time.Millisecond)
			unsub()
		}()
	}

	var pubWG sync.WaitGroup
	for i := 0; i < 8; i++ {
		pubWG.Add(1)
		go func() {
			defer pubWG.Done()
			for j := 0; j < 100; j++ {
				f.Publish(j)
			}
		}()
	}
	pubWG.Wait()

	time.Sleep(50 * time.Millisecond)

	if received.Load() == 0 {
		t.Fatal("no subscriber received any event")
	}
}
