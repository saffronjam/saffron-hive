package cleaning

import (
	"math"
	"strconv"
	"testing"
	"time"
)

func progressFixture() (Snapshot, Task, ProgressContext) {
	at := time.Date(2026, 11, 8, 12, 0, 0, 0, time.UTC)
	area := 10.0
	return Snapshot{DeviceID: "robot", Status: StatusCleaning, ActiveMapID: 7, UpdatedAt: at, CleanedArea: &area},
		Task{ID: "current", DeviceID: "robot", State: TaskRunning, CreatedAt: at.Add(-time.Minute), Plan: Plan{DeviceID: "robot", MapID: "7", RoomIDs: []string{"hall", "kitchen"}, AreaIDs: []string{"1", "2"}, Options: Options{Repeats: 1}}},
		ProgressContext{RoomAreas: map[string]float64{"hall": 10, "kitchen": 30}, Links: []RoomLink{{RoomID: "hall", AreaID: "1"}, {RoomID: "kitchen", AreaID: "2"}}}
}

func progressSample(current Task, id string, rooms, areas []string, coverage float64, passes int, age time.Duration) Task {
	at := current.CreatedAt.Add(-age)
	return Task{ID: id, DeviceID: current.DeviceID, State: TaskCompleted, CompletedAt: &at, CreatedAt: at.Add(-time.Hour), CleanedArea: &coverage,
		Plan: Plan{DeviceID: current.DeviceID, MapID: current.Plan.MapID, RoomIDs: rooms, AreaIDs: areas, Options: Options{Repeats: passes}}}
}

func TestEstimatedProgress(t *testing.T) {
	number := func(v float64) *float64 { return &v }
	for _, tc := range []struct {
		name   string
		change func(*Snapshot, *Task, *ProgressContext)
		want   *float64
	}{
		{"Hive area fallback", nil, number(25)},
		{"zero cleaned", func(s *Snapshot, _ *Task, _ *ProgressContext) { s.CleanedArea = number(0) }, number(0)},
		{"reported zero wins", func(s *Snapshot, _ *Task, _ *ProgressContext) { s.Progress = number(0) }, nil},
		{"reported percentage wins", func(s *Snapshot, _ *Task, _ *ProgressContext) { s.Progress = number(60) }, nil},
		{"two pass fallback", func(_ *Snapshot, t *Task, _ *ProgressContext) { t.Plan.Options.Repeats = 2 }, number(12.5)},
		{"three pass fallback", func(_ *Snapshot, t *Task, _ *ProgressContext) { t.Plan.Options.Repeats = 3 }, number(100.0 / 12)},
		{"default pass", func(_ *Snapshot, t *Task, _ *ProgressContext) { t.Plan.Options.Repeats = 0 }, number(25)},
		{"paused", func(s *Snapshot, t *Task, _ *ProgressContext) { s.Status = StatusPaused; t.State = TaskPaused }, number(25)},
		{"returning request", func(_ *Snapshot, t *Task, _ *ProgressContext) { t.State = TaskReturning }, nil},
		{"reported return with running task", func(s *Snapshot, _ *Task, _ *ProgressContext) { s.Status = StatusReturning }, nil},
		{"docked with running task", func(s *Snapshot, _ *Task, _ *ProgressContext) { s.Status = StatusDocked }, nil},
		{"over target", func(s *Snapshot, _ *Task, _ *ProgressContext) { s.CleanedArea = number(60) }, number(99)},
		{"completed", func(_ *Snapshot, t *Task, _ *ProgressContext) { t.State = TaskCompleted }, number(100)},
		{"cancelled", func(_ *Snapshot, t *Task, _ *ProgressContext) { t.State = TaskCancelled }, nil},
		{"starting", func(_ *Snapshot, t *Task, _ *ProgressContext) { t.State = TaskStarting }, nil},
		{"unknown job", func(_ *Snapshot, t *Task, _ *ProgressContext) { t.State = TaskUnknown }, nil},
		{"missing measured area", func(s *Snapshot, _ *Task, _ *ProgressContext) { s.CleanedArea = nil }, nil},
		{"negative measured area", func(s *Snapshot, _ *Task, _ *ProgressContext) { s.CleanedArea = number(-1) }, nil},
		{"invalid measured area", func(s *Snapshot, _ *Task, _ *ProgressContext) { s.CleanedArea = number(math.NaN()) }, nil},
		{"unknown target", func(_ *Snapshot, t *Task, _ *ProgressContext) { t.Plan.AreaIDs = nil }, nil},
		{"unlinked native area", func(_ *Snapshot, t *Task, _ *ProgressContext) { t.Plan.AreaIDs = append(t.Plan.AreaIDs, "3") }, nil},
		{"missing Hive area", func(_ *Snapshot, _ *Task, d *ProgressContext) { delete(d.RoomAreas, "hall") }, nil},
		{"invalid Hive area", func(_ *Snapshot, _ *Task, d *ProgressContext) { d.RoomAreas["hall"] = math.Inf(1) }, nil},
		{"wrong map", func(s *Snapshot, _ *Task, _ *ProgressContext) { s.ActiveMapID = 8 }, nil},
		{"wrong device", func(s *Snapshot, _ *Task, _ *ProgressContext) { s.DeviceID = "other" }, nil},
		{"stale statistics", func(s *Snapshot, t *Task, _ *ProgressContext) { s.UpdatedAt = t.CreatedAt.Add(-time.Second) }, nil},
		{"duplicate selections", func(_ *Snapshot, t *Task, _ *ProgressContext) {
			t.Plan.RoomIDs = append(t.Plan.RoomIDs, "hall")
			t.Plan.AreaIDs = append(t.Plan.AreaIDs, "1")
		}, number(25)},
		{"learned plus Hive fallback", func(_ *Snapshot, t *Task, d *ProgressContext) {
			d.History = []Task{progressSample(*t, "hall-run", []string{"hall"}, []string{"1"}, 8, 1, time.Hour)}
		}, number(10.0 / 38 * 100)},
		{"completed exact selection", func(_ *Snapshot, t *Task, d *ProgressContext) {
			d.History = []Task{progressSample(*t, "whole-run", t.Plan.RoomIDs, t.Plan.AreaIDs, 20, 1, time.Hour)}
		}, number(50)},
		{"pass counts are independent", func(_ *Snapshot, t *Task, d *ProgressContext) {
			d.History = []Task{progressSample(*t, "two-pass", t.Plan.RoomIDs, t.Plan.AreaIDs, 20, 2, time.Hour)}
		}, number(25)},
		{"single pass learning seeds repeated cleaning", func(_ *Snapshot, t *Task, d *ProgressContext) {
			t.Plan.Options.Repeats = 2
			d.History = []Task{progressSample(*t, "one-pass", t.Plan.RoomIDs, t.Plan.AreaIDs, 20, 1, time.Hour)}
		}, number(25)},
		{"learned two pass total", func(_ *Snapshot, t *Task, d *ProgressContext) {
			t.Plan.Options.Repeats = 2
			d.History = []Task{progressSample(*t, "two-pass", t.Plan.RoomIDs, t.Plan.AreaIDs, 20, 2, time.Hour)}
		}, number(50)},
	} {
		t.Run(tc.name, func(t *testing.T) {
			snapshot, task, data := progressFixture()
			if tc.change != nil {
				tc.change(&snapshot, &task, &data)
			}
			got := EstimatedProgress(snapshot, &task, data)
			if tc.want == nil {
				if got != nil {
					t.Fatalf("unexpected estimate %v", *got)
				}
				return
			}
			if got == nil || math.Abs(*got-*tc.want) > 1e-8 {
				t.Fatalf("estimate %v, want %v", got, *tc.want)
			}
		})
	}
	if EstimatedProgress(Snapshot{}, nil, ProgressContext{}) != nil {
		t.Fatal("missing task has an estimate")
	}
}

