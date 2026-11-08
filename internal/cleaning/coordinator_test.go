package cleaning

import (
	"context"
	"errors"
	"testing"
	"time"
)

type taskMemory struct{ task *Task }

func (s *taskMemory) CreateCleaningTask(_ context.Context, t Task) error {
	if s.task != nil && s.task.State.Active() {
		return errors.New("busy")
	}
	s.task = &t
	return nil
}
func (s *taskMemory) GetCleaningTaskByRequest(_ context.Context, id string) (*Task, error) {
	if s.task != nil && s.task.RequestID == id {
		copy := *s.task
		return &copy, nil
	}
	return nil, nil
}
func (s *taskMemory) ListCleaningTasks(context.Context, string, string, int) ([]Task, error) {
	if s.task == nil {
		return nil, nil
	}
	return []Task{*s.task}, nil
}
func (s *taskMemory) TransitionCleaningTask(_ context.Context, id string, from, to TaskState, message string, at time.Time) error {
	if s.task == nil || s.task.ID != id || s.task.State != from {
		return errors.New("conflict")
	}
	s.task.State = to
	s.task.UpdatedAt = at
	s.task.Error = message
	return nil
}

type testOutput struct {
	calls int
	err   error
}

func (o *testOutput) SubmitCleaning(context.Context, Operation) error { o.calls++; return o.err }

func TestCoordinatorDoesNotReplayAcceptedStart(t *testing.T) {
	store := &taskMemory{}
	output := &testOutput{}
	coordinator := NewCoordinator(store, output)
	at := time.Now()
	coordinator.now = func() time.Time { return at }
	plan := Plan{DeviceID: "robot", MapID: "map", RoomIDs: []string{"kitchen"}, AreaIDs: []string{"1"}, Revision: "revision", Options: Options{Repeats: 1}}
	first, err := coordinator.Start(t.Context(), plan, "request", "user")
	if err != nil {
		t.Fatal(err)
	}
	second, err := coordinator.Start(t.Context(), plan, "request", "user")
	if err != nil || first.ID != second.ID || output.calls != 1 {
		t.Fatalf("duplicate start was dispatched: %v calls=%d", err, output.calls)
	}
	if first.State != TaskStarting {
		t.Fatal("dispatch was mistaken for physical confirmation")
	}
	if err := coordinator.Observe(t.Context(), "request", TaskRunning, at.Add(time.Second)); err != nil {
		t.Fatal(err)
	}
	if store.task.State != TaskRunning {
		t.Fatal("observation did not confirm the task")
	}
	if err := coordinator.Observe(t.Context(), "request", TaskPaused, at); err != nil || store.task.State != TaskRunning {
		t.Fatal("stale observation changed task state")
	}
}
func TestCoordinatorPreservesUncertaintyAfterTransportFailure(t *testing.T) {
	store := &taskMemory{}
	output := &testOutput{err: errors.New("timeout")}
	coordinator := NewCoordinator(store, output)
	plan := Plan{DeviceID: "robot", MapID: "map", RoomIDs: []string{"kitchen"}, AreaIDs: []string{"1"}, Revision: "revision"}
	task, err := coordinator.Start(t.Context(), plan, "request", "user")
	if err == nil || task == nil || task.State != TaskUnknown {
		t.Fatalf("ambiguous result lost: %+v %v", task, err)
	}
	if !task.State.Active() {
		t.Fatal("uncertain task released the execution slot")
	}
	if _, err := coordinator.Start(t.Context(), plan, "request", "user"); err != nil || output.calls != 1 {
		t.Fatal("ambiguous start was retried")
	}
}

func TestCoordinatorReleasesSlotForRejectedOperation(t *testing.T) {
	storage := &taskMemory{}
	output := &testOutput{err: Reject(errors.New("room map changed"))}
	coordinator := NewCoordinator(storage, output)
	plan := Plan{DeviceID: "robot", MapID: "map", RoomIDs: []string{"kitchen"}, AreaIDs: []string{"1"}, Revision: "revision"}
	task, err := coordinator.Start(t.Context(), plan, "request", "user")
	if err == nil || task == nil || task.State != TaskFailed || task.State.Active() {
		t.Fatalf("definitive rejection retained the slot: %+v %v", task, err)
	}
}
