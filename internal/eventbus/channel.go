package eventbus

import (
	"log/slog"
	"sync"
)

const defaultBufferSize = 256

// ChannelBus is an in-process EventBus backed by Go channels.
type ChannelBus struct {
	mu         sync.RWMutex
	bufferSize int
	subs       map[<-chan Event]*channelSub
}

type channelSub struct {
	ch    chan Event
	types map[EventType]struct{}
}

// ChannelBusOption configures a ChannelBus.
type ChannelBusOption func(*ChannelBus)

// WithBufferSize sets the subscriber channel buffer size.
func WithBufferSize(size int) ChannelBusOption {
	return func(b *ChannelBus) {
		b.bufferSize = size
	}
}

// NewChannelBus creates a new channel-based event bus.
func NewChannelBus(opts ...ChannelBusOption) *ChannelBus {
	b := &ChannelBus{
		bufferSize: defaultBufferSize,
		subs:       make(map[<-chan Event]*channelSub),
	}
	for _, opt := range opts {
		opt(b)
	}
	return b
}

// Publish fans out an event to all subscribers registered for its type.
func (b *ChannelBus) Publish(event Event) {
	b.mu.RLock()
	defer b.mu.RUnlock()

	for _, sub := range b.subs {
		if _, ok := sub.types[event.Type]; !ok {
			continue
		}
		select {
		case sub.ch <- event:
		default:
			slog.Warn("dropping event for full subscriber channel", "event_type", event.Type)
		}
	}
}

// Subscribe creates a buffered channel that receives events of the given types.
func (b *ChannelBus) Subscribe(eventTypes ...EventType) <-chan Event {
	ch := make(chan Event, b.bufferSize)
	types := make(map[EventType]struct{}, len(eventTypes))
	for _, t := range eventTypes {
		types[t] = struct{}{}
	}

	b.mu.Lock()
	b.subs[ch] = &channelSub{ch: ch, types: types}
	b.mu.Unlock()

	return ch
}

// Unsubscribe removes a subscriber channel and closes it.
func (b *ChannelBus) Unsubscribe(ch <-chan Event) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if sub, ok := b.subs[ch]; ok {
		delete(b.subs, ch)
		close(sub.ch)
	}
}
