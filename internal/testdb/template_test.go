package testdb

import (
	"path/filepath"
	"testing"
	"testing/fstest"
)

func TestTemplateOpensIsolatedMigratedDatabases(t *testing.T) {
	migrations := fstest.MapFS{
		"migrations/000001_items.up.sql": {
			Data: []byte("CREATE TABLE items (id TEXT PRIMARY KEY);")},
		"migrations/000001_items.down.sql": {
			Data: []byte("DROP TABLE items;")},
	}
	template := NewTemplate(migrations, "migrations")

	first, err := template.Open(filepath.Join(t.TempDir(), "first.db"))
	if err != nil {
		t.Fatalf("open first clone: %v", err)
	}
	t.Cleanup(func() { _ = first.Close() })
	if _, err := first.Exec("INSERT INTO items (id) VALUES ('first')"); err != nil {
		t.Fatalf("seed first clone: %v", err)
	}

	second, err := template.Open(filepath.Join(t.TempDir(), "second.db"))
	if err != nil {
		t.Fatalf("open second clone: %v", err)
	}
	t.Cleanup(func() { _ = second.Close() })
	var count int
	if err := second.QueryRow("SELECT COUNT(*) FROM items").Scan(&count); err != nil {
		t.Fatalf("query second clone: %v", err)
	}
	if count != 0 {
		t.Fatalf("second clone item count = %d, want 0", count)
	}
}
