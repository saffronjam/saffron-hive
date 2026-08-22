package providergroup

import (
	"context"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
)

var logger = logging.Named("provider_group")

// Store is the persistence surface needed by the provider-group persister.
type Store interface {
	SyncProviderGroups(context.Context, device.ProviderGroupsSnapshot) ([]string, error)
}

// RunPersister applies complete provider group snapshots and announces stored
// changes. The input subscription is created by the caller before adapters
// connect so retained snapshots cannot arrive before the persister is ready.
func RunPersister(ctx context.Context, bus eventbus.EventBus, store Store, ch <-chan eventbus.Event) {
	defer bus.Unsubscribe(ch)
	for {
		select {
		case <-ctx.Done():
			return
		case evt, ok := <-ch:
			if !ok {
				return
			}
			snapshot, ok := evt.Payload.(device.ProviderGroupsSnapshot)
			if !ok {
				continue
			}
			changedIDs, err := store.SyncProviderGroups(ctx, snapshot)
			if err != nil {
				logger.Error("failed to persist provider groups", "provider", snapshot.Provider, "error", err)
				continue
			}
			if len(changedIDs) == 0 {
				continue
			}
			now := time.Now()
			bus.Publish(eventbus.Event{
				Type:      eventbus.EventGroupSynced,
				Timestamp: now,
				Payload:   eventbus.GroupSyncedEvent{ChangedIDs: changedIDs},
			})
			bus.Publish(eventbus.Event{Type: eventbus.EventGroupMembershipChanged, Timestamp: now})
			bus.Publish(eventbus.Event{Type: eventbus.EventRoomMembershipChanged, Timestamp: now})
		}
	}
}
