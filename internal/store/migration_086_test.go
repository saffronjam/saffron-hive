package store

import "testing"

func TestMigration086RemovesOnlyCommandlessStateBehaviors(t *testing.T) {
	db, migrator := migration084DB(t, "migration086-empty-behaviors")
	if err := migrator.Migrate(85); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`
		INSERT INTO devices (id, friendly_name, source, type) VALUES
			('empty', 'Empty', 'zigbee2mqtt', 'sensor'),
			('plug', 'Plug', 'zigbee2mqtt', 'plug');
		INSERT INTO scenes (id, name, lighting_mode) VALUES ('s1', 'Scene', 'manual');
		INSERT INTO scene_manual_lighting (scene_id, on_state) VALUES ('s1', 1);
		INSERT INTO scene_device_behaviors (scene_id, device_id, kind) VALUES ('s1', 'empty', 'state');
		INSERT INTO scene_device_behaviors (scene_id, device_id, kind, on_state) VALUES ('s1', 'plug', 'state', 1);
	`); err != nil {
		t.Fatal(err)
	}
	if err := migrator.Migrate(86); err != nil {
		t.Fatal(err)
	}
	var count int
	if err := db.QueryRow(`SELECT count(*) FROM scene_device_behaviors`).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 1 {
		t.Fatalf("behaviors = %d, want 1", count)
	}
	var deviceID string
	if err := db.QueryRow(`SELECT device_id FROM scene_device_behaviors`).Scan(&deviceID); err != nil {
		t.Fatal(err)
	}
	if deviceID != "plug" {
		t.Fatalf("remaining behavior = %q", deviceID)
	}
}
