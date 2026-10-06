package zigbee

import (
	"context"
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
)

const fp300ID = device.DeviceID("0xfp300")

func loadFP300Exposes(t *testing.T) []z2mFeature {
	t.Helper()
	raw, err := os.ReadFile("testdata/aqara_fp300_exposes.json")
	if err != nil {
		t.Fatal(err)
	}
	var exposes []z2mFeature
	if err := json.Unmarshal(raw, &exposes); err != nil {
		t.Fatal(err)
	}
	return exposes
}

func loadFP300State(t *testing.T) []byte {
	t.Helper()
	raw, err := os.ReadFile("testdata/aqara_fp300_state.json")
	if err != nil {
		t.Fatal(err)
	}
	return raw
}

// startFP300 discovers an Aqara FP300 through bridge/devices on an adapter
// backed by a real memory store, so validation sees the discovered capabilities.
func startFP300(t *testing.T) (*ZigbeeAdapter, *FakeMQTTClient, *device.MemoryStore) {
	t.Helper()
	adapter, mqtt, _, store := newAvailabilityTestAdapter(t)
	t.Cleanup(adapter.Stop)
	exposes, err := json.Marshal(loadFP300Exposes(t))
	if err != nil {
		t.Fatal(err)
	}
	devices := `[{"ieee_address":"` + string(fp300ID) + `","friendly_name":"Motion sensor 1","type":"EndDevice","supported":true,` +
		`"definition":{"model":"PS-S04D","vendor":"Aqara","exposes":` + string(exposes) + `}}]`
	injectSync(adapter, mqtt, "zigbee2mqtt/bridge/devices", []byte(devices))
	if _, ok := store.GetDevice(fp300ID); !ok {
		t.Fatal("FP300 not discovered")
	}
	return adapter, mqtt, store
}

func TestFP300_Classification(t *testing.T) {
	exposes := loadFP300Exposes(t)
	if got := detectDeviceType(exposes); got != device.Sensor {
		t.Fatalf("device type = %q, want sensor", got)
	}
	caps, attributes := extractCapabilitiesWithAttributes(exposes)
	byName := make(map[string]device.Capability, len(caps))
	for _, capability := range caps {
		byName[capability.Name] = capability
	}

	want := map[string]device.CapabilityCategory{
		device.CapPresence:           device.CapabilityCategoryState,
		device.CapOccupancy:          device.CapabilityCategoryState,
		device.CapTemperature:        device.CapabilityCategoryState,
		device.CapBattery:            device.CapabilityCategoryDiagnostic,
		"motion_sensitivity":         device.CapabilityCategoryConfiguration,
		"presence_detection_options": device.CapabilityCategoryConfiguration,
		"ai_sensitivity_adaptive":    device.CapabilityCategoryConfiguration,
		"absence_delay_timer":        device.CapabilityCategoryConfiguration,
		"temp_reporting_mode":        device.CapabilityCategoryConfiguration,
		"led_disabled_night":         device.CapabilityCategoryConfiguration,
		"schedule_start_time":        device.CapabilityCategoryConfiguration,
		"detection_range_composite":  device.CapabilityCategoryConfiguration,
		"identify":                   device.CapabilityCategoryCommand,
		"restart_device":             device.CapabilityCategoryCommand,
		"spatial_learning":           device.CapabilityCategoryCommand,
		"track_target_distance":      device.CapabilityCategoryCommand,
		"target_distance":            device.CapabilityCategoryDiagnostic,
		"power_outage_count":         device.CapabilityCategoryDiagnostic,
	}
	for name, category := range want {
		capability, ok := byName[name]
		if !ok {
			t.Errorf("missing capability %q", name)
			continue
		}
		if capability.Category != category {
			t.Errorf("%s category = %q, want %q", name, capability.Category, category)
		}
	}
	for _, hidden := range []string{"detection_range", "detection_range_0", "pir_detection"} {
		if _, ok := byName[hidden]; ok {
			t.Errorf("capability %q must not be surfaced", hidden)
		}
	}

	flags := byName["detection_range_composite"]
	if flags.Type != device.CapabilityTypeFlags || len(flags.Values) != 24 {
		t.Fatalf("detection range = type %q with %d flags, want flags with 24", flags.Type, len(flags.Values))
	}
	if flags.Label != "Detection range" {
		t.Fatalf("flags label = %q, want the raw exposure's label", flags.Label)
	}
	if flags.Values[0] != "0.00m - 0.25m" || flags.Values[23] != "5.75m - 6.00m" {
		t.Fatalf("flag names = %q … %q", flags.Values[0], flags.Values[23])
	}

	for _, typed := range []string{device.CapPresence, device.CapOccupancy, device.CapBattery} {
		if _, ok := attributes[typed]; ok {
			t.Errorf("typed state %q must not be a generic attribute", typed)
		}
	}
}

