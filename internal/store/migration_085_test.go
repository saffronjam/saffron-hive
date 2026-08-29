package store

import "testing"

func TestMigration085ConvertsActiveSceneRuntimeAndDown(t *testing.T) {
	db, migrator := migration084DB(t, "migration085-roundtrip")
	if err := migrator.Migrate(84); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`
		INSERT INTO devices (id, friendly_name, source, type) VALUES ('d1', 'Light', 'zigbee2mqtt', 'light');
		INSERT INTO scenes (id, name, lighting_mode, activated_at) VALUES ('s1', 'Scene', 'manual', '2026-08-26 12:00:00+00:00');
		INSERT INTO scene_manual_lighting (scene_id, on_state) VALUES ('s1', 1);
		INSERT INTO scene_expected_states (scene_id, device_id, on_state, brightness, color_temp, color_r, color_g, color_b)
		VALUES ('s1', 'd1', 1, 120, 300, 10, 20, 30);
	`); err != nil {
		t.Fatal(err)
	}
	if err := migrator.Migrate(85); err != nil {
		t.Fatalf("migrate up: %v", err)
	}
	var mode, kind string
	var ownsOn, ownsBrightness, ownsColorTemp, ownsColor int
	var on, brightness, colorTemp, r, g, b int
	if err := db.QueryRow(`
		SELECT r.lighting_mode, m.behavior_kind,
		       m.owns_on, m.owns_brightness, m.owns_color_temp, m.owns_color,
		       m.expected_on, m.expected_brightness, m.expected_color_temp,
		       m.expected_color_r, m.expected_color_g, m.expected_color_b
		FROM active_scene_runs r
		JOIN active_scene_members m ON m.scene_id = r.scene_id
		WHERE r.scene_id = 's1'
	`).Scan(&mode, &kind, &ownsOn, &ownsBrightness, &ownsColorTemp, &ownsColor, &on, &brightness, &colorTemp, &r, &g, &b); err != nil {
		t.Fatal(err)
	}
	if mode != "manual" || kind != "state" || ownsOn != 1 || ownsBrightness != 1 || ownsColorTemp != 1 || ownsColor != 1 || on != 1 || brightness != 120 || colorTemp != 300 || r != 10 || g != 20 || b != 30 {
		t.Fatalf("runtime conversion = mode=%q kind=%q owns=(%d,%d,%d,%d) expected=(%d,%d,%d,%d,%d,%d)", mode, kind, ownsOn, ownsBrightness, ownsColorTemp, ownsColor, on, brightness, colorTemp, r, g, b)
	}
	if _, err := db.Exec(`SELECT * FROM scene_expected_states`); err == nil {
		t.Fatal("scene_expected_states still exists")
	}
	if err := migrator.Migrate(84); err != nil {
		t.Fatalf("migrate down: %v", err)
	}
	if err := db.QueryRow(`SELECT on_state, brightness, color_temp, color_r, color_g, color_b FROM scene_expected_states WHERE scene_id='s1' AND device_id='d1'`).Scan(&on, &brightness, &colorTemp, &r, &g, &b); err != nil {
		t.Fatal(err)
	}
	if on != 1 || brightness != 120 || colorTemp != 300 || r != 10 || g != 20 || b != 30 {
		t.Fatalf("down expected state = (%d,%d,%d,%d,%d,%d)", on, brightness, colorTemp, r, g, b)
	}
}

func TestMigration085RuntimeReferencesCascade(t *testing.T) {
	db, migrator := migration084DB(t, "migration085-cascade")
	if err := migrator.Migrate(85); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`
		INSERT INTO devices (id, friendly_name, source, type) VALUES ('d1', 'Light', 'zigbee2mqtt', 'light');
		INSERT INTO scenes (id, name, lighting_mode) VALUES ('s1', 'Scene', 'vibe');
		INSERT INTO active_scene_runs (scene_id, run_id, started_at, definition_updated_at, lighting_mode)
		VALUES ('s1', 'run-1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'vibe');
		INSERT INTO active_scene_members (
			scene_id, device_id, behavior_kind, owns_on, owns_brightness, owns_color_temp,
			owns_color, owns_temperature, owns_hvac_mode, owns_fan_mode, owns_swing
		) VALUES ('s1', 'd1', 'field', 1, 1, 0, 1, 0, 0, 0, 0);
	`); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`DELETE FROM devices WHERE id='d1'`); err != nil {
		t.Fatal(err)
	}
	var members int
	if err := db.QueryRow(`SELECT count(*) FROM active_scene_members`).Scan(&members); err != nil || members != 0 {
		t.Fatalf("device cascade members=%d err=%v", members, err)
	}
	if _, err := db.Exec(`DELETE FROM scenes WHERE id='s1'`); err != nil {
		t.Fatal(err)
	}
	var runs int
	if err := db.QueryRow(`SELECT count(*) FROM active_scene_runs`).Scan(&runs); err != nil || runs != 0 {
		t.Fatalf("Scene cascade runs=%d err=%v", runs, err)
	}
}
