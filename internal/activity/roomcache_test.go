package activity

import (
	"context"
	"errors"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/store"
)

type fakeRoomStore struct {
	memberships []store.RoomDeviceMembership
	calls       int
	err         error
}

func (f *fakeRoomStore) ListTransitiveRoomDeviceMemberships(_ context.Context) ([]store.RoomDeviceMembership, error) {
	f.calls++
	if f.err != nil {
		return nil, f.err
	}
	out := make([]store.RoomDeviceMembership, len(f.memberships))
	copy(out, f.memberships)
	return out, nil
}

func TestRoomCacheReturnsFalseBeforeRefresh(t *testing.T) {
	fs := &fakeRoomStore{}
	c := NewRoomCache(fs)

	if _, _, ok := c.Room("dev-1"); ok {
		t.Fatal("expected no hit before Refresh")
	}
	if fs.calls != 0 {
		t.Fatalf("Room should not hit the store; got %d calls", fs.calls)
	}
}

func TestRoomCacheHitAfterRefresh(t *testing.T) {
	fs := &fakeRoomStore{memberships: []store.RoomDeviceMembership{
		{RoomID: "r-1", RoomName: "Living Room", DeviceID: "dev-1"},
	}}
	c := NewRoomCache(fs)

	if err := c.Refresh(context.Background()); err != nil {
		t.Fatalf("refresh: %v", err)
	}
	id, name, ok := c.Room("dev-1")
	if !ok {
		t.Fatal("expected cache hit")
	}
	if id != "r-1" || name != "Living Room" {
		t.Fatalf("wrong room: %q %q", id, name)
	}
}

func TestRoomCacheDeterministicWhenDeviceInMultipleRooms(t *testing.T) {
	fs := &fakeRoomStore{memberships: []store.RoomDeviceMembership{
		{RoomID: "r-2", RoomName: "Bedroom", DeviceID: "dev-1"},
		{RoomID: "r-1", RoomName: "Living Room", DeviceID: "dev-1"},
	}}
	c := NewRoomCache(fs)

	if err := c.Refresh(context.Background()); err != nil {
		t.Fatalf("refresh: %v", err)
	}
	id, _, ok := c.Room("dev-1")
	if !ok {
		t.Fatal("expected cache hit")
	}
	if id != "r-1" {
		t.Fatalf("expected the lexicographically smallest room id, got %q", id)
	}
}

func TestRoomCacheRefreshReplacesEntries(t *testing.T) {
	fs := &fakeRoomStore{memberships: []store.RoomDeviceMembership{
		{RoomID: "r-1", RoomName: "Living Room", DeviceID: "dev-1"},
	}}
	c := NewRoomCache(fs)

	if err := c.Refresh(context.Background()); err != nil {
		t.Fatalf("refresh: %v", err)
	}
	if _, _, ok := c.Room("dev-1"); !ok {
		t.Fatal("first refresh missed")
	}

	fs.memberships = nil // device removed from every room
	if err := c.Refresh(context.Background()); err != nil {
		t.Fatalf("refresh: %v", err)
	}
	if _, _, ok := c.Room("dev-1"); ok {
		t.Fatal("cache retained stale entry after refresh")
	}
}

func TestRoomCacheRefreshSurfacesStoreErrors(t *testing.T) {
	fs := &fakeRoomStore{err: errors.New("db down")}
	c := NewRoomCache(fs)

	if err := c.Refresh(context.Background()); err == nil {
		t.Fatal("expected error, got nil")
	}
}
