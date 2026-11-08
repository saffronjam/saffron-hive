package output

import (
	"context"
	"errors"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"time"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"github.com/saffronjam/saffron-hive/internal/device"
)

// CleaningActuator is the typed physical boundary implemented by vacuum adapters.
type CleaningActuator interface {
	DispatchCleaning(context.Context, cleaning.Operation) error
}

// SubmitCleaning schedules a single operation and waits for its transport result.
// Acknowledgement does not imply that the requested physical state was reached.
func (c *Controller) SubmitCleaning(ctx context.Context, request cleaning.Operation) (returnErr error) {
	queued := false
	defer func() {
		if returnErr != nil && !queued {
			returnErr = cleaning.Reject(returnErr)
		}
	}()
	id := device.DeviceID(request.DeviceID)
	origin := device.CommandOrigin{Kind: request.Origin, ID: request.TaskID}
	if origin.Kind == "" {
		origin.Kind = device.OriginKindUser
	}
	if err := auditRequest(c, ctx, &origin, "cleaning", request); err != nil {
		return err
	}
	defer func() { c.auditRejected(origin, id, returnErr) }()
	dev, ok := c.reader.GetDevice(id)
	if !ok || dev.RuntimeDisabled() || dev.Removed || !dev.Available {
		return errors.New("vacuum is unavailable")
	}
	if _, ok := dev.Capability(device.CapCleaning); !ok {
		return errors.New("device does not support cleaning")
	}
	switch request.Action {
	case "start", "pause", "resume", "stop", "dock", "locate", "empty_bin", "reset_consumable":
	default:
		return errors.New("unsupported cleaning operation")
	}
	if request.Action == "start" && (request.Plan == nil || len(request.Plan.RoomIDs) == 0 || len(request.Plan.AreaIDs) == 0) {
		return errors.New("cleaning requires linked Hive rooms")
	}
	c.mu.Lock()
	provider := c.providerLocked(dev.Source)
	if _, ok := provider.actuator.(CleaningActuator); !ok {
		c.mu.Unlock()
		return errors.New("cleaning integration is unavailable")
	}
	done := make(chan error, 1)
	item := &intent{kind: intentCleaning, key: "cleaning:" + uuid.NewString(), provider: dev.Source, class: classFor(origin), cleaning: request, cleaningContext: ctx, command: device.Command{Origin: origin}, members: []device.DeviceID{id}, done: done}
	c.enqueueLocked(provider, item)
	queued = true
	c.mu.Unlock()
	c.signal()
	select {
	case err := <-done:
		return err
	case <-ctx.Done():
		return ctx.Err()
	}
}

type cleaningDelivery struct {
	operation cleaning.Operation
	origin    device.CommandOrigin
	class     device.OutputClass
	at        time.Time
	deadline  time.Time
}

func (c *Controller) observeCleaning(snapshot cleaning.Snapshot) {
	c.mu.Lock()
	var events []eventbus.Event
	for key, current := range c.cleaningDeliveries {
		if current.operation.DeviceID != snapshot.DeviceID || !snapshot.UpdatedAt.After(current.at) {
			continue
		}
		confirmed := false
		switch current.operation.Action {
		case "start", "resume":
			confirmed = snapshot.Status == cleaning.StatusCleaning
		case "pause":
			confirmed = snapshot.Status == cleaning.StatusPaused
		case "stop":
			confirmed = snapshot.Status == cleaning.StatusIdle || snapshot.Status == cleaning.StatusDocked
		case "dock":
			confirmed = snapshot.Status == cleaning.StatusReturning || snapshot.Status == cleaning.StatusDocked
		case "reset_consumable":
			for _, item := range snapshot.Consumables {
				if item.Name == current.operation.Consumable && item.Percent == 100 {
					confirmed = true
				}
			}
		}
		if !confirmed && snapshot.Status != cleaning.StatusAttention {
			continue
		}
		stage := eventbus.EventCommandConfirmed
		message := ""
		if !confirmed {
			stage = eventbus.EventCommandFailed
			message = "device reported a cleaning error"
		}
		delivery := deliveryEvent(device.DeviceID(snapshot.DeviceID), current.origin, current.class, 1, snapshot.UpdatedAt, message)
		events = append(events, eventbus.Event{Type: stage, DeviceID: snapshot.DeviceID, Timestamp: snapshot.UpdatedAt, Payload: delivery})
		delete(c.cleaningDeliveries, key)
	}
	c.mu.Unlock()
	for _, event := range events {
		c.publish(event)
	}
}

func (c *Controller) expireCleaningLocked(now time.Time) {
	for key, current := range c.cleaningDeliveries {
		if now.Before(current.deadline) {
			continue
		}
		failure := deliveryEvent(device.DeviceID(current.operation.DeviceID), current.origin, current.class, 1, now, "cleaning operation was not confirmed")
		c.publish(eventbus.Event{Type: eventbus.EventCommandFailed, DeviceID: current.operation.DeviceID, Timestamp: now, Payload: failure})
		delete(c.cleaningDeliveries, key)
	}
}
