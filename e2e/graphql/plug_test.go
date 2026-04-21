//go:build e2e

package graphql_test

import (
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/e2e/infra"
)

// TestPlug_MeteringState verifies that a plug's power, voltage, current, and
// energy fields all propagate through DeviceState.
func TestPlug_MeteringState(t *testing.T) {
	plugState, err := infra.LoadPlugState()
	if err != nil {
		t.Fatalf("load fixture: %v", err)
	}

	if err := publisher.PublishDeviceState("Lava Lamp", plugState); err != nil {
		t.Fatalf("publish state: %v", err)
	}

	ok := pollUntil(5*time.Second, 100*time.Millisecond, func() bool {
		data, err := graphqlQuery(`{
			devices {
				name
				state { on power voltage current energy }
			}
		}`, nil)
		if err != nil {
			return false
		}
		var result struct {
			Devices []struct {
				Name  string `json:"name"`
				State struct {
					On      *bool    `json:"on"`
					Power   *float64 `json:"power"`
					Voltage *float64 `json:"voltage"`
					Current *float64 `json:"current"`
					Energy  *float64 `json:"energy"`
				} `json:"state"`
			} `json:"devices"`
		}
		if json.Unmarshal(data, &result) != nil {
			return false
		}
		for _, d := range result.Devices {
			if d.Name != "Lava Lamp" {
				continue
			}
			return d.State.On != nil && *d.State.On &&
				d.State.Power != nil && *d.State.Power == 42.5 &&
				d.State.Voltage != nil && *d.State.Voltage == 230.1 &&
				d.State.Current != nil && *d.State.Current == 0.18 &&
				d.State.Energy != nil && *d.State.Energy == 12.3
		}
		return false
	})
	if !ok {
		t.Fatal("timed out waiting for plug metering fields to propagate")
	}
}

// A plug reporting power metering must render in the activity feed as
// something other than "<name> pressed". Plugs don't emit action events.
func TestPlug_ActivityNotPressed(t *testing.T) {
	plugState, err := infra.LoadPlugState()
	if err != nil {
		t.Fatalf("load fixture: %v", err)
	}

	if err := publisher.PublishDeviceState("Lava Lamp", plugState); err != nil {
		t.Fatalf("publish state: %v", err)
	}

	ok := pollUntil(5*time.Second, 100*time.Millisecond, func() bool {
		data, err := graphqlQuery(`{
			activity(filter: {limit: 20}) {
				message
				source { name }
			}
		}`, nil)
		if err != nil {
			return false
		}
		var result struct {
			Activity []struct {
				Message string `json:"message"`
				Source  struct {
					Name *string `json:"name"`
				} `json:"source"`
			} `json:"activity"`
		}
		if json.Unmarshal(data, &result) != nil {
			return false
		}
		for _, row := range result.Activity {
			if row.Source.Name != nil && *row.Source.Name == "Lava Lamp" {
				if strings.Contains(strings.ToLower(row.Message), "pressed") {
					t.Fatalf("regression: plug metering rendered as %q (contains 'pressed')", row.Message)
				}
				return true
			}
		}
		return false
	})
	if !ok {
		t.Fatal("timed out waiting for plug activity entry")
	}
}
