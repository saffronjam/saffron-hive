package store

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// CreateDevice inserts a new device and returns it.
func (s *SQLiteStore) CreateDevice(ctx context.Context, params CreateDeviceParams) (device.Device, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO devices (id, name, source, type, available, removed) VALUES (?, ?, ?, ?, false, false)`,
		params.ID, params.Name, params.Source, params.Type,
	)
	if err != nil {
		return device.Device{}, fmt.Errorf("create device: %w", err)
	}
	return s.GetDevice(ctx, params.ID)
}

// GetDevice retrieves a device by its ID.
func (s *SQLiteStore) GetDevice(ctx context.Context, id device.DeviceID) (device.Device, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id, name, source, type, available, removed, last_seen FROM devices WHERE id = ?`, id,
	)
	return scanDevice(row)
}

// ListDevices returns all devices.
func (s *SQLiteStore) ListDevices(ctx context.Context) ([]device.Device, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name, source, type, available, removed, last_seen FROM devices`)
	if err != nil {
		return nil, fmt.Errorf("list devices: %w", err)
	}
	defer func() { _ = rows.Close() }()
	return scanDevices(rows)
}

// ListDevicesBySource returns all devices matching a given source.
func (s *SQLiteStore) ListDevicesBySource(ctx context.Context, source device.Source) ([]device.Device, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, name, source, type, available, removed, last_seen FROM devices WHERE source = ?`, source,
	)
	if err != nil {
		return nil, fmt.Errorf("list devices by source: %w", err)
	}
	defer func() { _ = rows.Close() }()
	return scanDevices(rows)
}

// UpdateDevice updates a device's mutable fields and returns the updated device.
func (s *SQLiteStore) UpdateDevice(ctx context.Context, params UpdateDeviceParams) (device.Device, error) {
	_, err := s.db.ExecContext(ctx,
		`UPDATE devices SET name = ?, available = ?, removed = ?, last_seen = ? WHERE id = ?`,
		params.Name, params.Available, params.Removed, params.LastSeen, params.ID,
	)
	if err != nil {
		return device.Device{}, fmt.Errorf("update device: %w", err)
	}
	return s.GetDevice(ctx, params.ID)
}

// DeleteDevice deletes a device by its ID.
func (s *SQLiteStore) DeleteDevice(ctx context.Context, id device.DeviceID) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM devices WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete device: %w", err)
	}
	return nil
}

func scanDevice(row *sql.Row) (device.Device, error) {
	var d device.Device
	var lastSeen sql.NullTime
	err := row.Scan(&d.ID, &d.Name, &d.Source, &d.Type, &d.Available, &d.Removed, &lastSeen)
	if err != nil {
		return device.Device{}, fmt.Errorf("scan device: %w", err)
	}
	if lastSeen.Valid {
		d.LastSeen = lastSeen.Time
	}
	return d, nil
}

func scanDevices(rows *sql.Rows) ([]device.Device, error) {
	var devices []device.Device
	for rows.Next() {
		var d device.Device
		var lastSeen sql.NullTime
		err := rows.Scan(&d.ID, &d.Name, &d.Source, &d.Type, &d.Available, &d.Removed, &lastSeen)
		if err != nil {
			return nil, fmt.Errorf("scan device: %w", err)
		}
		if lastSeen.Valid {
			d.LastSeen = lastSeen.Time
		}
		devices = append(devices, d)
	}
	return devices, rows.Err()
}
