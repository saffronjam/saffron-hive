package store

import (
	"context"
	"database/sql"
	"fmt"
)

// InsertSensorReading inserts a sensor reading and returns it with the generated ID.
func (s *SQLiteStore) InsertSensorReading(ctx context.Context, params InsertSensorReadingParams) (SensorReading, error) {
	result, err := s.db.ExecContext(ctx,
		`INSERT INTO sensor_history (device_id, temperature, humidity, battery, pressure, illuminance, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
		params.DeviceID, params.Temperature, params.Humidity, params.Battery, params.Pressure, params.Illuminance, params.RecordedAt,
	)
	if err != nil {
		return SensorReading{}, fmt.Errorf("insert sensor reading: %w", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		return SensorReading{}, fmt.Errorf("insert sensor reading last id: %w", err)
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
func (s *SQLiteStore) QuerySensorHistory(ctx context.Context, query SensorHistoryQuery) ([]SensorReading, error) {
	q := `SELECT id, device_id, temperature, humidity, battery, pressure, illuminance, recorded_at FROM sensor_history WHERE device_id = ? AND recorded_at >= ? AND recorded_at <= ? ORDER BY recorded_at DESC`
	args := []interface{}{query.DeviceID, query.From, query.To}
	if query.Limit > 0 {
		q += ` LIMIT ?`
		args = append(args, query.Limit)
	}
	rows, err := s.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("query sensor history: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var readings []SensorReading
	for rows.Next() {
		var r SensorReading
		var temp, hum, pres, illu sql.NullFloat64
		var bat sql.NullInt64
		if err := rows.Scan(&r.ID, &r.DeviceID, &temp, &hum, &bat, &pres, &illu, &r.RecordedAt); err != nil {
			return nil, fmt.Errorf("scan sensor reading: %w", err)
		}
		if temp.Valid {
			r.Temperature = &temp.Float64
		}
		if hum.Valid {
			r.Humidity = &hum.Float64
		}
		if bat.Valid {
			v := int(bat.Int64)
			r.Battery = &v
		}
		if pres.Valid {
			r.Pressure = &pres.Float64
		}
		if illu.Valid {
			r.Illuminance = &illu.Float64
		}
		readings = append(readings, r)
	}
	return readings, rows.Err()
}
