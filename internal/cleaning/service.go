package cleaning

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strconv"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
)

var logger = logging.Named("cleaning")

const controlConfirmationTimeout = 30 * time.Second

// Store is the persisted state required by cleaning operations.
type Store interface {
	TaskStore
	ListCleaningSnapshots(context.Context) ([]Snapshot, error)
	GetActiveCleaningTask(context.Context, string) (*Task, error)
	GetCleaningRoomLinks(context.Context, string) ([]RoomLinks, error)
	ReplaceCleaningRoomLinks(context.Context, string, RoomLinks) error
	CleaningRooms(context.Context) ([]RoomIdentity, error)
	CleaningRoomAreas(context.Context) (map[string]float64, error)
	CleaningAreaHistory(context.Context, string, string) ([]Task, error)
	ListCleaningHistory(context.Context, string, string, int) ([]Task, error)
	CleaningFloorplan(context.Context) (string, int64, error)
	GetCleaningCalibration(context.Context, string, string, string) (*Calibration, error)
	SaveCleaningCalibration(context.Context, Calibration) error
	IngestCleaningHistory(context.Context, string, []HistoryRecord) error
}

// BusyError identifies the exact task that an interactive replacement must acknowledge.
type BusyError struct{ TaskID string }

func (e *BusyError) Error() string { return "vacuum is busy" }

// Service owns room resolution, task control and reconciliation with reported state.
type Service struct {
	store       Store
	reader      device.StateReader
	output      Output
	coordinator *Coordinator
	bus         eventbus.EventBus
	operations  sync.Mutex
	now         func() time.Time
}

func NewService(store Store, reader device.StateReader, output Output, bus eventbus.EventBus) *Service {
	return &Service{store: store, reader: reader, output: output, coordinator: NewCoordinator(store, output), bus: bus, now: time.Now}
}

