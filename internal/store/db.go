package store

import "database/sql"

// SQLiteStore implements Store using a SQLite database.
type SQLiteStore struct {
	db *sql.DB
}

// New creates a new SQLiteStore backed by the given *sql.DB.
func New(db *sql.DB) *SQLiteStore {
	return &SQLiteStore{db: db}
}
