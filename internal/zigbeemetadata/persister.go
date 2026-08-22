package zigbeemetadata

import (
	"context"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
)

var logger = logging.Named("zigbee_metadata")

// Store is the persistence surface used by the metadata event consumer.
type Store interface {
	UpsertZigbeeBridgeMetadata(context.Context, Metadata) (bool, error)
	MergeZigbeeOTAStatus(context.Context, device.DeviceID, OTAStatus) (bool, error)
}

// RunPersister consumes Zigbee metadata events, stores changed values, and
// announces committed changes.
func RunPersister(ctx context.Context, bus eventbus.Publisher, events <-chan eventbus.Event, store Store) {
	for {
		select {
		case <-ctx.Done():
			return
		case event, ok := <-events:
			if !ok {
				return
			}
			changed, err := persistWithRetry(ctx, store, event)
			if err != nil {
				logger.Error("persist zigbee metadata failed", "device_id", event.DeviceID, "event_type", event.Type, "error", err)
				continue
			}
			if changed {
				bus.Publish(eventbus.Event{
					Type:      eventbus.EventZigbeeMetadataUpdated,
					DeviceID:  event.DeviceID,
					Timestamp: time.Now(),
				})
			}
		}
	}
}

func persistWithRetry(ctx context.Context, store Store, event eventbus.Event) (bool, error) {
	var changed bool
	var err error
	for attempt := 0; attempt < 6; attempt++ {
		switch event.Type {
		case eventbus.EventZigbeeMetadataSynced:
			metadata, ok := event.Payload.(Metadata)
			if !ok {
				return false, nil
			}
			changed, err = store.UpsertZigbeeBridgeMetadata(ctx, metadata)
		case eventbus.EventZigbeeOTAStatusChanged:
			status, ok := event.Payload.(OTAStatus)
			if !ok {
				return false, nil
			}
			changed, err = store.MergeZigbeeOTAStatus(ctx, device.DeviceID(event.DeviceID), status)
		default:
			return false, nil
		}
		if err == nil {
			return changed, nil
		}
		timer := time.NewTimer(time.Duration(attempt+1) * 20 * time.Millisecond)
		select {
		case <-ctx.Done():
			timer.Stop()
			return false, ctx.Err()
		case <-timer.C:
		}
	}
	return false, err
}
