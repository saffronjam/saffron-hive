package automation

import (
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func configurableSensor(id device.DeviceID) device.Device {
	return device.Device{
		ID:           id,
		FriendlyName: string(id),
		Capabilities: []device.Capability{
			{
				Name:     "fall_detection",
				Type:     "binary",
				Category: device.CapabilityCategoryConfiguration,
				Access:   device.CapabilityAccessState | device.CapabilityAccessSet,
			},
		},
	}
}

func TestConfigureDevicePublishesTypedRequest(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	reader.addDevice(configurableSensor("sensor-1"))
	store := newMockStore()
	ch := bus.Subscribe(eventbus.EventConfigurationRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, store, store, nil, nil)
	executor.ExecuteGraphAction(ActionConfig{
		AutomationID: "automation-1",
		ActionType:   ActionConfigureDevice,
		TargetType:   TargetDevice,
		TargetID:     "sensor-1",
		Payload:      `{"settings":[{"capability":"fall_detection","booleanValue":true}]}`,
	})

	select {
	case event := <-ch:
		request, ok := event.Payload.(device.ConfigurationRequest)
		if !ok || len(request.Values) != 1 {
			t.Fatalf("unexpected configuration request: %#v", event.Payload)
		}
		if request.Values[0].BooleanValue == nil || !*request.Values[0].BooleanValue {
			t.Fatalf("unexpected configuration value: %+v", request.Values[0])
		}
		if request.Origin.Kind != device.OriginKindAutomation || request.Origin.ID != "automation-1" {
			t.Fatalf("unexpected request origin: %+v", request.Origin)
		}
	case <-time.After(time.Second):
		t.Fatal("expected configuration request")
	}
}

func TestConfigureDeviceSkipsConfirmedValue(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	reader.addDevice(configurableSensor("sensor-1"))
	enabled := true
	reader.setDeviceConfiguration("sensor-1", []device.ConfigurationValue{
		{Capability: "fall_detection", BooleanValue: &enabled},
	})
	store := newMockStore()
	ch := bus.Subscribe(eventbus.EventConfigurationRequested)
	defer bus.Unsubscribe(ch)

	executor := NewActionExecutor(bus, reader, store, store, nil, nil)
	executor.ExecuteGraphAction(ActionConfig{
		ActionType: ActionConfigureDevice,
		TargetType: TargetDevice,
		TargetID:   "sensor-1",
		Payload:    `{"settings":[{"capability":"fall_detection","booleanValue":true}]}`,
	})

	select {
	case event := <-ch:
		t.Fatalf("confirmed setting must not be written again: %+v", event)
	case <-time.After(50 * time.Millisecond):
	}
}
