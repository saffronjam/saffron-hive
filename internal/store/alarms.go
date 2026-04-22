package store

import (
	"context"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// InsertAlarmTx inserts an alarm row and reports whether an alarm with the
// same alarm_id already existed. The COUNT and INSERT run inside a single
// transaction so the isNew signal is race-safe against concurrent raises.
func (s *DB) InsertAlarmTx(ctx context.Context, p InsertAlarmParams) (AlarmRow, bool, error) {
	var row AlarmRow
	var isNew bool
	err := s.execTx(ctx, func(q *sqlite.Queries) error {
		existing, err := q.CountAlarmsByAlarmID(ctx, p.AlarmID)
		if err != nil {
			return fmt.Errorf("count alarms by alarm_id: %w", err)
		}
		isNew = existing == 0

		inserted, err := q.InsertAlarm(ctx, sqlite.InsertAlarmParams{
			AlarmID:  p.AlarmID,
			Severity: string(p.Severity),
			Kind:     string(p.Kind),
			Message:  p.Message,
			Source:   p.Source,
			RaisedAt: p.RaisedAt,
		})
		if err != nil {
			return fmt.Errorf("insert alarm: %w", err)
		}
		row = AlarmRow{
			ID:       inserted.ID,
			AlarmID:  inserted.AlarmID,
			Severity: AlarmSeverity(inserted.Severity),
			Kind:     AlarmKind(inserted.Kind),
			Message:  inserted.Message,
			Source:   inserted.Source,
			RaisedAt: inserted.RaisedAt,
		}
		return nil
	})
	if err != nil {
		return AlarmRow{}, false, err
	}
	return row, isNew, nil
}

// DeleteAlarmsByAlarmID removes every row belonging to the given alarm_id
// group and returns the number of rows removed.
func (s *DB) DeleteAlarmsByAlarmID(ctx context.Context, alarmID string) (int64, error) {
	n, err := s.q.DeleteAlarmsByAlarmID(ctx, alarmID)
	if err != nil {
		return 0, fmt.Errorf("delete alarms by alarm_id: %w", err)
	}
	return n, nil
}

// BatchDeleteAlarmsByAlarmIDs removes every row belonging to any of the given
// alarm_id groups. Returns the total number of rows removed.
func (s *DB) BatchDeleteAlarmsByAlarmIDs(ctx context.Context, alarmIDs []string) (int64, error) {
	if len(alarmIDs) == 0 {
		return 0, nil
	}
	js, err := marshalStringArray(alarmIDs)
	if err != nil {
		return 0, fmt.Errorf("batch delete alarms: %w", err)
	}
	n, err := s.q.BatchDeleteAlarmsByAlarmIDs(ctx, js)
	if err != nil {
		return 0, fmt.Errorf("batch delete alarms: %w", err)
	}
	return n, nil
}

// ListAlarms returns every persisted alarm row ordered most-recent first.
// Grouping (latest message wins, count of rows per alarm_id) happens above
// the store.
func (s *DB) ListAlarms(ctx context.Context) ([]AlarmRow, error) {
	rows, err := s.q.ListAlarms(ctx)
	if err != nil {
		return nil, fmt.Errorf("list alarms: %w", err)
	}
	result := make([]AlarmRow, len(rows))
	for i, r := range rows {
		result[i] = AlarmRow{
			ID:       r.ID,
			AlarmID:  r.AlarmID,
			Severity: AlarmSeverity(r.Severity),
			Kind:     AlarmKind(r.Kind),
			Message:  r.Message,
			Source:   r.Source,
			RaisedAt: r.RaisedAt,
		}
	}
	return result, nil
}
