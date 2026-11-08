package store

import (
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/cleaning"
)

func TestDreameConfigurationRejectsStaleWrites(t *testing.T) {
	s := newTestStore(t)
	ctx := t.Context()
	cfg := DreameConfig{Email: "owner@example.com", Password: "private-test-value", Region: "eu", Enabled: true}
	if err := s.UpsertDreameConfig(ctx, cfg); err != nil {
		t.Fatal(err)
	}
	first, err := s.GetDreameConfig(ctx)
	if err != nil || first == nil || first.Revision != 1 || first.Password != cfg.Password {
		t.Fatalf("configuration did not roundtrip: %v", err)
	}
	if err := s.UpsertDreameConfig(ctx, cfg); !errors.Is(err, ErrRevisionConflict) {
		t.Fatalf("stale insert accepted: %v", err)
	}
	first.Enabled = false
	if err := s.UpsertDreameConfig(ctx, *first); err != nil {
		t.Fatal(err)
	}
	if err := s.UpsertDreameConfig(ctx, *first); !errors.Is(err, ErrRevisionConflict) {
		t.Fatalf("stale update accepted: %v", err)
	}
	if err := s.DeleteDreameConfig(ctx); err != nil {
		t.Fatal(err)
	}
	if result, err := s.GetDreameConfig(ctx); err != nil || result != nil {
		t.Fatalf("configuration remained after deletion: %v", err)
	}
}

func TestCleaningTaskPersistencePreventsDuplicateExecution(t *testing.T) {
	s := seedPlacedPlan(t)
	ctx := t.Context()
	at := time.Date(2026, 11, 8, 10, 0, 0, 0, time.UTC)
	task := cleaning.Task{ID: "task1", DeviceID: "dev-1", RequestID: "request1", State: cleaning.TaskStarting, Origin: "user", CreatedAt: at, Plan: cleaning.Plan{DeviceID: "dev-1", MapID: "map1", RoomIDs: []string{"kitchen"}, AreaIDs: []string{"1"}, Options: cleaning.Options{Repeats: 1}, Revision: "v1"}}
	if err := s.CreateCleaningTask(ctx, task); err != nil {
		t.Fatal(err)
	}
	duplicate := task
	duplicate.ID = "task2"
	if err := s.CreateCleaningTask(ctx, duplicate); err == nil {
		t.Fatal("duplicate request acquired another execution slot")
	}
	duplicate.RequestID = "request2"
	if err := s.CreateCleaningTask(ctx, duplicate); err == nil {
		t.Fatal("busy vacuum acquired another execution slot")
	}
	restored, err := s.GetCleaningTaskByRequest(ctx, "request1")
	if err != nil || restored == nil || restored.Plan.Revision != "v1" {
		t.Fatalf("request did not roundtrip: %v", err)
	}
	if err := s.TransitionCleaningTask(ctx, "task1", cleaning.TaskStarting, cleaning.TaskRunning, "", at.Add(time.Second)); err != nil {
		t.Fatal(err)
	}
	if err := s.TransitionCleaningTask(ctx, "task1", cleaning.TaskStarting, cleaning.TaskFailed, "", at.Add(2*time.Second)); !errors.Is(err, ErrRevisionConflict) {
		t.Fatalf("stale observation overwrote state: %v", err)
	}
	if err := s.TransitionCleaningTask(ctx, "task1", cleaning.TaskRunning, cleaning.TaskCompleted, "", at.Add(3*time.Second)); err != nil {
		t.Fatal(err)
	}
	if err := s.CreateCleaningTask(ctx, duplicate); err != nil {
		t.Fatalf("completed task retained execution slot: %v", err)
	}
	history, err := s.ListCleaningTasks(ctx, "dev-1", "", 20)
	if err != nil || len(history) != 2 {
		t.Fatalf("wrong history: %d %v", len(history), err)
	}
}

