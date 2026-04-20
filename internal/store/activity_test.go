package store

import (
	"context"
	"testing"
	"time"
)

func strPtr(s string) *string { return &s }

func TestInsertAndQueryActivityEvent(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	now := time.Now().UTC().Truncate(time.Second)
	e, err := s.InsertActivityEvent(ctx, InsertActivityEventParams{
		Type:        "device.state_changed",
		Timestamp:   now,
		Message:     "Kitchen light turned on",
		PayloadJSON: `{"on":true,"brightness":200}`,
		DeviceID:    strPtr("dev-1"),
		DeviceName:  strPtr("Kitchen light"),
		DeviceType:  strPtr("light"),
		RoomID:      strPtr("room-1"),
		RoomName:    strPtr("Kitchen"),
	})
	if err != nil {
		t.Fatalf("insert: %v", err)
	}
	if e.ID == 0 {
		t.Fatal("expected non-zero ID")
	}

	events, err := s.QueryActivityEvents(ctx, ActivityQuery{Limit: 10})
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(events) != 1 {
		t.Fatalf("expected 1 event, got %d", len(events))
	}
	got := events[0]
	if got.Type != "device.state_changed" || got.Message != "Kitchen light turned on" {
		t.Errorf("unexpected row: %+v", got)
	}
	if got.DeviceID == nil || *got.DeviceID != "dev-1" {
		t.Errorf("device_id: got %v", got.DeviceID)
	}
	if got.RoomName == nil || *got.RoomName != "Kitchen" {
		t.Errorf("room_name: got %v", got.RoomName)
	}
}

func TestQueryActivityFilters(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	base := time.Now().UTC().Truncate(time.Second)
	insert := func(typ string, offset time.Duration, devID *string, roomID *string) {
		_, err := s.InsertActivityEvent(ctx, InsertActivityEventParams{
			Type:        typ,
			Timestamp:   base.Add(offset),
			Message:     typ,
			PayloadJSON: `null`,
			DeviceID:    devID,
			RoomID:      roomID,
		})
		if err != nil {
			t.Fatalf("insert: %v", err)
		}
	}

	insert("device.state_changed", -time.Minute, strPtr("d1"), strPtr("r1"))
	insert("device.state_changed", -2*time.Hour, strPtr("d2"), strPtr("r2"))
	insert("command.requested", -time.Second, strPtr("d1"), strPtr("r1"))
	insert("scene.applied", -time.Second, nil, nil)
	insert("automation.node_activated", -time.Second, nil, nil)

	// Default (advanced=false) hides command.requested and automation.node_activated.
	events, err := s.QueryActivityEvents(ctx, ActivityQuery{Limit: 10})
	if err != nil {
		t.Fatalf("query default: %v", err)
	}
	if len(events) != 3 {
		t.Errorf("default view: expected 3, got %d", len(events))
	}
	for _, e := range events {
		if e.Type == "command.requested" || e.Type == "automation.node_activated" {
			t.Errorf("default view leaked internal type %q", e.Type)
		}
	}

	// Advanced shows everything.
	events, err = s.QueryActivityEvents(ctx, ActivityQuery{Limit: 10, Advanced: true})
	if err != nil {
		t.Fatalf("query advanced: %v", err)
	}
	if len(events) != 5 {
		t.Errorf("advanced view: expected 5, got %d", len(events))
	}

	// Filter by device.
	events, err = s.QueryActivityEvents(ctx, ActivityQuery{Limit: 10, Advanced: true, DeviceID: strPtr("d1")})
	if err != nil {
		t.Fatalf("query device: %v", err)
	}
	if len(events) != 2 {
		t.Errorf("device d1 filter: expected 2, got %d", len(events))
	}

	// Filter by room.
	events, err = s.QueryActivityEvents(ctx, ActivityQuery{Limit: 10, Advanced: true, RoomID: strPtr("r2")})
	if err != nil {
		t.Fatalf("query room: %v", err)
	}
	if len(events) != 1 {
		t.Errorf("room r2 filter: expected 1, got %d", len(events))
	}

	// Filter by since (excludes the 2h-ago event).
	since := base.Add(-time.Hour)
	events, err = s.QueryActivityEvents(ctx, ActivityQuery{Limit: 10, Advanced: true, Since: &since})
	if err != nil {
		t.Fatalf("query since: %v", err)
	}
	if len(events) != 4 {
		t.Errorf("since filter: expected 4, got %d", len(events))
	}

	// Filter by types.
	events, err = s.QueryActivityEvents(ctx, ActivityQuery{Limit: 10, Advanced: true, Types: []string{"scene.applied"}})
	if err != nil {
		t.Fatalf("query types: %v", err)
	}
	if len(events) != 1 || events[0].Type != "scene.applied" {
		t.Errorf("types filter: got %+v", events)
	}
}

