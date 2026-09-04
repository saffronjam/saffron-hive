package store

import (
	"context"
	"testing"
	"time"
)

func TestGuestLifecycle(t *testing.T) {
	db := newTestStore(t)
	ctx := context.Background()
	now := time.Now().UTC().Truncate(time.Second)

	created, err := db.CreateGuest(ctx, CreateGuestParams{
		ID:             "guest-1",
		Name:           "Linnea",
		NormalizedName: "linnea",
		ExpiresAt:      now.Add(4 * time.Hour),
		CreatedAt:      now,
	})
	if err != nil {
		t.Fatalf("create guest: %v", err)
	}
	if created.Name != "Linnea" || !created.ExpiresAt.Equal(now.Add(4*time.Hour)) {
		t.Fatalf("created guest = %+v", created)
	}

	byName, err := db.GetActiveGuestByNormalizedName(ctx, "linnea", now)
	if err != nil || byName.ID != created.ID {
		t.Fatalf("active guest by name = %+v, %v", byName, err)
	}
	listed, err := db.ListActiveGuests(ctx, now)
	if err != nil || len(listed) != 1 || listed[0].ID != created.ID {
		t.Fatalf("active guests = %+v, %v", listed, err)
	}

	extended, err := db.UpdateGuestExpiresAt(ctx, created.ID, now.Add(5*time.Hour))
	if err != nil || !extended.ExpiresAt.Equal(now.Add(5*time.Hour)) {
		t.Fatalf("extended guest = %+v, %v", extended, err)
	}
	deleted, err := db.DeleteGuest(ctx, created.ID)
	if err != nil || !deleted {
		t.Fatalf("delete guest = %v, %v", deleted, err)
	}
	if deleted, err = db.DeleteGuest(ctx, created.ID); err != nil || deleted {
		t.Fatalf("second delete = %v, %v", deleted, err)
	}
}

func TestCreateGuestReusesExpiredNormalizedName(t *testing.T) {
	db := newTestStore(t)
	ctx := context.Background()
	now := time.Now().UTC().Truncate(time.Second)

	_, err := db.CreateGuest(ctx, CreateGuestParams{
		ID: "expired", Name: "Sam", NormalizedName: "sam",
		CreatedAt: now.Add(-2 * time.Hour), ExpiresAt: now.Add(-time.Hour),
	})
	if err != nil {
		t.Fatal(err)
	}
	active, err := db.CreateGuest(ctx, CreateGuestParams{
		ID: "active", Name: "SAM", NormalizedName: "sam",
		CreatedAt: now, ExpiresAt: now.Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("reuse expired name: %v", err)
	}
	if active.ID != "active" {
		t.Fatalf("created ID = %q", active.ID)
	}
	if _, err := db.GetGuestByID(ctx, "expired"); err == nil {
		t.Fatal("expired guest with reused name still exists")
	}
	if _, err := db.CreateGuest(ctx, CreateGuestParams{
		ID: "duplicate", Name: "Sam", NormalizedName: "sam",
		CreatedAt: now, ExpiresAt: now.Add(time.Hour),
	}); err == nil {
		t.Fatal("active duplicate name was accepted")
	}
}

func TestDeleteExpiredAndBatchDeleteGuests(t *testing.T) {
	db := newTestStore(t)
	ctx := context.Background()
	now := time.Now().UTC().Truncate(time.Second)
	for _, guest := range []CreateGuestParams{
		{ID: "expired", Name: "Expired", NormalizedName: "expired", CreatedAt: now.Add(-time.Hour), ExpiresAt: now},
		{ID: "one", Name: "One", NormalizedName: "one", CreatedAt: now, ExpiresAt: now.Add(time.Hour)},
		{ID: "two", Name: "Two", NormalizedName: "two", CreatedAt: now, ExpiresAt: now.Add(time.Hour)},
	} {
		if _, err := db.CreateGuest(ctx, guest); err != nil {
			t.Fatal(err)
		}
	}

	expired, err := db.DeleteExpiredGuests(ctx, now)
	if err != nil || len(expired) != 1 || expired[0] != "expired" {
		t.Fatalf("expired IDs = %v, %v", expired, err)
	}
	deleted, err := db.BatchDeleteGuests(ctx, []string{"one", "missing", "two"})
	if err != nil || len(deleted) != 2 {
		t.Fatalf("batch deleted IDs = %v, %v", deleted, err)
	}
	listed, err := db.ListActiveGuests(ctx, now)
	if err != nil || len(listed) != 0 {
		t.Fatalf("remaining guests = %+v, %v", listed, err)
	}
}

func TestActiveGuestComparisonNormalizesTimeZone(t *testing.T) {
	db := newTestStore(t)
	ctx := context.Background()
	now := time.Date(2026, time.September, 4, 22, 30, 0, 0, time.UTC)
	guest, err := db.CreateGuest(ctx, CreateGuestParams{
		ID:             "time-zone",
		Name:           "Time Zone",
		NormalizedName: "time zone",
		CreatedAt:      now,
		ExpiresAt:      now.Add(time.Hour),
	})
	if err != nil {
		t.Fatal(err)
	}
	stockholm := time.FixedZone("Europe/Stockholm", 2*60*60)
	active, err := db.GetActiveGuestByID(ctx, guest.ID, now.In(stockholm))
	if err != nil || active.ID != guest.ID {
		t.Fatalf("active guest across time zone = %+v, %v", active, err)
	}
}
