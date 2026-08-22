package graph

import (
	"context"
	"reflect"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func TestGroupsChangedCoalescesChangedIDs(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	bus := eventbus.NewChannelBus()
	resolver := &subscriptionResolver{&Resolver{EventBus: bus}}
	out, err := resolver.GroupsChanged(ctx)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	bus.Publish(eventbus.Event{Type: eventbus.EventGroupSynced, Payload: eventbus.GroupSyncedEvent{ChangedIDs: []string{"b", "a"}}})
	bus.Publish(eventbus.Event{Type: eventbus.EventGroupSynced, Payload: eventbus.GroupSyncedEvent{ChangedIDs: []string{"a", "c"}}})
	select {
	case ids := <-out:
		if !reflect.DeepEqual(ids, []string{"a", "b", "c"}) {
			t.Fatalf("changed IDs = %v", ids)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for groupsChanged")
	}
}
