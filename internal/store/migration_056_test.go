package store

import (
	"database/sql"
	"testing"

	"github.com/golang-migrate/migrate/v4"
	_ "modernc.org/sqlite"
)

// TestMigration056DeviceFriendlyName exercises the up + down pair for migration
// 056. The up migration splits the single name column in two: `name` keeps only
// a user's override and becomes nullable, `friendly_name` carries what the
// integration reported. A name still identical to the adapter's is unset so the
// device tracks its integration again, while a name the user changed survives
// as an override. The down migration collapses them back into a NOT NULL column
// and restores zigbee_devices.
func TestMigration056DeviceFriendlyName(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Migrate(55); err != nil {
		t.Fatalf("migrate to 55: %v", err)
	}

	if _, err := db.Exec(`INSERT INTO devices (id, name, source, type, disabled) VALUES
        ('0x001', 'kitchen_ceiling', 'zigbee2mqtt', 'light', false),
        ('0x002', 'Reading lamp',    'zigbee2mqtt', 'light', true),
        ('0x003', 'unpaired_bulb',   'zigbee2mqtt', 'light', false),
        ('t-001', 'Portable AC',     'tuya',        'climate', false)`); err != nil {
		t.Fatalf("seed devices: %v", err)
	}
	// 0x003 deliberately has no zigbee_devices row, standing in for a device
	// discovered before that table was written to.
	if _, err := db.Exec(`INSERT INTO zigbee_devices (device_id, ieee_address, friendly_name) VALUES
        ('0x001', '0x001', 'kitchen_ceiling'),
        ('0x002', '0x002', 'bedroom_lamp_2')`); err != nil {
		t.Fatalf("seed zigbee_devices: %v", err)
	}
	// A membership row proves the devices rebuild does not orphan its children.
	if _, err := db.Exec(`INSERT INTO device_tags (device_id, tag) VALUES ('0x002', 'LIGHT')`); err != nil {
		t.Fatalf("seed device_tags: %v", err)
	}

	if err := m.Migrate(56); err != nil {
		t.Fatalf("migrate to 56: %v", err)
	}

	for _, tc := range []struct {
		id           string
		wantName     *string
		wantFriendly string
		why          string
	}{
		{"0x001", nil, "kitchen_ceiling",
			"name matched the adapter's, so it is unset and tracks zigbee2mqtt again"},
		{"0x002", strptr("Reading lamp"), "bedroom_lamp_2",
			"user renamed this one, so the override survives over the adapter name"},
		{"0x003", nil, "unpaired_bulb",
			"no zigbee_devices row, so the current name becomes the adapter name"},
		{"t-001", nil, "Portable AC",
			"non-Zigbee devices take their name as the adapter value"},
	} {
		var name *string
		var friendly string
		row := db.QueryRow(`SELECT name, friendly_name FROM devices WHERE id = ?`, tc.id)
		if err := row.Scan(&name, &friendly); err != nil {
			t.Fatalf("read %s after up: %v", tc.id, err)
		}
		if !eqStrPtr(name, tc.wantName) {
			t.Errorf("%s name after up = %v, want %v (%s)", tc.id, derefStr(name), derefStr(tc.wantName), tc.why)
		}
		if friendly != tc.wantFriendly {
			t.Errorf("%s friendly_name after up = %q, want %q (%s)", tc.id, friendly, tc.wantFriendly, tc.why)
		}
	}

	if tableExists(t, db, "zigbee_devices") {
		t.Error("zigbee_devices still present after up")
	}

	var disabled bool
	if err := db.QueryRow(`SELECT disabled FROM devices WHERE id = '0x002'`).Scan(&disabled); err != nil {
		t.Fatalf("read disabled after up: %v", err)
	}
	if !disabled {
		t.Error("the rebuild dropped the disabled flag")
	}

	var tagCount int
	if err := db.QueryRow(`SELECT count(*) FROM device_tags WHERE device_id = '0x002'`).Scan(&tagCount); err != nil {
		t.Fatalf("count device_tags after up: %v", err)
	}
	if tagCount != 1 {
		t.Errorf("device_tags rows after up = %d, want 1", tagCount)
	}

	if err := m.Migrate(56); err != nil && err != migrate.ErrNoChange {
		t.Fatalf("idempotent up: %v", err)
	}

	if err := m.Migrate(55); err != nil {
		t.Fatalf("migrate down to 55: %v", err)
	}

	for id, want := range map[string]string{
		"0x001": "kitchen_ceiling",
		"0x002": "Reading lamp",
		"0x003": "unpaired_bulb",
		"t-001": "Portable AC",
	} {
		var name string
		if err := db.QueryRow(`SELECT name FROM devices WHERE id = ?`, id).Scan(&name); err != nil {
			t.Fatalf("read %s after down: %v", id, err)
		}
		if name != want {
			t.Errorf("%s name after down = %q, want %q", id, name, want)
		}
	}

	var friendly string
	if err := db.QueryRow(`SELECT friendly_name FROM zigbee_devices WHERE device_id = '0x002'`).Scan(&friendly); err != nil {
		t.Fatalf("read zigbee_devices after down: %v", err)
	}
	if friendly != "bedroom_lamp_2" {
		t.Errorf("zigbee_devices.friendly_name after down = %q, want %q", friendly, "bedroom_lamp_2")
	}

	var zigbeeRows int
	if err := db.QueryRow(`SELECT count(*) FROM zigbee_devices`).Scan(&zigbeeRows); err != nil {
		t.Fatalf("count zigbee_devices after down: %v", err)
	}
	if zigbeeRows != 3 {
		t.Errorf("zigbee_devices rows after down = %d, want 3 (the tuya device is excluded)", zigbeeRows)
	}
}

func strptr(s string) *string { return &s }

func derefStr(s *string) string {
	if s == nil {
		return "<nil>"
	}
	return *s
}

func eqStrPtr(a, b *string) bool {
	if a == nil || b == nil {
		return a == nil && b == nil
	}
	return *a == *b
}
