package auth

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

type cleanupStoreStub struct {
	ids []string
	err error
}

func (s cleanupStoreStub) DeleteExpiredGuests(context.Context, time.Time) ([]string, error) {
	return s.ids, s.err
}

func TestGuestLifecycleExpires(t *testing.T) {
	bus := eventbus.NewChannelBus()
	ctx := WithGuestLifecycle(context.Background(), Principal{
		ID: "guest-1", Guest: true, AccessExpiresAt: time.Now().Add(20 * time.Millisecond),
	}, bus)
	select {
	case <-ctx.Done():
	case <-time.After(time.Second):
		t.Fatal("guest context did not expire")
	}
}

func TestGuestLifecycleFollowsExtensionAndRevocation(t *testing.T) {
	bus := eventbus.NewChannelBus()
	ctx := WithGuestLifecycle(context.Background(), Principal{
		ID: "guest-1", Guest: true, AccessExpiresAt: time.Now().Add(40 * time.Millisecond),
	}, bus)
	time.Sleep(10 * time.Millisecond)
	bus.Publish(eventbus.Event{Type: eventbus.EventGuestChanged, Payload: eventbus.GuestChangedEvent{
		GuestID: "guest-1", Kind: eventbus.GuestExtended, ExpiresAt: time.Now().Add(time.Second),
	}})
	select {
	case <-ctx.Done():
		t.Fatal("guest context ended at the original expiry")
	case <-time.After(80 * time.Millisecond):
	}
	bus.Publish(eventbus.Event{Type: eventbus.EventGuestChanged, Payload: eventbus.GuestChangedEvent{
		GuestID: "guest-1", Kind: eventbus.GuestRevoked,
	}})
	select {
	case <-ctx.Done():
	case <-time.After(time.Second):
		t.Fatal("guest context remained active after revocation")
	}
}

func TestPruneGuestsPublishesEveryExpiredID(t *testing.T) {
	bus := eventbus.NewChannelBus()
	changes := bus.Subscribe(eventbus.EventGuestChanged)
	defer bus.Unsubscribe(changes)
	pruneGuests(context.Background(), cleanupStoreStub{ids: []string{"one", "two"}}, bus, time.Now())
	for _, want := range []string{"one", "two"} {
		select {
		case event := <-changes:
			change, ok := event.Payload.(eventbus.GuestChangedEvent)
			if !ok || change.GuestID != want || change.Kind != eventbus.GuestExpired {
				t.Fatalf("guest cleanup event = %+v", event)
			}
		case <-time.After(time.Second):
			t.Fatalf("missing cleanup event for %s", want)
		}
	}
}
