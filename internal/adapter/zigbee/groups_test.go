package zigbee

import (
	"fmt"
	"reflect"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

type retainedGroupsMQTT struct {
	*FakeMQTTClient
	payload []byte
}

func (m *retainedGroupsMQTT) Connect() error {
	if _, subscribed := m.subscriptions["zigbee2mqtt/bridge/groups"]; !subscribed {
		return fmt.Errorf("bridge/groups was not subscribed before connect")
	}
	m.Inject("zigbee2mqtt/bridge/groups", m.payload)
	return m.FakeMQTTClient.Connect()
}

func TestBridgeGroupsPublishesCompleteSnapshot(t *testing.T) {
	adapter, mqtt, bus, _ := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatalf("start adapter: %v", err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/groups", []byte(`[
		{"id":7,"friendly_name":"Hall","members":[
			{"ieee_address":"0xaaa","endpoint":1},
			{"ieee_address":"0xaaa","endpoint":2},
			{"ieee_address":"0xaaa","endpoint":2}
		]},
		{"id":8,"friendly_name":"Bedroom","members":[]}
	]`))

	events := bus.getEvents()
	if len(events) != 1 || events[0].Type != eventbus.EventProviderGroupsSynced {
		t.Fatalf("events = %+v", events)
	}
	snapshot, ok := events[0].Payload.(device.ProviderGroupsSnapshot)
	if !ok {
		t.Fatalf("payload type = %T", events[0].Payload)
	}
	want := device.ProviderGroupsSnapshot{
		Provider: "zigbee2mqtt",
		Groups: []device.ProviderGroup{
			{ProviderGroupID: "7", Name: "Hall", Members: []device.ProviderGroupMember{
				{DeviceID: "0xaaa", Endpoint: 1},
				{DeviceID: "0xaaa", Endpoint: 2},
			}},
			{ProviderGroupID: "8", Name: "Bedroom", Members: []device.ProviderGroupMember{}},
		},
	}
	if !reflect.DeepEqual(snapshot, want) {
		t.Fatalf("snapshot = %#v, want %#v", snapshot, want)
	}
}

func TestBridgeGroupsRejectsMalformedSnapshotAtomically(t *testing.T) {
	adapter, mqtt, bus, _ := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatalf("start adapter: %v", err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/groups", []byte(`[
		{"id":7,"friendly_name":"Hall","members":[]},
		{"id":8,"friendly_name":"Bedroom","members":[{"ieee_address":"","endpoint":1}]}
	]`))
	if events := bus.getEvents(); len(events) != 0 {
		t.Fatalf("malformed snapshot published events: %+v", events)
	}
}

func TestBridgeGroupsPublishesEmptySnapshotWithUnknownDevices(t *testing.T) {
	for name, payload := range map[string][]byte{
		"empty": []byte(`[]`),
		"unknown": []byte(`[{
			"id":9,
			"friendly_name":"Unregistered device group",
			"members":[{"ieee_address":"0xnot-discovered","endpoint":1}]
		}]`),
	} {
		t.Run(name, func(t *testing.T) {
			adapter, mqtt, bus, _ := newTestAdapter()
			if err := adapter.Start(); err != nil {
				t.Fatalf("start adapter: %v", err)
			}
			defer adapter.Stop()
			injectSync(adapter, mqtt, "zigbee2mqtt/bridge/groups", payload)
			events := bus.getEvents()
			if len(events) != 1 || events[0].Type != eventbus.EventProviderGroupsSynced {
				t.Fatalf("events = %+v", events)
			}
		})
	}
}

func TestBridgeGroupsPublishesProviderRename(t *testing.T) {
	adapter, mqtt, bus, _ := newTestAdapter()
	if err := adapter.Start(); err != nil {
		t.Fatalf("start adapter: %v", err)
	}
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/groups", []byte(`[{"id":7,"friendly_name":"Hall","members":[]}]`))
	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/groups", []byte(`[{"id":7,"friendly_name":"Hall lights","members":[]}]`))

	events := bus.getEvents()
	if len(events) != 2 {
		t.Fatalf("events = %+v", events)
	}
	first := events[0].Payload.(device.ProviderGroupsSnapshot)
	second := events[1].Payload.(device.ProviderGroupsSnapshot)
	if first.Groups[0].Name != "Hall" || second.Groups[0].Name != "Hall lights" {
		t.Fatalf("snapshot names = %q, %q", first.Groups[0].Name, second.Groups[0].Name)
	}
}

func TestBridgeGroupsRetainedSnapshotIsHandledDuringStart(t *testing.T) {
	mqtt := &retainedGroupsMQTT{
		FakeMQTTClient: NewFakeMQTTClient(),
		payload:        []byte(`[{"id":7,"friendly_name":"Hall","members":[]}]`),
	}
	bus := newMockEventBus()
	adapter := NewZigbeeAdapter(mqtt, bus, newMockStateWriter(), newMockStateReader())
	if err := adapter.Start(); err != nil {
		t.Fatalf("start adapter: %v", err)
	}
	defer adapter.Stop()
	adapter.WaitForDispatchIdle()
	events := bus.getEvents()
	if len(events) != 1 || events[0].Type != eventbus.EventProviderGroupsSynced {
		t.Fatalf("retained events = %+v", events)
	}
}
