package store

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func seedHistoryDevice(t *testing.T, s *DB, id device.DeviceID) {
	t.Helper()
	if _, err := s.CreateDevice(context.Background(), CreateDeviceParams{
		ID:     id,
		Name:   string(id),
		Source: "zigbee",
		Type:   device.Sensor,
	}); err != nil {
		t.Fatalf("seed device: %v", err)
	}
}

func TestInsertStateSampleAndQueryRaw(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	seedHistoryDevice(t, s, "sensor-1")

	now := time.Now().UTC().Truncate(time.Second)
	samples := []InsertStateSampleParams{
		{DeviceID: "sensor-1", Field: "temperature", Value: 20.5, RecordedAt: now},
		{DeviceID: "sensor-1", Field: "humidity", Value: 55.0, RecordedAt: now},
		{DeviceID: "sensor-1", Field: "temperature", Value: 21.0, RecordedAt: now.Add(1 * time.Minute)},
		{DeviceID: "sensor-1", Field: "temperature", Value: 22.0, RecordedAt: now.Add(2 * time.Minute)},
	}
	for _, p := range samples {
		if _, err := s.InsertStateSample(ctx, p); err != nil {
			t.Fatalf("insert sample %+v: %v", p, err)
		}
	}

	points, err := s.QueryStateHistory(ctx, StateHistoryQuery{
		DeviceIDs: []device.DeviceID{"sensor-1"},
		Fields:    []string{"temperature"},
		From:      now.Add(-time.Hour),
		To:        now.Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(points) != 3 {
		t.Fatalf("expected 3 temperature points, got %d", len(points))
	}
	for i := range points {
		if points[i].Field != "temperature" {
			t.Errorf("point %d field = %q, want temperature", i, points[i].Field)
		}
		if i > 0 && !points[i].At.After(points[i-1].At) {
			t.Errorf("points not ordered ascending by time: %v then %v", points[i-1].At, points[i].At)
		}
	}
}

func TestQueryStateHistoryEmptyFieldsMatchesAll(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	seedHistoryDevice(t, s, "sensor-1")

	now := time.Now().UTC().Truncate(time.Second)
	for _, p := range []InsertStateSampleParams{
		{DeviceID: "sensor-1", Field: "temperature", Value: 20, RecordedAt: now},
		{DeviceID: "sensor-1", Field: "humidity", Value: 55, RecordedAt: now},
		{DeviceID: "sensor-1", Field: "battery", Value: 88, RecordedAt: now},
	} {
		if _, err := s.InsertStateSample(ctx, p); err != nil {
			t.Fatalf("insert: %v", err)
		}
	}

	points, err := s.QueryStateHistory(ctx, StateHistoryQuery{
		DeviceIDs: []device.DeviceID{"sensor-1"},
		From:      now.Add(-time.Hour),
		To:        now.Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(points) != 3 {
		t.Fatalf("expected 3 points across all fields, got %d", len(points))
	}
	seenFields := map[string]bool{}
	for _, p := range points {
		seenFields[p.Field] = true
	}
	for _, want := range []string{"temperature", "humidity", "battery"} {
		if !seenFields[want] {
			t.Errorf("missing field %q in result", want)
		}
	}
}

func TestQueryStateHistoryBucketed(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	seedHistoryDevice(t, s, "sensor-1")

	base := time.Now().UTC().Truncate(time.Hour)
	values := []float64{10, 12, 14, 40, 42, 44}
	for i, v := range values {
		if _, err := s.InsertStateSample(ctx, InsertStateSampleParams{
			DeviceID:   "sensor-1",
			Field:      "temperature",
			Value:      v,
			RecordedAt: base.Add(time.Duration(i) * time.Minute),
		}); err != nil {
			t.Fatalf("insert: %v", err)
		}
	}

	points, err := s.QueryStateHistory(ctx, StateHistoryQuery{
		DeviceIDs:     []device.DeviceID{"sensor-1"},
		Fields:        []string{"temperature"},
		From:          base.Add(-time.Hour),
		To:            base.Add(time.Hour),
		BucketSeconds: 180,
	})
	if err != nil {
		t.Fatalf("query bucketed: %v", err)
	}
	if len(points) != 2 {
		t.Fatalf("expected 2 buckets (3min each), got %d (%+v)", len(points), points)
	}
	if got, want := points[0].Value, 12.0; got != want {
		t.Errorf("bucket 0 value = %v, want %v", got, want)
	}
	if got, want := points[1].Value, 42.0; got != want {
		t.Errorf("bucket 1 value = %v, want %v", got, want)
	}
	if !points[0].At.Before(points[1].At) {
		t.Error("bucket start times should be in ascending order")
	}
}

func TestPruneDeviceStateSamplesOlderThan(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	seedHistoryDevice(t, s, "sensor-1")

	now := time.Now().UTC()
	for _, age := range []time.Duration{48 * time.Hour, 12 * time.Hour, 1 * time.Hour} {
		if _, err := s.InsertStateSample(ctx, InsertStateSampleParams{
			DeviceID:   "sensor-1",
			Field:      "temperature",
			Value:      20,
			RecordedAt: now.Add(-age),
		}); err != nil {
			t.Fatalf("insert: %v", err)
		}
	}

	n, err := s.PruneDeviceStateSamplesOlderThan(ctx, now.Add(-24*time.Hour))
	if err != nil {
		t.Fatalf("prune: %v", err)
	}
	if n != 1 {
		t.Errorf("pruned = %d, want 1", n)
	}

	remaining, err := s.QueryStateHistory(ctx, StateHistoryQuery{
		DeviceIDs: []device.DeviceID{"sensor-1"},
		From:      now.Add(-72 * time.Hour),
		To:        now.Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(remaining) != 2 {
		t.Errorf("expected 2 remaining, got %d", len(remaining))
	}
}
