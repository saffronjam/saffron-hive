package graph

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestQueryDevices(t *testing.T) {
	env := newTestEnv(t)
	now := time.Now().Truncate(time.Second)

	env.stateReader.addDevice(device.Device{ID: "d1", Name: "Light 1", Source: "zigbee", Type: device.Light, Available: true, LastSeen: now})
	env.stateReader.addDevice(device.Device{ID: "d2", Name: "Sensor 1", Source: "zigbee", Type: device.Sensor, Available: true, LastSeen: now})
	env.stateReader.addDevice(device.Device{ID: "d3", Name: "Button 1", Source: "zigbee", Type: device.Button, Available: false, LastSeen: now})

	resp := env.query(t, `{ devices { id name type } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		Devices []struct {
			ID   string `json:"id"`
			Name string `json:"name"`
			Type string `json:"type"`
		} `json:"devices"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal data: %v", err)
	}
	if len(data.Devices) != 3 {
		t.Fatalf("expected 3 devices, got %d", len(data.Devices))
	}

	found := make(map[string]bool)
	for _, d := range data.Devices {
		found[d.ID] = true
	}
	for _, id := range []string{"d1", "d2", "d3"} {
		if !found[id] {
			t.Errorf("device %s not found", id)
		}
	}
}

func TestQueryDevice(t *testing.T) {
	env := newTestEnv(t)
	now := time.Now().Truncate(time.Second)

	env.stateReader.addDevice(device.Device{ID: "d1", Name: "Light 1", Source: "zigbee", Type: device.Light, Available: true, LastSeen: now})
	env.stateReader.setDeviceState("d1", &device.DeviceState{
		On:         device.Ptr(true),
		Brightness: device.Ptr(200),
	})

	resp := env.query(t, `query($id: ID!) { device(id: $id) { id name source type available state { on brightness } } }`,
		map[string]any{"id": "d1"})
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		Device struct {
			ID        string `json:"id"`
			Name      string `json:"name"`
			Source    string `json:"source"`
			Type      string `json:"type"`
			Available bool   `json:"available"`
			State     struct {
				On         *bool `json:"on"`
				Brightness *int  `json:"brightness"`
			} `json:"state"`
		} `json:"device"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal data: %v", err)
	}
	if data.Device.ID != "d1" {
		t.Errorf("expected id d1, got %s", data.Device.ID)
	}
	if data.Device.Name != "Light 1" {
		t.Errorf("expected name Light 1, got %s", data.Device.Name)
	}
	if data.Device.Source != "zigbee" {
		t.Errorf("expected source zigbee, got %s", data.Device.Source)
	}
	if data.Device.State.On == nil || !*data.Device.State.On {
		t.Error("expected light on=true")
	}
	if data.Device.State.Brightness == nil || *data.Device.State.Brightness != 200 {
		t.Error("expected brightness 200")
	}
}

func TestQueryDeviceNotFound(t *testing.T) {
	env := newTestEnv(t)
	resp := env.query(t, `query($id: ID!) { device(id: $id) { id } }`, map[string]any{"id": "nonexistent"})
	if len(resp.Errors) > 0 {
		t.Fatalf("expected null result without error, got errors: %v", resp.Errors)
	}
	var data struct {
		Device *struct{ ID string } `json:"device"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if data.Device != nil {
		t.Errorf("expected nil device, got %+v", data.Device)
	}
}

