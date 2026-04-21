package graph

import (
	"context"
	"database/sql"
	"encoding/json"
	"testing"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "modernc.org/sqlite"
	"net/http/httptest"

	"github.com/saffronjam/saffron-hive/internal/alarms"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
	"log/slog"
)

// newAlarmTestEnv wires a resolver backed by a real SQLite-backed alarm
// service. The mutation tests exercise end-to-end: POST → resolver → service
// → store → response.
func newAlarmTestEnv(t *testing.T) (*testEnv, *alarms.Service) {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
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
	sqlStore := store.New(db)

	sr := newMockStateReader()
	st := newMockStore()
	bus := eventbus.NewChannelBus()
	rl := &mockReloader{}
	buf := alarms.NewBuffer()
	svc := alarms.NewService(sqlStore, buf)

	levelVar := &slog.LevelVar{}
	levelVar.Set(slog.LevelInfo)

	resolver := &Resolver{
		StateReader:        sr,
		Store:              st,
		TargetResolver:     st,
		EventBus:           bus,
		AutomationReloader: rl,
		LogBuffer:          logging.NewBuffer(),
		Alarms:             svc,
		AlarmBuffer:        buf,
		LevelVar:           levelVar,
	}

	srv := handler.New(NewExecutableSchema(Config{Resolvers: resolver}))
	srv.AddTransport(transport.POST{})
	ts := httptest.NewServer(srv)
	t.Cleanup(ts.Close)

	return &testEnv{server: ts, stateReader: sr, store: st, bus: bus, reloader: rl}, svc
}

func TestMutationRaiseAndDeleteAlarm(t *testing.T) {
	te, svc := newAlarmTestEnv(t)

	raise := te.query(t, `
		mutation ($in: RaiseAlarmInput!) {
			raiseAlarm(input: $in) {
				id
				severity
				kind
				message
				count
				source
			}
		}
	`, map[string]any{
		"in": map[string]any{
			"alarmId":  "humidity.high",
			"severity": "HIGH",
			"kind":     "AUTO",
			"message":  "hallway humid",
		},
	})
	if len(raise.Errors) > 0 {
		t.Fatalf("raiseAlarm errors: %+v", raise.Errors)
	}
	var raiseResp struct {
		RaiseAlarm struct {
			ID       string `json:"id"`
			Severity string `json:"severity"`
			Kind     string `json:"kind"`
			Message  string `json:"message"`
			Count    int    `json:"count"`
			Source   string `json:"source"`
		}
	}
	if err := json.Unmarshal(raise.Data, &raiseResp); err != nil {
		t.Fatalf("unmarshal raise: %v", err)
	}
	if raiseResp.RaiseAlarm.ID != "humidity.high" || raiseResp.RaiseAlarm.Count != 1 || raiseResp.RaiseAlarm.Source != "api" {
		t.Fatalf("unexpected raise response: %+v", raiseResp.RaiseAlarm)
	}

	// Confirm the service actually holds the alarm.
	list, err := svc.ListActive(context.Background())
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 active alarm, got %d", len(list))
	}

	// Delete it.
	del := te.query(t, `
		mutation ($id: ID!) {
			deleteAlarm(alarmId: $id)
		}
	`, map[string]any{"id": "humidity.high"})
	if len(del.Errors) > 0 {
		t.Fatalf("deleteAlarm errors: %+v", del.Errors)
	}
	var delResp struct {
		DeleteAlarm bool `json:"deleteAlarm"`
	}
	if err := json.Unmarshal(del.Data, &delResp); err != nil {
		t.Fatalf("unmarshal delete: %v", err)
	}
	if !delResp.DeleteAlarm {
		t.Fatal("expected deleteAlarm=true")
	}

	list, err = svc.ListActive(context.Background())
	if err != nil {
		t.Fatalf("list after delete: %v", err)
	}
	if len(list) != 0 {
		t.Fatalf("expected empty list after delete, got %d", len(list))
	}

	// Deleting an absent alarm returns false.
	del2 := te.query(t, `mutation { deleteAlarm(alarmId: "nonexistent") }`, nil)
	if len(del2.Errors) > 0 {
		t.Fatalf("second deleteAlarm errors: %+v", del2.Errors)
	}
	var del2Resp struct {
		DeleteAlarm bool `json:"deleteAlarm"`
	}
	if err := json.Unmarshal(del2.Data, &del2Resp); err != nil {
		t.Fatalf("unmarshal second delete: %v", err)
	}
	if del2Resp.DeleteAlarm {
		t.Fatal("expected deleteAlarm=false for unknown id")
	}
}

func TestQueryAlarmsGroupsAndFilters(t *testing.T) {
	te, svc := newAlarmTestEnv(t)
	ctx := context.Background()

	_, _ = svc.Raise(ctx, alarms.RaiseParams{AlarmID: "a", Severity: store.AlarmSeverityHigh, Kind: store.AlarmKindAuto, Message: "a1", Source: "system.monitor"})
	_, _ = svc.Raise(ctx, alarms.RaiseParams{AlarmID: "a", Severity: store.AlarmSeverityHigh, Kind: store.AlarmKindAuto, Message: "a2", Source: "system.monitor"})
	_, _ = svc.Raise(ctx, alarms.RaiseParams{AlarmID: "b", Severity: store.AlarmSeverityLow, Kind: store.AlarmKindOneShot, Message: "b1", Source: "api"})

	q := te.query(t, `
		query ($filter: AlarmFilter) {
			alarms(filter: $filter) {
				id
				severity
				count
				message
				source
			}
		}
	`, map[string]any{
		"filter": map[string]any{
			"severities": []string{"HIGH"},
		},
	})
	if len(q.Errors) > 0 {
		t.Fatalf("alarms errors: %+v", q.Errors)
	}
	var resp struct {
		Alarms []struct {
			ID       string `json:"id"`
			Severity string `json:"severity"`
			Count    int    `json:"count"`
			Message  string `json:"message"`
			Source   string `json:"source"`
		}
	}
	if err := json.Unmarshal(q.Data, &resp); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(resp.Alarms) != 1 {
		t.Fatalf("expected 1 HIGH alarm, got %d: %+v", len(resp.Alarms), resp.Alarms)
	}
	if resp.Alarms[0].ID != "a" || resp.Alarms[0].Count != 2 || resp.Alarms[0].Message != "a2" {
		t.Fatalf("unexpected alarm: %+v", resp.Alarms[0])
	}
}
