package activity

import (
	"context"
	"sync"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// roomStore is the subset of store methods the cache needs. *store.DB
// satisfies it implicitly. The transitive variant follows nested groups inside
// rooms so a device buried under a group still attributes events to the room.
type roomStore interface {
	ListTransitiveRoomDeviceMemberships(ctx context.Context) ([]store.RoomDeviceMembership, error)
}

// RoomCache holds an in-memory map from device ID to one of the rooms the
// device belongs to. The activity recorder consults it on every event to
// avoid running a three-table JOIN per event, which dominates recorder cost
// on busy sensors.
//
// When a device is in multiple rooms the cache returns a deterministic
// representative: whichever room had the lexicographically smaller ID at
// the last refresh. That matches the previous recorder behavior, which
// used rooms[0] from the DB query without ordering.
type RoomCache struct {
	store roomStore

	mu    sync.RWMutex
	byDev map[string]roomEntry
}

type roomEntry struct {
	id   string
	name string
}

// NewRoomCache constructs an empty cache bound to a store. Call Refresh to
// populate it; Run to keep it refreshed on bus events.
func NewRoomCache(s roomStore) *RoomCache {
	return &RoomCache{
		store: s,
		byDev: make(map[string]roomEntry),
	}
}

// Room returns the cached room id+name for the given device. The second
// value is false when the device has no room membership.
func (c *RoomCache) Room(deviceID string) (id, name string, ok bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	e, found := c.byDev[deviceID]
	if !found {
		return "", "", false
	}
	return e.id, e.name, true
}

// Refresh reloads the whole cache from the store. Safe to call concurrently
// with Room lookups; readers see either the old or the new map.
func (c *RoomCache) Refresh(ctx context.Context) error {
	memberships, err := c.store.ListTransitiveRoomDeviceMemberships(ctx)
	if err != nil {
		return err
	}
	next := make(map[string]roomEntry, len(memberships))
	for _, m := range memberships {
		cur, exists := next[m.DeviceID]
		if !exists || m.RoomID < cur.id {
			next[m.DeviceID] = roomEntry{id: m.RoomID, name: m.RoomName}
		}
	}

	c.mu.Lock()
	c.byDev = next
	c.mu.Unlock()
	return nil
}

// Run subscribes to membership-change events on the bus and refreshes the
// cache on each one. Blocks until ctx is cancelled.
func (c *RoomCache) Run(ctx context.Context, bus eventbus.Subscriber) {
	ch := bus.Subscribe(
		eventbus.EventRoomMembershipChanged,
		eventbus.EventGroupMembershipChanged,
		eventbus.EventDeviceAdded,
		eventbus.EventDeviceRemoved,
	)
	defer bus.Unsubscribe(ch)

	for {
		select {
		case <-ctx.Done():
			return
		case _, ok := <-ch:
			if !ok {
				return
			}
			if err := c.Refresh(ctx); err != nil {
				logger.Warn("room cache refresh failed", "error", err)
			}
		}
	}
}
