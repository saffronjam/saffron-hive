package store

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// DB is the concrete persistence type returned by New. All SQL goes through
// the sqlc-generated *sqlite.Queries; consumers depend on narrow interfaces
// they declare locally and *DB satisfies them structurally. The underlying
// *sql.DB is retained so a few wrappers that need multi-statement atomicity
// (e.g. InsertAlarmTx) can open transactions.
type DB struct {
	q  *sqlite.Queries
	db *sql.DB
}

// New creates a new DB backed by the given *sql.DB.
func New(db *sql.DB) *DB {
	return &DB{q: sqlite.New(db), db: db}
}

// execTx runs fn inside a BEGIN IMMEDIATE transaction, committing on success
// and rolling back on error. The fn receives a *sqlite.Queries bound to the
// tx so follow-up statements stay inside the same transaction.
func (s *DB) execTx(ctx context.Context, fn func(*sqlite.Queries) error) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	if err := fn(s.q.WithTx(tx)); err != nil {
		_ = tx.Rollback()
		return err
	}
	return tx.Commit()
}
