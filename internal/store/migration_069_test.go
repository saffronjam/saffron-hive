package store

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func TestMigration069ProviderGroups(t *testing.T) {
	db, err := sql.Open("sqlite", "file:migration069?mode=memory&cache=shared")
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Migrate(68); err != nil {
		t.Fatalf("migrate to 68: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO groups (id, name) VALUES ('hive-group', 'Hive group')`); err != nil {
		t.Fatalf("seed group: %v", err)
	}
	if _, err := db.Exec(`
		INSERT INTO group_members (id, group_id, member_type, member_id)
		VALUES ('member-1', 'hive-group', 'device', 'device-1')
	`); err != nil {
		t.Fatalf("seed member: %v", err)
	}

	if err := m.Migrate(69); err != nil {
		t.Fatalf("migrate to 69: %v", err)
	}

	var provider string
	var providerGroupID *string
	var removed bool
	if err := db.QueryRow(`
		SELECT provider, provider_group_id, removed FROM groups WHERE id = 'hive-group'
	`).Scan(&provider, &providerGroupID, &removed); err != nil {
		t.Fatalf("read migrated group: %v", err)
	}
	if provider != GroupProviderHive || providerGroupID != nil || removed {
		t.Fatalf("migrated group = (%q, %v, %v)", provider, providerGroupID, removed)
	}

	if _, err := db.Exec(`
		INSERT INTO groups (id, name, provider, provider_group_id)
		VALUES ('zigbee2mqtt:group:7', 'Hall', 'zigbee2mqtt', '7')
	`); err != nil {
		t.Fatalf("insert provider group: %v", err)
	}
	for _, endpoint := range []int{1, 2} {
		if _, err := db.Exec(`
			INSERT INTO group_members (id, group_id, member_type, member_id, provider_endpoint)
			VALUES (?, 'zigbee2mqtt:group:7', 'device', '0xabc', ?)
		`, "provider-member-"+string(rune('0'+endpoint)), endpoint); err != nil {
			t.Fatalf("insert endpoint %d: %v", endpoint, err)
		}
	}
	if _, err := db.Exec(`
		INSERT INTO group_members (id, group_id, member_type, member_id, provider_endpoint)
		VALUES ('provider-member-duplicate', 'zigbee2mqtt:group:7', 'device', '0xabc', 1)
	`); err == nil {
		t.Fatal("duplicate provider endpoint was accepted")
	}
	if _, err := db.Exec(`
		INSERT INTO groups (id, name, provider, provider_group_id)
		VALUES ('other-id', 'Duplicate', 'zigbee2mqtt', '7')
	`); err == nil {
		t.Fatal("duplicate provider group id was accepted")
	}

	if err := m.Migrate(68); err != nil {
		t.Fatalf("migrate down to 68: %v", err)
	}
	var memberCount int
	if err := db.QueryRow(`
		SELECT count(*) FROM group_members
		WHERE group_id = 'zigbee2mqtt:group:7' AND member_id = '0xabc'
	`).Scan(&memberCount); err != nil {
		t.Fatalf("count collapsed members: %v", err)
	}
	if memberCount != 1 {
		t.Fatalf("collapsed member count = %d, want 1", memberCount)
	}
	if _, err := db.Exec(`SELECT provider FROM groups LIMIT 1`); err == nil {
		t.Fatal("provider column still exists after down migration")
	}
}
