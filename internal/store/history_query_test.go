package store

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

type historyPlanDB struct {
	*sql.DB
	plans []string
}

func (d *historyPlanDB) QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error) {
	rows, err := d.DB.QueryContext(ctx, "EXPLAIN QUERY PLAN "+query, args...)
	if err != nil {
		return nil, err
	}
	var details []string
	for rows.Next() {
		var id, parent, unused int
		var detail string
		if err := rows.Scan(&id, &parent, &unused, &detail); err != nil {
			_ = rows.Close()
			return nil, err
		}
		details = append(details, detail)
	}
	err = rows.Err()
	_ = rows.Close()
	if err != nil {
		return nil, err
	}
	d.plans = append(d.plans, strings.Join(details, "\n"))
	return d.DB.QueryContext(ctx, query, args...)
}

func TestHistoryUsesDeviceFieldTimeIndex(t *testing.T) {
	for _, bucket := range []int{0, 60} {
		for _, fields := range [][]string{{"temperature"}, {"contact"}, {"temperature", "contact"}, {}} {
			t.Run(fmt.Sprintf("bucket=%d/fields=%v", bucket, fields), func(t *testing.T) {
				s := newTestStore(t)
				probe := &historyPlanDB{DB: s.db}
				s.q = sqlite.New(probe)
				_, err := s.QueryStateHistory(t.Context(), StateHistoryQuery{
					DeviceIDs: []device.DeviceID{"sensor"}, Fields: fields,
					StatefulFields: []string{"contact", "orientation"},
					From:           time.Now().Add(-12 * time.Hour), To: time.Now(), BucketSeconds: bucket,
				})
				if err != nil {
					t.Fatal(err)
				}
				expected := 0
				if len(fields) > 0 {
					expected = 1
					if fields[len(fields)-1] == "contact" {
						expected++
						if bucket > 0 && len(fields) > 1 {
							expected++
						}
					}
				}
				if len(probe.plans) != expected {
					t.Fatalf("executed %d history queries, want %d", len(probe.plans), expected)
				}
				for _, plan := range probe.plans {
					if !strings.Contains(plan, "idx_device_state_samples_device_field_time (device_id=? AND field=? AND recorded_at") {
						t.Fatalf("history must constrain device, field and time in the index:\n%s", plan)
					}
				}
			})
		}
	}
}

func TestHistoryAnchorsAndRawLimit(t *testing.T) {
	s := newTestStore(t)
	seedHistoryDevice(t, s, "sensor")
	base := time.Date(2026, 9, 24, 0, 0, 0, 0, time.UTC)
	for _, sample := range []InsertStateSampleParams{
		{DeviceID: "sensor", Field: "contact", NumericValue: device.Ptr(1.0), RecordedAt: base.Add(-time.Minute)},
		{DeviceID: "sensor", Field: "contact", NumericValue: device.Ptr(0.0), RecordedAt: base.Add(-time.Minute)},
		{DeviceID: "sensor", Field: "temperature", NumericValue: device.Ptr(10.0), RecordedAt: base.Add(-time.Minute)},
		{DeviceID: "sensor", Field: "temperature", NumericValue: device.Ptr(20.0), RecordedAt: base},
		{DeviceID: "sensor", Field: "temperature", NumericValue: device.Ptr(22.0), RecordedAt: base.Add(time.Minute)},
		{DeviceID: "sensor", Field: "orientation", TextValue: device.Ptr("up"), RecordedAt: base.Add(time.Minute)},
		{DeviceID: "sensor", Field: "temperature", NumericValue: device.Ptr(99.0), RecordedAt: base.Add(2 * time.Minute)},
	} {
		if _, err := s.InsertStateSample(t.Context(), sample); err != nil {
			t.Fatal(err)
		}
	}
	q := StateHistoryQuery{
		DeviceIDs:      []device.DeviceID{"sensor", "sensor", "missing"},
		Fields:         []string{"temperature", "contact", "contact", "orientation", "unknown"},
		StatefulFields: []string{"contact", "orientation"}, From: base, To: base.Add(time.Minute),
	}
	points, err := s.QueryStateHistory(t.Context(), q)
	if err != nil {
		t.Fatal(err)
	}
	if len(points) != 4 || points[0].Field != "contact" || !points[0].At.Equal(base) || *points[0].NumericValue != 0 {
		t.Fatalf("expected latest tied anchor and three inclusive range samples: %+v", points)
	}
	q.Limit = 1
	limited, err := s.QueryStateHistory(t.Context(), q)
	if err != nil || len(limited) != 2 || limited[1].Field != "orientation" {
		t.Fatalf("raw limit must apply to range samples, preserving the anchor: %+v, %v", limited, err)
	}
	q.Fields = nil
	points, err = s.QueryStateHistory(t.Context(), q)
	if err != nil || len(points) != 0 {
		t.Fatalf("empty fields must return no points: %+v, %v", points, err)
	}
}

func BenchmarkQueryStateHistory(b *testing.B) {
	for _, retained := range []int{1_000, 50_000, 500_000} {
		b.Run(fmt.Sprintf("retained=%d", retained), func(b *testing.B) {
			s := newTestStore(b)
			seedHistoryDevice(b, s, "sensor")
			base := time.Date(2026, 9, 24, 0, 0, 0, 0, time.UTC)
			tx, err := s.db.BeginTx(b.Context(), nil)
			if err != nil {
				b.Fatal(err)
			}
			defer func() { _ = tx.Rollback() }()
			stmt, err := tx.PrepareContext(b.Context(), "INSERT INTO device_state_samples (device_id, field, numeric_value, recorded_at) VALUES ('sensor', ?, 20, ?)")
			if err != nil {
				b.Fatal(err)
			}
			defer func() { _ = stmt.Close() }()
			for i := 0; i < retained; i++ {
				field := []string{"temperature", "humidity", "battery", "contact"}[i%4]
				if _, err := stmt.ExecContext(b.Context(), field, formatSampleTime(base.Add(-time.Duration(i+1)*time.Minute))); err != nil {
					b.Fatal(err)
				}
			}
			for i := 0; i < 32; i++ {
				for _, field := range []string{"temperature", "humidity"} {
					if _, err := stmt.ExecContext(b.Context(), field, formatSampleTime(base.Add(time.Duration(i)*time.Minute))); err != nil {
						b.Fatal(err)
					}
				}
			}
			if err := tx.Commit(); err != nil {
				b.Fatal(err)
			}
			q := StateHistoryQuery{
				DeviceIDs: []device.DeviceID{"sensor"}, Fields: []string{"temperature", "humidity"},
				StatefulFields: []string{"contact"}, From: base, To: base.Add(12 * time.Hour), BucketSeconds: 60,
			}
			b.ReportAllocs()
			b.ResetTimer()
			for b.Loop() {
				points, err := s.QueryStateHistory(b.Context(), q)
				if err != nil || len(points) != 64 {
					b.Fatalf("query returned %d points: %v", len(points), err)
				}
			}
		})
	}
}
