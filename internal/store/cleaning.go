package store

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"sort"
	"time"

	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// DreameConfig holds the account settings for the opt-in Dreame integration.
type DreameConfig struct {
	Revision int64
	Email    string
	Password string
	Region   string
	Enabled  bool
}

func (s *DB) GetDreameConfig(ctx context.Context) (*DreameConfig, error) {
	row, err := s.q.GetDreameConfig(ctx)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &DreameConfig{row.Revision, row.Email, row.Password, row.Region, row.Enabled}, nil
}
func (s *DB) UpsertDreameConfig(ctx context.Context, cfg DreameConfig) error {
	return s.atomic(ctx, func(s *DB) error {
		n, err := s.q.UpsertDreameConfig(ctx, sqlite.UpsertDreameConfigParams{ExpectedRevision: cfg.Revision, Email: cfg.Email, Password: cfg.Password, Region: cfg.Region, Enabled: cfg.Enabled})
		if err != nil {
			return err
		}
		if n != 1 {
			return ErrRevisionConflict
		}
		return nil

	})
}
func (s *DB) DeleteDreameConfig(ctx context.Context) error {
	return s.atomic(ctx, func(s *DB) error { return s.q.DeleteDreameConfig(ctx) })
}

func (s *DB) GetCleaningRoomLinks(ctx context.Context, deviceID string) ([]cleaning.RoomLinks, error) {
	rows, err := s.q.ListCleaningRoomLinks(ctx, deviceID)
	if err != nil {
		return nil, err
	}
	result := []cleaning.RoomLinks{}
	for _, r := range rows {
		if len(result) == 0 || result[len(result)-1].MapID != r.MapID {
			result = append(result, cleaning.RoomLinks{MapID: r.MapID, Revision: r.Revision, Links: []cleaning.RoomLink{}})
		}
		i := len(result) - 1
		if r.RoomID != nil && r.AreaID != nil {
			if r.MapRevision != nil {
				result[i].MapRevision = *r.MapRevision
			}
			result[i].Links = append(result[i].Links, cleaning.RoomLink{RoomID: *r.RoomID, AreaID: *r.AreaID})
		}
	}
	return result, nil
}
func (s *DB) ReplaceCleaningRoomLinks(ctx context.Context, deviceID string, links cleaning.RoomLinks) error {
	return s.atomic(ctx, func(tx *DB) error {
		n, err := tx.q.AdvanceCleaningLinkRevision(ctx, sqlite.AdvanceCleaningLinkRevisionParams{DeviceID: deviceID, MapID: links.MapID, ExpectedRevision: links.Revision})
		if err != nil {
			return err
		}
		if n != 1 {
			return ErrRevisionConflict
		}
		if err := tx.q.DeleteCleaningRoomLinks(ctx, sqlite.DeleteCleaningRoomLinksParams{DeviceID: deviceID, MapID: links.MapID}); err != nil {
			return err
		}
		for _, link := range links.Links {
			if err := tx.q.InsertCleaningRoomLink(ctx, sqlite.InsertCleaningRoomLinkParams{DeviceID: deviceID, MapID: links.MapID, RoomID: link.RoomID, AreaID: link.AreaID, MapRevision: links.MapRevision}); err != nil {
				return err
			}
		}
		return nil
	})
}
func (s *DB) GetCleaningCalibration(ctx context.Context, deviceID, mapID, floorplanID string) (*cleaning.Calibration, error) {
	row, err := s.q.GetCleaningCalibration(ctx, sqlite.GetCleaningCalibrationParams{DeviceID: deviceID, MapID: mapID, FloorplanID: floorplanID})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	result := &cleaning.Calibration{MapRotation: row.MapRotation, Enabled: row.Enabled, DeviceID: deviceID, MapID: mapID, FloorplanID: floorplanID, Revision: row.Revision, MapRevision: row.MapRevision, FloorplanRevision: row.FloorplanRevision, FloorplanGeometry: row.FloorplanGeometry}
	if err = json.Unmarshal([]byte(row.Anchors), &result.Anchors); err != nil {
		return nil, err
	}
	return result, nil
}
func (s *DB) SaveCleaningCalibration(ctx context.Context, c cleaning.Calibration) error {
	return s.atomic(ctx, func(s *DB) error {
		if err := c.Validate(); err != nil {
			return err
		}
		raw, err := json.Marshal(c.Anchors)
		if err != nil {
			return err
		}
		plan, err := s.GetFloorplanGraph(ctx)
		if err != nil {
			return err
		}
		if plan == nil || plan.ID != c.FloorplanID || plan.Revision != c.FloorplanRevision {
			return ErrRevisionConflict
		}
		c.FloorplanGeometry = FloorplanGeometry(plan)
		n, err := s.q.UpsertCleaningCalibration(ctx, sqlite.UpsertCleaningCalibrationParams{DeviceID: c.DeviceID, MapID: c.MapID, FloorplanID: c.FloorplanID, ExpectedRevision: c.Revision, MapRevision: c.MapRevision, FloorplanRevision: c.FloorplanRevision, FloorplanGeometry: c.FloorplanGeometry, Anchors: string(raw), Enabled: c.Enabled, MapRotation: c.MapRotation})
		if err != nil {
			return err
		}
		if n != 1 {
			return ErrRevisionConflict
		}
		return nil

	})
}

