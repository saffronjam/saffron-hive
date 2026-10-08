package store

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func TestMigration099AutomationLanguage(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration099?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()
	migrator := newMigrate(t, db)
	if err := migrator.Migrate(98); err != nil {
		t.Fatalf("migrate to 98: %v", err)
	}
	if _, err := db.Exec(`
		INSERT INTO automations (id, name, enabled) VALUES ('auto-1', 'Scenes', 1);
		INSERT INTO automation_nodes (id, automation_id, type, config) VALUES
			('trigger-1', 'auto-1', 'trigger', '{"kind":"schedule","cron_expr":"0 0 7 * * *"}'),
			('action-1', 'auto-1', 'action', '{"action_type":"activate_scene","target_type":"","target_id":"","payload":"scene-1"}'),
			('action-2', 'auto-1', 'action', '{"action_type":"set_device_state","target_type":"device","target_id":"lamp","payload":"{\"on\":true}"}');
		INSERT INTO automation_edges (automation_id, from_node_id, to_node_id) VALUES
			('auto-1', 'trigger-1', 'action-1'), ('auto-1', 'trigger-1', 'action-2');
		INSERT INTO automation_node_state (automation_id, node_id, key, value) VALUES ('auto-1', 'action-1', 'k', 'v');
	`); err != nil {
		t.Fatal(err)
	}
	if err := migrator.Migrate(99); err != nil {
		t.Fatalf("migrate to 99: %v", err)
	}

	var nodeIDs, edgeIDs, stateNode string
	if err := db.QueryRow(`SELECT group_concat(id, ',') FROM (SELECT id FROM automation_nodes WHERE automation_id = 'auto-1' ORDER BY id)`).Scan(&nodeIDs); err != nil {
		t.Fatal(err)
	}
	if nodeIDs != "a1,a2,t1" {
		t.Fatalf("node ids = %q", nodeIDs)
	}
	if err := db.QueryRow(`SELECT group_concat(from_node_id || '>' || to_node_id, ',') FROM (SELECT * FROM automation_edges ORDER BY to_node_id)`).Scan(&edgeIDs); err != nil {
		t.Fatal(err)
	}
	if edgeIDs != "t1>a1,t1>a2" {
		t.Fatalf("edges = %q", edgeIDs)
	}
	if err := db.QueryRow(`SELECT node_id FROM automation_node_state`).Scan(&stateNode); err != nil {
		t.Fatal(err)
	}
	if stateNode != "a1" {
		t.Fatalf("node state belongs to %q", stateNode)
	}

	payload := func(id string) string {
		t.Helper()
		var value string
		if err := db.QueryRow(`SELECT json_extract(config, '$.payload') FROM automation_nodes WHERE automation_id = 'auto-1' AND id = ?`, id).Scan(&value); err != nil {
			t.Fatal(err)
		}
		return value
	}
	if got := payload("a1"); got != `{"scene_id":"scene-1"}` {
		t.Fatalf("activate_scene payload = %q", got)
	}
	if got := payload("a2"); got != `{"on":true}` {
		t.Fatalf("set_device_state payload = %q", got)
	}
	var definitions string
	if err := db.QueryRow(`SELECT definitions FROM automations WHERE id = 'auto-1'`).Scan(&definitions); err != nil {
		t.Fatal(err)
	}
	if definitions != "{}" {
		t.Fatalf("definitions = %q", definitions)
	}

	if _, err := db.Exec(`
		INSERT INTO automations (id, name, enabled) VALUES ('auto-2', 'Copy', 1);
		INSERT INTO automation_nodes (automation_id, id, type, config) VALUES ('auto-2', 't1', 'trigger', '{}');
	`); err != nil {
		t.Fatalf("node ids are not scoped to their automation: %v", err)
	}
	var edges, states int
	if err := db.QueryRow(`SELECT (SELECT COUNT(*) FROM automation_edges), (SELECT COUNT(*) FROM automation_node_state)`).Scan(&edges, &states); err != nil {
		t.Fatal(err)
	}
	if edges != 2 || states != 1 {
		t.Fatalf("edges = %d, node state = %d", edges, states)
	}

	if _, err := db.Exec(`DELETE FROM automations WHERE id = 'auto-2'`); err != nil {
		t.Fatal(err)
	}
	if err := migrator.Migrate(98); err != nil {
		t.Fatalf("migrate down to 98: %v", err)
	}
	if got := payload("auto-1:a1"); got != "scene-1" {
		t.Fatalf("activate_scene payload after down = %q", got)
	}
	if _, err := db.Exec(`SELECT definitions FROM automations`); err == nil {
		t.Fatal("definitions column remains after down migration")
	}
}
