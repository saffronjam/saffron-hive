package automation

import (
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func TestExecuteActionExpressionTargetFiltersByType(t *testing.T) {
	bus := eventbus.NewChannelBus()
	reader := newMockStateReader()
	s := newMockStore()

	onOff := []device.Capability{{Name: device.CapOnOff}}
	reader.addDevice(device.Device{ID: "lamp", Name: "lamp", Type: device.Light, Capabilities: onOff})
	reader.addDevice(device.Device{ID: "fan", Name: "fan", Type: device.Plug, Capabilities: onOff})
	s.setRoomDevices("room-1", []device.DeviceID{"lamp", "fan"})

	engine := NewEngine(bus, reader, s, s, nil, nil)

	ch := bus.Subscribe(eventbus.EventCommandRequested)
	defer bus.Unsubscribe(ch)

	engine.executeAction(Node{
		ID:   "action-1",
		Type: NodeAction,
		Config: ActionConfig{
			ActionType: ActionSetDeviceState,
			TargetType: TargetType(device.TargetExpression),
			TargetExpr: []device.Clause{
				{Subject: device.SubjectRoom, Op: device.OpIs, Values: []string{"room-1"}},
				{Connector: device.ConnectorAnd, Subject: device.SubjectDeviceType, Op: device.OpIs, Values: []string{"light"}},
			},
			Payload: `{"on": true}`,
		},
	}, "auto-1")

	commanded := map[device.DeviceID]struct{}{}
	for {
		select {
		case evt := <-ch:
			commanded[device.DeviceID(evt.DeviceID)] = struct{}{}
			continue
		default:
		}
		break
	}

	if _, ok := commanded["lamp"]; !ok {
		t.Fatal("expected lamp commanded")
	}
	if _, ok := commanded["fan"]; ok {
		t.Fatal("plug should be excluded by device_type=light expression")
	}
	if len(commanded) != 1 {
		t.Fatalf("expected exactly one command, got %d", len(commanded))
	}
}
