package cleaning

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func (s *serviceMemory) IngestCleaningHistory(context.Context, string, []HistoryRecord) error {
	return nil
}

type serviceMemory struct {
	taskMemory
	snapshot Snapshot
	links    []RoomLinks
}

func (s *serviceMemory) ListCleaningSnapshots(context.Context) ([]Snapshot, error) {
	return []Snapshot{s.snapshot}, nil
}
func (s *serviceMemory) GetActiveCleaningTask(context.Context, string) (*Task, error) {
	if s.task == nil || !s.task.State.Active() {
		return nil, nil
	}
	copy := *s.task
	return &copy, nil
}
func (s *serviceMemory) GetCleaningRoomLinks(context.Context, string) ([]RoomLinks, error) {
	return s.links, nil
}
func (s *serviceMemory) ReplaceCleaningRoomLinks(context.Context, string, RoomLinks) error {
	return nil
}
func (s *serviceMemory) CleaningRooms(context.Context) ([]RoomIdentity, error) {
	return []RoomIdentity{{ID: "kitchen", Name: "Kitchen"}}, nil
}
func (s *serviceMemory) CleaningRoomAreas(context.Context) (map[string]float64, error) {
	return nil, nil
}
func (s *serviceMemory) CleaningAreaHistory(context.Context, string, string) ([]Task, error) {
	return nil, nil
}
func (s *serviceMemory) ListCleaningHistory(ctx context.Context, id, before string, limit int) ([]Task, error) {
	return s.ListCleaningTasks(ctx, id, before, limit)
}
func (s *serviceMemory) CleaningFloorplan(context.Context) (string, int64, error) {
	return "floor", 1, nil
}
func (s *serviceMemory) GetCleaningCalibration(context.Context, string, string, string) (*Calibration, error) {
	return nil, nil
}
func (s *serviceMemory) SaveCleaningCalibration(context.Context, Calibration) error { return nil }

func TestReconcilePreservesAutomaticBatteryReturn(t *testing.T) {
	at := time.Now()
	storage := &serviceMemory{taskMemory: taskMemory{task: &Task{ID: "task", DeviceID: "robot", RequestID: "request", State: TaskRunning, CreatedAt: at, UpdatedAt: at}}}
	service := NewService(storage, device.NewMemoryStore(), &testOutput{}, eventbus.NewChannelBus())
	snapshot := Snapshot{DeviceID: "robot", Status: StatusReturning, UpdatedAt: at.Add(time.Second)}
	if err := service.reconcile(t.Context(), snapshot); err != nil {
		t.Fatal(err)
	}
	active := 1
	snapshot.Status = StatusDocked
	snapshot.TaskStatus = &active
	snapshot.UpdatedAt = at.Add(2 * time.Second)
	if err := service.reconcile(t.Context(), snapshot); err != nil {
		t.Fatal(err)
	}
	if storage.task.State != TaskRunning {
		t.Fatalf("battery return ended the task: %s", storage.task.State)
	}
}
func TestReconcileManualStopWaitsForReportedIdle(t *testing.T) {
	at := time.Now()
	storage := &serviceMemory{taskMemory: taskMemory{task: &Task{ID: "task", DeviceID: "robot", RequestID: "request", State: TaskStopping, CreatedAt: at, UpdatedAt: at}}}
	service := NewService(storage, device.NewMemoryStore(), &testOutput{}, eventbus.NewChannelBus())
	if err := service.reconcile(t.Context(), Snapshot{DeviceID: "robot", Status: StatusCleaning, UpdatedAt: at.Add(time.Second)}); err != nil {
		t.Fatal(err)
	}
	if storage.task.State != TaskStopping {
		t.Fatal("late cleaning report erased the stop request")
	}
	if err := service.reconcile(t.Context(), Snapshot{DeviceID: "robot", Status: StatusIdle, UpdatedAt: at.Add(2 * time.Second)}); err != nil {
		t.Fatal(err)
	}
	if storage.task.State != TaskCancelled {
		t.Fatal("confirmed stop was not recorded")
	}
}
func TestReconcileDoesNotFailStartOnAnEarlyIdleReport(t *testing.T) {
	at := time.Now()
	storage := &serviceMemory{taskMemory: taskMemory{task: &Task{ID: "task", DeviceID: "robot", RequestID: "request", State: TaskUnknown, CreatedAt: at, UpdatedAt: at}}}
	service := NewService(storage, device.NewMemoryStore(), &testOutput{}, eventbus.NewChannelBus())
	if err := service.reconcile(t.Context(), Snapshot{DeviceID: "robot", Status: StatusIdle, UpdatedAt: at.Add(time.Second)}); err != nil {
		t.Fatal(err)
	}
	if storage.task.State != TaskUnknown {
		t.Fatal("early idle released the uncertain start")
	}
	if err := service.reconcile(t.Context(), Snapshot{DeviceID: "robot", Status: StatusIdle, UpdatedAt: at.Add(time.Minute)}); err != nil {
		t.Fatal(err)
	}
	if storage.task.State != TaskFailed {
		t.Fatal("confirmed absence of activity retained the execution slot")
	}
}
