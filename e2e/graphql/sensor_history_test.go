//go:build e2e

package graphql_test

import (
	"encoding/json"
	"testing"
	"time"
)

func TestSensorHistory_QueryAfterPublish(t *testing.T) {
	sensorID, err := queryDeviceIDByName("Living Room Sensor")
	if err != nil {
		t.Fatalf("find sensor: %v", err)
	}

	sensorPayload, _ := json.Marshal(map[string]float64{
		"temperature": 23.5,
		"humidity":    48.0,
		"battery":     92,
	})
	if err := publisher.PublishDeviceState("Living Room Sensor", sensorPayload); err != nil {
		t.Fatalf("publish sensor state: %v", err)
	}

	ok := pollUntil(5*time.Second, 200*time.Millisecond, func() bool {
		data, qErr := graphqlQuery(`query($deviceId: ID!) {
			sensorHistory(deviceId: $deviceId, limit: 10) {
				id
				deviceId
				temperature
				humidity
				battery
				recordedAt
			}
		}`, map[string]any{"deviceId": sensorID})
		if qErr != nil {
			return false
		}

		var result struct {
			SensorHistory []struct {
				ID          string   `json:"id"`
				DeviceID    string   `json:"deviceId"`
				Temperature *float64 `json:"temperature"`
				Humidity    *float64 `json:"humidity"`
				Battery     *int     `json:"battery"`
				RecordedAt  string   `json:"recordedAt"`
			} `json:"sensorHistory"`
		}
		if json.Unmarshal(data, &result) != nil {
			return false
		}

		for _, reading := range result.SensorHistory {
			if reading.Temperature != nil && *reading.Temperature == 23.5 {
				return true
			}
		}
		return false
	})

	if !ok {
		t.Logf("sensor history did not contain the published reading within timeout — auto-recording may not be wired")
		data, _ := graphqlQuery(`query($deviceId: ID!) {
			sensorHistory(deviceId: $deviceId, limit: 10) { id temperature }
		}`, map[string]any{"deviceId": sensorID})
		t.Logf("final sensorHistory response: %s", string(data))
		t.Fatal("timed out waiting for sensor history to record published data")
	}
}

func TestSensorHistory_EmptyForNonSensor(t *testing.T) {
	lightID, err := queryDeviceIDByName("Living Room Light")
	if err != nil {
		t.Fatalf("find light: %v", err)
	}

	data, err := graphqlQuery(`query($deviceId: ID!) {
		sensorHistory(deviceId: $deviceId, limit: 10) {
			id
			deviceId
			temperature
		}
	}`, map[string]any{"deviceId": lightID})
	if err != nil {
		t.Fatalf("query: %v", err)
	}

	var result struct {
		SensorHistory []struct {
			ID string `json:"id"`
		} `json:"sensorHistory"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(result.SensorHistory) != 0 {
		t.Errorf("expected empty sensor history for light device, got %d readings", len(result.SensorHistory))
	}
}
