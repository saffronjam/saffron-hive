package spatial

import (
	"context"
	"database/sql"
	"testing"

	"github.com/golang-migrate/migrate/v4"
	migratesqlite "github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
	_ "modernc.org/sqlite"
)

func spatialTestStore(t *testing.T) *store.DB {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		t.Fatal(err)
	}
	source, err := iofs.New(store.Migrations, "migrations")
	if err != nil {
		t.Fatal(err)
	}
	driver, err := migratesqlite.WithInstance(db, &migratesqlite.Config{})
	if err != nil {
		t.Fatal(err)
	}
	migrator, err := migrate.NewWithInstance("iofs", source, "sqlite", driver)
	if err != nil {
		t.Fatal(err)
	}
	if err := migrator.Up(); err != nil && err != migrate.ErrNoChange {
		t.Fatal(err)
	}
	return store.New(db)
}

func TestResolverWithStoredNestedAndOverlappingGroups(t *testing.T) {
	db := spatialTestStore(t)
	ctx := context.Background()
	for _, id := range []device.DeviceID{"d1", "d2"} {
		if err := db.UpsertDevice(ctx, store.CreateDeviceParams{ID: id, FriendlyName: string(id), Source: device.SourceZigbee2MQTT, Type: device.Light}); err != nil {
			t.Fatal(err)
		}
	}
	for _, id := range []string{"left", "right", "outer"} {
		if _, err := db.CreateGroup(ctx, store.CreateGroupParams{ID: id, Name: id}); err != nil {
			t.Fatal(err)
		}
	}
	members := []store.AddGroupMemberParams{
		{ID: "m1", GroupID: "left", MemberType: device.GroupMemberDevice, MemberID: "d1"},
		{ID: "m2", GroupID: "right", MemberType: device.GroupMemberDevice, MemberID: "d1"},
		{ID: "m3", GroupID: "right", MemberType: device.GroupMemberDevice, MemberID: "d2"},
		{ID: "m4", GroupID: "outer", MemberType: device.GroupMemberGroup, MemberID: "left"},
		{ID: "m5", GroupID: "outer", MemberType: device.GroupMemberGroup, MemberID: "right"},
	}
	for _, member := range members {
		if _, err := db.AddGroupMember(ctx, member); err != nil {
			t.Fatal(err)
		}
	}
	if err := db.ReplaceFloorplan(ctx, store.ReplaceFloorplanParams{
		ID: "plan", Name: "Home",
		Vertices: []store.FloorplanVertex{{ID: "a", X: 0, Y: 0}, {ID: "b", X: 10, Y: 0}, {ID: "c", X: 10, Y: 10}, {ID: "d", X: 0, Y: 10}},
		Placements: []store.FloorplanPlacement{
			{MemberType: device.TargetGroup, MemberID: "left", X: 2, Y: 5},
			{MemberType: device.TargetGroup, MemberID: "right", X: 8, Y: 5},
		},
	}); err != nil {
		t.Fatal(err)
	}
	resolver := NewResolver(db)
	points, _, err := resolver.Resolve(ctx, TargetContext{
		DeviceIDs: []device.DeviceID{"d1", "d2"},
		PositiveRoots: map[device.DeviceID][]StructuralRoot{
			"d1": {{Type: device.TargetGroup, ID: "outer"}, {Type: device.TargetGroup, ID: "left"}},
			"d2": {{Type: device.TargetGroup, ID: "outer"}},
		},
	}, 88)
	if err != nil {
		t.Fatal(err)
	}
	if len(points) != 2 || points[0].Source != PointSourceGroup || points[1].Source != PointSourceGroup || points[0].Point == points[1].Point {
		t.Fatalf("stored resolution = %#v", points)
	}
}