func TestActivityBeforeCursor(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	base := time.Now().UTC().Truncate(time.Second)
	var ids []int64
	for i := 0; i < 12; i++ {
		e, err := s.InsertActivityEvent(ctx, InsertActivityEventParams{
			Type:        "device.state_changed",
			Timestamp:   base.Add(time.Duration(i) * time.Millisecond),
			Message:     "m",
			PayloadJSON: "null",
		})
		if err != nil {
			t.Fatalf("insert %d: %v", i, err)
		}
		ids = append(ids, e.ID)
	}

	first, err := s.QueryActivityEvents(ctx, ActivityQuery{Limit: 5})
	if err != nil {
		t.Fatalf("first page: %v", err)
	}
	if len(first) != 5 {
		t.Fatalf("first page: expected 5, got %d", len(first))
	}
	oldestOnFirstPage := first[len(first)-1].ID

	second, err := s.QueryActivityEvents(ctx, ActivityQuery{Limit: 5, Before: &oldestOnFirstPage})
	if err != nil {
		t.Fatalf("second page: %v", err)
	}
	if len(second) != 5 {
		t.Fatalf("second page: expected 5, got %d", len(second))
	}

	// No overlap between pages.
	seen := map[int64]bool{}
	for _, e := range first {
		seen[e.ID] = true
	}
	for _, e := range second {
		if seen[e.ID] {
			t.Errorf("page overlap: id %d appears in both pages", e.ID)
		}
	}

	// Every row on page 2 is older (smaller id) than the oldest on page 1.
	for _, e := range second {
		if e.ID >= oldestOnFirstPage {
			t.Errorf("second page id %d not strictly before cursor %d", e.ID, oldestOnFirstPage)
		}
	}
}

func TestPruneActivityEventsOlderThan(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	base := time.Now().UTC().Truncate(time.Second)
	for i, offset := range []time.Duration{-10 * 24 * time.Hour, -5 * 24 * time.Hour, -1 * time.Hour} {
		_, err := s.InsertActivityEvent(ctx, InsertActivityEventParams{
			Type: "device.state_changed", Timestamp: base.Add(offset),
			Message: "m", PayloadJSON: "null", DeviceID: strPtr("d" + string(rune('1'+i))),
		})
		if err != nil {
			t.Fatalf("insert: %v", err)
		}
	}

	cutoff := base.Add(-7 * 24 * time.Hour)
	n, err := s.PruneActivityEventsOlderThan(ctx, cutoff)
	if err != nil {
		t.Fatalf("prune: %v", err)
	}
	if n != 1 {
		t.Errorf("pruned: expected 1, got %d", n)
	}

	remaining, err := s.QueryActivityEvents(ctx, ActivityQuery{Limit: 10})
	if err != nil {
		t.Fatalf("query remaining: %v", err)
	}
	if len(remaining) != 2 {
		t.Errorf("remaining: expected 2, got %d", len(remaining))
	}
}
