package store

import (
	"database/sql"
	"sort"
	"strings"
	"testing"

	"github.com/golang-migrate/migrate/v4"
	_ "modernc.org/sqlite"
)

// TestMigration054Zigbee2MQTTIntegration exercises the up + down pair for
// migration 054. The up migration renames the broker config table, defaults the
// new enabled flag on so a configured install keeps talking to its broker,
// folds the "zigbee" and empty-string device sources into "zigbee2mqtt", and
// drops rows carrying the retired connectivity alarm id. Sources belonging to
// other adapters and alarms carrying other ids are left alone. The down
// migration restores the table, its data, and the device source.
func TestMigration054Zigbee2MQTTIntegration(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Migrate(53); err != nil {
		t.Fatalf("migrate to 53: %v", err)
	}

	if _, err := db.Exec(`INSERT INTO mqtt_config (id, broker, username, password, use_wss)
        VALUES (1, 'mqtt.example.com:8883', 'hive', 's3cret', 1)`); err != nil {
		t.Fatalf("seed mqtt_config: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO devices (id, name, source, type) VALUES
        ('d-zigbee', 'Hallway ceiling 1', 'zigbee', 'light'),
        ('d-empty', 'Legacy bulb', '', 'light'),
        ('d-tuya', 'Cloud bulb', 'tuya', 'light')`); err != nil {
		t.Fatalf("seed devices: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO alarms (alarm_id, severity, kind, message, source, raised_at) VALUES
        ('system.mqtt_disconnected', 'high', 'auto', 'MQTT broker is disconnected', 'system.monitor', '2026-07-31T06:00:00Z'),
        ('system.disk_low', 'medium', 'auto', 'Disk space is low', 'system.monitor', '2026-07-31T06:00:00Z')`); err != nil {
		t.Fatalf("seed alarms: %v", err)
	}

	if err := m.Migrate(54); err != nil {
		t.Fatalf("migrate to 54: %v", err)
	}

	var broker, username, password string
	var useWSS, enabled bool
	row := db.QueryRow(`SELECT broker, username, password, use_wss, enabled FROM zigbee2mqtt_config WHERE id = 1`)
	if err := row.Scan(&broker, &username, &password, &useWSS, &enabled); err != nil {
		t.Fatalf("read zigbee2mqtt_config after up: %v", err)
	}
	if broker != "mqtt.example.com:8883" || username != "hive" || password != "s3cret" || !useWSS {
		t.Fatalf("config not preserved after up: broker=%q username=%q password=%q useWSS=%v", broker, username, password, useWSS)
	}
	if !enabled {
		t.Fatal("enabled must default to true after up, otherwise a configured install stops connecting")
	}

	if got := deviceSource(t, db, "d-zigbee"); got != "zigbee2mqtt" {
		t.Fatalf("d-zigbee source after up: want zigbee2mqtt, got %q", got)
	}
	if got := deviceSource(t, db, "d-empty"); got != "zigbee2mqtt" {
		t.Fatalf("d-empty source after up: want zigbee2mqtt, got %q", got)
	}
	if got := deviceSource(t, db, "d-tuya"); got != "tuya" {
		t.Fatalf("d-tuya source after up: want tuya (untouched), got %q", got)
	}

	if got := alarmIDs(t, db); got != "system.disk_low" {
		t.Fatalf("alarms after up: want only system.disk_low, got %q", got)
	}

	if err := m.Migrate(54); err != nil && err != migrate.ErrNoChange {
		t.Fatalf("idempotent up: %v", err)
	}

	if err := m.Migrate(53); err != nil {
		t.Fatalf("migrate down to 53: %v", err)
	}

	row = db.QueryRow(`SELECT broker, username, password, use_wss FROM mqtt_config WHERE id = 1`)
	if err := row.Scan(&broker, &username, &password, &useWSS); err != nil {
		t.Fatalf("read mqtt_config after down: %v", err)
	}
	if broker != "mqtt.example.com:8883" || username != "hive" || password != "s3cret" || !useWSS {
		t.Fatalf("config not restored after down: broker=%q username=%q password=%q useWSS=%v", broker, username, password, useWSS)
	}
	if tableExists(t, db, "zigbee2mqtt_config") {
		t.Fatal("zigbee2mqtt_config still present after down")
	}

	if got := deviceSource(t, db, "d-zigbee"); got != "zigbee" {
		t.Fatalf("d-zigbee source after down: want zigbee, got %q", got)
	}
	if got := deviceSource(t, db, "d-tuya"); got != "tuya" {
		t.Fatalf("d-tuya source after down: want tuya (untouched), got %q", got)
	}
}

func deviceSource(t *testing.T, db *sql.DB, id string) string {
	t.Helper()
	var source string
	if err := db.QueryRow(`SELECT source FROM devices WHERE id = ?`, id).Scan(&source); err != nil {
		t.Fatalf("query source for %s: %v", id, err)
	}
	return source
}

func alarmIDs(t *testing.T, db *sql.DB) string {
	t.Helper()
	rows, err := db.Query(`SELECT alarm_id FROM alarms`)
	if err != nil {
		t.Fatalf("query alarms: %v", err)
	}
	defer func() { _ = rows.Close() }()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			t.Fatalf("scan alarm_id: %v", err)
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("iterate alarms: %v", err)
	}
	sort.Strings(ids)
	return strings.Join(ids, ",")
}

func tableExists(t *testing.T, db *sql.DB, name string) bool {
	t.Helper()
	var found string
	err := db.QueryRow(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`, name).Scan(&found)
	if err == sql.ErrNoRows {
		return false
	}
	if err != nil {
		t.Fatalf("query sqlite_master for %s: %v", name, err)
	}
	return true
}
