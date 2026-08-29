package store

import "testing"

func TestMigration088RemovesSceneFallback(t *testing.T) {
	db, migrator := migration084DB(t, "migration088-remove-scene-fallback")
	if err := migrator.Migrate(87); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`
		INSERT INTO scenes (id, name) VALUES ('scene', 'Scene');
		INSERT INTO scene_lighting (scene_id, on_state, brightness) VALUES ('scene', 1, 180);
	`); err != nil {
		t.Fatal(err)
	}

	if err := migrator.Migrate(88); err != nil {
		t.Fatalf("migrate up: %v", err)
	}
	if _, err := db.Exec(`SELECT * FROM scene_lighting`); err == nil {
		t.Fatal("scene_lighting still exists")
	}

	if err := migrator.Migrate(87); err != nil {
		t.Fatalf("migrate down: %v", err)
	}
	var rows int
	if err := db.QueryRow(`SELECT count(*) FROM scene_lighting WHERE scene_id = 'scene'`).Scan(&rows); err != nil || rows != 1 {
		t.Fatalf("restored lighting rows=%d err=%v", rows, err)
	}
}
