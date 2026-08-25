package zigbee

import (
	"encoding/json"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func TestMapBridgeInfoNormalizesStableDiagnostics(t *testing.T) {
	var raw z2mBridgeInfo
	payload := []byte(`{
      "version":"2.7.2", "commit":"abc123",
      "coordinator":{"ieee_address":"0xAABB", "type":"ZStack3x0", "meta":{"revision":20240710}},
      "zigbee_herdsman":{"version":"6.1.4"},
      "zigbee_herdsman_converters":{"version":"25.30.0"},
      "network":{"channel":20,"pan_id":6754,"extended_pan_id":[0,18,75,0,0,0,171,205]}
    }`)
	if err := json.Unmarshal(payload, &raw); err != nil {
		t.Fatal(err)
	}
	id, info, err := mapBridgeInfo(raw)
	if err != nil {
		t.Fatal(err)
	}
	if id != "0xaabb" {
		t.Fatalf("coordinator ID = %q", id)
	}
	if info.FirmwareVersion == nil || *info.FirmwareVersion != "20240710" {
		t.Fatalf("firmware version = %v", info.FirmwareVersion)
	}
	if info.ExtendedPANID == nil || *info.ExtendedPANID != "0x00124b000000abcd" {
		t.Fatalf("extended PAN ID = %v", info.ExtendedPANID)
	}
	if info.Fingerprint == "" {
		t.Fatal("bridge info fingerprint is empty")
	}
}

func TestBridgeInfoWaitsForCoordinatorDiscovery(t *testing.T) {
	adapter, mqtt, bus, _ := newAvailabilityTestAdapter(t)
	defer adapter.Stop()

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/info", []byte(`{
      "version":"2.7.2",
      "coordinator":{"ieee_address":"0xcoord","type":"ZStack3x0","meta":{"revision":"20240710"}},
      "network":{"channel":20,"pan_id":6754,"extended_pan_id":"0x00124b000000abcd"}
    }`))
	if got := countEvents(bus, eventbus.EventZigbeeBridgeInfoSynced); got != 0 {
		t.Fatalf("bridge info events before discovery = %d", got)
	}

	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(`[
      {"ieee_address":"0xcoord","friendly_name":"Coordinator","type":"Coordinator","supported":true,"definition":null}
    ]`))
	if got := countEvents(bus, eventbus.EventZigbeeBridgeInfoSynced); got != 1 {
		t.Fatalf("bridge info events after discovery = %d, want 1", got)
	}
}
