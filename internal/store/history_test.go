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
		ID:           id,
		FriendlyName: string(id),
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Sensor,
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
		{DeviceID: "sensor-1", Field: "temperature", NumericValue: device.Ptr(20.5), RecordedAt: now},
		{DeviceID: "sensor-1", Field: "humidity", NumericValue: device.Ptr(55.0), RecordedAt: now},
		{DeviceID: "sensor-1", Field: "temperature", NumericValue: device.Ptr(21.0), RecordedAt: now.Add(1 * time.Minute)},
		{DeviceID: "sensor-1", Field: "temperature", NumericValue: device.Ptr(22.0), RecordedAt: now.Add(2 * time.Minute)},
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
		{DeviceID: "sensor-1", Field: "temperature", NumericValue: device.Ptr(20.0), RecordedAt: now},
		{DeviceID: "sensor-1", Field: "humidity", NumericValue: device.Ptr(55.0), RecordedAt: now},
		{DeviceID: "sensor-1", Field: "battery", NumericValue: device.Ptr(88.0), RecordedAt: now},
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
			DeviceID:     "sensor-1",
			Field:        "temperature",
			NumericValue: device.Ptr(v),
			RecordedAt:   base.Add(time.Duration(i) * time.Minute),
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
	if got, want := *points[0].NumericValue, 12.0; got != want {
		t.Errorf("bucket 0 value = %v, want %v", got, want)
	}
	if got, want := *points[1].NumericValue, 42.0; got != want {
		t.Errorf("bucket 1 value = %v, want %v", got, want)
	}
	if !points[0].At.Before(points[1].At) {
		t.Error("bucket start times should be in ascending order")
	}
}

