package graph

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func TestSubscriptionDeviceStateChanged(t *testing.T) {
	sr := newMockStateReader()
	bus := eventbus.NewChannelBus()

	sr.addDevice(device.Device{ID: "d1", Name: "Light 1", Source: "zigbee", Type: device.Light, Available: true, LastSeen: time.Now()})
	sr.setDeviceState("d1", &device.DeviceState{On: device.Ptr(true), Brightness: device.Ptr(200)})

	resolver := &Resolver{StateReader: sr, EventBus: bus}
	sub := &subscriptionResolver{resolver}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	ch, err := sub.DeviceStateChanged(ctx, nil)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}

	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "d1",
		Timestamp: time.Now(),
	})

	select {
	case evt := <-ch:
		if evt.DeviceID != "d1" {
			t.Errorf("expected device d1, got %s", evt.DeviceID)
		}
		if evt.State == nil {
			t.Fatal("expected non-nil state")
		}
		if evt.State.On == nil || !*evt.State.On {
			t.Error("expected on=true")
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for subscription event")
	}
}

func TestSubscriptionDeviceStateFiltered(t *testing.T) {
	sr := newMockStateReader()
	bus := eventbus.NewChannelBus()

	sr.addDevice(device.Device{ID: "d1", Name: "Light 1", Source: "zigbee", Type: device.Light, Available: true, LastSeen: time.Now()})
	sr.addDevice(device.Device{ID: "d2", Name: "Light 2", Source: "zigbee", Type: device.Light, Available: true, LastSeen: time.Now()})
	sr.setDeviceState("d1", &device.DeviceState{On: device.Ptr(true)})
	sr.setDeviceState("d2", &device.DeviceState{On: device.Ptr(false)})

	resolver := &Resolver{StateReader: sr, EventBus: bus}
	sub := &subscriptionResolver{resolver}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	filterID := "d1"
	ch, err := sub.DeviceStateChanged(ctx, &filterID)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}

	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "d2", Timestamp: time.Now()})
	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: "d1", Timestamp: time.Now()})

	select {
	case evt := <-ch:
		if evt.DeviceID != "d1" {
			t.Errorf("expected filtered device d1, got %s", evt.DeviceID)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out")
	}
}

func TestSubscriptionDeviceAvailability(t *testing.T) {
	sr := newMockStateReader()
	bus := eventbus.NewChannelBus()

	sr.addDevice(device.Device{ID: "d1", Name: "Light 1", Source: "zigbee", Type: device.Light, Available: false, LastSeen: time.Now()})

	resolver := &Resolver{StateReader: sr, EventBus: bus}
	sub := &subscriptionResolver{resolver}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	ch, err := sub.DeviceAvailabilityChanged(ctx)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}

	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceAvailabilityChanged, DeviceID: "d1", Timestamp: time.Now()})

	select {
	case evt := <-ch:
		if evt.DeviceID != "d1" {
			t.Errorf("expected d1, got %s", evt.DeviceID)
		}
		if evt.Available {
			t.Error("expected available=false")
		}
	case <-time.After(time.Second):
		t.Fatal("timed out")
	}
}

func TestSubscriptionDeviceAdded(t *testing.T) {
	sr := newMockStateReader()
	bus := eventbus.NewChannelBus()

	resolver := &Resolver{StateReader: sr, EventBus: bus}
	sub := &subscriptionResolver{resolver}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	ch, err := sub.DeviceAdded(ctx)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}

	sr.addDevice(device.Device{ID: "new1", Name: "New Light", Source: "zigbee", Type: device.Light, Available: true, LastSeen: time.Now()})
	bus.Publish(eventbus.Event{Type: eventbus.EventDeviceAdded, DeviceID: "new1", Timestamp: time.Now()})

	select {
	case dev := <-ch:
		if dev.ID != "new1" {
			t.Errorf("expected new1, got %s", dev.ID)
		}
		if dev.Name != "New Light" {
			t.Errorf("expected New Light, got %s", dev.Name)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out")
	}
}

func TestSubscriptionClientDisconnect(t *testing.T) {
	sr := newMockStateReader()
	bus := eventbus.NewChannelBus()

	resolver := &Resolver{StateReader: sr, EventBus: bus}
	sub := &subscriptionResolver{resolver}

	ctx, cancel := context.WithCancel(context.Background())

	ch, err := sub.DeviceStateChanged(ctx, nil)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}

	cancel()

	time.Sleep(50 * time.Millisecond)

	select {
	case _, ok := <-ch:
		if ok {
			t.Error("expected channel to be closed")
		}
	case <-time.After(time.Second):
		t.Fatal("channel was not closed after context cancellation")
	}
}
