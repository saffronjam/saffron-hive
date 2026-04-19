package logging

import "sync"

const defaultCapacity = 10_000

// Buffer is a thread-safe ring buffer that stores log entries and supports
// live subscribers.
type Buffer struct {
	mu      sync.RWMutex
	entries []Entry
	head    int
	count   int
	cap     int

	subMu       sync.Mutex
	subscribers map[*subscriber]struct{}
}

type subscriber struct {
	ch chan Entry
}

// NewBuffer creates a ring buffer with the default capacity (10,000).
func NewBuffer() *Buffer {
	return &Buffer{
		entries:     make([]Entry, defaultCapacity),
		cap:         defaultCapacity,
		subscribers: make(map[*subscriber]struct{}),
	}
}

// Write appends an entry to the buffer and notifies all live subscribers.
func (b *Buffer) Write(e Entry) {
	b.mu.Lock()
	idx := (b.head + b.count) % b.cap
	if b.count == b.cap {
		b.head = (b.head + 1) % b.cap
	} else {
		b.count++
	}
	b.entries[idx] = e
	b.mu.Unlock()

	b.subMu.Lock()
	for sub := range b.subscribers {
		select {
		case sub.ch <- e:
		default:
		}
	}
	b.subMu.Unlock()
}

// Entries returns a snapshot of all buffered entries, oldest first.
func (b *Buffer) Entries() []Entry {
	b.mu.RLock()
	defer b.mu.RUnlock()

	out := make([]Entry, b.count)
	for i := range b.count {
		out[i] = b.entries[(b.head+i)%b.cap]
	}
	return out
}

// Subscribe returns a channel that receives new log entries as they are
// written, and an unsubscribe function to clean up.
func (b *Buffer) Subscribe() (<-chan Entry, func()) {
	sub := &subscriber{ch: make(chan Entry, 64)}

	b.subMu.Lock()
	b.subscribers[sub] = struct{}{}
	b.subMu.Unlock()

	unsub := func() {
		b.subMu.Lock()
		delete(b.subscribers, sub)
		b.subMu.Unlock()
	}

	return sub.ch, unsub
}
