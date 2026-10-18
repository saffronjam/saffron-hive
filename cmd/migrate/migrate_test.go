package migrate

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/base64"
	"path/filepath"
	"strconv"
	"strings"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestUpgradeAppliedConfigurationRevisions(t *testing.T) {
	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "hive.db")
	t.Setenv("HIVE_DB_PATH", path)
	entries, err := store.Migrations.ReadDir("migrations")
	if err != nil {
		t.Fatal(err)
	}
	steps := 0
	for _, entry := range entries {
		if !strings.HasSuffix(entry.Name(), ".up.sql") {
			continue
		}
		version, err := strconv.Atoi(strings.SplitN(entry.Name(), "_", 2)[0])
		if err != nil {
			t.Fatal(err)
		}
		if version <= 102 {
			steps++
		}
	}
	if err := Run(ctx, "up", steps); err != nil {
		t.Fatal(err)
	}
	db, err := sql.Open("sqlite", path)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()
	if _, err := db.Exec(`
		ALTER TABLE automations ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
		ALTER TABLE effects ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
		ALTER TABLE scenes ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
		UPDATE schema_migrations SET version=103, dirty=0;
		INSERT INTO automations(id,name,revision) VALUES ('automation','Automation',7);
		INSERT INTO rooms(id,name) VALUES ('room','Room');
	`); err != nil {
		t.Fatal(err)
	}
	secret := bytes.Repeat([]byte{42}, 32)
	if _, err := db.Exec("INSERT INTO settings(key,value) VALUES (?,?)", auth.SettingJWTSecret, base64.StdEncoding.EncodeToString(secret)); err != nil {
		t.Fatal(err)
	}
	for range 2 {
		if err := Run(ctx, "up", 0); err != nil {
			t.Fatal(err)
		}
		loaded, err := auth.LoadOrInitSecret(ctx, store.New(db))
		if err != nil {
			t.Fatal(err)
		}
		if !bytes.Equal(loaded, secret) {
			t.Fatal("JWT secret changed during migration")
		}
	}
	for _, tc := range []struct {
		query string
		want  int
	}{
		{"SELECT revision FROM automations WHERE id='automation'", 7},
		{"SELECT revision FROM rooms WHERE id='room'", 1},
		{"SELECT count(*) FROM pragma_foreign_key_check", 0},
	} {
		var got int
		if err := db.QueryRow(tc.query).Scan(&got); err != nil || got != tc.want {
			t.Fatalf("%s: got %d, want %d, error %v", tc.query, got, tc.want, err)
		}
	}
}