func (s *DB) CreateCleaningTask(ctx context.Context, t cleaning.Task) error {
	if t.State != cleaning.TaskStarting {
		return errors.New("a cleaning request must begin in the starting state")
	}
	if t.ID == "" || t.RequestID == "" || t.DeviceID == "" || t.Plan.DeviceID != t.DeviceID || t.CreatedAt.IsZero() {
		return errors.New("incomplete cleaning request")
	}
	raw, err := json.Marshal(t.Plan)
	if err != nil {
		return err
	}
	return s.q.InsertCleaningTask(ctx, sqlite.InsertCleaningTaskParams{ID: t.ID, DeviceID: t.DeviceID, RequestID: t.RequestID, Plan: string(raw), State: string(t.State), Origin: t.Origin, CreatedAt: t.CreatedAt.UTC().Format("2006-01-02T15:04:05.000000000Z07:00")})
}
func cleaningTask(row sqlite.CleaningTask) (cleaning.Task, error) {
	t := cleaning.Task{ID: row.ID, DeviceID: row.DeviceID, RequestID: row.RequestID, State: cleaning.TaskState(row.State), Origin: row.Origin, Error: row.Error, ElapsedMinutes: row.ElapsedMinutes, CleanedArea: row.CleanedArea}
	if row.ProviderHistoryID != nil {
		t.ProviderHistoryID = *row.ProviderHistoryID
	}
	if err := json.Unmarshal([]byte(row.Plan), &t.Plan); err != nil {
		return t, err
	}
	var err error
	if t.CreatedAt, err = time.Parse(time.RFC3339Nano, row.CreatedAt); err != nil {
		return t, err
	}
	if t.UpdatedAt, err = time.Parse(time.RFC3339Nano, row.UpdatedAt); err != nil {
		return t, err
	}
	if row.CompletedAt != nil {
		at, err := time.Parse(time.RFC3339Nano, *row.CompletedAt)
		if err != nil {
			return t, err
		}
		t.CompletedAt = &at
	}
	return t, nil
}
func (s *DB) GetCleaningTaskByRequest(ctx context.Context, requestID string) (*cleaning.Task, error) {
	row, err := s.q.GetCleaningTaskByRequest(ctx, requestID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	task, err := cleaningTask(row)
	return &task, err
}
func (s *DB) ListCleaningTasks(ctx context.Context, deviceID, before string, limit int) ([]cleaning.Task, error) {
	if before != "" {
		stamp, err := time.Parse(time.RFC3339Nano, before)
		if err != nil {
			return nil, fmt.Errorf("invalid cleaning history cursor: %w", err)
		}
		before = stamp.UTC().Format("2006-01-02T15:04:05.000000000Z07:00")
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	rows, err := s.q.ListCleaningTasks(ctx, sqlite.ListCleaningTasksParams{DeviceID: deviceID, Before: before, PageLimit: int64(limit)})
	if err != nil {
		return nil, err
	}
	result := []cleaning.Task{}
	for _, row := range rows {
		task, err := cleaningTask(row)
		if err != nil {
			return nil, err
		}
		result = append(result, task)
	}
	return result, nil
}
func (s *DB) ListCleaningHistory(ctx context.Context, deviceID, before string, limit int) ([]cleaning.Task, error) {
	if before != "" {
		stamp, err := time.Parse(time.RFC3339Nano, before)
		if err != nil {
			return nil, fmt.Errorf("invalid cleaning history cursor: %w", err)
		}
		before = stamp.UTC().Format("2006-01-02T15:04:05.000000000Z07:00")
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	rows, err := s.q.ListCleaningHistory(ctx, sqlite.ListCleaningHistoryParams{DeviceID: deviceID, Before: before, PageLimit: int64(limit)})
	if err != nil {
		return nil, err
	}
	result := []cleaning.Task{}
	for _, row := range rows {
		task, err := cleaningTask(row)
		if err != nil {
			return nil, err
		}
		result = append(result, task)
	}
	return result, nil
}
func (s *DB) TransitionCleaningTask(ctx context.Context, id string, from, to cleaning.TaskState, message string, at time.Time) error {
	if !from.CanTransition(to) {
		return fmt.Errorf("invalid cleaning transition from %s to %s", from, to)
	}
	stamp := at.UTC().Format("2006-01-02T15:04:05.000000000Z07:00")
	var completed *string
	if !to.Active() {
		completed = &stamp
	}
	n, err := s.q.UpdateCleaningTask(ctx, sqlite.UpdateCleaningTaskParams{ID: id, ExpectedState: string(from), State: string(to), Error: message, UpdatedAt: stamp, CompletedAt: completed})
	if err != nil {
		return err
	}
	if n != 1 {
		return ErrRevisionConflict
	}
	return nil
}

// DreameDevice retains the provider identity needed to reconnect a Hive device.
type DreameDevice struct {
	DeviceID   device.DeviceID
	AccountID  string
	ExternalID string
	Model      string
	Shard      string
}

func (s *DB) RegisterDreameDevice(ctx context.Context, d device.Device, identity DreameDevice) error {
	return s.atomic(ctx, func(tx *DB) error {
		if err := tx.UpsertDevice(ctx, CreateDeviceParams{ID: d.ID, FriendlyName: d.FriendlyName, Source: d.Source, Type: d.Type, Capabilities: d.Capabilities}); err != nil {
			return err
		}
		return tx.q.UpsertDreameDevice(ctx, sqlite.UpsertDreameDeviceParams{DeviceID: string(identity.DeviceID), AccountID: identity.AccountID, ExternalID: identity.ExternalID, Model: identity.Model, Shard: identity.Shard})
	})
}
func (s *DB) ListDreameDevices(ctx context.Context) ([]DreameDevice, error) {
	rows, err := s.q.ListDreameDevices(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]DreameDevice, 0, len(rows))
	for _, r := range rows {
		result = append(result, DreameDevice{device.DeviceID(r.DeviceID), r.AccountID, r.ExternalID, r.Model, r.Shard})
	}
	return result, nil
}
func (s *DB) SaveCleaningSnapshot(ctx context.Context, snapshot cleaning.Snapshot) error {
	raw, err := json.Marshal(snapshot)
	if err != nil {
		return err
	}
	return s.q.SaveCleaningSnapshot(ctx, sqlite.SaveCleaningSnapshotParams{DeviceID: snapshot.DeviceID, Snapshot: string(raw)})
}
func (s *DB) ListCleaningSnapshots(ctx context.Context) ([]cleaning.Snapshot, error) {
	rows, err := s.q.ListCleaningSnapshots(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]cleaning.Snapshot, 0, len(rows))
	for _, r := range rows {
		var snapshot cleaning.Snapshot
		if err = json.Unmarshal([]byte(r.Snapshot), &snapshot); err != nil {
			return nil, err
		}
		result = append(result, snapshot)
	}
	return result, nil
}
func (s *DB) GetActiveCleaningTask(ctx context.Context, deviceID string) (*cleaning.Task, error) {
	row, err := s.q.GetActiveCleaningTask(ctx, deviceID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	task, err := cleaningTask(row)
	return &task, err
}

func (s *DB) CleaningRooms(ctx context.Context) ([]cleaning.RoomIdentity, error) {
	rooms, err := s.ListRooms(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]cleaning.RoomIdentity, 0, len(rooms))
	for _, r := range rooms {
		result = append(result, cleaning.RoomIdentity{ID: r.ID, Name: r.Name})
	}
	return result, nil
}
func (s *DB) CleaningFloorplan(ctx context.Context) (string, int64, error) {
	plan, err := s.GetFloorplanGraph(ctx)
	if err != nil || plan == nil {
		return "", 0, err
	}
	return plan.ID, plan.Revision, nil
}

// FloorplanGeometry identifies the wall geometry used for cleaning alignment.
func FloorplanGeometry(plan *Floorplan) string {
	vertices := append([]FloorplanVertex(nil), plan.Vertices...)
	walls := append([]FloorplanWall(nil), plan.Walls...)
	sort.Slice(vertices, func(i, j int) bool { return vertices[i].ID < vertices[j].ID })
	sort.Slice(walls, func(i, j int) bool { return walls[i].ID < walls[j].ID })
	data, _ := json.Marshal(struct {
		Vertices []FloorplanVertex
		Walls    []FloorplanWall
	}{vertices, walls})
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

// IngestCleaningHistory attaches reported outcomes to matching requests and retains external runs.
func (s *DB) IngestCleaningHistory(ctx context.Context, deviceID string, records []cleaning.HistoryRecord) error {
	return s.atomic(ctx, func(s *DB) error {
		tasks, err := s.ListCleaningTasks(ctx, deviceID, "", 100)
		if err != nil {
			return err
		}
		for _, record := range records {
			if record.ID == "" || record.StartedAt.IsZero() || record.FinishedAt.Before(record.StartedAt) {
				continue
			}
			state := cleaning.TaskEnded
			if record.Completed != nil && *record.Completed {
				state = cleaning.TaskCompleted
			}
			var match *cleaning.Task
			known, err := s.q.GetCleaningTaskByProviderHistory(ctx, sqlite.GetCleaningTaskByProviderHistoryParams{DeviceID: deviceID, ProviderHistoryID: &record.ID})
			if err == nil {
				task, decodeErr := cleaningTask(known)
				if decodeErr != nil {
					return decodeErr
				}
				match = &task
			} else if !errors.Is(err, sql.ErrNoRows) {
				return err
			}
			if match == nil {
				for i := range tasks {
					t := &tasks[i]
					if t.ProviderHistoryID != "" || record.FinishedAt.Before(t.CreatedAt) {
						continue
					}
					tolerance := 45 * time.Second
					if t.Origin == "external" {
						tolerance = 90 * time.Second
					}
					delta := record.StartedAt.Sub(t.CreatedAt)
					if delta < -tolerance || delta > tolerance {
						continue
					}
					if record.MapID != "" && t.Plan.MapID != "" && record.MapID != t.Plan.MapID {
						continue
					}
					if match != nil {
						match = nil
						break
					}
					match = t
				}
			}
			stamp := record.FinishedAt.UTC().Format("2006-01-02T15:04:05.000000000Z07:00")
			if match != nil {
				if state != cleaning.TaskCompleted && (match.State == cleaning.TaskCancelled || match.State == cleaning.TaskFailed) {
					state = match.State
				}
				if _, err := s.q.AttachCleaningHistory(ctx, sqlite.AttachCleaningHistoryParams{ID: match.ID, ProviderHistoryID: &record.ID, ElapsedMinutes: &record.ElapsedMinutes, CleanedArea: &record.CleanedArea, State: string(state), CompletedAt: &stamp}); err != nil {
					return err
				}
				match.ProviderHistoryID = record.ID
				continue
			}
			key := "cleaning-history:" + deviceID + ":" + record.ID
			id := uuid.NewSHA1(uuid.NameSpaceURL, []byte(key)).String()
			plan, _ := json.Marshal(cleaning.Plan{DeviceID: deviceID, MapID: record.MapID, RoomIDs: []string{}, AreaIDs: []string{}, Options: cleaning.Options{Repeats: 1}})
			if err := s.q.InsertHistoricalCleaningTask(ctx, sqlite.InsertHistoricalCleaningTaskParams{ID: id, DeviceID: deviceID, RequestID: key, Plan: string(plan), State: string(state), CreatedAt: record.StartedAt.UTC().Format("2006-01-02T15:04:05.000000000Z07:00"), CompletedAt: stamp, ProviderHistoryID: &record.ID, ElapsedMinutes: &record.ElapsedMinutes, CleanedArea: &record.CleanedArea}); err != nil {
				return err
			}
		}
		return nil
	})
}

// CleaningAreaHistory returns recent successful coverage samples for a vacuum map.
func (s *DB) CleaningAreaHistory(ctx context.Context, deviceID, mapID string) ([]cleaning.Task, error) {
	rows, err := s.q.ListCleaningAreaHistory(ctx, sqlite.ListCleaningAreaHistoryParams{DeviceID: deviceID, MapID: mapID})
	if err != nil {
		return nil, err
	}
	result := make([]cleaning.Task, 0, len(rows))
	for _, row := range rows {
		task, err := cleaningTask(row)
		if err != nil {
			return nil, err
		}
		result = append(result, task)
	}
	return result, nil
}