func (s *Service) Snapshots(ctx context.Context) ([]Snapshot, error) {
	snapshots, err := s.store.ListCleaningSnapshots(ctx)
	if err != nil {
		return nil, err
	}
	result := []Snapshot{}
	for _, snap := range snapshots {
		d, ok := s.reader.GetDevice(device.DeviceID(snap.DeviceID))
		if ok && !d.Deleted && !d.Removed {
			result = append(result, snap)
		}
	}
	return result, nil
}
func (s *Service) Snapshot(ctx context.Context, id string) (Snapshot, error) {
	values, err := s.Snapshots(ctx)
	if err != nil {
		return Snapshot{}, err
	}
	for _, v := range values {
		if v.DeviceID == id {
			return v, nil
		}
	}
	return Snapshot{}, errors.New("cleaning device not found")
}
func (s *Service) controllable(ctx context.Context, id string) (Snapshot, error) {
	d, ok := s.reader.GetDevice(device.DeviceID(id))
	if !ok || d.RuntimeDisabled() || d.Removed || !d.Available {
		return Snapshot{}, errors.New("vacuum is unavailable")
	}
	snap, err := s.Snapshot(ctx, id)
	if err != nil {
		return snap, err
	}
	if !snap.Supported {
		return snap, errors.New("cleaning is unsupported on this model")
	}
	if s.now().Sub(snap.UpdatedAt) > 2*time.Minute {
		return snap, errors.New("vacuum status is stale")
	}
	return snap, nil
}
func (s *Service) Prepare(ctx context.Context, id, mapID string, rooms []string, options Options, scope Scope) (Plan, error) {
	snap, err := s.controllable(ctx, id)
	if err != nil {
		return Plan{}, err
	}
	if strconv.Itoa(snap.ActiveMapID) != mapID {
		return Plan{}, errors.New("the robot active map does not match the selected rooms")
	}
	var saved *MapSnapshot
	for i := range snap.Maps {
		if strconv.Itoa(snap.Maps[i].ID) == mapID {
			saved = &snap.Maps[i]
			break
		}
	}
	if saved == nil {
		return Plan{}, errors.New("cleaning map not found")
	}
	links, err := s.store.GetCleaningRoomLinks(ctx, id)
	if err != nil {
		return Plan{}, err
	}
	var assigned *RoomLinks
	for i := range links {
		if links[i].MapID == mapID {
			assigned = &links[i]
			break
		}
	}
	if assigned == nil {
		return Plan{}, errors.New("link Hive rooms before cleaning")
	}
	validRooms, err := s.store.CleaningRooms(ctx)
	if err != nil {
		return Plan{}, err
	}
	valid := map[string]bool{}
	for _, r := range validRooms {
		valid[r.ID] = true
	}
	for _, room := range rooms {
		if !valid[room] {
			return Plan{}, errors.New("selected Hive room no longer exists")
		}
	}
	areas := []string{}
	for _, r := range saved.Rooms {
		areas = append(areas, strconv.Itoa(r.ID))
	}
	return Prepare(id, mapID, assigned.Revision, assigned.Links, areas, rooms, options, scope)
}
func (s *Service) Links(ctx context.Context, id string) ([]RoomLinks, error) {
	if _, err := s.Snapshot(ctx, id); err != nil {
		return nil, err
	}
	return s.store.GetCleaningRoomLinks(ctx, id)
}
func (s *Service) SaveLinks(ctx context.Context, id string, links RoomLinks) error {
	snap, err := s.Snapshot(ctx, id)
	if err != nil {
		return err
	}
	var saved *MapSnapshot
	for i := range snap.Maps {
		if strconv.Itoa(snap.Maps[i].ID) == links.MapID {
			saved = &snap.Maps[i]
			break
		}
	}
	if saved == nil {
		return errors.New("cleaning map not found")
	}
	links.MapRevision = saved.Revision
	rooms, err := s.store.CleaningRooms(ctx)
	if err != nil {
		return err
	}
	validRooms := map[string]bool{}
	for _, r := range rooms {
		validRooms[r.ID] = true
	}
	areas := map[string]bool{}
	for _, a := range saved.Rooms {
		areas[strconv.Itoa(a.ID)] = true
	}
	for _, l := range links.Links {
		if !validRooms[l.RoomID] || !areas[l.AreaID] {
			return errors.New("invalid cleaning room link")
		}
	}
	if err := s.store.ReplaceCleaningRoomLinks(ctx, id, links); err != nil {
		return err
	}
	s.changed(id)
	return nil
}

