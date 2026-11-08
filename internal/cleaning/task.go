package cleaning

import "time"

// TaskState records reported execution progress separately from command acceptance.
type TaskState string

const (
	TaskStarting  TaskState = "starting"
	TaskRunning   TaskState = "running"
	TaskPaused    TaskState = "paused"
	TaskStopping  TaskState = "stopping"
	TaskReturning TaskState = "returning"
	TaskCompleted TaskState = "completed"
	TaskEnded     TaskState = "ended"
	TaskCancelled TaskState = "cancelled"
	TaskFailed    TaskState = "failed"
	TaskUnknown   TaskState = "unknown"
)

// Task retains the resolved plan and origin for one cleaning request.
type Task struct {
	ID                string
	DeviceID          string
	RequestID         string
	Plan              Plan
	State             TaskState
	Origin            string
	Error             string
	CreatedAt         time.Time
	UpdatedAt         time.Time
	CompletedAt       *time.Time
	ProviderHistoryID string
	ElapsedMinutes    *float64
	CleanedArea       *float64
}

// Active reports whether a task owns the vacuum's execution slot.
func (state TaskState) Active() bool {
	switch state {
	case TaskStarting, TaskRunning, TaskPaused, TaskStopping, TaskReturning, TaskUnknown:
		return true
	}
	return false
}

// CanTransition rejects stale or contradictory task lifecycle updates.
func (state TaskState) CanTransition(next TaskState) bool {
	if state == next {
		return true
	}
	if !state.Active() {
		return false
	}
	switch next {
	case TaskFailed, TaskUnknown, TaskCancelled, TaskEnded:
		return true
	case TaskRunning:
		return state == TaskStarting || state == TaskPaused || state == TaskReturning || state == TaskStopping || state == TaskUnknown
	case TaskPaused:
		return state == TaskRunning || state == TaskStarting || state == TaskReturning || state == TaskStopping || state == TaskUnknown
	case TaskStopping, TaskReturning:
		return true
	case TaskCompleted:
		return state == TaskRunning || state == TaskReturning || state == TaskUnknown
	}
	return false
}

// Calibration persists the landmarks used to place one robot map on a Hive floor plan.
type Calibration struct {
	MapRotation       float64
	Enabled           bool
	DeviceID          string
	MapID             string
	FloorplanID       string
	Revision          int64
	MapRevision       string
	FloorplanRevision int64
	FloorplanGeometry string
	Anchors           []Anchor
}
