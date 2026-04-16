//go:build e2e

package graphql_test

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/e2e/infra"
)

func TestDevices_QueryAll(t *testing.T) {
	data, err := graphqlQuery(`{
		devices {
			id
			name
			type
			source
			available
		}
	}`, nil)
	if err != nil {
		t.Fatalf("query devices: %v", err)
	}

	var result struct {
		Devices []struct {
			ID        string `json:"id"`
			Name      string `json:"name"`
			Type      string `json:"type"`
			Source    string `json:"source"`
			Available bool   `json:"available"`
		} `json:"devices"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if len(result.Devices) != expectedDeviceCount {
		t.Fatalf("expected %d devices, got %d", expectedDeviceCount, len(result.Devices))
	}

	nameSet := make(map[string]struct{}, len(result.Devices))
	for _, d := range result.Devices {
		nameSet[d.Name] = struct{}{}
		if d.Source != "zigbee" {
			t.Errorf("device %q source=%q, want zigbee", d.Name, d.Source)
		}
		if d.ID == "" {
			t.Errorf("device %q has empty ID", d.Name)
		}
	}

	for _, expected := range []string{"Living Room Light", "Bedroom Light", "Kitchen Light", "Living Room Sensor", "Outdoor Sensor", "Office Switch"} {
		if _, ok := nameSet[expected]; !ok {
			t.Errorf("expected device %q not found", expected)
		}
	}
}

func TestDevices_VerifyTypes(t *testing.T) {
	data, err := graphqlQuery(`{ devices { name type } }`, nil)
	if err != nil {
		t.Fatalf("query: %v", err)
	}

	var result struct {
		Devices []struct {
			Name string `json:"name"`
			Type string `json:"type"`
		} `json:"devices"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	expected := map[string]string{
		"Living Room Light":  "light",
		"Bedroom Light":      "light",
		"Kitchen Light":      "light",
		"Living Room Sensor": "sensor",
		"Outdoor Sensor":     "sensor",
		"Office Switch":      "switch",
	}

	for _, d := range result.Devices {
		if want, ok := expected[d.Name]; ok {
			if d.Type != want {
				t.Errorf("device %q type=%q, want %q", d.Name, d.Type, want)
			}
		}
	}
}

func TestDevices_StateChange(t *testing.T) {
	lightState, err := infra.LoadLightState()
	if err != nil {
		t.Fatalf("load fixture: %v", err)
	}

	if err := publisher.PublishDeviceState("Living Room Light", lightState); err != nil {
		t.Fatalf("publish state: %v", err)
	}

	ok := pollUntil(5*time.Second, 100*time.Millisecond, func() bool {
		data, err := graphqlQuery(`{
			devices {
				name
				state {
					... on LightState { on brightness colorTemp }
				}
			}
		}`, nil)
		if err != nil {
			return false
		}
		var result struct {
			Devices []struct {
				Name  string `json:"name"`
				State struct {
					On         *bool `json:"on"`
					Brightness *int  `json:"brightness"`
					ColorTemp  *int  `json:"colorTemp"`
				} `json:"state"`
			} `json:"devices"`
		}
		if err := json.Unmarshal(data, &result); err != nil {
			return false
		}
		for _, d := range result.Devices {
			if d.Name == "Living Room Light" {
				return d.State.Brightness != nil && *d.State.Brightness == 200
			}
		}
		return false
	})

	if !ok {
		t.Fatal("timed out waiting for light state to propagate")
	}
}

func TestDevices_AvailabilityChange(t *testing.T) {
	if err := publisher.PublishAvailability("Living Room Light", false); err != nil {
		t.Fatalf("publish availability: %v", err)
	}

	ok := pollUntil(5*time.Second, 100*time.Millisecond, func() bool {
		data, err := graphqlQuery(`{ devices { name available } }`, nil)
		if err != nil {
			return false
		}
		var result struct {
			Devices []struct {
				Name      string `json:"name"`
				Available bool   `json:"available"`
			} `json:"devices"`
		}
		if err := json.Unmarshal(data, &result); err != nil {
			return false
		}
		for _, d := range result.Devices {
			if d.Name == "Living Room Light" {
				return !d.Available
			}
		}
		return false
	})

	if !ok {
		t.Fatal("timed out waiting for availability change")
	}

	if err := publisher.PublishAvailability("Living Room Light", true); err != nil {
		t.Fatalf("restore availability: %v", err)
	}

	pollUntil(5*time.Second, 100*time.Millisecond, func() bool {
		data, err := graphqlQuery(`{ devices { name available } }`, nil)
		if err != nil {
			return false
		}
		var result struct {
			Devices []struct {
				Name      string `json:"name"`
				Available bool   `json:"available"`
			} `json:"devices"`
		}
		if err := json.Unmarshal(data, &result); err != nil {
			return false
		}
		for _, d := range result.Devices {
			if d.Name == "Living Room Light" {
				return d.Available
			}
		}
		return false
	})
}