func TestQueryDeviceLightState(t *testing.T) {
	env := newTestEnv(t)
	now := time.Now().Truncate(time.Second)

	env.stateReader.addDevice(device.Device{ID: "l1", Name: "Bulb", Source: "zigbee", Type: device.Light, Available: true, LastSeen: now})
	env.stateReader.setDeviceState("l1", &device.DeviceState{
		On:        device.Ptr(true),
		ColorTemp: device.Ptr(350),
	})

	resp := env.query(t, `{ device(id: "l1") { state { on brightness colorTemp } } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		Device struct {
			State struct {
				On         *bool `json:"on"`
				Brightness *int  `json:"brightness"`
				ColorTemp  *int  `json:"colorTemp"`
			} `json:"state"`
		} `json:"device"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if data.Device.State.On == nil || !*data.Device.State.On {
		t.Error("expected on=true")
	}
	if data.Device.State.Brightness != nil {
		t.Error("expected brightness nil")
	}
	if data.Device.State.ColorTemp == nil || *data.Device.State.ColorTemp != 350 {
		t.Error("expected colorTemp=350")
	}
}

func TestQueryDeviceSensorState(t *testing.T) {
	env := newTestEnv(t)
	now := time.Now().Truncate(time.Second)

	env.stateReader.addDevice(device.Device{ID: "s1", Name: "Temp Sensor", Source: "zigbee", Type: device.Sensor, Available: true, LastSeen: now})
	env.stateReader.setDeviceState("s1", &device.DeviceState{
		Temperature: device.Ptr(22.5),
		Humidity:    device.Ptr(55.0),
	})

	resp := env.query(t, `{ device(id: "s1") { state { temperature humidity battery } } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		Device struct {
			State struct {
				Temperature *float64 `json:"temperature"`
				Humidity    *float64 `json:"humidity"`
				Battery     *int     `json:"battery"`
			} `json:"state"`
		} `json:"device"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if data.Device.State.Temperature == nil || *data.Device.State.Temperature != 22.5 {
		t.Error("expected temperature=22.5")
	}
	if data.Device.State.Humidity == nil || *data.Device.State.Humidity != 55.0 {
		t.Error("expected humidity=55.0")
	}
	if data.Device.State.Battery != nil {
		t.Error("expected battery nil")
	}
}

func TestQueryScenes(t *testing.T) {
	env := newTestEnv(t)
	env.store.scenes["s1"] = store.Scene{ID: "s1", Name: "Evening"}
	env.store.scenes["s2"] = store.Scene{ID: "s2", Name: "Movie"}
	env.store.sceneActions["s1"] = []store.SceneAction{
		{SceneID: "s1", TargetType: "device", TargetID: "d1"},
	}

	resp := env.query(t, `{ scenes { id name actions { targetType targetId } } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		Scenes []struct {
			ID      string `json:"id"`
			Name    string `json:"name"`
			Actions []struct {
				TargetType string `json:"targetType"`
				TargetID   string `json:"targetId"`
			} `json:"actions"`
		} `json:"scenes"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(data.Scenes) != 2 {
		t.Fatalf("expected 2 scenes, got %d", len(data.Scenes))
	}
}

func TestQueryAutomations(t *testing.T) {
	env := newTestEnv(t)
	env.store.automations["a1"] = store.Automation{
		ID:      "a1",
		Name:    "Night mode",
		Enabled: true,
	}

	resp := env.query(t, `{ automations { id name enabled } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		Automations []struct {
			ID      string `json:"id"`
			Name    string `json:"name"`
			Enabled bool   `json:"enabled"`
		} `json:"automations"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(data.Automations) != 1 {
		t.Fatalf("expected 1 automation, got %d", len(data.Automations))
	}
	a := data.Automations[0]
	if a.ID != "a1" || a.Name != "Night mode" || !a.Enabled {
		t.Errorf("unexpected automation payload: %+v", a)
	}
}

func TestQueryStateHistory(t *testing.T) {
	env := newTestEnv(t)
	now := time.Now().UTC().Truncate(time.Second)

	for i := 0; i < 10; i++ {
		env.store.stateSamples = append(env.store.stateSamples, store.StateHistoryPoint{
			DeviceID: "s1",
			Field:    "temperature",
			At:       now.Add(time.Duration(i) * time.Minute),
			Value:    20.0 + float64(i),
		})
		env.store.stateSamples = append(env.store.stateSamples, store.StateHistoryPoint{
			DeviceID: "s1",
			Field:    "humidity",
			At:       now.Add(time.Duration(i) * time.Minute),
			Value:    40.0 + float64(i),
		})
	}

	from := now
	to := now.Add(9 * time.Minute)
	resp := env.query(t, `query($filter: StateHistoryFilter!) { stateHistory(filter: $filter) { deviceId field points { at value } } }`,
		map[string]any{
			"filter": map[string]any{
				"deviceIds": []string{"s1"},
				"fields":    []string{"temperature"},
				"from":      from.Format(time.RFC3339),
				"to":        to.Format(time.RFC3339),
			},
		})
	if len(resp.Errors) > 0 {
		t.Fatalf("unexpected errors: %v", resp.Errors)
	}

	var data struct {
		StateHistory []struct {
			DeviceID string `json:"deviceId"`
			Field    string `json:"field"`
			Points   []struct {
				At    string  `json:"at"`
				Value float64 `json:"value"`
			} `json:"points"`
		} `json:"stateHistory"`
	}
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(data.StateHistory) != 1 {
		t.Fatalf("expected 1 series (temperature only), got %d", len(data.StateHistory))
	}
	series := data.StateHistory[0]
	if series.DeviceID != "s1" || series.Field != "temperature" {
		t.Errorf("unexpected series key: %+v", series)
	}
	if len(series.Points) != 10 {
		t.Errorf("expected 10 points, got %d", len(series.Points))
	}
}
