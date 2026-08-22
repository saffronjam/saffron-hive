package providergroup

import (
	"context"
	"reflect"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

type fakeStore struct {
	changed []string
	calls   int
}

func (s *fakeStore) SyncProviderGroups(_ context.Context, _ device.ProviderGroupsSnapshot) ([]string, error) {
	s.calls++
	return s.changed, nil
}

func TestPersisterAnnouncesOnlyStoredChanges(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	bus := eventbus.NewChannelBus()
	input := bus.Subscribe(eventbus.EventProviderGroupsSynced)
	store := &fakeStore{changed: []string{"zigbee2mqtt:group:7"}}
	done := make(chan struct{})
	go func() {
		defer close(done)
		RunPersister(ctx, bus, store, input)
	}()

	groups := bus.Subscribe(eventbus.EventGroupSynced)
	members := bus.Subscribe(eventbus.EventGroupMembershipChanged)
	rooms := bus.Subscribe(eventbus.EventRoomMembershipChanged)
	defer bus.Unsubscribe(groups)
	defer bus.Unsubscribe(members)
	defer bus.Unsubscribe(rooms)

	bus.Publish(eventbus.Event{Type: eventbus.EventProviderGroupsSynced, Payload: device.ProviderGroupsSnapshot{Provider: "zigbee2mqtt"}})
	select {
	case evt := <-groups:
		payload, ok := evt.Payload.(eventbus.GroupSyncedEvent)
		if !ok || !reflect.DeepEqual(payload.ChangedIDs, store.changed) {
			t.Fatalf("group announcement = %#v", evt.Payload)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for group announcement")
	}
	select {
	case <-members:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for group membership announcement")
	}
	select {
	case <-rooms:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for room membership announcement")
	}

	store.changed = nil
	bus.Publish(eventbus.Event{Type: eventbus.EventProviderGroupsSynced, Payload: device.ProviderGroupsSnapshot{Provider: "zigbee2mqtt"}})
	time.Sleep(20 * time.Millisecond)
	select {
	case evt := <-groups:
		t.Fatalf("idempotent sync announced %+v", evt)
	default:
	}

	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("persister did not stop")
	}
}
