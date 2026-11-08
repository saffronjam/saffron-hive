package output

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

type cleaningActuator struct {
	*fakeActuator
	received chan cleaning.Operation
	failure  error
}

func (a *cleaningActuator) DispatchCleaning(_ context.Context, op cleaning.Operation) error {
	a.received <- op
	return a.failure
}
func TestCleaningOutputDispatchesTypedRequestOnce(t *testing.T) {
	c, _, _, _, bus, _ := newFixture(device.Device{ID: "robot", Source: device.SourceDreame, Type: device.Vacuum, Available: true, Capabilities: []device.Capability{{Name: device.CapCleaning}}})
	a := &cleaningActuator{fakeActuator: &fakeActuator{}, received: make(chan cleaning.Operation, 2), failure: errors.New("ambiguous transport timeout")}
	c.RegisterActuator(device.SourceDreame, a, Policy{InteractivePerSecond: 10, ContinuousPerSecond: 1})
	events := bus.Subscribe(eventbus.EventCommandDispatched, eventbus.EventCommandConfirmed, eventbus.EventCommandFailed)
	defer bus.Unsubscribe(events)
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	go c.Run(ctx)
	err := c.SubmitCleaning(ctx, cleaning.Operation{DeviceID: "robot", TaskID: "task", Action: "start", Origin: device.OriginKindUser, Plan: &cleaning.Plan{DeviceID: "robot", RoomIDs: []string{"kitchen"}, AreaIDs: []string{"1"}}})
	if err == nil {
		t.Fatal("transport failure was hidden")
	}
	select {
	case got := <-a.received:
		if got.Plan.AreaIDs[0] != "1" {
			t.Fatal("typed destinations were lost")
		}
	default:
		t.Fatal("request was not dispatched")
	}
	select {
	case event := <-events:
		if event.Type != eventbus.EventCommandFailed {
			t.Fatalf("unexpected delivery state %s", event.Type)
		}
	case <-time.After(time.Second):
		t.Fatal("failure event missing")
	}
	c.dispatchAvailable(ctx, time.Now().Add(time.Minute))
	select {
	case <-a.received:
		t.Fatal("ambiguous start was retried")
	default:
	}
}
func TestCleaningOutputRejectsDisabledAndUnscopedStart(t *testing.T) {
	c, _, state, _, _, _ := newFixture(device.Device{ID: "robot", Source: device.SourceDreame, Type: device.Vacuum, Available: true, Disabled: true, Capabilities: []device.Capability{{Name: device.CapCleaning}}})
	if err := c.SubmitCleaning(t.Context(), cleaning.Operation{DeviceID: "robot", Action: "pause"}); err == nil {
		t.Fatal("disabled vacuum was accepted")
	}
	state.Register(device.Device{ID: "robot", Source: device.SourceDreame, Type: device.Vacuum, Available: true, Capabilities: []device.Capability{{Name: device.CapCleaning}}})
	if err := c.SubmitCleaning(t.Context(), cleaning.Operation{DeviceID: "robot", Action: "start"}); err == nil {
		t.Fatal("unscoped start was accepted")
	}
}

func TestCleaningAcknowledgementWaitsForFreshPhysicalReport(t *testing.T) {
	c, _, _, _, bus, _ := newFixture(device.Device{ID: "robot", Source: device.SourceDreame, Type: device.Vacuum, Available: true, Capabilities: []device.Capability{{Name: device.CapCleaning}}})
	a := &cleaningActuator{fakeActuator: &fakeActuator{}, received: make(chan cleaning.Operation, 1)}
	c.RegisterActuator(device.SourceDreame, a, Policy{InteractivePerSecond: 10})
	events := bus.Subscribe(eventbus.EventCommandConfirmed)
	defer bus.Unsubscribe(events)
	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	go c.Run(ctx)
	if err := c.SubmitCleaning(ctx, cleaning.Operation{DeviceID: "robot", Action: "pause", Origin: device.OriginKindUser}); err != nil {
		t.Fatal(err)
	}
	c.observeCleaning(cleaning.Snapshot{DeviceID: "robot", Status: cleaning.StatusPaused, UpdatedAt: time.Now().Add(-time.Minute)})
	select {
	case <-events:
		t.Fatal("stale report confirmed a fresh command")
	default:
	}
	c.observeCleaning(cleaning.Snapshot{DeviceID: "robot", Status: cleaning.StatusPaused, UpdatedAt: time.Now().Add(time.Second)})
	select {
	case event := <-events:
		if event.Type != eventbus.EventCommandConfirmed {
			t.Fatal("wrong event")
		}
	case <-time.After(time.Second):
		t.Fatal("fresh pause was not confirmed")
	}
}
