package graph

import (
	"encoding/json"
	"slices"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestHistoryFieldSelection(t *testing.T) {
	for _, aggregated := range []bool{false, true} {
		for _, tc := range []struct {
			name   string
			fields []string
			want   []string
		}{
			{"omitted", nil, []string{"contact", "orientation", "temperature"}},
			{"empty", []string{}, []string{"contact", "orientation", "temperature"}},
			{"invalid", []string{"unknown"}, []string{}},
			{"mixed", []string{"unknown", "temperature", "contact", "temperature"}, []string{"contact", "temperature"}},
		} {
			name := tc.name
			if aggregated {
				name = "aggregated/" + name
			}
			t.Run(name, func(t *testing.T) {
				env := newTestEnv(t)
				env.stateReader.addDevice(device.Device{ID: "sensor", Type: device.Sensor})
				now := time.Now().UTC().Truncate(time.Second)
				env.store.stateSamples = []store.StateHistoryPoint{
					{DeviceID: "sensor", Field: "temperature", NumericValue: device.Ptr(20.0), At: now},
					{DeviceID: "sensor", Field: "contact", NumericValue: device.Ptr(0.0), At: now},
					{DeviceID: "sensor", Field: "orientation", TextValue: device.Ptr("up"), At: now},
					{DeviceID: "sensor", Field: "unknown", NumericValue: device.Ptr(99.0), At: now},
				}
				filter := map[string]any{
					"from": now.Add(-time.Minute).Format(time.RFC3339),
					"to":   now.Add(time.Minute).Format(time.RFC3339),
				}
				if tc.fields != nil {
					filter["fields"] = tc.fields
				}
				query := `query($filter: StateHistoryFilter!) { series: stateHistory(filter: $filter) { field } }`
				want := tc.want
				if aggregated {
					query = `query($filter: AggregatedStateHistoryFilter!) { series: aggregatedStateHistory(filter: $filter) { field } }`
					filter["target"] = map[string]string{"type": "APARTMENT"}
					want = []string{}
					if slices.Contains(tc.want, "temperature") {
						want = []string{"temperature"}
					}
				} else {
					filter["deviceIds"] = []string{"sensor"}
				}
				resp := env.query(t, query, map[string]any{"filter": filter})
				if len(resp.Errors) != 0 {
					t.Fatal(resp.Errors)
				}
				var data struct {
					Series []struct{ Field string }
				}
				if err := json.Unmarshal(resp.Data, &data); err != nil {
					t.Fatal(err)
				}
				got := make([]string, 0, len(data.Series))
				for _, series := range data.Series {
					got = append(got, series.Field)
				}
				slices.Sort(got)
				if !slices.Equal(got, want) {
					t.Fatalf("fields = %v, want %v", got, want)
				}
			})
		}
	}
}
