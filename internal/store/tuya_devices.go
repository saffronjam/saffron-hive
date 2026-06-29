package store

import (
	"context"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// TuyaDevice holds the per-device data needed for local (LAN) control: the
// local key (fetched from the cloud), the LAN protocol version and IP (from UDP
// discovery), and the product id (for DP mapping).
type TuyaDevice struct {
	DeviceID        string
	LocalKey        string
	ProtocolVersion string
	LANIP           string
	ProductID       string
}

// UpsertTuyaDevice inserts or updates a Tuya device's local-control metadata.
func (s *DB) UpsertTuyaDevice(ctx context.Context, d TuyaDevice) error {
	if err := s.q.UpsertTuyaDevice(ctx, sqlite.UpsertTuyaDeviceParams{
		DeviceID:        d.DeviceID,
		LocalKey:        d.LocalKey,
		ProtocolVersion: d.ProtocolVersion,
		LanIp:           d.LANIP,
		ProductID:       d.ProductID,
	}); err != nil {
		return fmt.Errorf("upsert tuya device: %w", err)
	}
	return nil
}

// ListTuyaDevices returns all stored Tuya device local-control metadata.
func (s *DB) ListTuyaDevices(ctx context.Context) ([]TuyaDevice, error) {
	rows, err := s.q.ListTuyaDevices(ctx)
	if err != nil {
		return nil, fmt.Errorf("list tuya devices: %w", err)
	}
	out := make([]TuyaDevice, len(rows))
	for i, r := range rows {
		out[i] = TuyaDevice{
			DeviceID:        r.DeviceID,
			LocalKey:        r.LocalKey,
			ProtocolVersion: r.ProtocolVersion,
			LANIP:           r.LanIp,
			ProductID:       r.ProductID,
		}
	}
	return out, nil
}
