package store

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func TestMigration075RemovesManualAutomationTriggers(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration075?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Migrate(74); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`
		INSERT INTO automations (id, name, enabled) VALUES ('auto-1', 'Door lights', 1);
		INSERT INTO automation_nodes (id, automation_id, type, config)
		VALUES
			('manual', 'auto-1', 'trigger', '{"kind":"manual"}'),
			('event', 'auto-1', 'trigger', '{"kind":"event","event_type":"device.state_changed","filter_expr":"true"}'),
			('action', 'auto-1', 'action', '{"action_type":"set_device_state","target_type":"device","target_id":"light-1","payload":"{\"on\":true}"}');
		INSERT INTO automation_edges (automation_id, from_node_id, to_node_id)
		VALUES ('auto-1', 'manual', 'action'), ('auto-1', 'event', 'action');
		INSERT INTO automation_node_state (automation_id, node_id, key, value)
		VALUES ('auto-1', 'manual', 'last_fired', '2026-08-21T06:00:00Z');
	`); err != nil {
		t.Fatal(err)
	}

	if err := m.Migrate(75); err != nil {
		t.Fatal(err)
	}

	assertRowCount(t, db, `SELECT COUNT(*) FROM automation_nodes WHERE id = 'manual'`, 0)
	assertRowCount(t, db, `SELECT COUNT(*) FROM automation_nodes WHERE id IN ('event', 'action')`, 2)
	assertRowCount(t, db, `SELECT COUNT(*) FROM automation_edges WHERE from_node_id = 'manual'`, 0)
	assertRowCount(t, db, `SELECT COUNT(*) FROM automation_edges WHERE from_node_id = 'event'`, 1)
	assertRowCount(t, db, `SELECT COUNT(*) FROM automation_node_state WHERE node_id = 'manual'`, 0)

	if err := m.Migrate(74); err != nil {
		t.Fatal(err)
	}
	assertRowCount(t, db, `SELECT COUNT(*) FROM automation_nodes WHERE id = 'manual'`, 0)
}

func assertRowCount(t *testing.T, db *sql.DB, query string, want int) {
	t.Helper()
	var got int
	if err := db.QueryRow(query).Scan(&got); err != nil {
		t.Fatal(err)
	}
	if got != want {
		t.Fatalf("row count = %d, want %d for %s", got, want, query)
	}
}
