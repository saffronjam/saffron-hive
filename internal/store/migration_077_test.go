package store

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func TestMigration077RemovesWebhookDescriptions(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration077?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Migrate(76); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`
		INSERT INTO webhook_endpoints (
			id, name, description, enabled, secret_hash, rate_limit_count, rate_limit_window_ms
		) VALUES ('hook-1', 'Pipeline failed', 'Deployment event', 1, 'hash', 1, 1000);
		INSERT INTO webhook_deliveries (
			id, endpoint_id, received_at, outcome, http_status
		) VALUES ('delivery-1', 'hook-1', CURRENT_TIMESTAMP, 'accepted', 202);
	`); err != nil {
		t.Fatal(err)
	}
	if err := m.Migrate(77); err != nil {
		t.Fatal(err)
	}

	assertRowCount(t, db, "SELECT COUNT(*) FROM pragma_table_info('webhook_endpoints') WHERE name = 'description'", 0)
	assertRowCount(t, db, "SELECT COUNT(*) FROM webhook_endpoints WHERE id = 'hook-1'", 1)
	assertRowCount(t, db, "SELECT COUNT(*) FROM webhook_deliveries WHERE endpoint_id = 'hook-1'", 1)

	if err := m.Migrate(76); err != nil {
		t.Fatal(err)
	}
	assertRowCount(t, db, "SELECT COUNT(*) FROM pragma_table_info('webhook_endpoints') WHERE name = 'description'", 1)
	assertRowCount(t, db, "SELECT COUNT(*) FROM webhook_endpoints WHERE id = 'hook-1' AND description = ''", 1)
}
