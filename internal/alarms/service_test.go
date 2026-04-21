package alarms

import (
	"context"
	"database/sql"
	"sync"
	"testing"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "modernc.org/sqlite"

	"github.com/saffronjam/saffron-hive/internal/store"
)

func newTestStore(t *testing.T) *store.DB {
	t.Helper()
	// Use a file-backed temp DB so concurrent goroutines (e.g. the
	// TestRaiseRaceUniqueness test) share the same database. An in-memory
	// SQLite database is per-connection by default, which breaks the
	// transaction-based race-safety test.
	tmp := t.TempDir() + "/alarms.db"
	db, err := sql.Open("sqlite", tmp+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	// SQLite is a single-writer engine. Capping the pool to one connection
	// lets concurrent Raise calls queue on the Go side rather than race for
	// the file lock and fail with SQLITE_BUSY.
	db.SetMaxOpenConns(1)
	t.Cleanup(func() { _ = db.Close() })

	src, err := iofs.New(store.Migrations, "migrations")
	if err != nil {
		t.Fatalf("iofs: %v", err)
	}
	drv, err := sqlite.WithInstance(db, &sqlite.Config{})
	if err != nil {
		t.Fatalf("driver: %v", err)
	}
	m, err := migrate.NewWithInstance("iofs", src, "sqlite", drv)
	if err != nil {
		t.Fatalf("migrate: %v", err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		t.Fatalf("up: %v", err)
	}
	return store.New(db)
}

func TestRaisePublishesAndGroups(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	buffer := NewBuffer()
	events, unsub := buffer.Subscribe()
	defer unsub()

	svc := NewService(s, buffer)

	params := RaiseParams{
		AlarmID:  "test.alarm",
		Severity: store.AlarmSeverityHigh,
		Kind:     store.AlarmKindAuto,
		Message:  "first",
		Source:   "test",
	}
	first, err := svc.Raise(ctx, params)
	if err != nil {
		t.Fatalf("first raise: %v", err)
	}
	if first.Count != 1 {
		t.Fatalf("first raise count: want 1, got %d", first.Count)
	}

	select {
	case evt := <-events:
		if evt.Kind != EventRaised || evt.Alarm == nil || evt.Alarm.ID != "test.alarm" {
			t.Fatalf("unexpected first event: %+v", evt)
		}
	case <-time.After(time.Second):
		t.Fatal("no event published for first raise")
	}

	params.Message = "second"
	second, err := svc.Raise(ctx, params)
	if err != nil {
		t.Fatalf("second raise: %v", err)
	}
	if second.Count != 2 {
		t.Fatalf("second raise count: want 2, got %d", second.Count)
	}
	if second.Message != "second" {
		t.Fatalf("second raise message: want %q, got %q", "second", second.Message)
	}
}

func TestRaiseRaceUniqueness(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	svc := NewService(s, NewBuffer())

	const n = 25
	var wg sync.WaitGroup
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := svc.Raise(ctx, RaiseParams{
				AlarmID:  "race.alarm",
				Severity: store.AlarmSeverityMedium,
				Kind:     store.AlarmKindAuto,
				Message:  "bump",
				Source:   "test",
			})
			if err != nil {
				t.Errorf("race raise: %v", err)
			}
		}()
	}
	wg.Wait()

	list, err := svc.ListActive(ctx)
	if err != nil {
		t.Fatalf("list active: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 group, got %d", len(list))
	}
	if list[0].Count != n {
		t.Fatalf("expected count %d, got %d", n, list[0].Count)
	}
}

func TestDeleteByAlarmID(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	buffer := NewBuffer()
	events, unsub := buffer.Subscribe()
	defer unsub()
	svc := NewService(s, buffer)

	for _, msg := range []string{"one", "two", "three"} {
		if _, err := svc.Raise(ctx, RaiseParams{
			AlarmID:  "to.delete",
			Severity: store.AlarmSeverityLow,
			Kind:     store.AlarmKindOneShot,
			Message:  msg,
			Source:   "test",
		}); err != nil {
			t.Fatalf("raise: %v", err)
		}
	}
	// Drain the raised events so we can assert on the cleared one.
	for i := 0; i < 3; i++ {
		<-events
	}

	deleted, err := svc.DeleteByAlarmID(ctx, "to.delete")
	if err != nil {
		t.Fatalf("delete: %v", err)
	}
	if !deleted {
		t.Fatal("delete reported nothing removed")
	}

	select {
	case evt := <-events:
		if evt.Kind != EventCleared || evt.ClearedAlarmID != "to.delete" {
			t.Fatalf("unexpected cleared event: %+v", evt)
		}
	case <-time.After(time.Second):
		t.Fatal("no event published for delete")
	}

	list, err := svc.ListActive(ctx)
	if err != nil {
		t.Fatalf("list active: %v", err)
	}
	if len(list) != 0 {
		t.Fatalf("expected empty list after delete, got %d", len(list))
	}

	// Deleting a nonexistent alarm reports false with no error.
	again, err := svc.DeleteByAlarmID(ctx, "to.delete")
	if err != nil {
		t.Fatalf("delete idempotent: %v", err)
	}
	if again {
		t.Fatal("expected second delete to report false")
	}
}

func TestListActiveGroupsByAlarmID(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	svc := NewService(s, NewBuffer())

	_, _ = svc.Raise(ctx, RaiseParams{AlarmID: "a", Severity: store.AlarmSeverityHigh, Kind: store.AlarmKindAuto, Message: "a1", Source: "x"})
	_, _ = svc.Raise(ctx, RaiseParams{AlarmID: "a", Severity: store.AlarmSeverityHigh, Kind: store.AlarmKindAuto, Message: "a2", Source: "x"})
	_, _ = svc.Raise(ctx, RaiseParams{AlarmID: "b", Severity: store.AlarmSeverityLow, Kind: store.AlarmKindOneShot, Message: "b1", Source: "x"})

	list, err := svc.ListActive(ctx)
	if err != nil {
		t.Fatalf("list active: %v", err)
	}
	if len(list) != 2 {
		t.Fatalf("expected 2 groups, got %d", len(list))
	}

	byID := map[string]Alarm{}
	for _, a := range list {
		byID[a.ID] = a
	}

	a := byID["a"]
	if a.Count != 2 || a.Message != "a2" {
		t.Fatalf("group a mismatch: %+v", a)
	}
	b := byID["b"]
	if b.Count != 1 || b.Message != "b1" {
		t.Fatalf("group b mismatch: %+v", b)
	}
}

func TestRaiseValidation(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	svc := NewService(s, NewBuffer())

	base := RaiseParams{
		AlarmID:  "x",
		Severity: store.AlarmSeverityHigh,
		Kind:     store.AlarmKindAuto,
		Message:  "ok",
		Source:   "test",
	}

	cases := map[string]RaiseParams{
		"missing alarm_id": func() RaiseParams { p := base; p.AlarmID = ""; return p }(),
		"bad severity":     func() RaiseParams { p := base; p.Severity = "nope"; return p }(),
		"bad kind":         func() RaiseParams { p := base; p.Kind = "nope"; return p }(),
		"missing message":  func() RaiseParams { p := base; p.Message = ""; return p }(),
	}
	for name, p := range cases {
		if _, err := svc.Raise(ctx, p); err == nil {
			t.Errorf("%s: expected error", name)
		}
	}
}
