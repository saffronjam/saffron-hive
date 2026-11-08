package cleaning

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

type confirmationOutput struct {
	operations []Operation
	apply      func(Operation)
}

func (o *confirmationOutput) SubmitCleaning(_ context.Context, op Operation) error {
	o.operations = append(o.operations, op)
	if o.apply != nil {
		o.apply(op)
	}
	return nil
}
func confirmationService(storage *serviceMemory, out *confirmationOutput) *Service {
	reader := device.NewMemoryStore()
	reader.Register(device.Device{ID: "robot", Available: true})
	return NewService(storage, reader, out, eventbus.NewChannelBus())
}
func TestReplacementRequiresFreshStoppedReport(t *testing.T) {
	for _, fresh := range []bool{false, true} {
		t.Run(map[bool]string{false: "stale", true: "fresh"}[fresh], func(t *testing.T) {
			now := time.Now()
			storage := &serviceMemory{snapshot: Snapshot{DeviceID: "robot", Supported: true, Status: StatusIdle, UpdatedAt: now.Add(-time.Second), ActiveMapID: 7, Maps: []MapSnapshot{{ID: 7, Rooms: []MapRoom{{ID: 1}}}}}, links: []RoomLinks{{MapID: "7", Revision: 1, Links: []RoomLink{{RoomID: "kitchen", AreaID: "1"}}}}}
			out := &confirmationOutput{apply: func(op Operation) {
				if fresh && op.Action == "stop" {
					storage.snapshot.UpdatedAt = time.Now()
				}
			}}
			service := confirmationService(storage, out)
			plan, err := service.Prepare(t.Context(), "robot", "7", []string{"kitchen"}, Options{Repeats: 1}, ScopeRooms)
			if err != nil {
				t.Fatal(err)
			}
			first, err := service.Start(t.Context(), plan, "request-1", "", device.OriginKindUser)
			if err != nil {
				t.Fatal(err)
			}
			ctx, cancel := context.WithTimeout(t.Context(), 20*time.Millisecond)
			defer cancel()
			second, err := service.Start(ctx, plan, "request-2", first.ID, device.OriginKindUser)
			if fresh {
				if err != nil || second == nil || len(out.operations) != 3 {
					t.Fatalf("fresh replacement failed: %+v %v", second, err)
				}
			} else if err == nil || second != nil || len(out.operations) != 2 || !storage.task.State.Active() {
				t.Fatalf("stale report admitted replacement: %+v %v ops=%d state=%s", second, err, len(out.operations), storage.task.State)
			}
		})
	}
}
func TestDockTimeoutRestoresControlsFromReportedState(t *testing.T) {
	now := time.Now()
	storage := &serviceMemory{taskMemory: taskMemory{task: &Task{ID: "task", DeviceID: "robot", RequestID: "request", State: TaskRunning, CreatedAt: now.Add(-time.Minute), UpdatedAt: now.Add(-time.Second)}}, snapshot: Snapshot{DeviceID: "robot", Supported: true, Status: StatusCleaning, UpdatedAt: now, Actions: []Action{ActionDock, ActionPause}}}
	out := &confirmationOutput{}
	service := confirmationService(storage, out)
	ctx, cancel := context.WithTimeout(t.Context(), 20*time.Millisecond)
	defer cancel()
	if err := service.Control(ctx, "robot", "dock", device.OriginKindUser); err == nil {
		t.Fatal("unconfirmed dock succeeded")
	}
	if storage.task.State != TaskUnknown {
		t.Fatalf("timed-out task still claims %s", storage.task.State)
	}
	storage.snapshot.UpdatedAt = time.Now()
	if err := service.reconcile(t.Context(), storage.snapshot); err != nil {
		t.Fatal(err)
	}
	if storage.task.State != TaskRunning {
		t.Fatal("reported cleaning did not restore running state")
	}
	out.apply = func(op Operation) {
		if op.Action == "pause" {
			storage.snapshot.Status = StatusPaused
			storage.snapshot.UpdatedAt = time.Now()
		}
	}
	if err := service.Control(t.Context(), "robot", "pause", device.OriginKindUser); err != nil {
		t.Fatalf("pause remained unavailable: %v", err)
	}
}
func TestExpiredControlIntentReconcilesAfterRestart(t *testing.T) {
	for _, state := range []TaskState{TaskReturning, TaskStopping} {
		now := time.Now()
		storage := &serviceMemory{taskMemory: taskMemory{task: &Task{ID: "task", State: state, CreatedAt: now.Add(-time.Hour), UpdatedAt: now.Add(-controlConfirmationTimeout - time.Second)}}}
		service := confirmationService(storage, &confirmationOutput{})
		if err := service.reconcile(t.Context(), Snapshot{DeviceID: "robot", Status: StatusCleaning, UpdatedAt: now}); err != nil {
			t.Fatal(err)
		}
		if storage.task.State != TaskRunning {
			t.Fatalf("expired %s intent blocked reported cleaning", state)
		}
	}
}