func TestCleaningCalibrationUsesOptimisticRevision(t *testing.T) {
	s := seedPlacedPlan(t)
	ctx := t.Context()
	c := cleaning.Calibration{DeviceID: "dev-1", MapID: "map1", MapRevision: "geometry1", FloorplanID: "fp-1", FloorplanRevision: 1, Anchors: []cleaning.Anchor{{Robot: cleaning.Point{X: 0, Y: 0}, Hive: cleaning.Point{X: 1, Y: 1}}, {Robot: cleaning.Point{X: 2, Y: 0}, Hive: cleaning.Point{X: 3, Y: 1}}}}
	if err := s.SaveCleaningCalibration(ctx, c); err != nil {
		t.Fatal(err)
	}
	if err := s.SaveCleaningCalibration(ctx, c); !errors.Is(err, ErrRevisionConflict) {
		t.Fatalf("stale calibration accepted: %v", err)
	}
	restored, err := s.GetCleaningCalibration(ctx, c.DeviceID, c.MapID, c.FloorplanID)
	if err != nil || restored == nil || restored.Revision != 1 || len(restored.Anchors) != 2 {
		t.Fatalf("calibration did not roundtrip: %v", err)
	}
	if restored.Enabled {
		t.Fatal("map overlay must be opt-in")
	}
	restored.Enabled = true
	restored.MapRotation = 90
	if err := s.SaveCleaningCalibration(ctx, *restored); err != nil {
		t.Fatal(err)
	}
	restored, err = s.GetCleaningCalibration(ctx, c.DeviceID, c.MapID, c.FloorplanID)
	if err != nil || !restored.Enabled || restored.Revision != 2 || restored.MapRotation != 90 {
		t.Fatal("overlay choice was not persisted")
	}
	for _, count := range []int{1, 0} {
		restored.Anchors = restored.Anchors[:count]
		if err := s.SaveCleaningCalibration(ctx, *restored); err != nil {
			t.Fatal(err)
		}
		restored, err = s.GetCleaningCalibration(ctx, c.DeviceID, c.MapID, c.FloorplanID)
		if err != nil || len(restored.Anchors) != count || restored.MapRotation != 90 {
			t.Fatalf("incomplete alignment did not roundtrip: %+v, %v", restored, err)
		}
	}
}

func TestCleaningLinksRejectConcurrentEditsAndRollback(t *testing.T) {
	s := seedPlacedPlan(t)
	ctx := t.Context()
	room, err := s.CreateRoom(ctx, CreateRoomParams{ID: "kitchen", Name: "Kitchen"})
	if err != nil {
		t.Fatal(err)
	}
	links := cleaning.RoomLinks{MapID: "map1", MapRevision: "geometry1", Links: []cleaning.RoomLink{{RoomID: room.ID, AreaID: "1"}}}
	if err := s.ReplaceCleaningRoomLinks(ctx, "dev-1", links); err != nil {
		t.Fatal(err)
	}
	if err := s.ReplaceCleaningRoomLinks(ctx, "dev-1", links); !errors.Is(err, ErrRevisionConflict) {
		t.Fatalf("stale link edit accepted: %v", err)
	}
	restored, err := s.GetCleaningRoomLinks(ctx, "dev-1")
	if err != nil || len(restored) != 1 || restored[0].Revision != 1 {
		t.Fatalf("link revision missing: %+v %v", restored, err)
	}
	broken := restored[0]
	broken.Links = []cleaning.RoomLink{{RoomID: "missing-room", AreaID: "2"}}
	if err := s.ReplaceCleaningRoomLinks(ctx, "dev-1", broken); err == nil {
		t.Fatal("missing room accepted")
	}
	restored, err = s.GetCleaningRoomLinks(ctx, "dev-1")
	if err != nil || restored[0].Revision != 1 || restored[0].Links[0].AreaID != "1" {
		t.Fatalf("failed replacement did not roll back: %+v %v", restored, err)
	}
}

func TestCleaningHistoryMatchesRequestAndPreservesExternalRuns(t *testing.T) {
	s := seedPlacedPlan(t)
	ctx := t.Context()
	at := time.Now().UTC().Truncate(time.Second)
	task := cleaning.Task{ID: "requested", DeviceID: "dev-1", RequestID: "request", State: cleaning.TaskStarting, Origin: "user", CreatedAt: at, Plan: cleaning.Plan{DeviceID: "dev-1", MapID: "map1", RoomIDs: []string{"kitchen"}, AreaIDs: []string{"1"}}}
	if err := s.CreateCleaningTask(ctx, task); err != nil {
		t.Fatal(err)
	}
	if err := s.TransitionCleaningTask(ctx, task.ID, cleaning.TaskStarting, cleaning.TaskUnknown, "request not confirmed", at); err != nil {
		t.Fatal(err)
	}
	yes := true
	rows := []cleaning.HistoryRecord{{ID: "own-run", StartedAt: at.Add(2 * time.Second), FinishedAt: at.Add(time.Hour), Completed: &yes, ElapsedMinutes: 44, CleanedArea: 29}, {ID: "external-run", StartedAt: at.Add(-24 * time.Hour), FinishedAt: at.Add(-23 * time.Hour), Completed: &yes, ElapsedMinutes: 10, CleanedArea: 8}}
	for range 2 {
		if err := s.IngestCleaningHistory(ctx, "dev-1", rows); err != nil {
			t.Fatal(err)
		}
	}
	history, err := s.ListCleaningTasks(ctx, "dev-1", "", 20)
	if err != nil || len(history) != 2 {
		t.Fatalf("history duplicated: %+v %v", history, err)
	}
	own := history[0]
	if own.ID != task.ID || own.Error != "" || own.State != cleaning.TaskCompleted || own.ElapsedMinutes == nil || *own.ElapsedMinutes != 44 || len(own.Plan.RoomIDs) != 1 {
		t.Fatalf("outcome did not match request: %+v", own)
	}
	if history[1].Origin != "external" || len(history[1].Plan.RoomIDs) != 0 {
		t.Fatal("external history invented Hive rooms")
	}
}

