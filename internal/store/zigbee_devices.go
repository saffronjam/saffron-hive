package store

import (
	"context"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// RegisterZigbeeDevice inserts a new zigbee device mapping.
func (s *DB) RegisterZigbeeDevice(ctx context.Context, params RegisterZigbeeDeviceParams) (ZigbeeDevice, error) {
	if err := s.q.RegisterZigbeeDevice(ctx, sqlite.RegisterZigbeeDeviceParams{
		DeviceID:     params.DeviceID,
		IeeeAddress:  params.IEEEAddress,
		FriendlyName: params.FriendlyName,
	}); err != nil {
		return ZigbeeDevice{}, fmt.Errorf("register zigbee device: %w", err)
	}
	return ZigbeeDevice{
		DeviceID:     params.DeviceID,
		IEEEAddress:  params.IEEEAddress,
		FriendlyName: params.FriendlyName,
	}, nil
}

// UpsertZigbeeDevice inserts or updates a zigbee device mapping.
func (s *DB) UpsertZigbeeDevice(ctx context.Context, params RegisterZigbeeDeviceParams) error {
	if err := s.q.UpsertZigbeeDevice(ctx, sqlite.UpsertZigbeeDeviceParams{
		DeviceID:     params.DeviceID,
		IeeeAddress:  params.IEEEAddress,
		FriendlyName: params.FriendlyName,
	}); err != nil {
		return fmt.Errorf("upsert zigbee device: %w", err)
	}
	return nil
}

// GetZigbeeDeviceByIEEEAddress looks up a zigbee device by its IEEE address.
func (s *DB) GetZigbeeDeviceByIEEEAddress(ctx context.Context, ieeeAddress string) (ZigbeeDevice, error) {
	row, err := s.q.GetZigbeeDeviceByIEEEAddress(ctx, ieeeAddress)
	if err != nil {
		return ZigbeeDevice{}, fmt.Errorf("get zigbee device by ieee address: %w", err)
	}
	return mapZigbeeDeviceRow(row), nil
}

// GetZigbeeDeviceByFriendlyName looks up a zigbee device by its friendly name.
func (s *DB) GetZigbeeDeviceByFriendlyName(ctx context.Context, friendlyName string) (ZigbeeDevice, error) {
	row, err := s.q.GetZigbeeDeviceByFriendlyName(ctx, friendlyName)
	if err != nil {
		return ZigbeeDevice{}, fmt.Errorf("get zigbee device by friendly name: %w", err)
	}
	return mapZigbeeDeviceRow(row), nil
}

func mapZigbeeDeviceRow(row sqlite.ZigbeeDevice) ZigbeeDevice {
	return ZigbeeDevice{
		DeviceID:     row.DeviceID,
		IEEEAddress:  row.IeeeAddress,
		FriendlyName: row.FriendlyName,
	}
}
