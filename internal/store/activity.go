package store

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"
)

// internalEventTypes lists event types hidden from the default (non-advanced)
// activity view. Mirrored from eventbus.EventType values to avoid importing the
// eventbus package into store.
var internalEventTypes = []string{
	"command.requested",
	"automation.node_activated",
}

// InsertActivityEvent inserts an activity event and returns it with the generated ID.
func (s *SQLiteStore) InsertActivityEvent(ctx context.Context, params InsertActivityEventParams) (ActivityEvent, error) {
	result, err := s.db.ExecContext(ctx,
		`INSERT INTO activity_events (
			type, timestamp, message, payload_json,
			device_id, device_name, device_type, room_id, room_name,
			scene_id, scene_name,
			automation_id, automation_name
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		params.Type, params.Timestamp, params.Message, params.PayloadJSON,
		params.DeviceID, params.DeviceName, params.DeviceType, params.RoomID, params.RoomName,
		params.SceneID, params.SceneName,
		params.AutomationID, params.AutomationName,
	)
	if err != nil {
		return ActivityEvent{}, fmt.Errorf("insert activity event: %w", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		return ActivityEvent{}, fmt.Errorf("insert activity event last id: %w", err)
	}
	return ActivityEvent{
		ID:             id,
		Type:           params.Type,
		Timestamp:      params.Timestamp,
		Message:        params.Message,
		PayloadJSON:    params.PayloadJSON,
		DeviceID:       params.DeviceID,
		DeviceName:     params.DeviceName,
		DeviceType:     params.DeviceType,
		RoomID:         params.RoomID,
		RoomName:       params.RoomName,
		SceneID:        params.SceneID,
		SceneName:      params.SceneName,
		AutomationID:   params.AutomationID,
		AutomationName: params.AutomationName,
	}, nil
}

// QueryActivityEvents returns activity events matching the query, ordered most recent first.
func (s *SQLiteStore) QueryActivityEvents(ctx context.Context, query ActivityQuery) ([]ActivityEvent, error) {
	var (
		conditions []string
		args       []interface{}
	)

	if len(query.Types) > 0 {
		placeholders := make([]string, len(query.Types))
		for i, t := range query.Types {
			placeholders[i] = "?"
			args = append(args, t)
		}
		conditions = append(conditions, fmt.Sprintf("type IN (%s)", strings.Join(placeholders, ",")))
	}
	if !query.Advanced {
		placeholders := make([]string, len(internalEventTypes))
		for i, t := range internalEventTypes {
			placeholders[i] = "?"
			args = append(args, t)
		}
		conditions = append(conditions, fmt.Sprintf("type NOT IN (%s)", strings.Join(placeholders, ",")))
	}
	if query.DeviceID != nil {
		conditions = append(conditions, "device_id = ?")
		args = append(args, *query.DeviceID)
	}
	if query.RoomID != nil {
		conditions = append(conditions, "room_id = ?")
		args = append(args, *query.RoomID)
	}
	if query.Since != nil {
		conditions = append(conditions, "timestamp >= ?")
		args = append(args, *query.Since)
	}
	if query.Before != nil {
		conditions = append(conditions, "id < ?")
		args = append(args, *query.Before)
	}

	q := `SELECT
		id, type, timestamp, message, payload_json,
		device_id, device_name, device_type, room_id, room_name,
		scene_id, scene_name,
		automation_id, automation_name
		FROM activity_events`
	if len(conditions) > 0 {
		q += " WHERE " + strings.Join(conditions, " AND ")
	}
	q += " ORDER BY timestamp DESC, id DESC"
	if query.Limit > 0 {
		q += " LIMIT ?"
		args = append(args, query.Limit)
	}

	rows, err := s.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("query activity events: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var events []ActivityEvent
	for rows.Next() {
		var (
			e                                                                                                    ActivityEvent
			deviceID, deviceName, deviceType, roomID, roomName, sceneID, sceneName, automationID, automationName sql.NullString
		)
		if err := rows.Scan(
			&e.ID, &e.Type, &e.Timestamp, &e.Message, &e.PayloadJSON,
			&deviceID, &deviceName, &deviceType, &roomID, &roomName,
			&sceneID, &sceneName,
			&automationID, &automationName,
		); err != nil {
			return nil, fmt.Errorf("scan activity event: %w", err)
		}
		e.DeviceID = nullStringPtr(deviceID)
		e.DeviceName = nullStringPtr(deviceName)
		e.DeviceType = nullStringPtr(deviceType)
		e.RoomID = nullStringPtr(roomID)
		e.RoomName = nullStringPtr(roomName)
		e.SceneID = nullStringPtr(sceneID)
		e.SceneName = nullStringPtr(sceneName)
		e.AutomationID = nullStringPtr(automationID)
		e.AutomationName = nullStringPtr(automationName)
		events = append(events, e)
	}
	return events, rows.Err()
}

// PruneActivityEventsOlderThan deletes activity events with timestamp < cutoff and
// returns the number of rows removed.
func (s *SQLiteStore) PruneActivityEventsOlderThan(ctx context.Context, cutoff time.Time) (int64, error) {
	result, err := s.db.ExecContext(ctx,
		`DELETE FROM activity_events WHERE timestamp < ?`, cutoff,
	)
	if err != nil {
		return 0, fmt.Errorf("prune activity events: %w", err)
	}
	n, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("prune activity events rows affected: %w", err)
	}
	return n, nil
}

func nullStringPtr(ns sql.NullString) *string {
	if !ns.Valid {
		return nil
	}
	v := ns.String
	return &v
}
