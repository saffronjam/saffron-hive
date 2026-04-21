package alarms

import "sync"

// Buffer is a live fanout for alarm events. Subscribers receive every Event
// emitted by the Service; there is no historical replay (history lives in
// SQLite and is served by the `alarms` query).
//
// Patterned on internal/activity.Buffer — slow subscribers drop rather than
// block the writer.
type Buffer struct {
	mu   sync.Mutex
	subs map[*subscriber]struct{}
}

type subscriber struct {
	ch chan Event
}

// NewBuffer creates an empty alarm buffer.
func NewBuffer() *Buffer {
	return &Buffer{subs: make(map[*subscriber]struct{})}
}

// Publish fans an event out to all active subscribers. Slow subscribers drop.
func (b *Buffer) Publish(evt Event) {
	b.mu.Lock()
	defer b.mu.Unlock()
	for sub := range b.subs {
		select {
		case sub.ch <- evt:
		default:
		}
	}
}

// Subscribe returns a channel of alarm events and an unsubscribe func.
func (b *Buffer) Subscribe() (<-chan Event, func()) {
	sub := &subscriber{ch: make(chan Event, 64)}
	b.mu.Lock()
	b.subs[sub] = struct{}{}
	b.mu.Unlock()

	return sub.ch, func() {
		b.mu.Lock()
		delete(b.subs, sub)
		b.mu.Unlock()
	}
}