func TestLearningExcludesUnreliableSamples(t *testing.T) {
	for _, kind := range []string{"cancelled", "failed", "running", "unknown outcome", "other vacuum", "other map", "other rooms", "other areas", "future", "zero", "nonfinite", "current"} {
		t.Run(kind, func(t *testing.T) {
			_, task, data := progressFixture()
			sample := progressSample(task, "sample", task.Plan.RoomIDs, task.Plan.AreaIDs, 20, 1, time.Hour)
			switch kind {
			case "cancelled":
				sample.State = TaskCancelled
			case "failed":
				sample.State = TaskFailed
			case "running":
				sample.State = TaskRunning
			case "unknown outcome":
				sample.State = TaskEnded
			case "other vacuum":
				sample.DeviceID = "elsewhere"
			case "other map":
				sample.Plan.MapID = "8"
			case "other rooms":
				sample.Plan.RoomIDs = []string{"other"}
			case "other areas":
				sample.Plan.AreaIDs = []string{"3"}
			case "future":
				at := task.CreatedAt.Add(time.Hour)
				sample.CompletedAt = &at
			case "zero":
				*sample.CleanedArea = 0
			case "nonfinite":
				*sample.CleanedArea = math.Inf(1)
			case "current":
				sample.ID = task.ID
			}
			data.History = []Task{sample}
			if got := expectedArea(task, data); got != 40 {
				t.Fatalf("unreliable sample changed expected area to %v", got)
			}
		})
	}
}

func TestLearningAdaptsToRecentCoverageWithoutSplittingGroupTotals(t *testing.T) {
	_, task, data := progressFixture()
	first := progressSample(task, "first", task.Plan.RoomIDs, task.Plan.AreaIDs, 10, 1, 2*time.Hour)
	second := progressSample(task, "second", task.Plan.RoomIDs, task.Plan.AreaIDs, 12, 1, time.Hour)
	data.History = []Task{first, second}
	want := (12 + 10*0.65) / 1.65
	if got := expectedArea(task, data); math.Abs(got-want) > 1e-8 {
		t.Fatalf("weighted coverage = %v, want %v", got, want)
	}
	task.Plan.RoomIDs = []string{"hall"}
	task.Plan.AreaIDs = []string{"1"}
	if got := expectedArea(task, data); got != 10 {
		t.Fatalf("attributed aggregate history to Hallway: %v", got)
	}
	data.Links = append(data.Links, RoomLink{RoomID: "kitchen", AreaID: "1"})
	task.Plan.RoomIDs = []string{"hall", "kitchen"}
	task.Plan.AreaIDs = []string{"1", "2"}
	data.History = nil
	if got := expectedArea(task, data); got != 40 {
		t.Fatalf("shared area duplicated room geometry: %v", got)
	}
}

func TestLearningLimitsOldSamplesAndBoundsOutliers(t *testing.T) {
	_, task, data := progressFixture()
	for i := 0; i < 5; i++ {
		data.History = append(data.History, progressSample(task, strconv.Itoa(i), task.Plan.RoomIDs, task.Plan.AreaIDs, 10, 1, time.Duration(i+1)*time.Hour))
	}
	data.History = append(data.History, progressSample(task, "old", task.Plan.RoomIDs, task.Plan.AreaIDs, 100, 1, 24*time.Hour))
	if got := expectedArea(task, data); math.Abs(got-10) > 1e-8 {
		t.Fatalf("old sample affected estimate: %v", got)
	}
	*data.History[0].CleanedArea = 100
	if got := expectedArea(task, data); got <= 10 || got >= 13 {
		t.Fatalf("outlier was not bounded: %v", got)
	}
}
