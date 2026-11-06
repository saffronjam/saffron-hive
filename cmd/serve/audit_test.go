package serve

import (
	"path/filepath"
	"strings"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
	"github.com/saffronjam/saffron-hive/internal/testdb"
)

var registryAuditTemplate = testdb.NewTemplate(store.Migrations, "migrations")

func TestRegistryChangesRetainIntegrationAttribution(t *testing.T) {
	db, err := registryAuditTemplate.Open(filepath.Join(t.TempDir(), "registry.db"), "_pragma=foreign_keys(1)")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })
	s := store.New(db)
	dev := device.Device{ID: "lamp", FriendlyName: "Lamp", Source: device.SourceZigbee2MQTT, Type: device.Light}
	for _, kind := range []eventbus.EventType{eventbus.EventDeviceAdded, eventbus.EventDeviceSynced, eventbus.EventDeviceRemoved} {
		if kind == eventbus.EventDeviceSynced {
			dev.FriendlyName = "Renamed lamp"
		}
		if err := persistDeviceRegistryEvent(t.Context(), eventbus.Event{Type: kind, DeviceID: string(dev.ID), Payload: dev}, s); err != nil {
			t.Fatal(err)
		}
	}
	rows, err := s.AuditEvents(t.Context(), store.AuditFilter{ReaderID: "viewer", Source: "integration", EntityType: "devices", EntityID: "lamp"})
	if err != nil || len(rows) != 3 {
		t.Fatalf("registry changes=%+v %v", rows, err)
	}
	for _, row := range rows {
		if row.ActorID != string(device.SourceZigbee2MQTT) {
			t.Fatalf("integration attribution missing: %+v", row)
		}
	}
	if !strings.Contains(rows[0].After, `"removed":1`) || !strings.Contains(rows[1].After, "Renamed lamp") {
		t.Fatalf("registry snapshots are incomplete: %+v", rows)
	}
}
