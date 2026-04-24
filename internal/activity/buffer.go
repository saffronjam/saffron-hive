package activity

import (
	"github.com/saffronjam/saffron-hive/internal/pubsub"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// Buffer is a live fan-out for persisted activity events. Subscribers get
// every event inserted through the recorder; there is no historical replay
// (history lives in SQLite and is served by the `activity` query instead).
// Slow subscribers have new events dropped rather than blocking the recorder.
type Buffer = pubsub.Fanout[store.ActivityEvent]

// NewBuffer creates an empty activity buffer.
func NewBuffer() *Buffer {
	return pubsub.NewFanout[store.ActivityEvent]()
}
