package store

import (
	"path/filepath"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/testdb"
)

var storeTestTemplate = testdb.NewTemplate(Migrations, "migrations")

func newTestStore(t *testing.T) *DB {
	t.Helper()
	db, err := storeTestTemplate.Open(
		filepath.Join(t.TempDir(), "store.db"),
		"_pragma=foreign_keys(1)",
	)
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })

	return New(db)
}
