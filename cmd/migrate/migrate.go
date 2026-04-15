package migrate

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/saffronjam/saffron-hive/internal/store"
	_ "modernc.org/sqlite"
)

// Run executes a database migration in the given direction.
// Valid directions are "up", "down", and "version".
func Run(_ context.Context, direction string) error {
	dbPath := os.Getenv("HIVE_DB_PATH")
	if dbPath == "" {
		dbPath = "saffron-hive.db"
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return fmt.Errorf("open database: %w", err)
	}
	defer func() { _ = db.Close() }()

	sourceDriver, err := iofs.New(store.Migrations, "migrations")
	if err != nil {
		return fmt.Errorf("create migration source: %w", err)
	}

	dbDriver, err := sqlite.WithInstance(db, &sqlite.Config{})
	if err != nil {
		return fmt.Errorf("create migration db driver: %w", err)
	}

	m, err := migrate.NewWithInstance("iofs", sourceDriver, "sqlite", dbDriver)
	if err != nil {
		return fmt.Errorf("create migrator: %w", err)
	}

	switch direction {
	case "up":
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			return fmt.Errorf("migrate up: %w", err)
		}
		log.Println("migrations applied successfully")
	case "down":
		if err := m.Steps(-1); err != nil && err != migrate.ErrNoChange {
			return fmt.Errorf("migrate down: %w", err)
		}
		log.Println("rolled back one migration")
	case "version":
		version, dirty, err := m.Version()
		if err != nil {
			return fmt.Errorf("get version: %w", err)
		}
		log.Printf("version: %d, dirty: %v", version, dirty)
	default:
		return fmt.Errorf("unknown migration direction: %q (expected up, down, or version)", direction)
	}

	return nil
}
