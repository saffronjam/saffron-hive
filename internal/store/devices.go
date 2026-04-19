package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// CreateDevice inserts a new device and returns it.
func (s *SQLiteStore) CreateDevice(ctx context.Context, params CreateDeviceParams) (device.Device, error) {
	capsJSON, err := json.Marshal(params.Capabilities)
	if err != nil {
		return device.Device{}, fmt.Errorf("create device: marshal capabilities: %w", err)
	}
	_, err = s.db.ExecContext(ctx,
		`INSERT INTO devices (id, name, source, type, capabilities, available, removed) VALUES (?, ?, ?, ?, ?, false, false)`,
		params.ID, params.Name, params.Source, params.Type, string(capsJSON),
	)
	if err != nil {
		return device.Device{}, fmt.Errorf("create device: %w", err)
	}
	return s.GetDevice(ctx, params.ID)
}

// UpsertDevice inserts a device or updates its name, source, type, and capabilities if it already exists.
// It also clears the removed flag on conflict so re-discovered devices become active again.
func (s *SQLiteStore) UpsertDevice(ctx context.Context, params CreateDeviceParams) error {
	capsJSON, err := json.Marshal(params.Capabilities)
	if err != nil {
		return fmt.Errorf("upsert device: marshal capabilities: %w", err)
	}
	_, err = s.db.ExecContext(ctx,
		`INSERT INTO devices (id, name, source, type, capabilities, available, removed)
		 VALUES (?, ?, ?, ?, ?, false, false)
		 ON CONFLICT(id) DO UPDATE SET name=excluded.name, source=excluded.source, type=excluded.type, capabilities=excluded.capabilities, removed=false`,
		params.ID, params.Name, params.Source, params.Type, string(capsJSON),
	)
	if err != nil {
		return fmt.Errorf("upsert device: %w", err)
	}
	return nil
}

// GetDevice retrieves a device by its ID.
func (s *SQLiteStore) GetDevice(ctx context.Context, id device.DeviceID) (device.Device, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id, name, source, type, capabilities, available, removed, last_seen FROM devices WHERE id = ?`, id,
	)
	return scanDevice(row)
}

// ListDevices returns all devices.
func (s *SQLiteStore) ListDevices(ctx context.Context) ([]device.Device, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name, source, type, capabilities, available, removed, last_seen FROM devices`)
	if err != nil {
		return nil, fmt.Errorf("list devices: %w", err)
	}
	defer func() { _ = rows.Close() }()
	return scanDevices(rows)
}

// ListDevicesBySource returns all devices matching a given source.
func (s *SQLiteStore) ListDevicesBySource(ctx context.Context, source device.Source) ([]device.Device, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, name, source, type, capabilities, available, removed, last_seen FROM devices WHERE source = ?`, source,
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
	var capsJSON string
	err := row.Scan(&d.ID, &d.Name, &d.Source, &d.Type, &capsJSON, &d.Available, &d.Removed, &lastSeen)
	if err != nil {
		return device.Device{}, fmt.Errorf("scan device: %w", err)
	}
	if lastSeen.Valid {
		d.LastSeen = lastSeen.Time
	}
	d.Capabilities = unmarshalCapabilities(capsJSON)
	return d, nil
}

func scanDevices(rows *sql.Rows) ([]device.Device, error) {
	var devices []device.Device
	for rows.Next() {
		var d device.Device
		var lastSeen sql.NullTime
		var capsJSON string
		err := rows.Scan(&d.ID, &d.Name, &d.Source, &d.Type, &capsJSON, &d.Available, &d.Removed, &lastSeen)
		if err != nil {
			return nil, fmt.Errorf("scan device: %w", err)
		}
		if lastSeen.Valid {
			d.LastSeen = lastSeen.Time
		}
		d.Capabilities = unmarshalCapabilities(capsJSON)
		devices = append(devices, d)
	}
	return devices, rows.Err()
}

func unmarshalCapabilities(capsJSON string) []device.Capability {
	if capsJSON == "" || capsJSON == "[]" {
		return nil
	}
	var caps []device.Capability
	if err := json.Unmarshal([]byte(capsJSON), &caps); err == nil {
		return caps
	}
	var legacy []string
	if err := json.Unmarshal([]byte(capsJSON), &legacy); err == nil {
		caps = make([]device.Capability, len(legacy))
		for i, name := range legacy {
			caps[i] = device.Capability{Name: name}
		}
		return caps
	}
	return nil
}
