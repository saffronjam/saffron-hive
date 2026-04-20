package activity

import (
	"sync"

	"github.com/saffronjam/saffron-hive/internal/store"
)

// Buffer is a live fanout for persisted activity events. Subscribers get every
// event inserted through the recorder; there is no historical replay — history
// lives in SQLite and is served by the `activity` query instead.
type Buffer struct {
	mu   sync.Mutex
	subs map[*subscriber]struct{}
}

type subscriber struct {
	ch chan store.ActivityEvent
}

// NewBuffer creates an empty activity buffer.
func NewBuffer() *Buffer {
	return &Buffer{subs: make(map[*subscriber]struct{})}
}

// Publish fans out an event to all active subscribers. Slow subscribers drop
// rather than block the recorder.
func (b *Buffer) Publish(e store.ActivityEvent) {
	b.mu.Lock()
	defer b.mu.Unlock()
	for sub := range b.subs {
		select {
		case sub.ch <- e:
		default:
		}
	}
}

// Subscribe returns a channel of new activity events and an unsubscribe func.
func (b *Buffer) Subscribe() (<-chan store.ActivityEvent, func()) {
	sub := &subscriber{ch: make(chan store.ActivityEvent, 64)}
	b.mu.Lock()
	b.subs[sub] = struct{}{}
	b.mu.Unlock()

	return sub.ch, func() {
		b.mu.Lock()
		delete(b.subs, sub)
		b.mu.Unlock()
	}
}
