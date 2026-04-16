//go:build e2e

package graphql_test

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/e2e/infra"
)

type wsMessage struct {
	ID      string          `json:"id,omitempty"`
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

func TestSubscriptions_DeviceStateChanged(t *testing.T) {
	ch, cleanup, err := wsSubscribe(
		`subscription { deviceStateChanged { deviceId state { ... on LightState { brightness } } } }`,
		nil,
	)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	defer cleanup()

	time.Sleep(200 * time.Millisecond)

	statePayload := []byte(`{"state":"ON","brightness":180,"color_temp":300}`)
	if err := publisher.PublishDeviceState("Kitchen Light", statePayload); err != nil {
		t.Fatalf("publish: %v", err)
	}

	ok := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		select {
		case data := <-ch:
			var event struct {
				DeviceStateChanged struct {
					DeviceID string `json:"deviceId"`
					State    struct {
						Brightness *int `json:"brightness"`
					} `json:"state"`
				} `json:"deviceStateChanged"`
			}
			if json.Unmarshal(data, &event) == nil && event.DeviceStateChanged.State.Brightness != nil && *event.DeviceStateChanged.State.Brightness == 180 {
				return true
			}
		default:
		}
		return false
	})
	if !ok {
		t.Fatal("timed out waiting for deviceStateChanged subscription event")
	}
}

func TestSubscriptions_DeviceAvailabilityChanged(t *testing.T) {
	ch, cleanup, err := wsSubscribe(
		`subscription { deviceAvailabilityChanged { deviceId available } }`,
		nil,
	)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	defer cleanup()

	time.Sleep(200 * time.Millisecond)

	if err := publisher.PublishAvailability("Bedroom Light", false); err != nil {
		t.Fatalf("publish: %v", err)
	}
	t.Cleanup(func() {
		_ = publisher.PublishAvailability("Bedroom Light", true)
	})

	ok := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		select {
		case data := <-ch:
			var event struct {
				DeviceAvailabilityChanged struct {
					DeviceID  string `json:"deviceId"`
					Available bool   `json:"available"`
				} `json:"deviceAvailabilityChanged"`
			}
			if json.Unmarshal(data, &event) == nil && event.DeviceAvailabilityChanged.DeviceID != "" {
				if !event.DeviceAvailabilityChanged.Available {
					return true
				}
			}
		default:
		}
		return false
	})
	if !ok {
		t.Fatal("timed out waiting for availability changed subscription event")
	}
}

func TestSubscriptions_DeviceStateChangedWithFilter(t *testing.T) {
	bedroomID, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find bedroom: %v", err)
	}

	ch, cleanup, err := wsSubscribe(
		`subscription($deviceId: ID) { deviceStateChanged(deviceId: $deviceId) { deviceId state { ... on LightState { brightness } } } }`,
		map[string]any{"deviceId": bedroomID},
	)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	defer cleanup()

	time.Sleep(200 * time.Millisecond)

	wrongPayload := []byte(`{"state":"ON","brightness":99,"color_temp":250}`)
	if err := publisher.PublishDeviceState("Kitchen Light", wrongPayload); err != nil {
		t.Fatalf("publish wrong device: %v", err)
	}

	time.Sleep(500 * time.Millisecond)

	select {
	case data := <-ch:
		var event struct {
			DeviceStateChanged struct {
				DeviceID string `json:"deviceId"`
			} `json:"deviceStateChanged"`
		}
		if json.Unmarshal(data, &event) == nil && event.DeviceStateChanged.DeviceID != bedroomID {
			t.Fatalf("received event for wrong device %q while filtering for %q", event.DeviceStateChanged.DeviceID, bedroomID)
		}
	default:
	}

	rightPayload := []byte(`{"state":"ON","brightness":77,"color_temp":200}`)
	if err := publisher.PublishDeviceState("Bedroom Light", rightPayload); err != nil {
		t.Fatalf("publish right device: %v", err)
	}

	ok := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		select {
		case data := <-ch:
			var event struct {
				DeviceStateChanged struct {
					DeviceID string `json:"deviceId"`
					State    struct {
						Brightness *int `json:"brightness"`
					} `json:"state"`
				} `json:"deviceStateChanged"`
			}
			if json.Unmarshal(data, &event) == nil && event.DeviceStateChanged.DeviceID == bedroomID {
				return true
			}
		default:
		}
		return false
	})
	if !ok {
		t.Fatal("timed out waiting for filtered device state changed event")
	}
}