// Start requires a fresh server preparation and explicit identity for an interrupted task.
func (s *Service) Start(ctx context.Context, approved Plan, requestID, replaceTaskID, origin string) (*Task, error) {
	s.operations.Lock()
	defer s.operations.Unlock()
	existing, err := s.store.GetCleaningTaskByRequest(ctx, requestID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		if existing.DeviceID != approved.DeviceID || existing.Plan.Revision != approved.Revision || existing.Origin != origin {
			return nil, errors.New("request belongs to another task")
		}
		return existing, nil
	}
	plan, err := s.Prepare(ctx, approved.DeviceID, approved.MapID, approved.RoomIDs, approved.Options, approved.Scope)
	if err != nil {
		return nil, err
	}
	if plan.Revision != approved.Revision {
		return nil, errors.New("cleaning selection changed; review before starting")
	}
	current, err := s.store.GetActiveCleaningTask(ctx, plan.DeviceID)
	if err != nil {
		return nil, err
	}
	snap, err := s.controllable(ctx, plan.DeviceID)
	if err != nil {
		return nil, err
	}
	if current != nil || snap.Active() {
		if current == nil {
			return nil, &BusyError{}
		}
		if origin != device.OriginKindUser || replaceTaskID != current.ID {
			return nil, &BusyError{TaskID: current.ID}
		}
		requestedAt := s.now()
		if err := s.sendControl(ctx, plan.DeviceID, "stop", origin, current); err != nil {
			return nil, err
		}
		if err := s.wait(ctx, plan.DeviceID, requestedAt, func(v Snapshot) bool { return v.Status == StatusIdle || v.Status == StatusDocked }); err != nil {
			return nil, s.unconfirmedControl(ctx, current, TaskStopping, err)
		}
		active, err := s.store.GetActiveCleaningTask(ctx, plan.DeviceID)
		if err != nil {
			return nil, err
		}
		if active != nil && active.ID != current.ID {
			return nil, &BusyError{TaskID: active.ID}
		}
		if active != nil {
			if err = s.store.TransitionCleaningTask(ctx, active.ID, active.State, TaskCancelled, "", s.now()); err != nil {
				return nil, err
			}
		}
	} else if replaceTaskID != "" {
		return nil, errors.New("the task to replace has changed")
	}
	fresh, err := s.Prepare(ctx, plan.DeviceID, plan.MapID, plan.RoomIDs, plan.Options, plan.Scope)
	if err != nil {
		return nil, err
	}
	if fresh.Revision != plan.Revision {
		return nil, errors.New("cleaning selection changed; review before starting")
	}
	task, err := s.coordinator.Start(ctx, plan, requestID, origin)
	s.changed(plan.DeviceID)
	return task, err
}
func (s *Service) wait(ctx context.Context, id string, after time.Time, test func(Snapshot) bool) error {
	ctx, cancel := context.WithTimeout(ctx, controlConfirmationTimeout)
	defer cancel()
	ticker := time.NewTicker(250 * time.Millisecond)
	defer ticker.Stop()
	for {
		snap, err := s.Snapshot(ctx, id)
		if err == nil && snap.UpdatedAt.After(after) && test(snap) {
			return nil
		}
		select {
		case <-ctx.Done():
			return errors.New("vacuum did not confirm the requested state")
		case <-ticker.C:
		}
	}
}

func (s *Service) unconfirmedControl(ctx context.Context, task *Task, pending TaskState, failure error) error {
	if task == nil {
		return failure
	}
	ctx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 5*time.Second)
	defer cancel()
	current, err := s.store.GetActiveCleaningTask(ctx, task.DeviceID)
	if err != nil {
		return errors.Join(failure, err)
	}
	if current == nil || current.ID != task.ID || current.State != pending {
		return failure
	}
	if err := s.store.TransitionCleaningTask(ctx, current.ID, pending, TaskUnknown, failure.Error(), s.now()); err != nil {
		return errors.Join(failure, err)
	}
	s.changed(task.DeviceID)
	return failure
}
func (s *Service) sendControl(ctx context.Context, id, action, origin string, current *Task) error {
	taskID := ""
	if current != nil {
		taskID = current.ID
	}
	if current != nil && (action == "stop" || action == "dock") {
		target := TaskStopping
		if action == "dock" {
			target = TaskReturning
		}
		if err := s.store.TransitionCleaningTask(ctx, current.ID, current.State, target, "", s.now()); err != nil {
			return err
		}
	}
	err := s.output.SubmitCleaning(ctx, Operation{DeviceID: id, TaskID: taskID, Action: action, Origin: origin})
	if err != nil && current != nil && (action == "stop" || action == "dock") {
		pending := TaskStopping
		if action == "dock" {
			pending = TaskReturning
		}
		target := TaskUnknown
		if IsRejected(err) {
			target = current.State
		}
		if saveErr := s.store.TransitionCleaningTask(context.WithoutCancel(ctx), current.ID, pending, target, err.Error(), s.now()); saveErr != nil {
			return errors.Join(err, saveErr)
		}
	}
	return err
}
func (s *Service) Control(ctx context.Context, id, action, origin string) error {
	s.operations.Lock()
	defer s.operations.Unlock()
	snap, err := s.controllable(ctx, id)
	if err != nil {
		return err
	}
	if !snap.Supports(Action(action)) {
		return errors.New("vacuum does not support this action")
	}
	current, err := s.store.GetActiveCleaningTask(ctx, id)
	if err != nil {
		return err
	}
	if action != string(ActionStop) {
		enabled := false
		for _, control := range Controls(snap, current, true) {
			if control.Action == Action(action) && control.Enabled {
				enabled = true
			}
		}
		if !enabled {
			return errors.New("cleaning action is unavailable in the current state")
		}
	}
	requestedAt := s.now()
	err = s.sendControl(ctx, id, action, origin, current)
	s.changed(id)
	if err != nil {
		return err
	}
	switch action {
	case "pause":
		return s.wait(ctx, id, requestedAt, func(v Snapshot) bool { return v.Status == StatusPaused })
	case "resume":
		return s.wait(ctx, id, requestedAt, func(v Snapshot) bool { return v.Status == StatusCleaning })
	case "stop":
		err = s.wait(ctx, id, requestedAt, func(v Snapshot) bool { return v.Status == StatusIdle || v.Status == StatusDocked })
		if err != nil {
			return s.unconfirmedControl(ctx, current, TaskStopping, err)
		}
	case "dock":
		err = s.wait(ctx, id, requestedAt, func(v Snapshot) bool { return v.Status == StatusReturning || v.Status == StatusDocked })
		if err != nil {
			return s.unconfirmedControl(ctx, current, TaskReturning, err)
		}
	}
	return nil
}
func (s *Service) Calibration(ctx context.Context, id, mapID, floorplanID string) (*Calibration, error) {
	if _, err := s.Snapshot(ctx, id); err != nil {
		return nil, err
	}
	return s.store.GetCleaningCalibration(ctx, id, mapID, floorplanID)
}

