package store

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func TestMigration082AddsUserHapticsPreference(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration082?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Migrate(81); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`INSERT INTO users (id, username, name, password_hash) VALUES ('u-1', 'alice', 'Alice', 'hash')`); err != nil {
		t.Fatal(err)
	}

	if err := m.Migrate(82); err != nil {
		t.Fatal(err)
	}
	assertRowCount(t, db, `SELECT COUNT(*) FROM users WHERE id = 'u-1' AND haptics_enabled = true`, 1)

	if err := m.Migrate(81); err != nil {
		t.Fatal(err)
	}
	assertRowCount(t, db, `SELECT COUNT(*) FROM pragma_table_info('users') WHERE name = 'haptics_enabled'`, 0)
}
