package store

import (
	"context"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/zigbeemetadata"
)

// DeviceImageSources returns artwork supplied by a device's integration.
func (s *DB) DeviceImageSources(ctx context.Context, id device.DeviceID) ([]string, error) {
	found, err := s.GetDevice(ctx, id)
	if err != nil {
		return nil, err
	}
	switch found.Source {
	case device.SourceZigbee2MQTT:
		metadata, err := s.GetZigbeeDeviceMetadata(ctx, id)
		if err != nil || metadata == nil {
			return nil, err
		}
		return zigbeemetadata.ImageSources(*metadata), nil
	case device.SourceDreame:
		snapshots, err := s.ListCleaningSnapshots(ctx)
		if err != nil {
			return nil, err
		}
		for _, snapshot := range snapshots {
			if snapshot.DeviceID == string(id) {
				return snapshot.ImageSources, nil
			}
		}
	}
	return nil, nil
}
