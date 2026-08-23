package store

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func TestMigration076CreatesIncomingWebhookStorage(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration076?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Migrate(75); err != nil {
		t.Fatal(err)
	}
	if err := m.Migrate(76); err != nil {
		t.Fatal(err)
	}

	if _, err := db.Exec(`
		INSERT INTO webhook_endpoints (
			id, name, description, enabled, secret_hash, rate_limit_count, rate_limit_window_ms
		) VALUES ('hook-1', 'Pipeline failed', '', 1, 'hash', 1, 1000);
		INSERT INTO webhook_deliveries (
			id, endpoint_id, received_at, outcome, http_status
		) VALUES ('delivery-1', 'hook-1', CURRENT_TIMESTAMP, 'accepted', 202);
		INSERT INTO activity_events (
			type, timestamp, message, payload_json, webhook_id, webhook_name
		) VALUES ('webhook.received', CURRENT_TIMESTAMP, 'Webhook received: Pipeline failed', '{}', 'hook-1', 'Pipeline failed');
	`); err != nil {
		t.Fatal(err)
	}

	assertRowCount(t, db, "SELECT COUNT(*) FROM webhook_endpoints", 1)
	assertRowCount(t, db, "SELECT COUNT(*) FROM webhook_deliveries", 1)
	assertRowCount(t, db, "SELECT COUNT(*) FROM activity_events WHERE webhook_id = 'hook-1'", 1)

	if err := m.Migrate(75); err != nil {
		t.Fatal(err)
	}
	assertRowCount(t, db, "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'webhook_endpoints'", 0)
}
