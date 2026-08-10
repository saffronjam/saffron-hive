package store

import (
	"database/sql"
	"testing"

	"github.com/golang-migrate/migrate/v4"
	_ "modernc.org/sqlite"
)

// TestMigration059FloorplanPlacementMembers exercises the up + down pair for
// migration 059. The up migration makes placements polymorphic target refs and
// must carry the existing device placements across with their coordinates
// intact. The down migration narrows back to a device-keyed table, where group
// placements have no representation and are dropped.
func TestMigration059FloorplanPlacementMembers(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer func() { _ = db.Close() }()

	m := newMigrate(t, db)
	if err := m.Migrate(58); err != nil {
		t.Fatalf("migrate to 58: %v", err)
	}

	if _, err := db.Exec(`INSERT INTO devices (id, name, source, type) VALUES
        ('0x001', 'Kitchen ceiling', 'zigbee2mqtt', 'light'),
        ('0x002', 'Reading lamp',    'zigbee2mqtt', 'light')`); err != nil {
		t.Fatalf("seed devices: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO floorplans (id, name) VALUES ('fp-1', 'Home')`); err != nil {
		t.Fatalf("seed floorplan: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO floorplan_placements (device_id, floorplan_id, x, y) VALUES
        ('0x001', 'fp-1', 1.5, 2.25),
        ('0x002', 'fp-1', -0.5, 4)`); err != nil {
		t.Fatalf("seed floorplan_placements: %v", err)
	}

	if err := m.Migrate(59); err != nil {
		t.Fatalf("migrate to 59: %v", err)
	}

	for _, tc := range []struct {
		memberID string
		x, y     float64
	}{
		{"0x001", 1.5, 2.25},
		{"0x002", -0.5, 4},
	} {
		var memberType string
		var x, y float64
		row := db.QueryRow(
			`SELECT member_type, x, y FROM floorplan_placements WHERE member_id = ? AND floorplan_id = 'fp-1'`,
			tc.memberID)
		if err := row.Scan(&memberType, &x, &y); err != nil {
			t.Fatalf("read placement %s after up: %v", tc.memberID, err)
		}
		if memberType != "device" {
			t.Errorf("%s member_type after up = %q, want %q", tc.memberID, memberType, "device")
		}
		if x != tc.x || y != tc.y {
			t.Errorf("%s coordinates after up = (%v, %v), want (%v, %v)", tc.memberID, x, y, tc.x, tc.y)
		}
	}

	var rows int
	if err := db.QueryRow(`SELECT count(*) FROM floorplan_placements`).Scan(&rows); err != nil {
		t.Fatalf("count placements after up: %v", err)
	}
	if rows != 2 {
		t.Errorf("placements after up = %d, want 2", rows)
	}

	if _, err := db.Exec(`INSERT INTO groups (id, name) VALUES ('g-1', 'Ceiling lights')`); err != nil {
		t.Fatalf("seed group: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO floorplan_placements (floorplan_id, member_type, member_id, x, y)
        VALUES ('fp-1', 'group', 'g-1', 3, 3)`); err != nil {
		t.Fatalf("insert group placement: %v", err)
	}
	if _, err := db.Exec(`INSERT INTO floorplan_placements (floorplan_id, member_type, member_id, x, y)
        VALUES ('fp-1', 'room', 'r-1', 0, 0)`); err == nil {
		t.Error("member_type CHECK accepted a value that is neither device nor group")
	}
	if _, err := db.Exec(`INSERT INTO floorplan_placements (floorplan_id, member_type, member_id, x, y)
        VALUES ('fp-1', 'group', 'g-1', 9, 9)`); err == nil {
		t.Error("primary key accepted the same ref twice")
	}

	if err := m.Migrate(59); err != nil && err != migrate.ErrNoChange {
		t.Fatalf("idempotent up: %v", err)
	}

	if err := m.Migrate(58); err != nil {
		t.Fatalf("migrate down to 58: %v", err)
	}

	for id, want := range map[string][2]float64{
		"0x001": {1.5, 2.25},
		"0x002": {-0.5, 4},
	} {
		var x, y float64
		if err := db.QueryRow(`SELECT x, y FROM floorplan_placements WHERE device_id = ?`, id).Scan(&x, &y); err != nil {
			t.Fatalf("read %s after down: %v", id, err)
		}
		if x != want[0] || y != want[1] {
			t.Errorf("%s coordinates after down = (%v, %v), want (%v, %v)", id, x, y, want[0], want[1])
		}
	}

	if err := db.QueryRow(`SELECT count(*) FROM floorplan_placements`).Scan(&rows); err != nil {
		t.Fatalf("count placements after down: %v", err)
	}
	if rows != 2 {
		t.Errorf("placements after down = %d, want 2 (the group placement has no device-keyed form)", rows)
	}
}
