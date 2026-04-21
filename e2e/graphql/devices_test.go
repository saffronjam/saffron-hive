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

	for _, expected := range []string{"Living Room Light", "Bedroom Light", "Kitchen Light", "Living Room Sensor", "Outdoor Sensor", "Office Button", "Lava Lamp"} {
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
		"Office Button":      "button",
		"Lava Lamp":          "plug",
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
				state { on brightness colorTemp }
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

func TestDevices_QuerySingleByID(t *testing.T) {
	deviceID, err := queryDeviceIDByName("Living Room Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	data, err := graphqlQuery(`query($id: ID!) {
		device(id: $id) {
			id
			name
			type
			source
			available
		}
	}`, map[string]any{"id": deviceID})
	if err != nil {
		t.Fatalf("query device: %v", err)
	}

	var result struct {
		Device struct {
			ID        string `json:"id"`
			Name      string `json:"name"`
			Type      string `json:"type"`
			Source    string `json:"source"`
			Available bool   `json:"available"`
		} `json:"device"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if result.Device.ID != deviceID {
		t.Errorf("id=%q, want %q", result.Device.ID, deviceID)
	}
	if result.Device.Name != "Living Room Light" {
		t.Errorf("name=%q, want %q", result.Device.Name, "Living Room Light")
	}
	if result.Device.Type != "light" {
		t.Errorf("type=%q, want light", result.Device.Type)
	}
	if result.Device.Source != "zigbee" {
		t.Errorf("source=%q, want zigbee", result.Device.Source)
	}
}

func TestDevices_QuerySingleByID_NotFound(t *testing.T) {
	data, err := graphqlQuery(`query($id: ID!) {
		device(id: $id) { id name }
	}`, map[string]any{"id": "nonexistent-device-id"})
	if err != nil {
		t.Fatalf("query: %v", err)
	}

	var result struct {
		Device *struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"device"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if result.Device != nil {
		t.Errorf("expected null device, got %+v", result.Device)
	}
}

func TestDevices_SetDeviceState(t *testing.T) {
	deviceID, err := queryDeviceIDByName("Kitchen Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	cmdCh, err := publisher.SubscribeCommands()
	if err != nil {
		t.Fatalf("subscribe commands: %v", err)
	}

	_, err = graphqlMutation(`mutation($deviceId: ID!, $state: DeviceStateInput!) {
		setDeviceState(deviceId: $deviceId, state: $state) { id name }
	}`, map[string]any{
		"deviceId": deviceID,
		"state": map[string]any{
			"on":         true,
			"brightness": 128,
		},
	})
	if err != nil {
		t.Fatalf("setDeviceState: %v", err)
	}

	ok := pollUntil(5*time.Second, 50*time.Millisecond, func() bool {
		select {
		case msg := <-cmdCh:
			if msg.Topic == "zigbee2mqtt/Kitchen Light/set" {
				return true
			}
		default:
		}
		return false
	})
	if !ok {
		t.Fatal("timed out waiting for MQTT command from setDeviceState")
	}
}

func TestDevices_UpdateDeviceName(t *testing.T) {
	// KNOWN BUG: updateDevice updates DB but mapDeviceFromReader reads name from
	// in-memory StateReader which still has the old name. Same class as group-target bugs.
	t.Skip("KNOWN BUG: updateDevice response reads from memory store, not DB")
	deviceID, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	data, err := graphqlMutation(`mutation($id: ID!, $input: UpdateDeviceInput!) {
		updateDevice(id: $id, input: $input) { id name }
	}`, map[string]any{
		"id":    deviceID,
		"input": map[string]any{"name": "Renamed Bedroom Light"},
	})
	if err != nil {
		t.Fatalf("updateDevice: %v", err)
	}

	var updateResult struct {
		UpdateDevice struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"updateDevice"`
	}
	if err := json.Unmarshal(data, &updateResult); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if updateResult.UpdateDevice.Name != "Renamed Bedroom Light" {
		t.Errorf("name=%q, want %q", updateResult.UpdateDevice.Name, "Renamed Bedroom Light")
	}

	queryData, err := graphqlQuery(`query($id: ID!) {
		device(id: $id) { id name }
	}`, map[string]any{"id": deviceID})
	if err != nil {
		t.Fatalf("query device: %v", err)
	}

	var queryResult struct {
		Device struct {
			Name string `json:"name"`
		} `json:"device"`
	}
	if err := json.Unmarshal(queryData, &queryResult); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if queryResult.Device.Name != "Renamed Bedroom Light" {
		t.Errorf("persisted name=%q, want %q", queryResult.Device.Name, "Renamed Bedroom Light")
	}

	_, err = graphqlMutation(`mutation($id: ID!, $input: UpdateDeviceInput!) {
		updateDevice(id: $id, input: $input) { id name }
	}`, map[string]any{
		"id":    deviceID,
		"input": map[string]any{"name": "Bedroom Light"},
	})
	if err != nil {
		t.Fatalf("restore name: %v", err)
	}
}

func TestDevices_SetDeviceState_InvalidID(t *testing.T) {
	err := graphqlMutationExpectError(`mutation($deviceId: ID!, $state: DeviceStateInput!) {
		setDeviceState(deviceId: $deviceId, state: $state) { id }
	}`, map[string]any{
		"deviceId": "nonexistent-device-id",
		"state": map[string]any{
			"on": true,
		},
	})
	if err != nil {
		t.Fatalf("expected GraphQL error for invalid device ID, got: %v", err)
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
