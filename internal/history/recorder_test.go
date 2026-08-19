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
		ID:           "sensor-1",
		FriendlyName: "Sensor",
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Sensor,
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
	if p, ok := byField[FieldOn]; !ok || p.NumericValue == nil || *p.NumericValue != 1 {
		t.Errorf("on sample missing or wrong value: %+v", p)
	}
	if p, ok := byField[FieldTemperature]; !ok || p.NumericValue == nil || *p.NumericValue != 21.5 {
		t.Errorf("temperature sample missing or wrong value: %+v", p)
	}
	if p, ok := byField[FieldHumidity]; !ok || p.NumericValue == nil || *p.NumericValue != 55.2 {
		t.Errorf("humidity sample missing or wrong value: %+v", p)
	}
	firstAt := points[0].At
	for _, p := range points[1:] {
		if !p.At.Equal(firstAt) {
			t.Errorf("fan-out samples should share a recorded_at; got %v vs %v", firstAt, p.At)
		}
	}
}

func TestRecorderPersistsMultistateSensorFields(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	s := newTestStore(t)
	bus := eventbus.NewChannelBus()
	go RunRecorder(ctx, bus, s)
	time.Sleep(20 * time.Millisecond)

	contact := false
	orientation := "up"
	posture := "abnormal"
	linkQuality := 172.0
	bus.Publish(eventbus.Event{
		Type:     eventbus.EventDeviceStateChanged,
		DeviceID: "sensor-1",
		Payload: device.DeviceStateChange{State: device.DeviceState{
			Contact:       &contact,
			Orientation:   &orientation,
			DevicePosture: &posture,
			LinkQuality:   &linkQuality,
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
			t.Fatal(err)
		}
		if len(points) == 4 {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	if len(points) != 4 {
		t.Fatalf("expected four multistate samples, got %+v", points)
	}
	byField := map[string]store.StateHistoryPoint{}
	for _, point := range points {
		byField[point.Field] = point
	}
	if value := byField[FieldContact].NumericValue; value == nil || *value != 0 {
		t.Fatalf("unexpected contact sample: %+v", byField[FieldContact])
	}
	if value := byField[FieldOrientation].TextValue; value == nil || *value != "up" {
		t.Fatalf("unexpected orientation sample: %+v", byField[FieldOrientation])
	}
	if value := byField[FieldDevicePosture].TextValue; value == nil || *value != "abnormal" {
		t.Fatalf("unexpected posture sample: %+v", byField[FieldDevicePosture])
	}
	if value := byField[FieldLinkQuality].NumericValue; value == nil || *value != 172 {
		t.Fatalf("unexpected link quality sample: %+v", byField[FieldLinkQuality])
	}
}

func TestRecorderRecordsOccupancyAsZeroOrOne(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	s := newTestStore(t)
	bus := eventbus.NewChannelBus()
	go RunRecorder(ctx, bus, s)

	time.Sleep(20 * time.Millisecond)

	occupied := true
	vacant := false
	for _, v := range []*bool{&occupied, &vacant} {
		bus.Publish(eventbus.Event{
			Type:      eventbus.EventDeviceStateChanged,
			DeviceID:  "sensor-1",
			Timestamp: time.Now(),
			Payload:   device.DeviceStateChange{State: device.DeviceState{Occupancy: v}},
		})
	}

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
		if len(points) >= 2 {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}

	if len(points) != 2 {
		t.Fatalf("expected 2 occupancy samples, got %d", len(points))
	}
	values := map[float64]bool{}
	for _, p := range points {
		if p.Field != FieldOccupancy {
			t.Errorf("expected field %q, got %q", FieldOccupancy, p.Field)
		}
		if p.NumericValue != nil {
			values[*p.NumericValue] = true
		}
	}
	if !values[1] || !values[0] {
		t.Errorf("expected one sample at 1 and one at 0, got %+v", points)
	}
}

func TestRecorderSkipsOccupancyWhenAbsent(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	s := newTestStore(t)
	bus := eventbus.NewChannelBus()
	go RunRecorder(ctx, bus, s)

	time.Sleep(20 * time.Millisecond)

	temp := 21.0
	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "sensor-1",
		Timestamp: time.Now(),
		Payload:   device.DeviceStateChange{State: device.DeviceState{Temperature: &temp}},
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
		if len(points) >= 1 {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}

	if len(points) != 1 {
		t.Fatalf("expected only the temperature sample, got %d", len(points))
	}
	if points[0].Field == FieldOccupancy {
		t.Errorf("occupancy sample recorded for a payload without occupancy: %+v", points[0])
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
