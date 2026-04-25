package history

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "modernc.org/sqlite"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func newTestStore(t *testing.T) *store.DB {
	t.Helper()
	db, err := sql.Open("sqlite", "file::memory:?cache=shared")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
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
	s := store.New(db)
	if _, err := s.CreateDevice(context.Background(), store.CreateDeviceParams{
		ID:     "sensor-1",
		Name:   "Sensor",
		Source: "zigbee",
		Type:   device.Sensor,
	}); err != nil {
		t.Fatalf("seed device: %v", err)
	}
	return s
}

func TestRecorderFansOutPerField(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	s := newTestStore(t)
	bus := eventbus.NewChannelBus()
	go RunRecorder(ctx, bus, s)

	time.Sleep(20 * time.Millisecond)

	on := true
	temp := 21.5
	hum := 55.2
	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "sensor-1",
		Timestamp: time.Now(),
		Payload: device.DeviceStateChange{State: device.DeviceState{
			On:          &on,
			Temperature: &temp,
			Humidity:    &hum,
		}},
	})

	var points []store.StateHistoryPoint
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		var err error
		points, err = s.QueryStateHistory(ctx, store.StateHistoryQuery{
			DeviceIDs: []device.DeviceID{"sensor-1"},
			From:      time.Now().Add(-time.Hour),
			To:        time.Now().Add(time.Hour),
		})
		if err != nil {
			t.Fatalf("query: %v", err)
		}
		if len(points) >= 3 {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}

	if len(points) != 3 {
		t.Fatalf("expected 3 samples (on + temperature + humidity), got %d", len(points))
	}
	byField := map[string]store.StateHistoryPoint{}
	for _, p := range points {
		byField[p.Field] = p
	}
	if p, ok := byField[FieldOn]; !ok || p.Value != 1 {
		t.Errorf("on sample missing or wrong value: %+v", p)
	}
	if p, ok := byField[FieldTemperature]; !ok || p.Value != 21.5 {
		t.Errorf("temperature sample missing or wrong value: %+v", p)
	}
	if p, ok := byField[FieldHumidity]; !ok || p.Value != 55.2 {
		t.Errorf("humidity sample missing or wrong value: %+v", p)
	}
	firstAt := points[0].At
	for _, p := range points[1:] {
		if !p.At.Equal(firstAt) {
			t.Errorf("fan-out samples should share a recorded_at; got %v vs %v", firstAt, p.At)
		}
	}
}

func TestRecorderSkipsEventsWithoutDeviceID(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	s := newTestStore(t)
	bus := eventbus.NewChannelBus()
	go RunRecorder(ctx, bus, s)

	time.Sleep(20 * time.Millisecond)

	temp := 21.0
	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "",
		Timestamp: time.Now(),
		Payload:   device.DeviceStateChange{State: device.DeviceState{Temperature: &temp}},
	})

	time.Sleep(100 * time.Millisecond)

	points, err := s.QueryStateHistory(ctx, store.StateHistoryQuery{
		DeviceIDs: []device.DeviceID{"sensor-1"},
		From:      time.Now().Add(-time.Hour),
		To:        time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(points) != 0 {
		t.Errorf("expected no samples for empty device id, got %d", len(points))
	}
}
