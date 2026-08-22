package store

import (
	"context"
	"database/sql"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	_ "modernc.org/sqlite"
)

func TestMigration072GroupDisplayNames(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration072?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Migrate(71); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`
		INSERT INTO groups (id, name, provider, provider_group_id)
		VALUES ('hive-group', 'Living room', 'hive', NULL),
		       ('zigbee2mqtt:group:7', 'Hall lights', 'zigbee2mqtt', '7')
	`); err != nil {
		t.Fatal(err)
	}

	if err := m.Migrate(72); err != nil {
		t.Fatal(err)
	}
	s := New(db)
	ctx := context.Background()
	hive, err := s.GetGroup(ctx, "hive-group")
	if err != nil || hive.Name == nil || *hive.Name != "Living room" || hive.FriendlyName != "" {
		t.Fatalf("Hive group = %+v, %v", hive, err)
	}
	provider, err := s.GetGroup(ctx, "zigbee2mqtt:group:7")
	if err != nil || provider.Name != nil || provider.FriendlyName != "Hall lights" || provider.DisplayName() != "Hall lights" {
		t.Fatalf("provider group = %+v, %v", provider, err)
	}

	provider, err = s.UpdateGroup(ctx, UpdateGroupParams{
		ID: "zigbee2mqtt:group:7", Name: device.Ptr("Upstairs"), SetName: true,
	})
	if err != nil || provider.DisplayName() != "Upstairs" {
		t.Fatalf("provider override = %+v, %v", provider, err)
	}
	if _, err := s.SyncProviderGroups(ctx, device.ProviderGroupsSnapshot{
		Provider: GroupProviderZigbee2MQTT,
		Groups:   []device.ProviderGroup{{ProviderGroupID: "7", Name: "Hall lamps"}},
	}); err != nil {
		t.Fatal(err)
	}
	provider, err = s.GetGroup(ctx, "zigbee2mqtt:group:7")
	if err != nil || provider.Name == nil || *provider.Name != "Upstairs" || provider.FriendlyName != "Hall lamps" {
		t.Fatalf("provider resync = %+v, %v", provider, err)
	}

	if err := m.Migrate(71); err != nil {
		t.Fatal(err)
	}
	var hiveName, providerName string
	if err := db.QueryRow(`SELECT name FROM groups WHERE id = 'hive-group'`).Scan(&hiveName); err != nil {
		t.Fatal(err)
	}
	if err := db.QueryRow(`SELECT name FROM groups WHERE id = 'zigbee2mqtt:group:7'`).Scan(&providerName); err != nil {
		t.Fatal(err)
	}
	if hiveName != "Living room" || providerName != "Upstairs" {
		t.Fatalf("down-migrated names = %q, %q", hiveName, providerName)
	}
	if _, err := db.Exec(`SELECT friendly_name FROM groups LIMIT 1`); err == nil {
		t.Fatal("friendly_name column exists after down migration")
	}
}
