package cleaning

import (
	"context"
	"math"
	"slices"
	"strconv"
	"strings"
)

// ProgressContext supplies confirmed coverage samples and Hive room geometry.
type ProgressContext struct {
	History   []Task
	Links     []RoomLink
	RoomAreas map[string]float64
}

// EstimatedProgress uses confirmed coverage for the same cleaning selection and
// pass count, falling back to Hive room geometry for unlearned areas.
func EstimatedProgress(snapshot Snapshot, task *Task, data ProgressContext) *float64 {
	if snapshot.Progress != nil || task == nil || task.DeviceID != snapshot.DeviceID {
		return nil
	}
	if task.State == TaskCompleted {
		progress := 100.0
		return &progress
	}
	if task.State != TaskRunning && task.State != TaskPaused {
		return nil
	}
	if snapshot.Status != StatusCleaning && snapshot.Status != StatusPaused {
		return nil
	}
	if snapshot.UpdatedAt.Before(task.CreatedAt) || snapshot.CleanedArea == nil || !finite(*snapshot.CleanedArea) || *snapshot.CleanedArea < 0 {
		return nil
	}
	if task.Plan.MapID != strconv.Itoa(snapshot.ActiveMapID) {
		return nil
	}
	total := expectedArea(*task, data)
	if !finite(total) || total <= 0 {
		return nil
	}
	progress := math.Min(99, *snapshot.CleanedArea/total*100)
	return &progress
}

func expectedArea(task Task, data ProgressContext) float64 {
	plan := task.Plan
	passes := cleaningPasses(plan.Options.Repeats)
	if passes == 0 || plan.DeviceID != task.DeviceID || len(plan.RoomIDs) == 0 || len(plan.AreaIDs) == 0 {
		return 0
	}
	if learned := learnedArea(task, plan, data.History); learned > 0 {
		return learned
	}
	groups := map[string]bool{}
	covered := []string{}
	coveredRooms := []string{}
	available := slices.Clone(plan.AreaIDs)
	for _, link := range data.Links {
		available = append(available, link.AreaID)
	}
	total := 0.0
	for _, room := range plan.RoomIDs {
		group, err := Prepare(plan.DeviceID, plan.MapID, 0, data.Links, available, []string{room}, plan.Options, ScopeRooms)
		if err != nil {
			return 0
		}
		key := selectionKey(group.AreaIDs)
		if groups[key] {
			continue
		}
		groups[key] = true
		covered = append(covered, group.AreaIDs...)
		coveredRooms = append(coveredRooms, group.RoomIDs...)
		if learned := learnedArea(task, group, data.History); learned > 0 {
			total += learned
			continue
		}
		for _, id := range group.RoomIDs {
			area := data.RoomAreas[id]
			if !finite(area) || area <= 0 {
				return 0
			}
			total += area * float64(passes)
		}
	}
	if selectionKey(covered) != selectionKey(plan.AreaIDs) || selectionKey(coveredRooms) != selectionKey(plan.RoomIDs) {
		return 0
	}
	return total
}

func cleaningPasses(passes int) int {
	if passes == 0 {
		return 1
	}
	if passes < 1 || passes > 3 {
		return 0
	}
	return passes
}

func selectionKey(ids []string) string {
	copy := slices.Clone(ids)
	slices.Sort(copy)
	return strings.Join(slices.Compact(copy), "\x00")
}

func learnedArea(current Task, selection Plan, history []Task) float64 {
	matches := []Task{}
	seen := map[string]bool{}
	rooms, areas := selectionKey(selection.RoomIDs), selectionKey(selection.AreaIDs)
	for _, sample := range history {
		if sample.ID == current.ID || sample.State != TaskCompleted || sample.DeviceID != current.DeviceID ||
			sample.Plan.MapID != selection.MapID || sample.CompletedAt == nil || sample.CompletedAt.After(current.CreatedAt) ||
			cleaningPasses(sample.Plan.Options.Repeats) != cleaningPasses(selection.Options.Repeats) ||
			selectionKey(sample.Plan.RoomIDs) != rooms || selectionKey(sample.Plan.AreaIDs) != areas ||
			sample.CleanedArea == nil || !finite(*sample.CleanedArea) || *sample.CleanedArea <= 0 {
			continue
		}
		key := sample.ID
		if sample.ProviderHistoryID != "" {
			key = sample.ProviderHistoryID
		}
		if seen[key] {
			continue
		}
		seen[key] = true
		matches = append(matches, sample)
	}
	slices.SortFunc(matches, func(a, b Task) int { return b.CompletedAt.Compare(*a.CompletedAt) })
	if len(matches) > 5 {
		matches = matches[:5]
	}
	if len(matches) == 0 {
		if passes := cleaningPasses(selection.Options.Repeats); passes > 1 {
			selection.Options.Repeats = 1
			return learnedArea(current, selection, history) * float64(passes)
		}
		return 0
	}
	values := make([]float64, len(matches))
	for i, sample := range matches {
		values[i] = *sample.CleanedArea
	}
	slices.Sort(values)
	median := values[len(values)/2]
	if len(values)%2 == 0 {
		median = (median + values[len(values)/2-1]) / 2
	}
	weight, sum, weights := 1.0, 0.0, 0.0
	for _, sample := range matches {
		// Bound isolated readings while allowing sustained changes to move the estimate.
		area := min(median*1.5, max(median*0.5, *sample.CleanedArea))
		sum += area * weight
		weights += weight
		weight *= 0.65
	}
	return sum / weights
}

// EstimatedProgress resolves stored coverage samples and Hive room measurements.
func (s *Service) EstimatedProgress(ctx context.Context, snapshot Snapshot, task *Task) (*float64, error) {
	if snapshot.Progress != nil || task == nil || (task.State != TaskRunning && task.State != TaskPaused) ||
		(snapshot.Status != StatusCleaning && snapshot.Status != StatusPaused) {
		return EstimatedProgress(snapshot, task, ProgressContext{}), nil
	}
	history, err := s.store.CleaningAreaHistory(ctx, task.DeviceID, task.Plan.MapID)
	if err != nil {
		return nil, err
	}
	links, err := s.store.GetCleaningRoomLinks(ctx, task.DeviceID)
	if err != nil {
		return nil, err
	}
	areas, err := s.store.CleaningRoomAreas(ctx)
	if err != nil {
		return nil, err
	}
	data := ProgressContext{History: history, RoomAreas: areas}
	for _, set := range links {
		if set.MapID == task.Plan.MapID {
			data.Links = set.Links
			break
		}
	}
	return EstimatedProgress(snapshot, task, data), nil
}
