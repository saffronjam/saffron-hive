package topology

import (
	"context"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
)

var logger = logging.Named("topology")

// Store is the subset of the persistence layer the persister needs.
type Store interface {
	GetNetworkTopology(ctx context.Context, provider device.Source) (*device.NetworkTopology, error)
	UpsertNetworkTopology(ctx context.Context, topo device.NetworkTopology) error
}

// RunPersister subscribes to topology.scanned events, merges each scan with
// the provider's stored snapshot (carrying stale parent links forward for
// nodes that slept through the scan), persists the result, and announces it
// with topology.updated. Publishing only after the upsert means a subscriber
// reacting to topology.updated always reads the new snapshot. Blocks until
// ctx is cancelled.
func RunPersister(ctx context.Context, bus eventbus.EventBus, store Store) {
	ch := bus.Subscribe(eventbus.EventNetworkTopologyScanned)
	defer bus.Unsubscribe(ch)

	for {
		select {
		case <-ctx.Done():
			return
		case evt, ok := <-ch:
			if !ok {
				return
			}
			scan, ok := evt.Payload.(device.NetworkTopology)
			if !ok {
				continue
			}
			persist(ctx, bus, store, scan)
		}
	}
}

func persist(ctx context.Context, bus eventbus.EventBus, store Store, scan device.NetworkTopology) {
	prev, err := store.GetNetworkTopology(ctx, scan.Provider)
	if err != nil {
		logger.Error("failed to load previous topology", "provider", scan.Provider, "error", err)
		prev = nil
	}
	merged := MergeTopology(prev, scan)
	if err := store.UpsertNetworkTopology(ctx, merged); err != nil {
		logger.Error("failed to persist topology", "provider", scan.Provider, "error", err)
		return
	}
	logger.Info("topology snapshot stored",
		"provider", merged.Provider, "nodes", len(merged.Nodes), "links", len(merged.Links))
	bus.Publish(eventbus.Event{
		Type:      eventbus.EventNetworkTopologyUpdated,
		Timestamp: merged.ScannedAt,
		Payload: eventbus.NetworkTopologyUpdatedEvent{
			Provider:  string(merged.Provider),
			ScannedAt: merged.ScannedAt,
			NodeCount: len(merged.Nodes),
			LinkCount: len(merged.Links),
		},
	})
}
