package testdb

import (
	"database/sql"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "modernc.org/sqlite"
)

// Template provides isolated SQLite databases from one migrated schema image.
type Template struct {
	migrations   fs.FS
	migrationDir string
	once         sync.Once
	database     []byte
	err          error
}

// NewTemplate creates a lazily migrated SQLite template.
func NewTemplate(migrations fs.FS, migrationDir string) *Template {
	return &Template{migrations: migrations, migrationDir: migrationDir}
}

// Open copies the migrated template to path and opens it with the supplied DSN options.
func (t *Template) Open(path string, options ...string) (*sql.DB, error) {
	t.once.Do(t.build)
	if t.err != nil {
		return nil, t.err
	}
	if err := os.WriteFile(path, t.database, 0o600); err != nil {
		return nil, fmt.Errorf("write database clone: %w", err)
	}

	dsn := path
	if len(options) > 0 {
		dsn += "?" + strings.Join(options, "&")
	}
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("open database clone: %w", err)
	}
	return db, nil
}

func (t *Template) build() {
	dir, err := os.MkdirTemp("", "saffron-hive-testdb-")
	if err != nil {
		t.err = fmt.Errorf("create template directory: %w", err)
		return
	}
	defer func() { _ = os.RemoveAll(dir) }()

	path := filepath.Join(dir, "template.db")
	db, err := sql.Open("sqlite", path)
	if err != nil {
		t.err = fmt.Errorf("open template database: %w", err)
		return
	}
	db.SetMaxOpenConns(1)

	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		_ = db.Close()
		t.err = fmt.Errorf("enable template foreign keys: %w", err)
		return
	}
	source, err := iofs.New(t.migrations, t.migrationDir)
	if err != nil {
		_ = db.Close()
		t.err = fmt.Errorf("create migration source: %w", err)
		return
	}
	driver, err := sqlite.WithInstance(db, &sqlite.Config{})
	if err != nil {
		_ = db.Close()
		t.err = fmt.Errorf("create migration driver: %w", err)
		return
	}
	migrator, err := migrate.NewWithInstance("iofs", source, "sqlite", driver)
	if err != nil {
		_ = db.Close()
		t.err = fmt.Errorf("create migrator: %w", err)
		return
	}
	if err := migrator.Up(); err != nil && err != migrate.ErrNoChange {
		_ = db.Close()
		t.err = fmt.Errorf("migrate template: %w", err)
		return
	}
	if err := db.Close(); err != nil {
		t.err = fmt.Errorf("close template database: %w", err)
		return
	}
	t.database, t.err = os.ReadFile(path)
	if t.err != nil {
		t.err = fmt.Errorf("read template database: %w", t.err)
	}
}
