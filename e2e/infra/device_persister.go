package infra

import (
	"context"
	"log"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func runDevicePersister(ctx context.Context, bus eventbus.EventBus, ch <-chan eventbus.Event, s *store.DB) {
	defer bus.Unsubscribe(ch)

	for {
		select {
		case <-ctx.Done():
			return
		case evt, ok := <-ch:
			if !ok {
				return
			}
			switch evt.Type {
			case eventbus.EventDeviceAdded:
				d, ok := evt.Payload.(device.Device)
				if !ok {
					continue
				}
				if err := s.UpsertDevice(ctx, store.CreateDeviceParams{
					ID:           d.ID,
					Name:         d.Name,
					Source:       d.Source,
					Type:         d.Type,
					Capabilities: d.Capabilities,
				}); err != nil {
					log.Printf("failed to upsert e2e device %s: %v", d.ID, err)
					continue
				}
				if d.Source == "zigbee" {
					if err := s.UpsertZigbeeDevice(ctx, store.RegisterZigbeeDeviceParams{
						DeviceID:     d.ID,
						IEEEAddress:  string(d.ID),
						FriendlyName: d.Name,
					}); err != nil {
						log.Printf("failed to upsert e2e zigbee device %s: %v", d.ID, err)
					}
				}
			case eventbus.EventDeviceRemoved:
				if _, err := s.UpdateDevice(ctx, store.UpdateDeviceParams{
					ID:      device.DeviceID(evt.DeviceID),
					Removed: true,
				}); err != nil {
					log.Printf("failed to remove e2e device %s: %v", evt.DeviceID, err)
				}
			}
		}
	}
}
