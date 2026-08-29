package store

import (
	"database/sql"
	"encoding/json"
	"testing"

	_ "modernc.org/sqlite"
)

func migration084DB(t *testing.T, name string) (*sql.DB, interface{ Migrate(uint) error }) {
	t.Helper()
	db, err := sql.Open("sqlite", "file:"+name+"?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		t.Fatal(err)
	}
	migrator := newMigrate(t, db)
	return db, migrator
}

func TestMigration084ConvertsTypedSceneCompositionAndDown(t *testing.T) {
	db, migrator := migration084DB(t, "migration084-roundtrip")
	if err := migrator.Migrate(83); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`
		INSERT INTO devices (id, friendly_name, source, type) VALUES
		  ('d-state', 'State', 'zigbee2mqtt', 'light'),
		  ('d-effect', 'Effect', 'zigbee2mqtt', 'light'),
		  ('d-native', 'Native', 'zigbee2mqtt', 'light'),
		  ('d-malformed', 'Malformed', 'zigbee2mqtt', 'light');
		INSERT INTO effects (id, name, kind) VALUES ('effect-1', 'Glow', 'timeline');
		INSERT INTO scenes (id, name) VALUES ('scene-1', 'Migrated');
		INSERT INTO scene_actions (scene_id, target_type, target_id, expression, name) VALUES
		  ('scene-1', 'device', 'd-state', NULL, NULL),
		  ('scene-1', 'expression', 'selector-id', '[{"subject":"room","op":"is","values":["living"]}]', 'Living lights');
		INSERT INTO scene_device_payloads (scene_id, device_id, payload) VALUES
		  ('scene-1', 'd-state', '{"kind":"static","on":true,"brightness":123,"colorTemp":275,"color":{"r":10,"g":20,"b":30,"x":0.2,"y":0.3},"transition":1.5,"targetTemperature":21.5,"hvacMode":"heat","fanMode":"auto","swing":"both"}'),
		  ('scene-1', 'd-effect', '{"kind":"effect","effect_id":"effect-1"}'),
		  ('scene-1', 'd-native', '{"kind":"native_effect","native_name":"candle"}'),
		  ('scene-1', 'd-malformed', 'not-json');
	`); err != nil {
		t.Fatal(err)
	}
	if err := migrator.Migrate(84); err != nil {
		t.Fatalf("migrate up: %v", err)
	}
	var mode string
	if err := db.QueryRow(`SELECT lighting_mode FROM scenes WHERE id='scene-1'`).Scan(&mode); err != nil || mode != "manual" {
		t.Fatalf("mode=%q err=%v", mode, err)
	}
	var targets, behaviors int
	if err := db.QueryRow(`SELECT count(*) FROM scene_targets WHERE scene_id='scene-1'`).Scan(&targets); err != nil || targets != 2 {
		t.Fatalf("targets=%d err=%v", targets, err)
	}
	if err := db.QueryRow(`SELECT count(*) FROM scene_device_behaviors WHERE scene_id='scene-1'`).Scan(&behaviors); err != nil || behaviors != 4 {
		t.Fatalf("behaviors=%d err=%v", behaviors, err)
	}
	var brightness, colorTemp int
	var targetTemperature float64
	var hvac, fan, swing string
	if err := db.QueryRow(`
		SELECT brightness, color_temp, target_temperature, hvac_mode, fan_mode, swing
		FROM scene_device_behaviors WHERE scene_id='scene-1' AND device_id='d-state'
	`).Scan(&brightness, &colorTemp, &targetTemperature, &hvac, &fan, &swing); err != nil || brightness != 123 || colorTemp != 275 || targetTemperature != 21.5 || hvac != "heat" || fan != "auto" || swing != "both" {
		t.Fatalf("state=(%d,%d,%v,%q,%q,%q) err=%v", brightness, colorTemp, targetTemperature, hvac, fan, swing, err)
	}
	var malformedKind string
	var malformedOn *int
	if err := db.QueryRow(`SELECT kind, on_state FROM scene_device_behaviors WHERE device_id='d-malformed'`).Scan(&malformedKind, &malformedOn); err != nil || malformedKind != "state" || malformedOn != nil {
		t.Fatalf("malformed=(%q,%v) err=%v", malformedKind, malformedOn, err)
	}
	if _, err := db.Exec(`SELECT * FROM scene_actions`); err == nil {
		t.Fatal("scene_actions still exists")
	}
	if err := migrator.Migrate(83); err != nil {
		t.Fatalf("migrate down: %v", err)
	}
	var payload string
	if err := db.QueryRow(`SELECT payload FROM scene_device_payloads WHERE device_id='d-state'`).Scan(&payload); err != nil {
		t.Fatal(err)
	}
	var decoded map[string]any
	if err := json.Unmarshal([]byte(payload), &decoded); err != nil || decoded["kind"] != "static" || decoded["brightness"] != float64(123) || decoded["on"] != true {
		t.Fatalf("down payload=%s decoded=%#v err=%v", payload, decoded, err)
	}
	if _, err := db.Exec(`SELECT * FROM scene_targets`); err == nil {
		t.Fatal("typed Scene tables remain after down")
	}
}