// ResetConsumable confirms a vacuum's maintenance-counter reset.
func (s *Service) ResetConsumable(ctx context.Context, id, name, origin string) error {
	snap, err := s.controllable(ctx, id)
	if err != nil {
		return err
	}
	supported := false
	for _, item := range snap.Consumables {
		if item.Name == name && item.Resettable {
			supported = true
		}
	}
	if !supported {
		return errors.New("vacuum does not support this maintenance reset")
	}
	requestedAt := s.now()
	if err := s.output.SubmitCleaning(ctx, Operation{DeviceID: id, Action: "reset_consumable", Consumable: name, Origin: origin}); err != nil {
		return err
	}
	return s.wait(ctx, id, requestedAt, func(current Snapshot) bool {
		for _, item := range current.Consumables {
			if item.Name == name && item.Percent == 100 {
				return true
			}
		}
		return false
	})
}
func (s *Service) SaveCalibration(ctx context.Context, c Calibration) error {
	if !finite(c.MapRotation) {
		return errors.New("map rotation must be finite")
	}
	c.MapRotation = math.Mod(math.Mod(c.MapRotation, 360)+360, 360)
	snap, err := s.Snapshot(ctx, c.DeviceID)
	if err != nil {
		return err
	}
	valid := false
	for _, m := range snap.Maps {
		if strconv.Itoa(m.ID) == c.MapID {
			valid = true
			c.MapRevision = m.Revision
		}
	}
	if !valid {
		return errors.New("cleaning map changed; reload before aligning")
	}
	id, revision, err := s.store.CleaningFloorplan(ctx)
	if err != nil {
		return err
	}
	if id != c.FloorplanID || revision != c.FloorplanRevision {
		return errors.New("floor plan changed; reload before aligning")
	}
	if err := s.store.SaveCleaningCalibration(ctx, c); err != nil {
		return err
	}
	s.changed(c.DeviceID)
	return nil
}
func (s *Service) History(ctx context.Context, id, before string, limit int) ([]Task, error) {
	if _, err := s.Snapshot(ctx, id); err != nil {
		return nil, err
	}
	return s.store.ListCleaningHistory(ctx, id, before, limit)
}
func (s *Service) ActiveTask(ctx context.Context, id string) (*Task, error) {
	if _, err := s.Snapshot(ctx, id); err != nil {
		return nil, err
	}
	return s.store.GetActiveCleaningTask(ctx, id)
}
func (s *Service) changed(id string) {
	s.bus.Publish(eventbus.Event{Type: eventbus.EventCleaningChanged, DeviceID: id, Timestamp: s.now()})
}
func (s *Service) Run(ctx context.Context) {
	historyAt := map[string]time.Time{}
	updates := s.bus.Subscribe(eventbus.EventCleaningUpdated)
	defer s.bus.Unsubscribe(updates)
	for {
		select {
		case <-ctx.Done():
			return
		case event := <-updates:
			if snap, ok := event.Payload.(Snapshot); ok {
				if err := s.reconcile(ctx, snap); err != nil {
					logger.Warn("task reconciliation failed", "device_id", snap.DeviceID, "error", err)
				}
				if snap.HistoryAt.After(historyAt[snap.DeviceID]) {
					if err := s.store.IngestCleaningHistory(ctx, snap.DeviceID, snap.History); err != nil {
						logger.Warn("cleaning history import failed", "device_id", snap.DeviceID, "error", err)
					} else {
						historyAt[snap.DeviceID] = snap.HistoryAt
					}
				}
				s.changed(snap.DeviceID)
			}
		}
	}
}
func (s *Service) reconcile(ctx context.Context, snap Snapshot) error {
	current, err := s.store.GetActiveCleaningTask(ctx, snap.DeviceID)
	if err != nil {
		return err
	}
	if current == nil {
		if snap.Status != StatusCleaning && snap.Status != StatusPaused {
			return nil
		}
		at := snap.UpdatedAt
		if snap.ElapsedMinutes != nil {
			at = at.Add(-time.Duration(*snap.ElapsedMinutes * float64(time.Minute)))
		}
		task := Task{ID: uuid.NewString(), DeviceID: snap.DeviceID, RequestID: uuid.NewString(), State: TaskStarting, Origin: "external", Plan: Plan{DeviceID: snap.DeviceID, MapID: strconv.Itoa(snap.ActiveMapID)}, CreatedAt: at, UpdatedAt: at}
		if err = s.store.CreateCleaningTask(ctx, task); err != nil {
			return err
		}
		current = &task
	}
	if !snap.UpdatedAt.After(current.UpdatedAt) {
		return nil
	}
	next := current.State
	pendingControl := current.State == TaskStopping || current.State == TaskReturning
	controlExpired := pendingControl && snap.UpdatedAt.Sub(current.UpdatedAt) >= controlConfirmationTimeout
	switch snap.Status {
	case StatusCleaning:
		if !pendingControl || controlExpired {
			next = TaskRunning
		}
	case StatusPaused:
		if !pendingControl || controlExpired {
			next = TaskPaused
		}
	case StatusAttention:
		next = TaskFailed
	case StatusReturning:
		return nil
	case StatusIdle, StatusDocked:
		if snap.TaskStatus != nil && *snap.TaskStatus != 0 && current.State != TaskStopping && current.State != TaskReturning {
			return nil
		}
		if current.State == TaskStopping || current.State == TaskReturning {
			next = TaskCancelled
		} else if (current.State == TaskStarting || current.State == TaskUnknown) && snap.UpdatedAt.Sub(current.CreatedAt) < 30*time.Second {
			return nil
		} else if current.State == TaskStarting || current.State == TaskUnknown {
			next = TaskFailed
		} else {
			next = TaskEnded
		}
	}
	if next == current.State {
		return nil
	}
	if !current.State.CanTransition(next) {
		return fmt.Errorf("cannot reconcile %s to %s", current.State, next)
	}
	return s.store.TransitionCleaningTask(ctx, current.ID, current.State, next, snap.Error, snap.UpdatedAt)
}
