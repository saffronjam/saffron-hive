package store

import (
	"database/sql"
	"encoding/json"
	"testing"

	_ "modernc.org/sqlite"
)

func TestMigration073ScopesDeviceStateTriggers(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration073?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Migrate(72); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`
		INSERT INTO devices (id, name, friendly_name, source, type)
		VALUES ('door-1', 'Balcony door', 'Door sensor', 'zigbee2mqtt', 'sensor'),
		       ('plug-1', NULL, 'Balcony plug', 'zigbee2mqtt', 'plug');
		INSERT INTO automations (id, name, enabled) VALUES ('auto-1', 'Door plug', 1);
		INSERT INTO automation_nodes (id, automation_id, type, config)
		VALUES
			('contact', 'auto-1', 'trigger', '{"kind":"event","event_type":"device.state_changed","filter_expr":"device(\"Balcony door\").contact == true"}'),
			('custom', 'auto-1', 'trigger', '{"kind":"event","event_type":"device.state_changed","filter_expr":"time.hour >= 21"}');
	`); err != nil {
		t.Fatal(err)
	}

	if err := m.Migrate(73); err != nil {
		t.Fatal(err)
	}
	assertTriggerFilter(t, db, "contact", `trigger.device_id == "door-1" && trigger.payload.state.contact != nil && trigger.payload.state.contact == true`)
	assertTriggerFilter(t, db, "custom", `time.hour >= 21`)

	if err := m.Migrate(72); err != nil {
		t.Fatal(err)
	}
	assertTriggerFilter(t, db, "contact", `device("Balcony door").contact == true`)
}

func assertTriggerFilter(t *testing.T, db *sql.DB, nodeID, want string) {
	t.Helper()
	var configJSON string
	if err := db.QueryRow(`SELECT config FROM automation_nodes WHERE id = ?`, nodeID).Scan(&configJSON); err != nil {
		t.Fatal(err)
	}
	var config struct {
		FilterExpr string `json:"filter_expr"`
	}
	if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
		t.Fatal(err)
	}
	if config.FilterExpr != want {
		t.Fatalf("filter = %q, want %q", config.FilterExpr, want)
	}
}
