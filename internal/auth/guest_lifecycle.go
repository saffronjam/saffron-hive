package auth

import (
	"context"
	"time"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

// WithGuestLifecycle cancels a guest WebSocket context when access expires or
// is revoked, and follows extension events while the connection is alive.
func WithGuestLifecycle(parent context.Context, principal Principal, bus eventbus.EventBus) context.Context {
	ctx, cancel := context.WithCancel(parent)
	changes := bus.Subscribe(eventbus.EventGuestChanged)
	go func() {
		defer cancel()
		defer bus.Unsubscribe(changes)
		timer := time.NewTimer(time.Until(principal.AccessExpiresAt))
		defer timer.Stop()
		for {
			select {
			case <-parent.Done():
				return
			case <-timer.C:
				return
			case event, ok := <-changes:
				if !ok {
					return
				}
				change, ok := event.Payload.(eventbus.GuestChangedEvent)
				if !ok || change.GuestID != principal.ID {
					continue
				}
				switch change.Kind {
				case eventbus.GuestExtended:
					if !timer.Stop() {
						select {
						case <-timer.C:
						default:
						}
					}
					timer.Reset(time.Until(change.ExpiresAt))
				case eventbus.GuestRevoked, eventbus.GuestExpired:
					grace := time.NewTimer(100 * time.Millisecond)
					select {
					case <-parent.Done():
						grace.Stop()
					case <-grace.C:
					}
					return
				}
			}
		}
	}()
	return ctx
}
