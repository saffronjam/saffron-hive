package activity

import (
	"context"
	"encoding/json"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
	"github.com/saffronjam/saffron-hive/internal/testdb"
	"github.com/saffronjam/saffron-hive/internal/webhook"
)

var activityStoreTemplate = testdb.NewTemplate(store.Migrations, "migrations")

func newTestStore(t *testing.T) *store.DB {
	t.Helper()
	db, err := activityStoreTemplate.Open(
		filepath.Join(t.TempDir(), "activity.db"),
		"_pragma=foreign_keys(1)",
	)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })
	return store.New(db)
}

type fakeReader struct {
	devices map[device.DeviceID]device.Device
}

func (f *fakeReader) GetDevice(id device.DeviceID) (device.Device, bool) {
	d, ok := f.devices[id]
	return d, ok
}
func (f *fakeReader) GetDeviceState(device.DeviceID) (*device.DeviceState, bool) {
	return nil, false
}
func (f *fakeReader) ListDevices() []device.Device                         { return nil }
func (f *fakeReader) GetGroup(device.GroupID) (device.Group, bool)         { return device.Group{}, false }
func (f *fakeReader) ListGroups() []device.Group                           { return nil }
func (f *fakeReader) ListGroupMembers(device.GroupID) []device.GroupMember { return nil }
func (f *fakeReader) ResolveGroupDevices(device.GroupID) []device.DeviceID { return nil }

func TestRecorderEnrichesAndPersists(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	s := newTestStore(t)
	bus := eventbus.NewChannelBus()
	reader := &fakeReader{devices: map[device.DeviceID]device.Device{
		"d1": {ID: "d1", FriendlyName: "Kitchen light", Type: device.Light},
	}}
	buf := NewBuffer()

	rec := NewRecorder(bus, s, reader, nil, buf)
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
		Payload:   device.DeviceStateChange{State: device.DeviceState{On: &on}},
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

func TestRecorderPersistsSanitizedWebhookActivity(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	s := newTestStore(t)
	bus := eventbus.NewChannelBus()
	buf := NewBuffer()
	recorder := NewRecorder(bus, s, &fakeReader{devices: map[device.DeviceID]device.Device{}}, nil, buf)
	go recorder.Run(ctx)
	activityRows, unsubscribe := buf.Subscribe()
	defer unsubscribe()
	time.Sleep(20 * time.Millisecond)

	receivedAt := time.Date(2026, 8, 23, 11, 0, 0, 0, time.UTC)
	bus.Publish(eventbus.Event{
		Type:      eventbus.EventWebhookReceived,
		Timestamp: receivedAt,
		Payload: webhook.Event{
			EndpointID:   "hook-1",
			EndpointName: "Pipeline failed",
			DeliveryID:   "delivery-1",
			Body:         map[string]any{"secret": "must-not-persist"},
			Query:        map[string][]string{"token": {"must-not-persist"}},
			Headers:      map[string][]string{"X-Safe": {"must-not-persist"}},
			ReceivedAt:   receivedAt,
			ClientIP:     "192.0.2.10",
			UserAgent:    "test-client",
			ContentType:  "application/json",
			BodySize:     29,
		},
	})

	select {
	case row := <-activityRows:
		if row.WebhookID == nil || *row.WebhookID != "hook-1" || row.WebhookName == nil || *row.WebhookName != "Pipeline failed" {
			t.Fatalf("webhook source missing: %+v", row)
		}
		if row.Message != "Webhook received: Pipeline failed" {
			t.Fatalf("message = %q", row.Message)
		}
		if strings.Contains(row.PayloadJSON, "must-not-persist") || strings.Contains(row.PayloadJSON, "secret") {
			t.Fatalf("activity contains request content: %s", row.PayloadJSON)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("timeout waiting for webhook activity")
	}
}
