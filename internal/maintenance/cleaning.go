package maintenance

import (
	"context"
	"math"
	"strconv"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func (s *Service) deriveCleaningTasks(ctx context.Context) ([]Task, error) {
	if s.cleaning == nil {
		return nil, nil
	}
	snapshots, err := s.cleaning.Snapshots(ctx)
	if err != nil {
		return nil, err
	}
	tasks := []Task{}
	reported := map[string]bool{}
	for _, snapshot := range snapshots {
		found, ok := s.reader.GetDevice(device.DeviceID(snapshot.DeviceID))
		if !ok || found.Removed || found.RuntimeDisabled() {
			continue
		}
		for _, item := range snapshot.Consumables {
			if math.IsNaN(item.Percent) || math.IsInf(item.Percent, 0) || item.Percent < 0 || item.Percent > 100 {
				continue
			}
			reported[snapshot.DeviceID+":"+item.Name] = true
			if item.Percent > 10 {
				continue
			}
			band := 10
			if item.Percent == 0 {
				band = 0
			}
			part, value := item.Name, item.Percent
			task := newTask("cleaning:"+snapshot.DeviceID+":"+part, "band:"+strconv.Itoa(band), KindCleaning, &found, nil, nil, &value, &part, deviceURL(found.ID))
			task.CanComplete = found.Available && item.Resettable
			tasks = append(tasks, task)
		}
	}
	for _, previous := range s.tasks {
		if previous.Kind != KindCleaning || previous.Device == nil || previous.Context == nil || reported[string(previous.Device.ID)+":"+*previous.Context] {
			continue
		}
		found, ok := s.reader.GetDevice(previous.Device.ID)
		if !ok || found.Removed || found.RuntimeDisabled() {
			continue
		}
		previous.Device = &found
		previous.CanComplete = false
		tasks = append(tasks, previous)
	}
	return tasks, nil
}
