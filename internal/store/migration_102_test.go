package store

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

func TestConfigurationIntegrityMigrations(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = db.Close() }()
	db.SetMaxOpenConns(1)
	m := newMigrate(t, db)
	if err := m.Migrate(101); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec(`
		PRAGMA foreign_keys=OFF;
		INSERT INTO scenes(id,name) VALUES ('scene','Scene');
		INSERT INTO scene_light_overrides(scene_id,device_id,kind,brightness) VALUES ('scene','missing-device','state',999);
		INSERT INTO device_state_samples(device_id,field,numeric_value) VALUES ('missing-device','brightness',100);
		INSERT INTO room_members(id,room_id,member_type,member_id) VALUES ('orphan','missing-room','device','missing-device');
		INSERT INTO floorplans(id,name) VALUES ('plan','Home');
		INSERT INTO floorplan_vertices(id,floorplan_id,x,y) VALUES ('a','plan',0,0),('b','plan',1,1);
		INSERT INTO floorplan_walls(id,floorplan_id,vertex_a,vertex_b,thickness,curve_x,curve_y) VALUES ('wall','plan','a','b',0.1,0.5,NULL);
	`); err != nil {
		t.Fatal(err)
	}
	if err := m.Up(); err != nil {
		t.Fatal(err)
	}
	var count, brightness int
	if err := db.QueryRow("SELECT brightness FROM scene_light_overrides WHERE scene_id='scene'").Scan(&brightness); err != nil || brightness != 254 {
		t.Fatalf("authored reference: %d %v", brightness, err)
	}
	for _, tc := range []struct {
		query string
		want  int
	}{
		{"SELECT count(*) FROM device_state_samples WHERE device_id='missing-device'", 1},
		{"SELECT count(*) FROM room_members WHERE id='orphan'", 0},
		{"SELECT count(*) FROM floorplan_walls WHERE curve_x IS NULL AND curve_y IS NULL", 1},
		{"SELECT count(*) FROM pragma_foreign_key_check", 0},
	} {
		if err := db.QueryRow(tc.query).Scan(&count); err != nil || count != tc.want {
			t.Fatalf("%s: %d %v", tc.query, count, err)
		}
	}
	if err := m.Migrate(101); err != nil {
		t.Fatalf("configuration down migration: %v", err)
	}
	if err := m.Up(); err != nil {
		t.Fatalf("configuration up migration: %v", err)
	}
	if err := db.QueryRow("SELECT revision FROM scenes WHERE id='scene'").Scan(&count); err != nil || count != 1 {
		t.Fatalf("revision: %d %v", count, err)
	}
}
