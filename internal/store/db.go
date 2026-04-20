package store

import (
	"database/sql"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// DB is the concrete persistence type returned by New. All SQL goes through
// the sqlc-generated *sqlite.Queries; consumers depend on narrow interfaces
// they declare locally and *DB satisfies them structurally.
type DB struct {
	q *sqlite.Queries
}

// New creates a new DB backed by the given *sql.DB.
func New(db *sql.DB) *DB {
	return &DB{q: sqlite.New(db)}
}
