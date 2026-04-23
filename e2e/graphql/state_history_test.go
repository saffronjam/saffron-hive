//go:build e2e

package graphql_test

import (
	"encoding/json"
	"testing"
	"time"
)

type stateSeriesResponse struct {
	StateHistory []struct {
		DeviceID string `json:"deviceId"`
		Field    string `json:"field"`
		Points   []struct {
			At    string  `json:"at"`
			Value float64 `json:"value"`
		} `json:"points"`
	} `json:"stateHistory"`
}

func TestStateHistory_FansOutPerField(t *testing.T) {
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

	var last stateSeriesResponse
	var lastRaw []byte
	ok := pollUntil(5*time.Second, 200*time.Millisecond, func() bool {
		data, qErr := graphqlQuery(`query($filter: StateHistoryFilter!) {
			stateHistory(filter: $filter) { deviceId field points { at value } }
		}`, map[string]any{
			"filter": map[string]any{
				"deviceIds": []string{sensorID},
			},
		})
		if qErr != nil {
			return false
		}
		lastRaw = data
		last = stateSeriesResponse{}
		if json.Unmarshal(data, &last) != nil {
			return false
		}
		return len(last.StateHistory) >= 3
	})

	if !ok {
		t.Fatalf("timed out waiting for temperature/humidity/battery series; deviceId=%s last=%s", sensorID, string(lastRaw))
	}
	found := map[string]bool{}
	for _, s := range last.StateHistory {
		found[s.Field] = true
	}
	for _, want := range []string{"temperature", "humidity", "battery"} {
		if !found[want] {
			t.Errorf("expected series for field %q (got %v)", want, last.StateHistory)
		}
	}
}

func TestStateHistory_EmptyForUnknownDevice(t *testing.T) {
	data, err := graphqlQuery(`query($filter: StateHistoryFilter!) {
		stateHistory(filter: $filter) { deviceId field }
	}`, map[string]any{
		"filter": map[string]any{
			"deviceIds": []string{"not-a-real-device-id"},
		},
	})
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	var result stateSeriesResponse
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(result.StateHistory) != 0 {
		t.Errorf("expected 0 series, got %d", len(result.StateHistory))
	}
}

func TestStateHistoryFields_ReturnsFullList(t *testing.T) {
	data, err := graphqlQuery(`query { stateHistoryFields }`, nil)
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	var result struct {
		StateHistoryFields []string `json:"stateHistoryFields"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	for _, want := range []string{"on", "brightness", "temperature", "humidity", "battery", "power"} {
		seen := false
		for _, f := range result.StateHistoryFields {
			if f == want {
				seen = true
				break
			}
		}
		if !seen {
			t.Errorf("expected %q in stateHistoryFields, got %v", want, result.StateHistoryFields)
		}
	}
}
