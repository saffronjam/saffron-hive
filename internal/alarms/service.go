package alarms

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/saffronjam/saffron-hive/internal/store"
)

var logger = slog.Default().With("pkg", "alarms")

// alarmStore is the narrow subset of store methods the service needs.
// *store.DB satisfies it implicitly.
type alarmStore interface {
	InsertAlarmTx(ctx context.Context, p store.InsertAlarmParams) (store.AlarmRow, bool, error)
	DeleteAlarmsByAlarmID(ctx context.Context, alarmID string) (int64, error)
	BatchDeleteAlarmsByAlarmIDs(ctx context.Context, alarmIDs []string) (int64, error)
	ListAlarms(ctx context.Context) ([]store.AlarmRow, error)
}

// Service coordinates alarm raising, deletion, and live fanout. It owns the
// persistence writes and publishes Events onto the Buffer after every
// successful mutation. Callers: system monitor goroutine, automation action
// executor (for raise_alarm / clear_alarm actions), GraphQL mutation
// resolvers.
type Service struct {
	store  alarmStore
	buffer *Buffer
	now    func() time.Time
}

// NewService wires the service to its dependencies.
func NewService(s alarmStore, b *Buffer) *Service {
	return &Service{store: s, buffer: b, now: time.Now}
}

// Raise records a new alarm raise. If another raise with the same AlarmID is
// already present the new row joins that group (Alarm.Count increments, the
// grouped Message becomes the new one). The returned Alarm is the grouped
// projection after the insert.
func (s *Service) Raise(ctx context.Context, p RaiseParams) (Alarm, error) {
	if p.AlarmID == "" {
		return Alarm{}, fmt.Errorf("alarm_id is required")
	}
	if p.Severity != store.AlarmSeverityHigh && p.Severity != store.AlarmSeverityMedium && p.Severity != store.AlarmSeverityLow {
		return Alarm{}, fmt.Errorf("invalid severity %q", p.Severity)
	}
	if p.Kind != store.AlarmKindAuto && p.Kind != store.AlarmKindOneShot {
		return Alarm{}, fmt.Errorf("invalid kind %q", p.Kind)
	}
	if p.Message == "" {
		return Alarm{}, fmt.Errorf("message is required")
	}
	source := p.Source
	if source == "" {
		source = "api"
	}

	insertParams := store.InsertAlarmParams{
		AlarmID:  p.AlarmID,
		Severity: p.Severity,
		Kind:     p.Kind,
		Message:  p.Message,
		Source:   source,
		RaisedAt: s.now(),
	}

	_, _, err := s.store.InsertAlarmTx(ctx, insertParams)
	if err != nil {
		return Alarm{}, fmt.Errorf("raise alarm: %w", err)
	}

	grouped, err := s.getGroup(ctx, p.AlarmID)
	if err != nil {
		return Alarm{}, err
	}
	if grouped == nil {
		return Alarm{}, fmt.Errorf("alarm %q vanished after insert", p.AlarmID)
	}

	s.buffer.Publish(Event{Kind: EventRaised, Alarm: grouped})
	logger.Debug("alarm raised",
		slog.String("alarm_id", p.AlarmID),
		slog.String("severity", string(p.Severity)),
		slog.String("kind", string(p.Kind)),
		slog.String("source", source),
		slog.Int("count", grouped.Count),
	)
	return *grouped, nil
}

// DeleteByAlarmID removes every row in the given alarm group. Returns true if
// at least one row was removed (a no-op delete returns false with no error).
func (s *Service) DeleteByAlarmID(ctx context.Context, alarmID string) (bool, error) {
	if alarmID == "" {
		return false, fmt.Errorf("alarm_id is required")
	}
	n, err := s.store.DeleteAlarmsByAlarmID(ctx, alarmID)
	if err != nil {
		return false, fmt.Errorf("delete alarms by alarm_id: %w", err)
	}
	if n == 0 {
		return false, nil
	}
	s.buffer.Publish(Event{Kind: EventCleared, ClearedAlarmID: alarmID})
	logger.Debug("alarm deleted", slog.String("alarm_id", alarmID), slog.Int64("rows", n))
	return true, nil
}

