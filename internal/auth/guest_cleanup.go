package auth

import (
	"context"
	"log/slog"
	"time"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

var guestLogger = slog.Default().With("pkg", "auth")

type guestCleanupStore interface {
	DeleteExpiredGuests(ctx context.Context, now time.Time) ([]string, error)
}

// RunGuestCleanup deletes expired guest rows until ctx is cancelled.
func RunGuestCleanup(ctx context.Context, store guestCleanupStore, bus eventbus.Publisher) {
	pruneGuests(ctx, store, bus, time.Now())
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case now := <-ticker.C:
			pruneGuests(ctx, store, bus, now)
		}
	}
}

func pruneGuests(ctx context.Context, store guestCleanupStore, bus eventbus.Publisher, now time.Time) {
	ids, err := store.DeleteExpiredGuests(ctx, now)
	if err != nil {
		guestLogger.ErrorContext(ctx, "guest cleanup failed", slog.String("error", err.Error()))
		return
	}
	for _, id := range ids {
		bus.Publish(eventbus.Event{
			Type:      eventbus.EventGuestChanged,
			Timestamp: now,
			Payload: eventbus.GuestChangedEvent{
				GuestID: id,
				Kind:    eventbus.GuestExpired,
			},
		})
	}
	if len(ids) > 0 {
		guestLogger.InfoContext(ctx, "expired guests deleted", slog.Int("count", len(ids)))
	}
}