func TestCleaningCoverageHistoryReusesCompletedSamples(t *testing.T) {
	s := seedPlacedPlan(t)
	ctx := t.Context()
	at := time.Now().UTC().Add(-24 * time.Hour).Truncate(time.Second)
	for i := 0; i < 8; i++ {
		id := fmt.Sprintf("run-%d", i)
		started := at.Add(time.Duration(i) * time.Hour)
		task := cleaning.Task{ID: id, RequestID: id, DeviceID: "dev-1", State: cleaning.TaskStarting, CreatedAt: started,
			Plan: cleaning.Plan{DeviceID: "dev-1", MapID: "map1", RoomIDs: []string{"hall"}, AreaIDs: []string{"1"}, Options: cleaning.Options{Repeats: 1}}}
		if err := s.CreateCleaningTask(ctx, task); err != nil {
			t.Fatal(err)
		}
		if err := s.TransitionCleaningTask(ctx, id, cleaning.TaskStarting, cleaning.TaskRunning, "", started.Add(time.Second)); err != nil {
			t.Fatal(err)
		}
		yes := true
		record := cleaning.HistoryRecord{ID: id, StartedAt: started, FinishedAt: started.Add(30 * time.Minute), Completed: &yes, CleanedArea: float64(i + 1)}
		if err := s.IngestCleaningHistory(ctx, "dev-1", []cleaning.HistoryRecord{record}); err != nil {
			t.Fatal(err)
		}
		if err := s.IngestCleaningHistory(ctx, "dev-1", []cleaning.HistoryRecord{record}); err != nil {
			t.Fatal(err)
		}
	}
	samples, err := s.CleaningAreaHistory(ctx, "dev-1", "map1")
	if err != nil {
		t.Fatal(err)
	}
	if len(samples) != 5 || samples[0].ID != "run-7" || samples[4].ID != "run-3" {
		t.Fatalf("recent samples: %+v", samples)
	}
	for _, sample := range samples {
		if sample.State != cleaning.TaskCompleted || sample.CleanedArea == nil {
			t.Fatalf("invalid sample %+v", sample)
		}
	}
	other, err := s.CleaningAreaHistory(ctx, "dev-1", "other")
	if err != nil || len(other) != 0 {
		t.Fatalf("samples crossed map: %+v %v", other, err)
	}
}

func TestCleaningHistorySkipsEmptyRunsAndUsesCanonicalCursor(t *testing.T) {
	s := seedPlacedPlan(t)
	ctx := t.Context()
	at := time.Date(2026, 11, 8, 12, 0, 0, 0, time.UTC)
	yes := true
	records := []cleaning.HistoryRecord{}
	for i, area := range []float64{5, 0, 8, 0, 10} {
		start := at.Add(time.Duration(i) * time.Hour)
		records = append(records, cleaning.HistoryRecord{ID: fmt.Sprint(i), StartedAt: start, FinishedAt: start.Add(time.Minute), Completed: &yes, CleanedArea: area})
	}
	if err := s.IngestCleaningHistory(ctx, "dev-1", records); err != nil {
		t.Fatal(err)
	}
	first, err := s.ListCleaningHistory(ctx, "dev-1", "", 2)
	if err != nil || len(first) != 2 {
		t.Fatalf("page one=%v %v", first, err)
	}
	second, err := s.ListCleaningHistory(ctx, "dev-1", first[1].CreatedAt.Format(time.RFC3339Nano), 2)
	if err != nil || len(second) != 1 {
		t.Fatalf("page two=%v %v", second, err)
	}
	if second[0].ID == first[1].ID || *second[0].CleanedArea != 5 {
		t.Fatal("pagination repeated or skipped a meaningful run")
	}
	all, err := s.ListCleaningTasks(ctx, "dev-1", "", 20)
	if err != nil || len(all) != 5 {
		t.Fatal("empty runs were deleted from stored history")
	}
}
