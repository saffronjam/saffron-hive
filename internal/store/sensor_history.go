package store

import (
	"context"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// InsertSensorReading inserts a sensor reading and returns it with the generated ID.
func (s *DB) InsertSensorReading(ctx context.Context, params InsertSensorReadingParams) (SensorReading, error) {
	id, err := s.q.InsertSensorReading(ctx, sqlite.InsertSensorReadingParams{
		DeviceID:    params.DeviceID,
		Temperature: params.Temperature,
		Humidity:    params.Humidity,
		Battery:     intPtrToInt64Ptr(params.Battery),
		Pressure:    params.Pressure,
		Illuminance: params.Illuminance,
		RecordedAt:  params.RecordedAt,
	})
	if err != nil {
		return SensorReading{}, fmt.Errorf("insert sensor reading: %w", err)
	}
	return SensorReading{
		ID:          id,
		DeviceID:    params.DeviceID,
		Temperature: params.Temperature,
		Humidity:    params.Humidity,
		Battery:     params.Battery,
		Pressure:    params.Pressure,
		Illuminance: params.Illuminance,
		RecordedAt:  params.RecordedAt,
	}, nil
}

// QuerySensorHistory returns sensor readings for a device within a time range, ordered by most recent first.
func (s *DB) QuerySensorHistory(ctx context.Context, query SensorHistoryQuery) ([]SensorReading, error) {
	rows, err := s.q.QuerySensorHistory(ctx, sqlite.QuerySensorHistoryParams{
		DeviceID: query.DeviceID,
		FromTime: query.From,
		ToTime:   query.To,
		Lim:      int64(query.Limit),
	})
	if err != nil {
		return nil, fmt.Errorf("query sensor history: %w", err)
	}
	var readings []SensorReading
	for _, r := range rows {
		readings = append(readings, SensorReading{
			ID:          r.ID,
			DeviceID:    r.DeviceID,
			Temperature: r.Temperature,
			Humidity:    r.Humidity,
			Battery:     int64PtrToIntPtr(r.Battery),
			Pressure:    r.Pressure,
			Illuminance: r.Illuminance,
			RecordedAt:  r.RecordedAt,
		})
	}
	return readings, nil
}

func intPtrToInt64Ptr(p *int) *int64 {
	if p == nil {
		return nil
	}
	v := int64(*p)
	return &v
}

func int64PtrToIntPtr(p *int64) *int {
	if p == nil {
		return nil
	}
	v := int(*p)
	return &v
}
