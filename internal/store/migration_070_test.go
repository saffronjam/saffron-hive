package store

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func TestMigration070ZigbeeDeviceMetadata(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration070?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		t.Fatal(err)
	}
	m := newMigrate(t, db)
	if err := m.Migrate(69); err != nil {
		t.Fatalf("migrate to 69: %v", err)
	}
	if _, err := db.Exec(`
		INSERT INTO devices (id, friendly_name, source, type) VALUES ('0xabc', 'Sensor', 'zigbee2mqtt', 'sensor');
		INSERT INTO zigbee2mqtt_config (id, broker) VALUES (1, 'mqtt.example.com:1883');
	`); err != nil {
		t.Fatalf("seed migration: %v", err)
	}
	if err := m.Migrate(70); err != nil {
		t.Fatalf("migrate to 70: %v", err)
	}
	if _, err := db.Exec(`
		INSERT INTO zigbee_device_metadata (device_id, ieee_address, endpoints, bridge_fingerprint)
		VALUES ('0xabc', '0xabc', '[]', 'fingerprint')
	`); err != nil {
		t.Fatalf("insert metadata: %v", err)
	}
	if _, err := db.Exec(`UPDATE zigbee2mqtt_config SET frontend_url = 'https://z2m.example.com' WHERE id = 1`); err != nil {
		t.Fatalf("write frontend URL: %v", err)
	}
	if _, err := db.Exec(`DELETE FROM devices WHERE id = '0xabc'`); err != nil {
		t.Fatalf("delete device: %v", err)
	}
	var count int
	if err := db.QueryRow(`SELECT count(*) FROM zigbee_device_metadata`).Scan(&count); err != nil || count != 0 {
		t.Fatalf("metadata cascade count = %d, %v", count, err)
	}
	if err := m.Migrate(69); err != nil {
		t.Fatalf("migrate down to 69: %v", err)
	}
	if _, err := db.Exec(`SELECT frontend_url FROM zigbee2mqtt_config`); err == nil {
		t.Fatal("frontend_url still exists after down migration")
	}
	if _, err := db.Exec(`SELECT * FROM zigbee_device_metadata`); err == nil {
		t.Fatal("metadata table still exists after down migration")
	}
}
