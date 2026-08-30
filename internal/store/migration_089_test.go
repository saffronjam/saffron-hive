package store

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func TestMigration089ZigbeeCommandRates(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration089?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()
	migrator := newMigrate(t, db)
	if err := migrator.Migrate(88); err != nil {
		t.Fatalf("migrate to 88: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO zigbee2mqtt_config (id, broker) VALUES (1, 'mqtt.example.com:1883')`); err != nil {
		t.Fatal(err)
	}
	if err := migrator.Migrate(89); err != nil {
		t.Fatalf("migrate to 89: %v", err)
	}
	var interactive, continuous int
	if err := db.QueryRow(`SELECT interactive_commands_per_second, continuous_commands_per_second FROM zigbee2mqtt_config WHERE id = 1`).Scan(&interactive, &continuous); err != nil {
		t.Fatal(err)
	}
	if interactive != 10 || continuous != 2 {
		t.Fatalf("rates = %d/%d", interactive, continuous)
	}
	if err := migrator.Migrate(88); err != nil {
		t.Fatalf("migrate down to 88: %v", err)
	}
	if _, err := db.Exec(`SELECT interactive_commands_per_second FROM zigbee2mqtt_config`); err == nil {
		t.Fatal("command rate columns remain after down migration")
	}
}
