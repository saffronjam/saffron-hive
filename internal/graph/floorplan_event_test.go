package graph

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func TestUpdateFloorplanPublishesCommittedEvent(t *testing.T) {
	store := newMockStore()
	bus := eventbus.NewChannelBus()
	ch := bus.Subscribe(eventbus.EventFloorplanUpdated)
	defer bus.Unsubscribe(ch)
	resolver := &Resolver{Store: store, EventBus: bus}
	if _, err := (&mutationResolver{resolver}).UpdateFloorplan(context.Background(), floorplanInput(nil, nil)); err != nil {
		t.Fatal(err)
	}
	select {
	case event := <-ch:
		if event.Type != eventbus.EventFloorplanUpdated {
			t.Fatalf("event = %#v", event)
		}
	case <-time.After(time.Second):
		t.Fatal("floorplan update event not published")
	}
}
