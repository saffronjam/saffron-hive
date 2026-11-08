package alarms

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"time"

	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

const CleaningSource = "cleaning.maintenance"

type cleaningSnapshotReader interface {
	Snapshots(context.Context) ([]cleaning.Snapshot, error)
}

// RunCleaningMonitor maintains reminders from optional vacuum maintenance readings.
func RunCleaningMonitor(ctx context.Context, svc *Service, reader device.StateReader, snapshots cleaningSnapshotReader, bus eventbus.EventBus) {
	refresh := func() {
		reported, err := snapshots.Snapshots(ctx)
		if err != nil {
			logger.Warn("cleaning maintenance read failed", "error", err)
			return
		}
		if err := syncCleaningMaintenance(ctx, svc, reader, reported); err != nil {
			logger.Warn("cleaning maintenance sync failed", "error", err)
		}
	}
	updates := bus.Subscribe(eventbus.EventCleaningUpdated, eventbus.EventDeviceUpdated, eventbus.EventDeviceRemoved)
	defer bus.Unsubscribe(updates)
	refresh()
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			refresh()
		case <-updates:
			refresh()
		}
	}
}

func syncCleaningMaintenance(ctx context.Context, svc *Service, reader device.StateReader, snapshots []cleaning.Snapshot) error {
	active, err := svc.ListActive(ctx)
	if err != nil {
		return err
	}
	owned := map[string]Alarm{}
	for _, alarm := range active {
		if alarm.Source == CleaningSource {
			owned[alarm.ID] = alarm
		}
	}
	retained := map[string]bool{}
	for _, snapshot := range snapshots {
		d, ok := reader.GetDevice(device.DeviceID(snapshot.DeviceID))
		if !ok || d.RuntimeDisabled() || d.Removed {
			continue
		}
		prefix := "cleaning.maintenance." + snapshot.DeviceID + "."
		for id := range owned {
			if len(id) > len(prefix) && id[:len(prefix)] == prefix {
				retained[id] = true
			}
		}
		for _, item := range snapshot.Consumables {
			switch item.Name {
			case "main_brush", "side_brush", "filter", "sensors":
			default:
				continue
			}
			if math.IsNaN(item.Percent) || math.IsInf(item.Percent, 0) || item.Percent < 0 || item.Percent > 100 {
				continue
			}
			id := prefix + item.Name
			if item.Percent > 10 {
				delete(retained, id)
				continue
			}
			retained[id] = true
			if !d.Available {
				continue
			}
			code := "cleaning_maintenance_soon"
			severity := store.AlarmSeverityLow
			if item.Percent == 0 {
				code = "cleaning_maintenance_due"
				severity = store.AlarmSeverityMedium
			}
			args := MessageArguments{DeviceName: d.DisplayName(), Consumable: item.Name}
			if previous, ok := owned[id]; ok {
				var old MessageArguments
				if err := json.Unmarshal([]byte(previous.MessageArguments), &old); err == nil && previous.MessageCode == code && old.DeviceName == args.DeviceName {
					continue
				}
				if _, err := svc.DeleteByAlarmID(ctx, id); err != nil {
					return err
				}
			}
			if _, err := svc.Raise(ctx, RaiseParams{AlarmID: id, Kind: store.AlarmKindAuto, Severity: severity, Source: CleaningSource, MessageCode: code, MessageArguments: args}); err != nil {
				return fmt.Errorf("raise maintenance: %w", err)
			}
		}
	}
	for id := range owned {
		if !retained[id] {
			if _, err := svc.DeleteByAlarmID(ctx, id); err != nil {
				return err
			}
		}
	}
	return nil
}
