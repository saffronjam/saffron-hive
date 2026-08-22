package store

import (
	"context"
	"database/sql"
	"testing"
	"time"

	_ "modernc.org/sqlite"
)

func TestMigration071MaintenanceAcknowledgements(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration071?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		t.Fatal(err)
	}
	m := newMigrate(t, db)
	if err := m.Migrate(71); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`INSERT INTO users (id, username, name, password_hash) VALUES ('u-1', 'user', 'User', 'hash')`); err != nil {
		t.Fatal(err)
	}
	s := New(db)
	user := "u-1"
	row := InsertMaintenanceAcknowledgementParams{
		TaskKey: "battery:one", ConditionFingerprint: "band:25",
		CompletedAt: time.Now(), CompletedBy: &user,
	}
	if err := s.InsertMaintenanceAcknowledgements(context.Background(), []InsertMaintenanceAcknowledgementParams{row, row}); err != nil {
		t.Fatal(err)
	}
	acks, err := s.ListMaintenanceAcknowledgements(context.Background())
	if err != nil || len(acks) != 1 {
		t.Fatalf("acks = %+v, %v", acks, err)
	}
	if _, err := db.Exec(`DELETE FROM users WHERE id = 'u-1'`); err != nil {
		t.Fatal(err)
	}
	acks, err = s.ListMaintenanceAcknowledgements(context.Background())
	if err != nil || len(acks) != 1 || acks[0].CompletedBy != nil {
		t.Fatalf("after user deletion = %+v, %v", acks, err)
	}
	if err := m.Migrate(70); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`SELECT * FROM maintenance_acknowledgements`); err == nil {
		t.Fatal("maintenance table exists after down migration")
	}
}
