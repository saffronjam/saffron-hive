// Package pubsub provides tiny in-process fan-out primitives.
package pubsub

import "sync"

// DefaultSubscriberBuffer is the per-subscriber channel capacity applied when
// none is specified. Matches the historical buffer sizes used by the activity
// and alarm services.
const DefaultSubscriberBuffer = 64

// Fanout broadcasts values of T to every live subscriber. Slow subscribers
// have new values dropped rather than blocking the publisher, mirroring the
// backpressure policy used by the event bus.
type Fanout[T any] struct {
	bufSize int
	mu      sync.Mutex
	subs    map[*fanoutSub[T]]struct{}
}

type fanoutSub[T any] struct {
	ch chan T
}

// NewFanout creates a Fanout using DefaultSubscriberBuffer.
func NewFanout[T any]() *Fanout[T] {
	return NewFanoutWithBuffer[T](DefaultSubscriberBuffer)
}

// NewFanoutWithBuffer creates a Fanout with a custom per-subscriber buffer.
func NewFanoutWithBuffer[T any](bufSize int) *Fanout[T] {
	if bufSize <= 0 {
		bufSize = DefaultSubscriberBuffer
	}
	return &Fanout[T]{
		bufSize: bufSize,
		subs:    make(map[*fanoutSub[T]]struct{}),
	}
}

// Publish fans out a value to all active subscribers. A subscriber whose
// channel is full has the value dropped for that subscriber only.
func (f *Fanout[T]) Publish(v T) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for sub := range f.subs {
		select {
		case sub.ch <- v:
		default:
		}
	}
}

// Subscribe registers a new subscriber and returns a receive-only channel
// together with an unsubscribe function. The unsubscribe function is safe to
// call more than once.
func (f *Fanout[T]) Subscribe() (<-chan T, func()) {
	sub := &fanoutSub[T]{ch: make(chan T, f.bufSize)}

	f.mu.Lock()
	f.subs[sub] = struct{}{}
	f.mu.Unlock()

	var once sync.Once
	unsub := func() {
		once.Do(func() {
			f.mu.Lock()
			delete(f.subs, sub)
			f.mu.Unlock()
		})
	}
	return sub.ch, unsub
}
