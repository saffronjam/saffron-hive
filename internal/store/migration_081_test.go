package store

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func TestMigration081ZigbeeBridgeInfo(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration081?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		t.Fatal(err)
	}
	m := newMigrate(t, db)
	if err := m.Migrate(80); err != nil {
		t.Fatalf("migrate to 80: %v", err)
	}
	if _, err := db.Exec(`
        INSERT INTO devices (id, friendly_name, source, type)
        VALUES ('0xcoord', 'Coordinator', 'zigbee2mqtt', 'hub');
        INSERT INTO zigbee_device_metadata (device_id, ieee_address, endpoints, bridge_fingerprint)
        VALUES ('0xcoord', '0xcoord', '[]', 'device-print');
    `); err != nil {
		t.Fatalf("seed metadata: %v", err)
	}
	if err := m.Migrate(81); err != nil {
		t.Fatalf("migrate to 81: %v", err)
	}
	if _, err := db.Exec(`
        UPDATE zigbee_device_metadata
        SET bridge_adapter_type = 'ZStack3x0', bridge_channel = 20,
            bridge_info_fingerprint = 'info-print'
        WHERE device_id = '0xcoord'
    `); err != nil {
		t.Fatalf("write bridge info: %v", err)
	}
	var adapter string
	var channel int
	if err := db.QueryRow(`
        SELECT bridge_adapter_type, bridge_channel
        FROM zigbee_device_metadata WHERE device_id = '0xcoord'
    `).Scan(&adapter, &channel); err != nil || adapter != "ZStack3x0" || channel != 20 {
		t.Fatalf("bridge info = (%q, %d), %v", adapter, channel, err)
	}
	if err := m.Migrate(80); err != nil {
		t.Fatalf("migrate down to 80: %v", err)
	}
	var fingerprint string
	if err := db.QueryRow(`
        SELECT bridge_fingerprint FROM zigbee_device_metadata WHERE device_id = '0xcoord'
    `).Scan(&fingerprint); err != nil || fingerprint != "device-print" {
		t.Fatalf("base metadata after down migration = %q, %v", fingerprint, err)
	}
	if _, err := db.Exec(`SELECT bridge_adapter_type FROM zigbee_device_metadata`); err == nil {
		t.Fatal("bridge info columns remain after down migration")
	}
}
