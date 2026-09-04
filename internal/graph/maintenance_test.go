package graph

import (
	"encoding/json"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestMaintenanceQueryAndCompletion(t *testing.T) {
	env := newTestEnv(t)
	battery := 20.0
	found := device.Device{ID: "sensor-1", FriendlyName: "Sensor", Source: device.SourceZigbee2MQTT, Type: device.Sensor}
	env.stateReader.addDevice(found)
	env.stateReader.setDeviceState(found.ID, &device.DeviceState{Battery: &battery})
	if err := env.resolver.Maintenance.Evaluate(t.Context()); err != nil {
		t.Fatal(err)
	}

	response := env.query(t, `{ maintenanceTasks { id kind value actionUrl device { id friendlyName } } }`, nil)
	if len(response.Errors) != 0 {
		t.Fatalf("query errors: %+v", response.Errors)
	}
	var body struct {
		MaintenanceTasks []struct {
			ID     string `json:"id"`
			Kind   string `json:"kind"`
			Device struct {
				ID string `json:"id"`
			} `json:"device"`
		} `json:"maintenanceTasks"`
	}
	if err := json.Unmarshal(response.Data, &body); err != nil {
		t.Fatal(err)
	}
	if len(body.MaintenanceTasks) != 1 || body.MaintenanceTasks[0].Kind != "BATTERY" || body.MaintenanceTasks[0].Device.ID != "sensor-1" {
		t.Fatalf("tasks = %+v", body.MaintenanceTasks)
	}

	response = env.query(t, `mutation($ids: [ID!]!) { completeMaintenanceTasks(ids: $ids) }`, map[string]any{
		"ids": []string{body.MaintenanceTasks[0].ID, "stale"},
	})
	if len(response.Errors) != 0 {
		t.Fatalf("mutation errors: %+v", response.Errors)
	}
	if string(response.Data) == "" {
		t.Fatal("empty mutation response")
	}
	response = env.query(t, `{ maintenanceTasks { id } }`, nil)
	if string(response.Data) != `{"maintenanceTasks":[]}` {
		t.Fatalf("tasks after completion = %s", response.Data)
	}
}
