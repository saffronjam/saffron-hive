package history

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestRetentionPrunesOlderSamplesFromSetting(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)

	now := time.Now().UTC()
	for _, age := range []time.Duration{72 * time.Hour, 36 * time.Hour, 1 * time.Hour} {
		if _, err := s.InsertStateSample(ctx, store.InsertStateSampleParams{
			DeviceID:     "sensor-1",
			Field:        FieldTemperature,
			NumericValue: device.Ptr(20.0),
			RecordedAt:   now.Add(-age),
		}); err != nil {
			t.Fatalf("insert: %v", err)
		}
	}
	if err := s.UpsertSetting(ctx, RetentionSettingKey, "1"); err != nil {
		t.Fatalf("upsert setting: %v", err)
	}

	PruneOnce(ctx, s)

	points, err := s.QueryStateHistory(ctx, store.StateHistoryQuery{
		DeviceIDs: []device.DeviceID{"sensor-1"},
		From:      now.Add(-96 * time.Hour),
		To:        now.Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(points) != 2 {
		t.Fatalf("expected the pre-cutoff baseline and 1-hour-old sample to survive, got %d", len(points))
	}
}