func TestMigration084ForeignReferencesCascade(t *testing.T) {
	db, migrator := migration084DB(t, "migration084-cascade")
	if err := migrator.Migrate(84); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`
		INSERT INTO devices (id, friendly_name, source, type) VALUES ('d1', 'Light', 'zigbee2mqtt', 'light');
		INSERT INTO effects (id, name, kind) VALUES ('e1', 'Effect', 'timeline');
		INSERT INTO scenes (id, name, lighting_mode) VALUES ('s1', 'Scene', 'manual');
		INSERT INTO scene_manual_lighting (scene_id, on_state) VALUES ('s1', 1);
		INSERT INTO scene_device_behaviors (scene_id, device_id, kind, effect_id) VALUES ('s1', 'd1', 'effect', 'e1');
	`); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`DELETE FROM effects WHERE id='e1'`); err != nil {
		t.Fatal(err)
	}
	var count int
	if err := db.QueryRow(`SELECT count(*) FROM scene_device_behaviors`).Scan(&count); err != nil || count != 0 {
		t.Fatalf("effect cascade count=%d err=%v", count, err)
	}
	if _, err := db.Exec(`INSERT INTO scene_device_behaviors (scene_id, device_id, kind) VALUES ('s1', 'missing', 'state')`); err == nil {
		t.Fatal("missing device reference accepted")
	}
	if _, err := db.Exec(`DELETE FROM scenes WHERE id='s1'`); err != nil {
		t.Fatal(err)
	}
	for _, table := range []string{"scene_manual_lighting", "scene_targets", "scene_device_behaviors"} {
		if err := db.QueryRow(`SELECT count(*) FROM ` + table).Scan(&count); err != nil || count != 0 {
			t.Fatalf("%s count=%d err=%v", table, count, err)
		}
	}
}

func TestMigration084DownRejectsVibesBeforeMutation(t *testing.T) {
	db, migrator := migration084DB(t, "migration084-guard")
	if err := migrator.Migrate(84); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`
		INSERT INTO scenes (id, name, lighting_mode) VALUES ('vibe', 'Vibe', 'vibe');
		INSERT INTO scene_vibes (scene_id, domain, source_kind, seed, brightness, movement, cycle_nanos, grid_width, grid_height)
		VALUES ('vibe', 'full_color', 'photo', 1, 0.8, 0.2, 60000000000, 2, 2);
	`); err != nil {
		t.Fatal(err)
	}
	if err := migrator.Migrate(83); err == nil {
		t.Fatal("down migration accepted Vibe data")
	}
	var mode string
	if err := db.QueryRow(`SELECT lighting_mode FROM scenes WHERE id='vibe'`).Scan(&mode); err != nil || mode != "vibe" {
		t.Fatalf("guard mutated schema/data: mode=%q err=%v", mode, err)
	}
}
