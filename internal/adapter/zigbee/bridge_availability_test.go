package zigbee

import (
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

const bridgeDevicesWithLight = `[
  {"ieee_address":"0xcoord","friendly_name":"Coordinator","type":"Coordinator","supported":true,"definition":null},
  {"ieee_address":"0xlight","friendly_name":"Desk Light","type":"Router","supported":true,
   "definition":{"exposes":[{"type":"light","features":[{"type":"binary","property":"state"}]}]}}
]`

func newAvailabilityTestAdapter(t *testing.T) (*ZigbeeAdapter, *FakeMQTTClient, *mockEventBus, *device.MemoryStore) {
	t.Helper()
	mqtt := NewFakeMQTTClient()
	bus := newMockEventBus()
	state := device.NewMemoryStore()
	adapter := NewZigbeeAdapter(mqtt, bus, state, state)
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	return adapter, mqtt, bus, state
}

func TestCoordinatorAvailabilityUsesBridgeStateOnEmptyNetwork(t *testing.T) {
	adapter, mqtt, _, state := newAvailabilityTestAdapter(t)
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(`[
      {"ieee_address":"0xcoord","friendly_name":"Coordinator","type":"Coordinator","supported":true,"definition":null}
    ]`))
	coordinator, ok := state.GetDevice("0xcoord")
	if !ok {
		t.Fatal("coordinator not discovered")
	}
	if coordinator.Available {
		t.Fatal("coordinator became available before bridge/state")
	}

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/state", []byte(`{"state":"online"}`))
	coordinator, _ = state.GetDevice("0xcoord")
	if !coordinator.Available {
		t.Fatal("coordinator did not become available from bridge/state")
	}
	if !adapter.BridgeConnected() {
		t.Fatal("adapter did not report the bridge connected")
	}
}

func TestBridgeStateGatesDeviceAvailability(t *testing.T) {
	adapter, mqtt, _, state := newAvailabilityTestAdapter(t)
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(bridgeDevicesWithLight))
	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/state", []byte(`{"state":"online"}`))
	light, _ := state.GetDevice("0xlight")
	if !light.Available {
		t.Fatal("device without an availability topic should follow bridge state")
	}

	injectSync(adapter, mqtt, "zigbee2mqtt/Desk Light/availability", []byte(`{"state":"offline"}`))
	light, _ = state.GetDevice("0xlight")
	if light.Available {
		t.Fatal("device availability offline was ignored")
	}
	injectSync(adapter, mqtt, "zigbee2mqtt/Desk Light/availability", []byte(`{"state":"online"}`))

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/state", []byte(`{"state":"offline"}`))
	coordinator, _ := state.GetDevice("0xcoord")
	light, _ = state.GetDevice("0xlight")
	if coordinator.Available || light.Available {
		t.Fatal("bridge offline did not gate the complete Zigbee source")
	}
	injectSync(adapter, mqtt, "zigbee2mqtt/Desk Light/availability", []byte(`{"state":"online"}`))
	light, _ = state.GetDevice("0xlight")
	if light.Available {
		t.Fatal("device report overrode bridge offline")
	}

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/state", []byte(`{"state":"online"}`))
	light, _ = state.GetDevice("0xlight")
	if !light.Available {
		t.Fatal("fresh device availability did not recover with the bridge")
	}
}

func TestMQTTReconnectRequiresCurrentSessionAvailability(t *testing.T) {
	adapter, mqtt, _, state := newAvailabilityTestAdapter(t)
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(bridgeDevicesWithLight))
	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/state", []byte(`{"state":"online"}`))
	injectSync(adapter, mqtt, "zigbee2mqtt/Desk Light/availability", []byte(`{"state":"online"}`))

	mqtt.SetConnectionState(false)
	adapter.WaitForDispatchIdle()
	coordinator, _ := state.GetDevice("0xcoord")
	light, _ := state.GetDevice("0xlight")
	if coordinator.Available || light.Available || adapter.BridgeConnected() {
		t.Fatal("MQTT loss did not immediately mark the network offline")
	}

	mqtt.SetConnectionState(true)
	adapter.WaitForDispatchIdle()
	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/state", []byte(`{"state":"online"}`))
	coordinator, _ = state.GetDevice("0xcoord")
	light, _ = state.GetDevice("0xlight")
	if !coordinator.Available {
		t.Fatal("coordinator did not recover from current bridge state")
	}
	if light.Available {
		t.Fatal("device reused stale availability after reconnect")
	}

	injectSync(adapter, mqtt, "zigbee2mqtt/Desk Light/availability", []byte(`{"state":"online"}`))
	light, _ = state.GetDevice("0xlight")
	if !light.Available {
		t.Fatal("device did not recover from current-session availability")
	}
}

func TestAvailabilityBeforeDiscoveryIsApplied(t *testing.T) {
	adapter, mqtt, _, state := newAvailabilityTestAdapter(t)
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/state", []byte(`{"state":"online"}`))
	injectSync(adapter, mqtt, "zigbee2mqtt/Desk Light/availability", []byte(`{"state":"offline"}`))
	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(bridgeDevicesWithLight))

	light, _ := state.GetDevice("0xlight")
	if light.Available {
		t.Fatal("pre-discovery retained availability was discarded")
	}
}

func TestMalformedBridgeStateDoesNotChangeAvailability(t *testing.T) {
	adapter, mqtt, _, state := newAvailabilityTestAdapter(t)
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(bridgeDevicesWithLight))
	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/state", []byte(`{"state":"online"}`))
	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/state", []byte(`{"state":"starting"}`))

	coordinator, _ := state.GetDevice("0xcoord")
	if !coordinator.Available || !adapter.BridgeConnected() {
		t.Fatal("unknown bridge state changed the last valid status")
	}
}