func TestSubscriptions_DeviceAdded(t *testing.T) {
	ch, cleanup, err := wsSubscribe(
		`subscription { deviceAdded { id name type } }`,
		nil,
	)
	if err != nil {
		t.Fatalf("subscribe: %v", err)
	}
	defer cleanup()

	time.Sleep(200 * time.Millisecond)

	devices, err := infra.LoadBridgeDevices()
	if err != nil {
		t.Fatalf("load fixtures: %v", err)
	}

	var deviceList []json.RawMessage
	if err := json.Unmarshal(devices, &deviceList); err != nil {
		t.Fatalf("unmarshal devices: %v", err)
	}

	newDevice := []byte(`{
		"ieee_address": "0x00158d0009z9z9z9",
		"friendly_name": "New Test Device",
		"type": "Router",
		"supported": true,
		"definition": {
			"model": "LED1545G12",
			"vendor": "IKEA",
			"description": "Test device"
		},
		"features": [
			{
				"type": "light",
				"name": "light",
				"property": "light",
				"features": [
					{"type": "binary", "name": "state", "property": "state", "features": []},
					{"type": "numeric", "name": "brightness", "property": "brightness", "features": []}
				]
			}
		]
	}`)
	deviceList = append(deviceList, newDevice)

	updatedDevices, _ := json.Marshal(deviceList)
	if err := publisher.PublishBridgeDevices(updatedDevices); err != nil {
		t.Fatalf("publish: %v", err)
	}

	t.Cleanup(func() {
		_ = publisher.PublishBridgeDevices(devices)
		pollUntil(5*time.Second, 100*time.Millisecond, func() bool {
			data, qErr := graphqlQuery(`{ devices { id } }`, nil)
			if qErr != nil {
				return false
			}
			var result struct {
				Devices []struct{ ID string } `json:"devices"`
			}
			_ = json.Unmarshal(data, &result)
			return len(result.Devices) == expectedDeviceCount
		})
	})

	ok := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		select {
		case data := <-ch:
			var event struct {
				DeviceAdded struct {
					ID   string `json:"id"`
					Name string `json:"name"`
					Type string `json:"type"`
				} `json:"deviceAdded"`
			}
			if json.Unmarshal(data, &event) == nil && event.DeviceAdded.Name == "New Test Device" {
				return true
			}
		default:
		}
		return false
	})
	if !ok {
		t.Fatal("timed out waiting for deviceAdded subscription event")
	}
}

func TestSubscriptions_DeviceRemoved(t *testing.T) {
	devices, err := infra.LoadBridgeDevices()
	if err != nil {
		t.Fatalf("load fixtures: %v", err)
	}

	ch, cleanup, wsErr := wsSubscribe(
		`subscription { deviceRemoved }`,
		nil,
	)
	if wsErr != nil {
		t.Fatalf("subscribe: %v", wsErr)
	}
	defer cleanup()

	time.Sleep(200 * time.Millisecond)

	var deviceList []json.RawMessage
	if err := json.Unmarshal(devices, &deviceList); err != nil {
		t.Fatalf("unmarshal devices: %v", err)
	}

	if len(deviceList) < 2 {
		t.Fatal("need at least 2 devices to remove one")
	}
	reducedList := deviceList[1:]
	reducedDevices, _ := json.Marshal(reducedList)
	if err := publisher.PublishBridgeDevices(reducedDevices); err != nil {
		t.Fatalf("publish: %v", err)
	}

	t.Cleanup(func() {
		_ = publisher.PublishBridgeDevices(devices)
		pollUntil(5*time.Second, 100*time.Millisecond, func() bool {
			data, qErr := graphqlQuery(`{ devices { id } }`, nil)
			if qErr != nil {
				return false
			}
			var result struct {
				Devices []struct{ ID string } `json:"devices"`
			}
			_ = json.Unmarshal(data, &result)
			return len(result.Devices) >= expectedDeviceCount
		})
	})

	ok := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		select {
		case data := <-ch:
			var event struct {
				DeviceRemoved string `json:"deviceRemoved"`
			}
			if json.Unmarshal(data, &event) == nil && event.DeviceRemoved != "" {
				return true
			}
		default:
		}
		return false
	})
	if !ok {
		t.Fatal("timed out waiting for deviceRemoved subscription event")
	}
}
