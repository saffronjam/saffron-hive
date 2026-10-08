package automation

import (
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// changeTracker remembers when each device state field last took a new value,
// so expressions can ask how long a field has kept its value. A field first
// seen after the engine started counts as unchanged since the start, because
// what it was before is unknown.
type changeTracker struct {
	mu      sync.Mutex
	started time.Time
	fields  map[device.DeviceID]map[string]fieldChange
}

type fieldChange struct {
	value any
	at    time.Time
}

func newChangeTracker(started time.Time) *changeTracker {
	return &changeTracker{started: started, fields: make(map[device.DeviceID]map[string]fieldChange)}
}

// observe records the fields of a state report, stamping those whose value
// differs from the last one seen.
func (c *changeTracker) observe(id device.DeviceID, st *device.DeviceState, now time.Time) {
	c.mu.Lock()
	defer c.mu.Unlock()
	known := c.fields[id]
	if known == nil {
		known = make(map[string]fieldChange)
		c.fields[id] = known
	}
	for field, value := range stateFields(st) {
		previous, seen := known[field]
		switch {
		case !seen:
			known[field] = fieldChange{value: value, at: c.started}
		case !valuesEqual(previous.value, value):
			known[field] = fieldChange{value: value, at: now}
		}
	}
}

// lastChange is the most recent change of the field across the devices.
func (c *changeTracker) lastChange(ids []device.DeviceID, field string) time.Time {
	c.mu.Lock()
	defer c.mu.Unlock()
	latest := c.started
	for _, id := range ids {
		if change, ok := c.fields[id][field]; ok && change.at.After(latest) {
			latest = change.at
		}
	}
	return latest
}
