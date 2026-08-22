package maintenance

import (
	"time"

	"github.com/saffronjam/saffron-hive/internal/pubsub"
)

// Buffer fans out visible-snapshot changes.
type Buffer = pubsub.Fanout[time.Time]

// NewBuffer creates an empty maintenance change buffer.
func NewBuffer() *Buffer { return pubsub.NewFanout[time.Time]() }
