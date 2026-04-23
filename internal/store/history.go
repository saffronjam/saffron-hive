package store

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// sqliteBucketTimeFormats are the textual forms the driver may return when a
// TIMESTAMP column is scanned into a string. modernc.org/sqlite re-serialises
// MIN()/AVG()/etc. on TIMESTAMP columns through time.Time, which stringifies
// as "2006-01-02 15:04:05 -0700 MST"; direct reads come back as RFC 3339.
// Both are accepted here so the parser doesn't depend on SQL form.
var sqliteBucketTimeFormats = []string{
	"2006-01-02 15:04:05.999999999 -0700 MST",
	"2006-01-02 15:04:05 -0700 MST",
	time.RFC3339Nano,
	time.RFC3339,
	"2006-01-02T15:04:05",
	"2006-01-02 15:04:05",
}

func parseBucketTime(s string) (time.Time, error) {
	// time.Time.String() appends " m=±value" when the source time carries a
	// monotonic-clock reading. It isn't part of any parseable layout, so drop it.
	if i := strings.Index(s, " m=+"); i != -1 {
		s = s[:i]
	} else if i := strings.Index(s, " m=-"); i != -1 {
		s = s[:i]
	}
	for _, f := range sqliteBucketTimeFormats {
		if t, err := time.Parse(f, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("unrecognised bucket time %q", s)
}

// InsertStateSample persists one device-state field sample and returns its id.
func (s *DB) InsertStateSample(ctx context.Context, params InsertStateSampleParams) (int64, error) {
	id, err := s.q.InsertStateSample(ctx, sqlite.InsertStateSampleParams{
		DeviceID:   params.DeviceID,
		Field:      params.Field,
		Value:      params.Value,
		RecordedAt: params.RecordedAt,
	})
	if err != nil {
		return 0, fmt.Errorf("insert state sample: %w", err)
	}
	return id, nil
}

// QueryStateHistory returns device-state time series. When q.BucketSeconds > 0
// values are averaged into fixed-size buckets and each bucket's timestamp is
// the earliest sample in that bucket; when 0, raw samples are returned.
func (s *DB) QueryStateHistory(ctx context.Context, q StateHistoryQuery) ([]StateHistoryPoint, error) {
	if len(q.DeviceIDs) == 0 {
		return nil, nil
	}
	deviceIDs := make([]string, len(q.DeviceIDs))
	for i, id := range q.DeviceIDs {
		deviceIDs[i] = string(id)
	}
	deviceIDsJSON, err := json.Marshal(deviceIDs)
	if err != nil {
		return nil, fmt.Errorf("marshal device ids: %w", err)
	}
	fieldsJSON, err := json.Marshal(append([]string(nil), q.Fields...))
	if err != nil {
		return nil, fmt.Errorf("marshal fields: %w", err)
	}
	if q.BucketSeconds > 0 {
		rows, err := s.q.QueryStateHistoryBucketed(ctx, sqlite.QueryStateHistoryBucketedParams{
			BucketSeconds: int64(q.BucketSeconds),
			DeviceIdsJson: string(deviceIDsJSON),
			FieldsJson:    string(fieldsJSON),
			FromTime:      q.From,
			ToTime:        q.To,
		})
		if err != nil {
			return nil, fmt.Errorf("query state history (bucketed): %w", err)
		}
		out := make([]StateHistoryPoint, 0, len(rows))
		for _, r := range rows {
			at, err := parseBucketTime(r.BucketStart)
			if err != nil {
				return nil, fmt.Errorf("parse bucket start: %w", err)
			}
			out = append(out, StateHistoryPoint{
				DeviceID: r.DeviceID,
				Field:    r.Field,
				At:       at,
				Value:    r.BucketValue,
			})
		}
		return out, nil
	}
	rows, err := s.q.QueryStateHistoryRaw(ctx, sqlite.QueryStateHistoryRawParams{
		DeviceIdsJson: string(deviceIDsJSON),
		FieldsJson:    string(fieldsJSON),
		FromTime:      q.From,
		ToTime:        q.To,
		Lim:           int64(q.Limit),
	})
	if err != nil {
		return nil, fmt.Errorf("query state history (raw): %w", err)
	}
	out := make([]StateHistoryPoint, 0, len(rows))
	for _, r := range rows {
		out = append(out, StateHistoryPoint{
			DeviceID: r.DeviceID,
			Field:    r.Field,
			At:       r.RecordedAt,
			Value:    r.Value,
		})
	}
	return out, nil
}

// PruneDeviceStateSamplesOlderThan deletes samples older than cutoff and returns
// the number of rows removed.
func (s *DB) PruneDeviceStateSamplesOlderThan(ctx context.Context, cutoff time.Time) (int64, error) {
	n, err := s.q.PruneDeviceStateSamplesOlderThan(ctx, cutoff)
	if err != nil {
		return 0, fmt.Errorf("prune device state samples: %w", err)
	}
	return n, nil
}
