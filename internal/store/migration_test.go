package store

import (
	"database/sql"
	"testing"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "modernc.org/sqlite"
)

func newMigrate(t *testing.T, db *sql.DB) *migrate.Migrate {
	t.Helper()
	source, err := iofs.New(Migrations, "migrations")
	if err != nil {
		t.Fatalf("create iofs source: %v", err)
	}
	driver, err := sqlite.WithInstance(db, &sqlite.Config{})
	if err != nil {
		t.Fatalf("create sqlite driver: %v", err)
	}
	m, err := migrate.NewWithInstance("iofs", source, "sqlite", driver)
	if err != nil {
		t.Fatalf("create migrate instance: %v", err)
	}
	return m
}

func TestMigrateUp(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Up(); err != nil {
		t.Fatalf("migrate up: %v", err)
	}
}

func TestMigrateUpDown(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Up(); err != nil {
		t.Fatalf("migrate up: %v", err)
	}

	source2, err := iofs.New(Migrations, "migrations")
	if err != nil {
		t.Fatalf("create iofs source: %v", err)
	}
	driver2, err := sqlite.WithInstance(db, &sqlite.Config{})
	if err != nil {
		t.Fatalf("create sqlite driver: %v", err)
	}
	m2, err := migrate.NewWithInstance("iofs", source2, "sqlite", driver2)
	if err != nil {
		t.Fatalf("create migrate instance: %v", err)
	}

	if err := m2.Down(); err != nil {
		t.Fatalf("migrate down: %v", err)
	}
}

func TestMigrateUpIdempotent(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Up(); err != nil {
		t.Fatalf("first migrate up: %v", err)
	}

	source2, err := iofs.New(Migrations, "migrations")
	if err != nil {
		t.Fatalf("create iofs source: %v", err)
	}
	driver2, err := sqlite.WithInstance(db, &sqlite.Config{})
	if err != nil {
		t.Fatalf("create sqlite driver: %v", err)
	}
	m2, err := migrate.NewWithInstance("iofs", source2, "sqlite", driver2)
	if err != nil {
		t.Fatalf("create migrate instance: %v", err)
	}

	if err := m2.Up(); err != nil && err != migrate.ErrNoChange {
		t.Fatalf("second migrate up: %v", err)
	}
}
