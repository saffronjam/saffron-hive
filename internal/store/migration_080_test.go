package store

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func TestMigration080StoresActivateSceneIDInPayload(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration080?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Migrate(79); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`
		INSERT INTO automations (id, name, enabled) VALUES ('auto-1', 'Scenes', 1);
		INSERT INTO automation_nodes (id, automation_id, type, config)
		VALUES
			('target-fields', 'auto-1', 'action', '{"action_type":"activate_scene","target_type":"scene","target_id":"scene-1","target_expr":[],"payload":""}'),
			('payload', 'auto-1', 'action', '{"action_type":"activate_scene","target_type":"","target_id":"","target_expr":[],"payload":"scene-2"}'),
			('device', 'auto-1', 'action', '{"action_type":"set_device_state","target_type":"device","target_id":"light-1","target_expr":[],"payload":"{\"on\":true}"}');
	`); err != nil {
		t.Fatal(err)
	}

	if err := m.Migrate(80); err != nil {
		t.Fatal(err)
	}

	assertRowCount(t, db, `SELECT COUNT(*) FROM automation_nodes
		WHERE id = 'target-fields'
		  AND json_extract(config, '$.payload') = 'scene-1'
		  AND json_extract(config, '$.target_type') = ''
		  AND json_extract(config, '$.target_id') = ''`, 1)
	assertRowCount(t, db, `SELECT COUNT(*) FROM automation_nodes
		WHERE id = 'payload'
		  AND json_extract(config, '$.payload') = 'scene-2'
		  AND json_extract(config, '$.target_type') = ''
		  AND json_extract(config, '$.target_id') = ''`, 1)
	assertRowCount(t, db, `SELECT COUNT(*) FROM automation_nodes
		WHERE id = 'device'
		  AND json_extract(config, '$.target_type') = 'device'
		  AND json_extract(config, '$.target_id') = 'light-1'`, 1)

	if err := m.Migrate(79); err != nil {
		t.Fatal(err)
	}
	assertRowCount(t, db, `SELECT COUNT(*) FROM automation_nodes
		WHERE id = 'target-fields'
		  AND json_extract(config, '$.payload') = ''
		  AND json_extract(config, '$.target_type') = 'scene'
		  AND json_extract(config, '$.target_id') = 'scene-1'`, 1)
}
