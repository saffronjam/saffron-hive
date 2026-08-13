package topology

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

type fakeStore struct {
	mu       sync.Mutex
	stored   map[device.Source]device.NetworkTopology
	upserted int
}

func newFakeStore() *fakeStore {
	return &fakeStore{stored: make(map[device.Source]device.NetworkTopology)}
}

func (f *fakeStore) GetNetworkTopology(_ context.Context, provider device.Source) (*device.NetworkTopology, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	topo, ok := f.stored[provider]
	if !ok {
		return nil, nil
	}
	return &topo, nil
}

func (f *fakeStore) UpsertNetworkTopology(_ context.Context, topo device.NetworkTopology) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.stored[topo.Provider] = topo
	f.upserted++
	return nil
}

func TestPersisterMergesStoresAndAnnounces(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	bus := eventbus.NewChannelBus()
	store := newFakeStore()

	done := make(chan struct{})
	go func() {
		defer close(done)
		RunPersister(ctx, bus, store)
	}()

	updated := bus.Subscribe(eventbus.EventNetworkTopologyUpdated)
	defer bus.Unsubscribe(updated)

	// Give the persister goroutine time to subscribe before publishing.
	time.Sleep(20 * time.Millisecond)

	first := device.NetworkTopology{
		Provider:  device.SourceZigbee2MQTT,
		ScannedAt: t0,
		Nodes: []device.TopologyNode{
			node("r1", device.RoleRelay), node("s1", device.RoleLeaf),
		},
		Links: []device.TopologyLink{parentLink("s1", "r1", t0)},
	}
	bus.Publish(eventbus.Event{Type: eventbus.EventNetworkTopologyScanned, Timestamp: t0, Payload: first})

	evt := waitForEvent(t, updated)
	announce, ok := evt.Payload.(eventbus.NetworkTopologyUpdatedEvent)
	if !ok {
		t.Fatalf("payload is %T", evt.Payload)
	}
	if announce.Provider != string(device.SourceZigbee2MQTT) || announce.NodeCount != 2 || announce.LinkCount != 1 {
		t.Fatalf("announce = %+v", announce)
	}

	// The announcement must land after the upsert, so a subscriber that
	// re-queries on it always sees the fresh snapshot.
	stored, _ := store.GetNetworkTopology(ctx, device.SourceZigbee2MQTT)
	if stored == nil || len(stored.Links) != 1 {
		t.Fatalf("snapshot not stored before announce: %+v", stored)
	}

	// A second scan where the leaf slept: the persister merges against the
	// stored snapshot and the carried link survives into persistence.
	second := device.NetworkTopology{
		Provider:  device.SourceZigbee2MQTT,
		ScannedAt: t1,
		Nodes: []device.TopologyNode{
			node("r1", device.RoleRelay), node("s1", device.RoleLeaf),
		},
	}
	bus.Publish(eventbus.Event{Type: eventbus.EventNetworkTopologyScanned, Timestamp: t1, Payload: second})
	waitForEvent(t, updated)

	stored, _ = store.GetNetworkTopology(ctx, device.SourceZigbee2MQTT)
	if len(stored.Links) != 1 || !stored.Links[0].Stale {
		t.Fatalf("merged snapshot must carry the stale parent link, got %+v", stored.Links)
	}
	if !stored.ScannedAt.Equal(t1) {
		t.Fatalf("scannedAt must advance to %v, got %v", t1, stored.ScannedAt)
	}

	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("persister did not exit on cancel")
	}
}

func waitForEvent(t *testing.T, ch <-chan eventbus.Event) eventbus.Event {
	t.Helper()
	select {
	case evt := <-ch:
		return evt
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for topology.updated")
		return eventbus.Event{}
	}
}