func TestQueryStateHistoryTypedStatefulSeries(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	seedHistoryDevice(t, s, "sensor-1")
	base := time.Now().UTC().Truncate(time.Hour)

	closed := 1.0
	open := 0.0
	up := "up"
	down := "down"
	for _, sample := range []InsertStateSampleParams{
		{DeviceID: "sensor-1", Field: "contact", NumericValue: &closed, RecordedAt: base.Add(-time.Minute), Deduplicate: true},
		{DeviceID: "sensor-1", Field: "contact", NumericValue: &closed, RecordedAt: base.Add(time.Minute), Deduplicate: true},
		{DeviceID: "sensor-1", Field: "contact", NumericValue: &open, RecordedAt: base.Add(2 * time.Minute), Deduplicate: true},
		{DeviceID: "sensor-1", Field: "orientation", TextValue: &up, RecordedAt: base.Add(-time.Minute), Deduplicate: true},
		{DeviceID: "sensor-1", Field: "orientation", TextValue: &down, RecordedAt: base.Add(2 * time.Minute), Deduplicate: true},
	} {
		if _, err := s.InsertStateSample(ctx, sample); err != nil {
			t.Fatal(err)
		}
	}

	points, err := s.QueryStateHistory(ctx, StateHistoryQuery{
		DeviceIDs:      []device.DeviceID{"sensor-1"},
		Fields:         []string{"contact", "orientation"},
		StatefulFields: []string{"contact", "orientation"},
		From:           base,
		To:             base.Add(10 * time.Minute),
		BucketSeconds:  300,
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(points) != 4 {
		t.Fatalf("expected two anchors and two last-in-bucket values, got %d: %+v", len(points), points)
	}
	byField := map[string][]StateHistoryPoint{}
	for _, point := range points {
		byField[point.Field] = append(byField[point.Field], point)
	}
	contacts := byField["contact"]
	if len(contacts) != 2 || !contacts[0].At.Equal(base) || contacts[0].NumericValue == nil || *contacts[0].NumericValue != 1 {
		t.Fatalf("unexpected contact anchor: %+v", contacts)
	}
	if contacts[1].NumericValue == nil || *contacts[1].NumericValue != 0 {
		t.Fatalf("stateful bucket must retain the last contact value: %+v", contacts[1])
	}
	orientations := byField["orientation"]
	if len(orientations) != 2 || orientations[0].TextValue == nil || *orientations[0].TextValue != "up" {
		t.Fatalf("unexpected orientation anchor: %+v", orientations)
	}
	if orientations[1].TextValue == nil || *orientations[1].TextValue != "down" {
		t.Fatalf("stateful bucket must retain the last orientation: %+v", orientations[1])
	}
}

func TestInsertStateSampleDeduplicatesStatefulValues(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	seedHistoryDevice(t, s, "sensor-1")
	base := time.Now().UTC().Truncate(time.Second)
	normal := "normal"
	abnormal := "abnormal"

	first, err := s.InsertStateSample(ctx, InsertStateSampleParams{
		DeviceID: "sensor-1", Field: "devicePosture", TextValue: &normal, RecordedAt: base, Deduplicate: true,
	})
	if err != nil || first == 0 {
		t.Fatalf("insert first state: id=%d err=%v", first, err)
	}
	duplicate, err := s.InsertStateSample(ctx, InsertStateSampleParams{
		DeviceID: "sensor-1", Field: "devicePosture", TextValue: &normal, RecordedAt: base.Add(time.Minute), Deduplicate: true,
	})
	if err != nil || duplicate != 0 {
		t.Fatalf("duplicate state must be skipped: id=%d err=%v", duplicate, err)
	}
	if _, err := s.InsertStateSample(ctx, InsertStateSampleParams{
		DeviceID: "sensor-1", Field: "devicePosture", TextValue: &abnormal, RecordedAt: base.Add(2 * time.Minute), Deduplicate: true,
	}); err != nil {
		t.Fatal(err)
	}

	points, err := s.QueryStateHistory(ctx, StateHistoryQuery{
		DeviceIDs: []device.DeviceID{"sensor-1"},
		Fields:    []string{"devicePosture"},
		From:      base.Add(-time.Minute),
		To:        base.Add(3 * time.Minute),
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(points) != 2 {
		t.Fatalf("expected two transition samples, got %+v", points)
	}
}

func TestPruneDeviceStateSamplesOlderThan(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	seedHistoryDevice(t, s, "sensor-1")

	now := time.Now().UTC()
	for _, age := range []time.Duration{72 * time.Hour, 48 * time.Hour, 12 * time.Hour, 1 * time.Hour} {
		if _, err := s.InsertStateSample(ctx, InsertStateSampleParams{
			DeviceID:     "sensor-1",
			Field:        "temperature",
			NumericValue: device.Ptr(20.0),
			RecordedAt:   now.Add(-age),
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
	if len(remaining) != 3 {
		t.Errorf("expected 3 remaining including the pre-cutoff baseline, got %d", len(remaining))
	}
}

func TestPrunePreservesStatefulBaseline(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	seedHistoryDevice(t, s, "sensor-1")
	now := time.Now().UTC().Truncate(time.Second)
	closed := 1.0
	open := 0.0
	for _, sample := range []InsertStateSampleParams{
		{DeviceID: "sensor-1", Field: "contact", NumericValue: &closed, RecordedAt: now.Add(-72 * time.Hour)},
		{DeviceID: "sensor-1", Field: "contact", NumericValue: &open, RecordedAt: now.Add(-36 * time.Hour)},
	} {
		if _, err := s.InsertStateSample(ctx, sample); err != nil {
			t.Fatal(err)
		}
	}

	cutoff := now.Add(-24 * time.Hour)
	pruned, err := s.PruneDeviceStateSamplesOlderThan(ctx, cutoff)
	if err != nil {
		t.Fatal(err)
	}
	if pruned != 1 {
		t.Fatalf("pruned = %d, want 1", pruned)
	}
	points, err := s.QueryStateHistory(ctx, StateHistoryQuery{
		DeviceIDs:      []device.DeviceID{"sensor-1"},
		Fields:         []string{"contact"},
		StatefulFields: []string{"contact"},
		From:           cutoff,
		To:             now,
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(points) != 1 || !points[0].At.Equal(cutoff) || points[0].NumericValue == nil || *points[0].NumericValue != 0 {
		t.Fatalf("unexpected retained contact baseline: %+v", points)
	}
}
