package cleaning

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Operation describes a typed physical cleaning request for the output controller.
type Operation struct {
	TaskID     string
	DeviceID   string
	Action     string
	Consumable string
	Plan       *Plan
	Origin     string
}

// Output is the shared physical-write boundary required by the cleaning coordinator.
type Output interface {
	SubmitCleaning(context.Context, Operation) error
}

// TaskStore persists the execution slot and prevents duplicate requests.
type TaskStore interface {
	CreateCleaningTask(context.Context, Task) error
	GetCleaningTaskByRequest(context.Context, string) (*Task, error)
	ListCleaningTasks(context.Context, string, string, int) ([]Task, error)
	TransitionCleaningTask(context.Context, string, TaskState, TaskState, string, time.Time) error
}

// Coordinator owns serialized starts. Only reported state confirms execution.
type Coordinator struct {
	mu     sync.Mutex
	store  TaskStore
	output Output
	now    func() time.Time
}

func NewCoordinator(store TaskStore, output Output) *Coordinator {
	return &Coordinator{store: store, output: output, now: time.Now}
}

// Start accepts a prepared room selection. Callers must revalidate its revision before admission.
func (c *Coordinator) Start(ctx context.Context, plan Plan, requestID, origin string) (*Task, error) {
	if requestID == "" || origin == "" || plan.DeviceID == "" || plan.Revision == "" || len(plan.RoomIDs) == 0 || len(plan.AreaIDs) == 0 {
		return nil, errors.New("incomplete cleaning request")
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	existing, err := c.store.GetCleaningTaskByRequest(ctx, requestID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		if existing.DeviceID != plan.DeviceID || existing.Plan.Revision != plan.Revision || existing.Origin != origin {
			return nil, errors.New("request ID belongs to a different cleaning task")
		}
		return existing, nil
	}
	if c.output == nil {
		return nil, errors.New("cleaning output is unavailable")
	}
	task := Task{ID: uuid.NewString(), DeviceID: plan.DeviceID, RequestID: requestID, Plan: plan, State: TaskStarting, Origin: origin, CreatedAt: c.now().UTC()}
	task.UpdatedAt = task.CreatedAt
	if err := c.store.CreateCleaningTask(ctx, task); err != nil {
		return nil, fmt.Errorf("cannot reserve cleaning task: %w", err)
	}
	if err := c.output.SubmitCleaning(ctx, Operation{TaskID: task.ID, DeviceID: task.DeviceID, Action: "start", Plan: &task.Plan, Origin: origin}); err != nil {
		// A transport error does not prove that the robot rejected the operation.
		message := "cleaning request could not be confirmed"
		next := TaskUnknown
		if IsRejected(err) {
			next = TaskFailed
			message = err.Error()
		}
		if saveErr := c.store.TransitionCleaningTask(context.WithoutCancel(ctx), task.ID, task.State, next, message, c.now().UTC()); saveErr != nil {
			return nil, errors.Join(err, saveErr)
		}
		task.State = next
		task.Error = message
		return &task, err
	}
	return &task, nil
}

// Observe advances only the task associated with this observation, never a newer run.
func (c *Coordinator) Observe(ctx context.Context, requestID string, state TaskState, observedAt time.Time) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	task, err := c.store.GetCleaningTaskByRequest(ctx, requestID)
	if err != nil {
		return err
	}
	if task == nil {
		return errors.New("cleaning task not found")
	}
	if observedAt.Before(task.UpdatedAt) || !observedAt.After(task.CreatedAt) {
		return nil
	}
	if task.State == state {
		return nil
	}
	if !task.State.CanTransition(state) {
		return fmt.Errorf("invalid reported cleaning state %s", state)
	}
	return c.store.TransitionCleaningTask(ctx, task.ID, task.State, state, "", observedAt)
}
