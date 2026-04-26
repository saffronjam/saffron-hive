package store

import (
	"database/sql"
	"testing"

	"github.com/golang-migrate/migrate/v4"
	_ "modernc.org/sqlite"
)

// TestMigration032ScenePayloadKind exercises the up + down pair for migration
// 032. The up migration injects "kind":"static" into every row that lacks it
// while leaving rows that already carry a kind (e.g. effect rows inserted
// after the schema landed) untouched. The down migration removes the kind
// field from every row that has one.
func TestMigration032ScenePayloadKind(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Migrate(31); err != nil {
		t.Fatalf("migrate to 31: %v", err)
	}

	if _, err := db.Exec(`INSERT INTO users (id, username, name, password_hash) VALUES ('u1', 'u1', 'U1', 'hash')`); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO scenes (id, name, created_by) VALUES ('s1', 'scene 1', 'u1')`); err != nil {
		t.Fatalf("seed scene: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO scene_device_payloads (scene_id, device_id, payload) VALUES
        ('s1', 'd1', '{"on":true,"brightness":200}'),
        ('s1', 'd2', '{"kind":"effect","effect_id":"fireplace"}')`); err != nil {
		t.Fatalf("seed payloads: %v", err)
	}

	if err := m.Migrate(32); err != nil {
		t.Fatalf("migrate to 32: %v", err)
	}

	got := payloadKind(t, db, "s1", "d1")
	if got != "static" {
		t.Fatalf("d1 kind after up: want static, got %q", got)
	}
	got = payloadKind(t, db, "s1", "d2")
	if got != "effect" {
		t.Fatalf("d2 kind after up: want effect (untouched), got %q", got)
	}

	if err := m.Migrate(32); err != nil && err != migrate.ErrNoChange {
		t.Fatalf("idempotent up: %v", err)
	}

	got = payloadKind(t, db, "s1", "d1")
	if got != "static" {
		t.Fatalf("d1 kind after idempotent up: want static, got %q", got)
	}

	if err := m.Migrate(31); err != nil {
		t.Fatalf("migrate down to 31: %v", err)
	}

	got = payloadKind(t, db, "s1", "d1")
	if got != "" {
		t.Fatalf("d1 kind after down: want empty, got %q", got)
	}
	got = payloadKind(t, db, "s1", "d2")
	if got != "" {
		t.Fatalf("d2 kind after down: want empty, got %q", got)
	}
}

func payloadKind(t *testing.T, db *sql.DB, sceneID, deviceID string) string {
	t.Helper()
	var kind sql.NullString
	row := db.QueryRow(`SELECT json_extract(payload, '$.kind') FROM scene_device_payloads WHERE scene_id = ? AND device_id = ?`, sceneID, deviceID)
	if err := row.Scan(&kind); err != nil {
		t.Fatalf("query kind: %v", err)
	}
	if !kind.Valid {
		return ""
	}
	return kind.String
}
