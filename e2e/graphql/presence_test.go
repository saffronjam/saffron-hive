//go:build e2e

package graphql_test

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/e2e/infra"
)

const fp300Name = "Presence Sensor FP300"

type fp300Device struct {
	Capabilities []struct {
		Name     string   `json:"name"`
		Type     string   `json:"type"`
		Category string   `json:"category"`
		Values   []string `json:"values"`
	} `json:"capabilities"`
	State struct {
		Presence  *bool `json:"presence"`
		Occupancy *bool `json:"occupancy"`
	} `json:"state"`
	Attributes []struct {
		Capability   string   `json:"capability"`
		BooleanValue *bool    `json:"booleanValue"`
		NumberValue  *float64 `json:"numberValue"`
		StringValue  *string  `json:"stringValue"`
	} `json:"attributes"`
}

func queryFP300(t *testing.T, id string) (fp300Device, bool) {
	t.Helper()
	data, err := graphqlQuery(`query($id: ID!) {
		device(id: $id) {
			capabilities { name type category values }
			state { presence occupancy }
			attributes { capability booleanValue numberValue stringValue }
		}
	}`, map[string]any{"id": id})
	if err != nil {
		return fp300Device{}, false
	}
	var result struct {
		Device fp300Device `json:"device"`
	}
	if json.Unmarshal(data, &result) != nil {
		return fp300Device{}, false
	}
	return result.Device, true
}

func (d fp300Device) number(capability string) *float64 {
	for _, attribute := range d.Attributes {
		if attribute.Capability == capability {
			return attribute.NumberValue
		}
	}
	return nil
}

func publishFP300State(t *testing.T) string {
	t.Helper()
	state, err := infra.LoadFP300State()
	if err != nil {
		t.Fatalf("load fixture: %v", err)
	}
	if err := publisher.PublishDeviceState(fp300Name, state); err != nil {
		t.Fatalf("publish state: %v", err)
	}
	id, err := queryDeviceIDByName(fp300Name)
	if err != nil {
		t.Fatalf("find device: %v", err)
	}
	return id
}

// TestPresence_FP300ReportsPresenceMotionSettingsAndDiagnostics verifies that
// an mmWave + PIR sensor exposes presence and motion as typed state, its
// writable exposures as settings, its write-only exposures as commands, and
// its unmodelled readings as diagnostic attributes.
func TestPresence_FP300ReportsPresenceMotionSettingsAndDiagnostics(t *testing.T) {
	id := publishFP300State(t)

	var device fp300Device
	ok := pollUntil(5*time.Second, 100*time.Millisecond, func() bool {
		var found bool
		device, found = queryFP300(t, id)
		return found && device.State.Presence != nil && device.number("power_outage_count") != nil
	})
	if !ok {
		t.Fatalf("timed out waiting for FP300 state: %+v", device)
	}
	if !*device.State.Presence || device.State.Occupancy == nil || !*device.State.Occupancy {
		t.Fatalf("presence=%v occupancy=%v, want both true", device.State.Presence, device.State.Occupancy)
	}

	categories := make(map[string]string)
	for _, capability := range device.Capabilities {
		categories[capability.Name] = capability.Category
		if capability.Name == "detection_range_composite" && (capability.Type != "flags" || len(capability.Values) != 24) {
			t.Fatalf("detection range = %+v, want 24 flags", capability)
		}
	}
	for name, want := range map[string]string{
		"presence":                   "STATE",
		"absence_delay_timer":        "CONFIGURATION",
		"presence_detection_options": "CONFIGURATION",
		"detection_range_composite":  "CONFIGURATION",
		"identify":                   "COMMAND",
		"restart_device":             "COMMAND",
		"target_distance":            "DIAGNOSTIC",
		"power_outage_count":         "DIAGNOSTIC",
	} {
		if categories[name] != want {
			t.Errorf("%s category = %q, want %q", name, categories[name], want)
		}
	}
	if _, ok := categories["detection_range"]; ok {
		t.Error("raw detection_range bitmask must not be surfaced")
	}
}

// TestPresence_FP300SettingRoundTrip verifies a setting write reaches the
// device's set topic and the confirmed value comes back as an attribute.
func TestPresence_FP300SettingRoundTrip(t *testing.T) {
	id := publishFP300State(t)
	commands, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe commands: %v", err)
	}
	if !pollUntil(5*time.Second, 100*time.Millisecond, func() bool {
		device, ok := queryFP300(t, id)
		return ok && device.number("absence_delay_timer") != nil
	}) {
		t.Fatal("timed out waiting for initial settings")
	}

	if _, err := graphqlMutation(`mutation($id: ID!) {
		setDeviceConfiguration(deviceId: $id, settings: [{ capability: "absence_delay_timer", numberValue: 42 }])
	}`, map[string]any{"id": id}); err != nil {
		t.Fatalf("set configuration: %v", err)
	}

	waitForSetPayload(t, commands, `"absence_delay_timer":42`)
	if !pollUntil(5*time.Second, 100*time.Millisecond, func() bool {
		device, ok := queryFP300(t, id)
		value := device.number("absence_delay_timer")
		return ok && value != nil && *value == 42
	}) {
		t.Fatal("timed out waiting for confirmed setting")
	}
}

// TestPresence_FP300CommandPublishesOnce verifies a device command is written
// to the set topic exactly once, with no confirmation retries.
func TestPresence_FP300CommandPublishesOnce(t *testing.T) {
	id := publishFP300State(t)
	commands, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe commands: %v", err)
	}

	if _, err := graphqlMutation(`mutation($id: ID!) {
		runDeviceCommand(deviceId: $id, capability: "identify", value: "identify")
	}`, map[string]any{"id": id}); err != nil {
		t.Fatalf("run command: %v", err)
	}
	waitForSetPayload(t, commands, `"identify":"identify"`)

	deadline := time.After(4 * time.Second)
	for {
		select {
		case message := <-commands:
			if strings.Contains(string(message.Payload), `"identify"`) {
				t.Fatalf("command re-sent: %s", message.Payload)
			}
		case <-deadline:
			return
		}
	}
}

func waitForSetPayload(t *testing.T, commands <-chan infra.MQTTMessage, fragment string) {
	t.Helper()
	timeout := time.After(5 * time.Second)
	for {
		select {
		case message := <-commands:
			if message.Topic == "zigbee2mqtt/"+fp300Name+"/set" && strings.Contains(string(message.Payload), fragment) {
				return
			}
		case <-timeout:
			t.Fatalf("timed out waiting for set payload containing %s", fragment)
		}
	}
}
