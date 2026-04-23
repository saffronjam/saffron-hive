package migrate

import (
	"context"
	"database/sql"
	"fmt"
	"os"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
	_ "modernc.org/sqlite"
)

var logger = logging.Named("migrate")

// Run executes a database migration in the given direction.
// Valid directions are "up", "down", and "version".
// If steps > 0, only that many migrations are applied (up) or rolled back (down).
// If steps is 0, "up" applies all and "down" rolls back one.
func Run(_ context.Context, direction string, steps int) error {
	dbPath := os.Getenv("HIVE_DB_PATH")
	if dbPath == "" {
		dbPath = "saffron-hive.db"
	}

	db, err := sql.Open("sqlite", dbPath+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)")
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
		if steps > 0 {
			if err := m.Steps(steps); err != nil && err != migrate.ErrNoChange {
				return fmt.Errorf("migrate up %d: %w", steps, err)
			}
			logger.Info("applied migrations", "count", steps)
		} else {
			if err := m.Up(); err != nil && err != migrate.ErrNoChange {
				return fmt.Errorf("migrate up: %w", err)
			}
			logger.Info("all migrations applied")
		}
	case "down":
		n := 1
		if steps > 0 {
			n = steps
		}
		if err := m.Steps(-n); err != nil && err != migrate.ErrNoChange {
			return fmt.Errorf("migrate down %d: %w", n, err)
		}
		logger.Info("rolled back migrations", "count", n)
	case "version":
		version, dirty, err := m.Version()
		if err != nil {
			return fmt.Errorf("get version: %w", err)
		}
		logger.Info("migration version", "version", version, "dirty", dirty)
	default:
		return fmt.Errorf("unknown migration direction: %q (expected up, down, or version)", direction)
	}

	return nil
}
