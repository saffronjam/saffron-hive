package store

import (
	"context"
	"database/sql"
	"fmt"
	"sort"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// formatSampleTime normalises a time to RFC3339Nano UTC so lexicographic
// comparison in SQL matches chronological order. The column stores TEXT;
// mixing formats (or a local timezone label) would break range queries.
func formatSampleTime(t time.Time) string {
	return t.UTC().Format(time.RFC3339Nano)
}

// InsertStateSample persists one device-state field sample and returns its id.
func (s *DB) InsertStateSample(ctx context.Context, params InsertStateSampleParams) (int64, error) {
	if params.Deduplicate {
		latest, err := s.q.LatestStateSample(ctx, sqlite.LatestStateSampleParams{
			DeviceID: params.DeviceID,
			Field:    params.Field,
		})
		if err != nil && !isNoRows(err) {
			return 0, fmt.Errorf("read latest state sample: %w", err)
		}
		if err == nil && sampleValuesEqual(latest.NumericValue, latest.TextValue, params.NumericValue, params.TextValue) {
			return 0, nil
		}
	}
	id, err := s.q.InsertStateSample(ctx, sqlite.InsertStateSampleParams{
		DeviceID:     params.DeviceID,
		Field:        params.Field,
		NumericValue: params.NumericValue,
		TextValue:    params.TextValue,
		RecordedAt:   formatSampleTime(params.RecordedAt),
	})
	if err != nil {
		return 0, fmt.Errorf("insert state sample: %w", err)
	}
	return id, nil
}

func isNoRows(err error) bool {
	return err == sql.ErrNoRows
}

func sampleValuesEqual(aNumber *float64, aText *string, bNumber *float64, bText *string) bool {
	if aNumber != nil || bNumber != nil {
		return aNumber != nil && bNumber != nil && *aNumber == *bNumber
	}
	if aText != nil || bText != nil {
		return aText != nil && bText != nil && *aText == *bText
	}
	return true
}

// QueryStateHistory returns device-state time series. Numeric measurements are
// averaged in fixed-size buckets, while stateful fields retain the last value
// in each bucket and include the value active at the start of the range.
func (s *DB) QueryStateHistory(ctx context.Context, q StateHistoryQuery) ([]StateHistoryPoint, error) {
	if len(q.DeviceIDs) == 0 {
		return nil, nil
	}
	deviceIDs := make([]string, len(q.DeviceIDs))
	for i, id := range q.DeviceIDs {
		deviceIDs[i] = string(id)
	}
	deviceIDsJSON, err := marshalStringArray(deviceIDs)
	if err != nil {
		return nil, fmt.Errorf("marshal device ids: %w", err)
	}
	fieldsJSON, err := marshalStringArray(q.Fields)
	if err != nil {
		return nil, fmt.Errorf("marshal fields: %w", err)
	}
	statefulFieldsJSON, err := marshalStringArray(q.StatefulFields)
	if err != nil {
		return nil, fmt.Errorf("marshal stateful fields: %w", err)
	}
	fromText := formatSampleTime(q.From)
	toText := formatSampleTime(q.To)
	out := make([]StateHistoryPoint, 0, 128)
	if len(q.StatefulFields) > 0 {
		anchors, err := s.q.QueryStateHistoryAnchors(ctx, sqlite.QueryStateHistoryAnchorsParams{
			DeviceIdsJson:      deviceIDsJSON,
			FieldsJson:         fieldsJSON,
			StatefulFieldsJson: statefulFieldsJSON,
			FromTime:           fromText,
		})
		if err != nil {
			return nil, fmt.Errorf("query state history anchors: %w", err)
		}
		for _, row := range anchors {
			out = append(out, StateHistoryPoint{
				DeviceID:     device.DeviceID(row.DeviceID),
				Field:        row.Field,
				At:           q.From,
				NumericValue: row.NumericValue,
				TextValue:    row.TextValue,
			})
		}
	}
	if q.BucketSeconds > 0 {
		numericRows, err := s.q.QueryStateHistoryNumericBucketed(ctx, sqlite.QueryStateHistoryNumericBucketedParams{
			DeviceIdsJson:      deviceIDsJSON,
			FieldsJson:         fieldsJSON,
			StatefulFieldsJson: statefulFieldsJSON,
			FromTime:           fromText,
			ToTime:             toText,
			BucketSeconds:      int64(q.BucketSeconds),
		})
		if err != nil {
			return nil, fmt.Errorf("query numeric state history: %w", err)
		}
		for _, row := range numericRows {
			value := row.BucketValue
			out = append(out, StateHistoryPoint{
				DeviceID:     row.DeviceID,
				Field:        row.Field,
				At:           time.Unix(row.BucketStartUnix, 0).UTC(),
				NumericValue: &value,
			})
		}
		statefulRows, err := s.q.QueryStateHistoryStatefulBucketed(ctx, sqlite.QueryStateHistoryStatefulBucketedParams{
			DeviceIdsJson:      deviceIDsJSON,
			FieldsJson:         fieldsJSON,
			StatefulFieldsJson: statefulFieldsJSON,
			FromTime:           fromText,
			ToTime:             toText,
			BucketSeconds:      int64(q.BucketSeconds),
		})
		if err != nil {
			return nil, fmt.Errorf("query stateful state history: %w", err)
		}
		for _, row := range statefulRows {
			out = append(out, StateHistoryPoint{
				DeviceID:     device.DeviceID(row.DeviceID),
				Field:        row.Field,
				At:           row.RecordedAt,
				NumericValue: row.NumericValue,
				TextValue:    row.TextValue,
			})
		}
		sortStateHistory(out)
		return out, nil
	}
	rows, err := s.q.QueryStateHistoryRaw(ctx, sqlite.QueryStateHistoryRawParams{
		DeviceIdsJson: deviceIDsJSON,
		FieldsJson:    fieldsJSON,
		FromTime:      fromText,
		ToTime:        toText,
		Lim:           int64(q.Limit),
	})
	if err != nil {
		return nil, fmt.Errorf("query state history (raw): %w", err)
	}
	for _, r := range rows {
		out = append(out, StateHistoryPoint{
			DeviceID:     r.DeviceID,
			Field:        r.Field,
			At:           r.RecordedAt,
			NumericValue: r.NumericValue,
			TextValue:    r.TextValue,
		})
	}
	sortStateHistory(out)
	return out, nil
}

func sortStateHistory(points []StateHistoryPoint) {
	sort.SliceStable(points, func(i, j int) bool {
		if points[i].DeviceID != points[j].DeviceID {
			return points[i].DeviceID < points[j].DeviceID
		}
		if points[i].Field != points[j].Field {
			return points[i].Field < points[j].Field
		}
		return points[i].At.Before(points[j].At)
	})
}

// PruneDeviceStateSamplesOlderThan deletes samples older than cutoff while
// retaining one baseline per device and field. It returns the number removed.
func (s *DB) PruneDeviceStateSamplesOlderThan(ctx context.Context, cutoff time.Time) (int64, error) {
	n, err := s.q.PruneDeviceStateSamplesOlderThan(ctx, formatSampleTime(cutoff))
	if err != nil {
		return 0, fmt.Errorf("prune device state samples: %w", err)
	}
	return n, nil
}
