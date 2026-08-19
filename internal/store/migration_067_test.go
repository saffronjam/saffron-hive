package store

import (
	"database/sql"
	"testing"

	"github.com/golang-migrate/migrate/v4"
	_ "modernc.org/sqlite"
)

func TestMigration067DeviceRoles(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration067?mode=memory&cache=shared")
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Migrate(66); err != nil {
		t.Fatalf("migrate to 66: %v", err)
	}

	devices := []struct {
		id, deviceType, capabilities string
	}{
		{"light-plug", "plug", `[{"name":"on_off","access":3}]`},
		{"plain-plug", "plug", `[{"name":"on_off","access":3}]`},
		{"climate", "climate", `[{"name":"on_off","access":3}]`},
		{"contact", "sensor", `[{"name":"contact","access":1}]`},
	}
	for _, d := range devices {
		if _, err := db.Exec(
			`INSERT INTO devices (id, friendly_name, source, type, capabilities) VALUES (?, ?, 'zigbee2mqtt', ?, ?)`,
			d.id, d.id, d.deviceType, d.capabilities,
		); err != nil {
			t.Fatalf("seed device %s: %v", d.id, err)
		}
	}
	for _, id := range []string{"light-plug", "climate"} {
		if _, err := db.Exec(`INSERT INTO device_tags (device_id, tag) VALUES (?, 'LIGHT')`, id); err != nil {
			t.Fatalf("seed tag for %s: %v", id, err)
		}
	}

	if err := m.Migrate(67); err != nil {
		t.Fatalf("migrate to 67: %v", err)
	}

	assertRoles := func(id string, controlledLoad, contact *string) {
		t.Helper()
		var gotControlledLoad, gotContact *string
		if err := db.QueryRow(
			`SELECT controlled_load_role, contact_role FROM devices WHERE id = ?`, id,
		).Scan(&gotControlledLoad, &gotContact); err != nil {
			t.Fatalf("read roles for %s: %v", id, err)
		}
		if !equalStringPointers(gotControlledLoad, controlledLoad) || !equalStringPointers(gotContact, contact) {
			t.Fatalf("roles for %s = (%v, %v), want (%v, %v)", id, gotControlledLoad, gotContact, controlledLoad, contact)
		}
	}
	light, appliance, general := "light", "appliance", "general"
	assertRoles("light-plug", &light, nil)
	assertRoles("plain-plug", &appliance, nil)
	assertRoles("climate", nil, nil)
	assertRoles("contact", nil, &general)

	if _, err := db.Exec(`SELECT 1 FROM device_tags`); err == nil {
		t.Fatal("device_tags should not exist")
	}

	if err := m.Migrate(66); err != nil {
		t.Fatalf("migrate down to 66: %v", err)
	}
	var count int
	if err := db.QueryRow(`SELECT count(*) FROM device_tags WHERE device_id = 'light-plug' AND tag = 'LIGHT'`).Scan(&count); err != nil {
		t.Fatalf("read restored tags: %v", err)
	}
	if count != 1 {
		t.Fatalf("restored LIGHT tags = %d, want 1", count)
	}
	if err := m.Migrate(67); err != nil && err != migrate.ErrNoChange {
		t.Fatalf("migrate back to 67: %v", err)
	}
}

func equalStringPointers(a, b *string) bool {
	if a == nil || b == nil {
		return a == nil && b == nil
	}
	return *a == *b
}
