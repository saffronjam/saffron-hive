package logging

import (
	"github.com/google/uuid"
	"sync"

	"github.com/saffronjam/saffron-hive/internal/pubsub"
)

const defaultCapacity = 10_000

// Buffer is a thread-safe ring buffer that stores log entries and supports
// live subscribers. The ring holds the most recent defaultCapacity entries
// for queries (`Entries`); the embedded fan-out pushes every new entry to
// active subscribers.
type Buffer struct {
	epoch    string
	sequence int64
	mu       sync.RWMutex
	entries  []Entry
	head     int
	count    int
	cap      int

	fanout *pubsub.Fanout[Entry]
}

// NewBuffer creates a ring buffer with the default capacity (10,000).
func NewBuffer() *Buffer {
	return &Buffer{
		epoch:   uuid.NewString(),
		entries: make([]Entry, defaultCapacity),
		cap:     defaultCapacity,
		fanout:  pubsub.NewFanout[Entry](),
	}
}

// Write appends an entry to the buffer and notifies all live subscribers.
func (b *Buffer) Write(e Entry) {
	b.mu.Lock()
	b.sequence++
	idx := (b.head + b.count) % b.cap
	if b.count == b.cap {
		b.head = (b.head + 1) % b.cap
	} else {
		b.count++
	}
	b.entries[idx] = e
	b.mu.Unlock()

	b.fanout.Publish(e)
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
	return b.fanout.Subscribe()
}

// Since returns entries after a process-local cursor and reports buffer gaps.
func (b *Buffer) Since(epoch string, sequence int64) ([]Entry, string, int64, bool) {
	b.mu.RLock()
	defer b.mu.RUnlock()
	reset := epoch != "" && (epoch != b.epoch || sequence < b.sequence-int64(b.count) || sequence > b.sequence)
	if epoch == "" {
		return []Entry{}, b.epoch, b.sequence, false
	}
	out := []Entry{}
	if !reset {
		for i := 0; i < b.count; i++ {
			if b.sequence-int64(b.count)+int64(i)+1 > sequence {
				out = append(out, b.entries[(b.head+i)%b.cap])
			}
		}
	}
	return out, b.epoch, b.sequence, reset
}
