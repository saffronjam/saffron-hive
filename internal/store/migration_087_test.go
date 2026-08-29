package store

import (
	"database/sql"
	"testing"
)

func TestMigration087UnifiesSceneLightingAndSeparatesSupportingStates(t *testing.T) {
	db, migrator := migration084DB(t, "migration087-unified-lighting")
	if err := migrator.Migrate(86); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`
		INSERT INTO devices (id, friendly_name, source, type, controlled_load_role) VALUES
			('light', 'Light', 'zigbee2mqtt', 'light', NULL),
			('lamp-plug', 'Lamp plug', 'zigbee2mqtt', 'plug', 'light'),
			('appliance', 'Appliance', 'zigbee2mqtt', 'plug', 'appliance'),
			('sensor', 'Sensor', 'zigbee2mqtt', 'sensor', NULL);
		INSERT INTO effects (id, name, kind) VALUES ('effect', 'Glow', 'timeline');
		INSERT INTO scenes (id, name, lighting_mode) VALUES
			('static', 'Static', 'manual'),
			('dynamic', 'Dynamic', 'vibe');
		INSERT INTO scene_manual_lighting (scene_id, on_state, brightness) VALUES
			('static', 1, 120),
			('dynamic', 1, 180);
		INSERT INTO scene_targets (scene_id, position, target_type, target_id) VALUES
			('static', 0, 'room', 'living'),
			('dynamic', 0, 'device', 'light');
		INSERT INTO scene_device_behaviors (scene_id, device_id, kind, brightness) VALUES
			('static', 'light', 'state', 42),
			('static', 'lamp-plug', 'state', 90);
		INSERT INTO scene_device_behaviors (scene_id, device_id, kind, on_state)
		VALUES ('static', 'appliance', 'state', 1), ('static', 'sensor', 'state', 1);
		INSERT INTO scene_device_behaviors (scene_id, device_id, kind, effect_id)
		VALUES ('dynamic', 'light', 'effect', 'effect');
		INSERT INTO scene_vibes (
			scene_id, domain, source_kind, preset_id, preset_title, seed,
			brightness, movement, cycle_nanos, grid_width, grid_height
		) VALUES ('dynamic', 'full_color', 'preset', 'night-sky', 'Night Sky', 9, 0.8, 0.4, 60000000000, 2, 2);
		INSERT INTO scene_vibe_samples (scene_id, position, lightness, chroma, hue) VALUES
			('dynamic', 0, 0.7, 0.2, 20),
			('dynamic', 1, 0.7, 0.2, 80),
			('dynamic', 2, 0.7, 0.2, 180),
			('dynamic', 3, 0.7, 0.2, 280);
		INSERT INTO active_scene_runs (scene_id, run_id, started_at, definition_updated_at, lighting_mode)
		VALUES ('dynamic', 'run', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'vibe');
	`); err != nil {
		t.Fatal(err)
	}

	if err := migrator.Migrate(87); err != nil {
		t.Fatalf("migrate up: %v", err)
	}
	assertColumnMissing(t, db, "scenes", "lighting_mode")
	assertColumnMissing(t, db, "active_scene_runs", "lighting_mode")

	var fallbackBrightness int
	if err := db.QueryRow(`SELECT brightness FROM scene_lighting WHERE scene_id='static'`).Scan(&fallbackBrightness); err != nil || fallbackBrightness != 120 {
		t.Fatalf("fallback brightness=%d err=%v", fallbackBrightness, err)
	}
	var dynamicSamples int
	if err := db.QueryRow(`SELECT count(*) FROM scene_dynamic_samples WHERE scene_id='dynamic'`).Scan(&dynamicSamples); err != nil || dynamicSamples != 4 {
		t.Fatalf("dynamic samples=%d err=%v", dynamicSamples, err)
	}
	var overrideCount int
	if err := db.QueryRow(`SELECT count(*) FROM scene_light_overrides WHERE scene_id='static'`).Scan(&overrideCount); err != nil || overrideCount != 2 {
		t.Fatalf("light overrides=%d err=%v", overrideCount, err)
	}
	var supportingCount int
	if err := db.QueryRow(`SELECT count(*) FROM scene_supporting_states WHERE scene_id='static' AND device_id='appliance' AND on_state=1`).Scan(&supportingCount); err != nil || supportingCount != 1 {
		t.Fatalf("supporting states=%d err=%v", supportingCount, err)
	}
	var sensorCount int
	if err := db.QueryRow(`
		SELECT
			(SELECT count(*) FROM scene_supporting_states WHERE device_id='sensor') +
			(SELECT count(*) FROM scene_light_overrides WHERE device_id='sensor')
	`).Scan(&sensorCount); err != nil || sensorCount != 0 {
		t.Fatalf("sensor Scene rows=%d err=%v", sensorCount, err)
	}

	if err := migrator.Migrate(86); err != nil {
		t.Fatalf("migrate down: %v", err)
	}
	var staticMode, dynamicMode, runMode string
	if err := db.QueryRow(`SELECT lighting_mode FROM scenes WHERE id='static'`).Scan(&staticMode); err != nil {
		t.Fatal(err)
	}
	if err := db.QueryRow(`SELECT lighting_mode FROM scenes WHERE id='dynamic'`).Scan(&dynamicMode); err != nil {
		t.Fatal(err)
	}
	if err := db.QueryRow(`SELECT lighting_mode FROM active_scene_runs WHERE scene_id='dynamic'`).Scan(&runMode); err != nil {
		t.Fatal(err)
	}
	if staticMode != "manual" || dynamicMode != "vibe" || runMode != "vibe" {
		t.Fatalf("restored modes=(%q,%q,%q)", staticMode, dynamicMode, runMode)
	}
	var restoredSupporting int
	if err := db.QueryRow(`SELECT count(*) FROM scene_device_behaviors WHERE scene_id='static' AND device_id='appliance' AND kind='state'`).Scan(&restoredSupporting); err != nil || restoredSupporting != 1 {
		t.Fatalf("restored supporting behavior=%d err=%v", restoredSupporting, err)
	}
}

func assertColumnMissing(t *testing.T, db *sql.DB, table, column string) {
	t.Helper()
	rows, err := db.Query(`PRAGMA table_info(` + table + `)`)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = rows.Close() }()
	for rows.Next() {
		var cid int
		var name, kind string
		var notNull, primaryKey int
		var defaultValue any
		if err := rows.Scan(&cid, &name, &kind, &notNull, &defaultValue, &primaryKey); err != nil {
			t.Fatal(err)
		}
		if name == column {
			t.Fatalf("%s.%s still exists", table, column)
		}
	}
	if err := rows.Err(); err != nil {
		t.Fatal(err)
	}
}
