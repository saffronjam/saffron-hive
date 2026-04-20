package store

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// internalEventTypes lists event types hidden from the default (non-advanced)
// activity view. Mirrored from eventbus.EventType values to avoid importing the
// eventbus package into store.
var internalEventTypes = []string{
	"command.requested",
	"automation.node_activated",
}

// InsertActivityEvent inserts an activity event and returns it with the generated ID.
func (s *DB) InsertActivityEvent(ctx context.Context, params InsertActivityEventParams) (ActivityEvent, error) {
	id, err := s.q.InsertActivityEvent(ctx, sqlite.InsertActivityEventParams{
		Type:           params.Type,
		Timestamp:      params.Timestamp,
		Message:        params.Message,
		PayloadJson:    params.PayloadJSON,
		DeviceID:       params.DeviceID,
		DeviceName:     params.DeviceName,
		DeviceType:     params.DeviceType,
		RoomID:         params.RoomID,
		RoomName:       params.RoomName,
		SceneID:        params.SceneID,
		SceneName:      params.SceneName,
		AutomationID:   params.AutomationID,
		AutomationName: params.AutomationName,
	})
	if err != nil {
		return ActivityEvent{}, fmt.Errorf("insert activity event: %w", err)
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
func (s *DB) QueryActivityEvents(ctx context.Context, query ActivityQuery) ([]ActivityEvent, error) {
	typesJSON, err := marshalStringArray(query.Types)
	if err != nil {
		return nil, fmt.Errorf("query activity events: types: %w", err)
	}
	excluded := []string(nil)
	if !query.Advanced {
		excluded = internalEventTypes
	}
	excludedJSON, err := marshalStringArray(excluded)
	if err != nil {
		return nil, fmt.Errorf("query activity events: excluded types: %w", err)
	}

	rows, err := s.q.QueryActivityEvents(ctx, sqlite.QueryActivityEventsParams{
		TypesJson:         typesJSON,
		ExcludedTypesJson: excludedJSON,
		DeviceID:          query.DeviceID,
		RoomID:            query.RoomID,
		Since:             query.Since,
		Before:            query.Before,
		Lim:               int64(query.Limit),
	})
	if err != nil {
		return nil, fmt.Errorf("query activity events: %w", err)
	}

	var events []ActivityEvent
	for _, r := range rows {
		events = append(events, ActivityEvent{
			ID:             r.ID,
			Type:           r.Type,
			Timestamp:      r.Timestamp,
			Message:        r.Message,
			PayloadJSON:    r.PayloadJson,
			DeviceID:       r.DeviceID,
			DeviceName:     r.DeviceName,
			DeviceType:     r.DeviceType,
			RoomID:         r.RoomID,
			RoomName:       r.RoomName,
			SceneID:        r.SceneID,
			SceneName:      r.SceneName,
			AutomationID:   r.AutomationID,
			AutomationName: r.AutomationName,
		})
	}
	return events, nil
}

// PruneActivityEventsOlderThan deletes activity events with timestamp < cutoff and
// returns the number of rows removed.
func (s *DB) PruneActivityEventsOlderThan(ctx context.Context, cutoff time.Time) (int64, error) {
	n, err := s.q.PruneActivityEventsOlderThan(ctx, cutoff)
	if err != nil {
		return 0, fmt.Errorf("prune activity events: %w", err)
	}
	return n, nil
}

// marshalStringArray always emits a JSON array literal (even for empty/nil
// input). The query's json_each gate relies on "[]" meaning "match all".
func marshalStringArray(values []string) (string, error) {
	if values == nil {
		return "[]", nil
	}
	b, err := json.Marshal(values)
	if err != nil {
		return "", err
	}
	return string(b), nil
}
