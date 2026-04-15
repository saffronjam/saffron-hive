package store

import (
	"context"
	"database/sql"
	"fmt"
)

// RegisterZigbeeDevice inserts a new zigbee device mapping.
func (s *SQLiteStore) RegisterZigbeeDevice(ctx context.Context, params RegisterZigbeeDeviceParams) (ZigbeeDevice, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO zigbee_devices (device_id, ieee_address, friendly_name) VALUES (?, ?, ?)`,
		params.DeviceID, params.IEEEAddress, params.FriendlyName,
	)
	if err != nil {
		return ZigbeeDevice{}, fmt.Errorf("register zigbee device: %w", err)
	}
	return ZigbeeDevice{
		DeviceID:     params.DeviceID,
		IEEEAddress:  params.IEEEAddress,
		FriendlyName: params.FriendlyName,
	}, nil
}

// GetZigbeeDeviceByIEEEAddress looks up a zigbee device by its IEEE address.
func (s *SQLiteStore) GetZigbeeDeviceByIEEEAddress(ctx context.Context, ieeeAddress string) (ZigbeeDevice, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT device_id, ieee_address, friendly_name FROM zigbee_devices WHERE ieee_address = ?`,
		ieeeAddress,
	)
	return scanZigbeeDevice(row)
}

// GetZigbeeDeviceByFriendlyName looks up a zigbee device by its friendly name.
func (s *SQLiteStore) GetZigbeeDeviceByFriendlyName(ctx context.Context, friendlyName string) (ZigbeeDevice, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT device_id, ieee_address, friendly_name FROM zigbee_devices WHERE friendly_name = ?`,
		friendlyName,
	)
	return scanZigbeeDevice(row)
}

func scanZigbeeDevice(row *sql.Row) (ZigbeeDevice, error) {
	var zd ZigbeeDevice
	err := row.Scan(&zd.DeviceID, &zd.IEEEAddress, &zd.FriendlyName)
	if err != nil {
		return ZigbeeDevice{}, fmt.Errorf("scan zigbee device: %w", err)
	}
	return zd, nil
}
