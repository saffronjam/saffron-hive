package alarms

import "github.com/saffronjam/saffron-hive/internal/pubsub"

// Buffer is a live fan-out for alarm events. Subscribers receive every Event
// emitted by the Service; there is no historical replay (history lives in
// SQLite and is served by the `alarms` query). Slow subscribers have new
// events dropped rather than blocking the writer.
type Buffer = pubsub.Fanout[Event]

// NewBuffer creates an empty alarm buffer.
func NewBuffer() *Buffer {
	return pubsub.NewFanout[Event]()
}
