package store

import (
	"context"
	"fmt"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// CreateDevice inserts a new device and returns it.
func (s *DB) CreateDevice(ctx context.Context, params CreateDeviceParams) (device.Device, error) {
	capsJSON, err := marshalCapabilities(params.Capabilities)
	if err != nil {
		return device.Device{}, fmt.Errorf("create device: %w", err)
	}
	if err := s.q.CreateDevice(ctx, sqlite.CreateDeviceParams{
		ID:           params.ID,
		Name:         params.Name,
		Source:       params.Source,
		Type:         params.Type,
		Capabilities: capsJSON,
	}); err != nil {
		return device.Device{}, fmt.Errorf("create device: %w", err)
	}
	return s.GetDevice(ctx, params.ID)
}

// UpsertDevice inserts a device or updates its name, source, type, and capabilities if it already exists.
// It also clears the removed flag on conflict so re-discovered devices become active again.
func (s *DB) UpsertDevice(ctx context.Context, params CreateDeviceParams) error {
	capsJSON, err := marshalCapabilities(params.Capabilities)
	if err != nil {
		return fmt.Errorf("upsert device: %w", err)
	}
	if err := s.q.UpsertDevice(ctx, sqlite.UpsertDeviceParams{
		ID:           params.ID,
		Name:         params.Name,
		Source:       params.Source,
		Type:         params.Type,
		Capabilities: capsJSON,
	}); err != nil {
		return fmt.Errorf("upsert device: %w", err)
	}
	return nil
}

// GetDevice retrieves a device by its ID.
func (s *DB) GetDevice(ctx context.Context, id device.DeviceID) (device.Device, error) {
	row, err := s.q.GetDevice(ctx, id)
	if err != nil {
		return device.Device{}, fmt.Errorf("get device: %w", err)
	}
	return device.Device{
		ID:           row.ID,
		Name:         row.Name,
		Source:       row.Source,
		Type:         row.Type,
		Capabilities: unmarshalCapabilities(row.Capabilities),
		Available:    row.Available,
		Removed:      row.Removed,
		LastSeen:     derefTime(row.LastSeen),
	}, nil
}

// ListDevices returns all devices.
func (s *DB) ListDevices(ctx context.Context) ([]device.Device, error) {
	rows, err := s.q.ListDevices(ctx)
	if err != nil {
		return nil, fmt.Errorf("list devices: %w", err)
	}
	var devices []device.Device
	for _, r := range rows {
		devices = append(devices, device.Device{
			ID:           r.ID,
			Name:         r.Name,
			Source:       r.Source,
			Type:         r.Type,
			Capabilities: unmarshalCapabilities(r.Capabilities),
			Available:    r.Available,
			Removed:      r.Removed,
			LastSeen:     derefTime(r.LastSeen),
		})
	}
	return devices, nil
}

// ListDevicesBySource returns all devices matching a given source.
func (s *DB) ListDevicesBySource(ctx context.Context, source device.Source) ([]device.Device, error) {
	rows, err := s.q.ListDevicesBySource(ctx, source)
	if err != nil {
		return nil, fmt.Errorf("list devices by source: %w", err)
	}
	var devices []device.Device
	for _, r := range rows {
		devices = append(devices, device.Device{
			ID:           r.ID,
			Name:         r.Name,
			Source:       r.Source,
			Type:         r.Type,
			Capabilities: unmarshalCapabilities(r.Capabilities),
			Available:    r.Available,
			Removed:      r.Removed,
			LastSeen:     derefTime(r.LastSeen),
		})
	}
	return devices, nil
}

// UpdateDevice updates a device's mutable fields and returns the updated device.
func (s *DB) UpdateDevice(ctx context.Context, params UpdateDeviceParams) (device.Device, error) {
	lastSeen := params.LastSeen
	var lastSeenArg *time.Time
	if !lastSeen.IsZero() {
		lastSeenArg = &lastSeen
	}
	if err := s.q.UpdateDevice(ctx, sqlite.UpdateDeviceParams{
		Name:      params.Name,
		Available: params.Available,
		Removed:   params.Removed,
		LastSeen:  lastSeenArg,
		ID:        params.ID,
	}); err != nil {
		return device.Device{}, fmt.Errorf("update device: %w", err)
	}
	return s.GetDevice(ctx, params.ID)
}

// DeleteDevice deletes a device by its ID.
func (s *DB) DeleteDevice(ctx context.Context, id device.DeviceID) error {
	if err := s.q.DeleteDevice(ctx, id); err != nil {
		return fmt.Errorf("delete device: %w", err)
	}
	return nil
}

func derefTime(t *time.Time) time.Time {
	if t == nil {
		return time.Time{}
	}
	return *t
}
