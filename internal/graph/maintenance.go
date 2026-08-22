package graph

import (
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/maintenance"
)

func mapMaintenanceTask(reader device.StateReader, task maintenance.Task) *model.MaintenanceTask {
	out := &model.MaintenanceTask{
		ID: task.ID, Kind: maintenanceKindToModel(task.Kind), Title: task.Title,
		Detail: task.Detail, Action: task.Action, CurrentValue: task.CurrentValue,
		TargetValue: task.TargetValue, ActionURL: task.ActionURL,
	}
	if task.Device != nil {
		out.Device = mapDeviceFromReader(reader, *task.Device)
	}
	return out
}

func maintenanceKindToModel(kind maintenance.Kind) model.MaintenanceKind {
	switch kind {
	case maintenance.KindBattery:
		return model.MaintenanceKindBattery
	case maintenance.KindFirmware:
		return model.MaintenanceKindFirmware
	case maintenance.KindPosture:
		return model.MaintenanceKindPosture
	case maintenance.KindStorage:
		return model.MaintenanceKindStorage
	default:
		return model.MaintenanceKindStorage
	}
}