func TestFP300_StateReportsPresenceMotionAndAttributes(t *testing.T) {
	adapter, mqtt, store := startFP300(t)
	injectSync(adapter, mqtt, "zigbee2mqtt/Motion sensor 1", loadFP300State(t))

	state, ok := store.GetDeviceState(fp300ID)
	if !ok {
		t.Fatal("no state stored")
	}
	if state.Presence == nil || !*state.Presence {
		t.Fatalf("presence = %v, want true", state.Presence)
	}
	if state.Occupancy == nil || !*state.Occupancy {
		t.Fatalf("occupancy from pir_detection = %v, want true", state.Occupancy)
	}

	values := make(map[string]device.AttributeValue)
	for _, value := range store.GetDeviceAttributes(fp300ID) {
		values[value.Capability] = value
	}
	if v := values["absence_delay_timer"]; v.NumberValue == nil || *v.NumberValue != 10 {
		t.Fatalf("absence_delay_timer = %+v", v)
	}
	if v := values["ai_sensitivity_adaptive"]; v.BooleanValue == nil || !*v.BooleanValue {
		t.Fatalf("ai_sensitivity_adaptive = %+v", v)
	}
	if v := values["power_outage_count"]; v.NumberValue == nil || *v.NumberValue != 1 {
		t.Fatalf("power_outage_count = %+v", v)
	}
	wantMask := float64(1<<23-1) - 2
	if v := values["detection_range_composite"]; v.NumberValue == nil || *v.NumberValue != wantMask {
		t.Fatalf("detection range mask = %+v, want %v", v, wantMask)
	}
	for _, command := range []string{"identify", "restart_device"} {
		if _, ok := values[command]; ok {
			t.Fatalf("command %q must not carry a value", command)
		}
	}
}

func TestFP300_FlagsSettingWritesNamedComposite(t *testing.T) {
	adapter, mqtt, _ := startFP300(t)
	mask := float64(0b101)
	if err := adapter.DispatchConfiguration(context.Background(), device.ConfigurationRequest{
		DeviceID: fp300ID,
		Values:   []device.AttributeValue{{Capability: "detection_range_composite", NumberValue: &mask}},
	}); err != nil {
		t.Fatal(err)
	}
	published := waitForPublish(mqtt, 1, 500*time.Millisecond)
	if len(published) != 1 || published[0].Topic != "zigbee2mqtt/Motion sensor 1/set" {
		t.Fatalf("published = %+v", published)
	}
	var payload map[string]map[string]bool
	if err := json.Unmarshal(published[0].Payload, &payload); err != nil {
		t.Fatal(err)
	}
	flags := payload["detection_range_composite"]
	if len(flags) != 24 || !flags["detection_range_0"] || flags["detection_range_1"] || !flags["detection_range_2"] || flags["detection_range_23"] {
		t.Fatalf("composite payload = %v", flags)
	}
}

func TestFP300_CommandPublishesValue(t *testing.T) {
	adapter, mqtt, _ := startFP300(t)
	if err := adapter.DispatchDeviceCommand(context.Background(), device.DeviceCommandRequest{
		DeviceID: fp300ID, Capability: "restart_device", Value: "Restart Device",
	}); err != nil {
		t.Fatal(err)
	}
	published := waitForPublish(mqtt, 1, 500*time.Millisecond)
	if len(published) != 1 || string(published[0].Payload) != `{"restart_device":"Restart Device"}` {
		t.Fatalf("published = %+v", published)
	}

	if err := adapter.DispatchDeviceCommand(context.Background(), device.DeviceCommandRequest{
		DeviceID: fp300ID, Capability: "restart_device", Value: "Reboot",
	}); err == nil {
		t.Fatal("unknown command value accepted")
	}
	if err := adapter.DispatchDeviceCommand(context.Background(), device.DeviceCommandRequest{
		DeviceID: fp300ID, Capability: "absence_delay_timer", Value: "5",
	}); err == nil {
		t.Fatal("setting accepted as a command")
	}
}
