package store

import (
	"context"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// DeleteProviderConfiguration removes configuration and its owned data atomically.
func (s *DB) DeleteProviderConfiguration(ctx context.Context, source device.Source) (removed []device.Device, err error) {
	err = s.atomic(ctx, func(s *DB) error {
		switch source {
		case device.SourceZigbee2MQTT:
			if err := s.DeleteZigbee2MQTTConfig(ctx); err != nil {
				return err
			}
			return s.DeleteNetworkTopology(ctx, source)
		case device.SourceTuya:
			if err := s.DeleteTuyaConfig(ctx); err != nil {
				return err
			}
			var err error
			removed, err = s.ListDevicesBySource(ctx, source)
			if err != nil {
				return err
			}
			for _, d := range removed {
				if err := s.PurgeDevice(ctx, d.ID); err != nil {
					return err
				}
			}
			return nil
		default:
			return fmt.Errorf("unknown provider %q", source)
		}
	})
	if err != nil {
		return nil, err
	}
	return removed, nil
}
