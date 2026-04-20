package activity

import (
	"context"
	"database/sql"
	"encoding/json"
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
	return store.New(db)
}

type fakeReader struct {
	devices map[device.DeviceID]device.Device
}

func (f *fakeReader) GetDevice(id device.DeviceID) (device.Device, bool) {
	d, ok := f.devices[id]
	return d, ok
}
func (f *fakeReader) GetLightState(device.DeviceID) (*device.LightState, bool)   { return nil, false }
func (f *fakeReader) GetSensorState(device.DeviceID) (*device.SensorState, bool) { return nil, false }
func (f *fakeReader) GetSwitchState(device.DeviceID) (*device.SwitchState, bool) { return nil, false }
func (f *fakeReader) ListDevices() []device.Device                               { return nil }
func (f *fakeReader) GetGroup(device.GroupID) (device.Group, bool)               { return device.Group{}, false }
func (f *fakeReader) ListGroups() []device.Group                                 { return nil }
func (f *fakeReader) ListGroupMembers(device.GroupID) []device.GroupMember       { return nil }
func (f *fakeReader) ResolveGroupDevices(device.GroupID) []device.DeviceID       { return nil }

func TestRecorderEnrichesAndPersists(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	s := newTestStore(t)
	bus := eventbus.NewChannelBus()
	reader := &fakeReader{devices: map[device.DeviceID]device.Device{
		"d1": {ID: "d1", Name: "Kitchen light", Type: device.Light},
	}}
	buf := NewBuffer()

	rec := NewRecorder(bus, s, reader, buf)
	go rec.Run(ctx)

	subCh, unsub := buf.Subscribe()
	defer unsub()

	// Wait briefly for the recorder to register its subscription.
	time.Sleep(20 * time.Millisecond)

	on := true
	bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  "d1",
		Timestamp: time.Now(),
		Payload:   device.LightState{On: &on},
	})

	select {
	case row := <-subCh:
		if row.Type != "device.state_changed" {
			t.Errorf("type: %s", row.Type)
		}
		if row.Message != "Kitchen light turned on" {
			t.Errorf("message: %q", row.Message)
		}
		if row.DeviceName == nil || *row.DeviceName != "Kitchen light" {
			t.Errorf("device name not enriched: %v", row.DeviceName)
		}
		if row.DeviceType == nil || *row.DeviceType != "light" {
			t.Errorf("device type not enriched: %v", row.DeviceType)
		}
		// Payload must be valid JSON.
		var parsed map[string]interface{}
		if err := json.Unmarshal([]byte(row.PayloadJSON), &parsed); err != nil {
			t.Errorf("payload not valid JSON: %v (%s)", err, row.PayloadJSON)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("timeout waiting for enriched event on buffer")
	}

	// Also verify the DB has the row.
	rows, err := s.QueryActivityEvents(ctx, store.ActivityQuery{Limit: 10})
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(rows) != 1 {
		t.Fatalf("expected 1 row persisted, got %d", len(rows))
	}
}
