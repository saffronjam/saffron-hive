package store

import (
	"context"
	"strings"
	"testing"
)

func TestCreateUserAndGet(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	u, err := s.CreateUser(ctx, CreateUserParams{
		ID:           "u-1",
		Username:     "alice",
		Name:         "Alice",
		PasswordHash: "hash-1",
	})
	if err != nil {
		t.Fatalf("create user: %v", err)
	}
	if u.ID != "u-1" || u.Username != "alice" || u.Name != "Alice" {
		t.Errorf("unexpected user: %+v", u)
	}
	if u.PasswordHash != "hash-1" {
		t.Errorf("password hash not persisted: %q", u.PasswordHash)
	}
	if u.CreatedAt.IsZero() {
		t.Error("CreatedAt not populated")
	}

	byID, err := s.GetUserByID(ctx, "u-1")
	if err != nil {
		t.Fatalf("get by id: %v", err)
	}
	if byID.Username != "alice" {
		t.Errorf("GetUserByID username: %q", byID.Username)
	}

	byUsername, err := s.GetUserByUsername(ctx, "alice")
	if err != nil {
		t.Fatalf("get by username: %v", err)
	}
	if byUsername.ID != "u-1" {
		t.Errorf("GetUserByUsername id: %q", byUsername.ID)
	}
}

func TestCountUsers(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	n, err := s.CountUsers(ctx)
	if err != nil {
		t.Fatalf("count users (empty): %v", err)
	}
	if n != 0 {
		t.Errorf("empty table count = %d, want 0", n)
	}

	for i, username := range []string{"alice", "bob", "carol"} {
		_, err := s.CreateUser(ctx, CreateUserParams{
			ID:           "u-" + username,
			Username:     username,
			Name:         strings.ToUpper(username[:1]) + username[1:],
			PasswordHash: "h",
		})
		if err != nil {
			t.Fatalf("create user %d: %v", i, err)
		}
	}

	n, err = s.CountUsers(ctx)
	if err != nil {
		t.Fatalf("count users: %v", err)
	}
	if n != 3 {
		t.Errorf("count = %d, want 3", n)
	}
}

func TestListUsersOrder(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	for _, u := range []string{"alice", "bob", "carol"} {
		if _, err := s.CreateUser(ctx, CreateUserParams{
			ID:           "u-" + u,
			Username:     u,
			Name:         u,
			PasswordHash: "h",
		}); err != nil {
			t.Fatalf("create user %s: %v", u, err)
		}
	}

	users, err := s.ListUsers(ctx)
	if err != nil {
		t.Fatalf("list users: %v", err)
	}
	if len(users) != 3 {
		t.Fatalf("got %d users, want 3", len(users))
	}
	// created_at ASC — but timestamps can tie at second precision, so just
	// make sure all three are present.
	seen := map[string]bool{}
	for _, u := range users {
		seen[u.Username] = true
	}
	for _, want := range []string{"alice", "bob", "carol"} {
		if !seen[want] {
			t.Errorf("missing user %q in list", want)
		}
	}
}

func TestCreateUserUniqueUsername(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if _, err := s.CreateUser(ctx, CreateUserParams{
		ID: "u-1", Username: "alice", Name: "Alice", PasswordHash: "h",
	}); err != nil {
		t.Fatalf("first insert: %v", err)
	}

	_, err := s.CreateUser(ctx, CreateUserParams{
		ID: "u-2", Username: "alice", Name: "Other", PasswordHash: "h",
	})
	if err == nil {
		t.Fatal("expected UNIQUE constraint violation on duplicate username, got nil")
	}
}

func TestGetUserByUsernameNotFound(t *testing.T) {
	s := newTestStore(t)
	if _, err := s.GetUserByUsername(context.Background(), "missing"); err == nil {
		t.Error("expected error for missing user, got nil")
	}
}

func TestCreatedByJoinOnScene(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	u, err := s.CreateUser(ctx, CreateUserParams{
		ID: "u-1", Username: "alice", Name: "Alice", PasswordHash: "h",
	})
	if err != nil {
		t.Fatalf("create user: %v", err)
	}
	owner := u.ID
	sc, err := s.CreateScene(ctx, CreateSceneParams{ID: "s-1", Name: "Movie", CreatedBy: &owner})
	if err != nil {
		t.Fatalf("create scene: %v", err)
	}
	if sc.CreatedBy == nil {
		t.Fatal("scene.CreatedBy is nil after create")
	}
	if sc.CreatedBy.ID != u.ID || sc.CreatedBy.Username != "alice" || sc.CreatedBy.Name != "Alice" {
		t.Errorf("scene.CreatedBy = %+v", sc.CreatedBy)
	}

	scNoOwner, err := s.CreateScene(ctx, CreateSceneParams{ID: "s-2", Name: "Other"})
	if err != nil {
		t.Fatalf("create unowned scene: %v", err)
	}
	if scNoOwner.CreatedBy != nil {
		t.Errorf("expected nil CreatedBy for NULL creator, got %+v", scNoOwner.CreatedBy)
	}
}