// BatchDeleteByAlarmIDs removes every row belonging to any of the given alarm
// groups. Returns the number of distinct alarm groups that had at least one
// row removed (i.e. the count the caller most likely wants to surface). One
// EventCleared is published per input alarm_id; subscribers treat events for
// already-absent groups as no-ops.
func (s *Service) BatchDeleteByAlarmIDs(ctx context.Context, alarmIDs []string) (int, error) {
	if len(alarmIDs) == 0 {
		return 0, nil
	}
	before, err := s.activeAlarmIDSet(ctx)
	if err != nil {
		return 0, err
	}
	if _, err := s.store.BatchDeleteAlarmsByAlarmIDs(ctx, alarmIDs); err != nil {
		return 0, fmt.Errorf("batch delete alarms by alarm_id: %w", err)
	}
	cleared := 0
	for _, id := range alarmIDs {
		if _, ok := before[id]; !ok {
			continue
		}
		s.buffer.Publish(Event{Kind: EventCleared, ClearedAlarmID: id})
		cleared++
	}
	logger.Debug("alarms batch deleted", slog.Int("requested", len(alarmIDs)), slog.Int("cleared_groups", cleared))
	return cleared, nil
}

func (s *Service) activeAlarmIDSet(ctx context.Context) (map[string]struct{}, error) {
	rows, err := s.store.ListAlarms(ctx)
	if err != nil {
		return nil, fmt.Errorf("list alarms: %w", err)
	}
	out := make(map[string]struct{}, len(rows))
	for _, r := range rows {
		out[r.AlarmID] = struct{}{}
	}
	return out, nil
}

// ListActive returns every currently-persisted alarm, grouped by alarm_id.
func (s *Service) ListActive(ctx context.Context) ([]Alarm, error) {
	rows, err := s.store.ListAlarms(ctx)
	if err != nil {
		return nil, fmt.Errorf("list alarms: %w", err)
	}
	return groupRows(rows), nil
}

// ActiveAlarmIDsBySource returns the set of currently-active alarm_ids whose
// most recent raise has the given Source. Used by the monitor to scope its
// view to alarms it owns, so one-shot or API-raised alarms with different
// sources are invisible to the monitor and never touched by its clear loop.
func (s *Service) ActiveAlarmIDsBySource(ctx context.Context, source string) (map[string]struct{}, error) {
	alarms, err := s.ListActive(ctx)
	if err != nil {
		return nil, err
	}
	out := make(map[string]struct{}, len(alarms))
	for _, a := range alarms {
		if a.Source != source {
			continue
		}
		out[a.ID] = struct{}{}
	}
	return out, nil
}

func (s *Service) getGroup(ctx context.Context, alarmID string) (*Alarm, error) {
	rows, err := s.store.ListAlarms(ctx)
	if err != nil {
		return nil, fmt.Errorf("list alarms: %w", err)
	}
	var groupRows []store.AlarmRow
	for _, r := range rows {
		if r.AlarmID == alarmID {
			groupRows = append(groupRows, r)
		}
	}
	if len(groupRows) == 0 {
		return nil, nil
	}
	alarm := buildAlarm(groupRows)
	return &alarm, nil
}

// groupRows collapses raw rows into grouped Alarms. Input is assumed to be
// ordered raised_at DESC (ListAlarms guarantees that). The message and
// severity/kind of the most-recent row win; first/last timestamps are derived
// from the group.
func groupRows(rows []store.AlarmRow) []Alarm {
	if len(rows) == 0 {
		return nil
	}
	byID := make(map[string][]store.AlarmRow)
	order := make([]string, 0)
	for _, r := range rows {
		if _, seen := byID[r.AlarmID]; !seen {
			order = append(order, r.AlarmID)
		}
		byID[r.AlarmID] = append(byID[r.AlarmID], r)
	}
	alarms := make([]Alarm, 0, len(order))
	for _, id := range order {
		alarms = append(alarms, buildAlarm(byID[id]))
	}
	return alarms
}

// buildAlarm assumes group is non-empty and ordered raised_at DESC. The
// first element is the latest raise.
func buildAlarm(group []store.AlarmRow) Alarm {
	latest := group[0]
	first := group[len(group)-1]
	return Alarm{
		ID:            latest.AlarmID,
		LatestRowID:   latest.ID,
		Severity:      latest.Severity,
		Kind:          latest.Kind,
		Message:       latest.Message,
		Source:        latest.Source,
		Count:         len(group),
		FirstRaisedAt: first.RaisedAt,
		LastRaisedAt:  latest.RaisedAt,
	}
}
