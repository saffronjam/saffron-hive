package graph

import (
	"context"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// batchResolver returns a mutationResolver wired against the test env for
// direct-call tests that don't need to round-trip through HTTP (e.g. to set
// an auth context the gqlgen handler doesn't apply in the test setup).
func batchResolver(env *testEnv) *mutationResolver {
	return &mutationResolver{
		Resolver: &Resolver{
			StateReader:        env.stateReader,
			Store:              env.store,
			TargetResolver:     env.store,
			EventBus:           env.bus,
			AutomationReloader: env.reloader,
		},
	}
}

func TestBatchDeleteUsersSkipsSelf(t *testing.T) {
	env := newTestEnv(t)
	ctx := context.Background()

	for _, id := range []string{"me", "alice", "bob"} {
		env.store.users[id] = store.User{ID: id, Username: id, Name: id}
	}

	ctx = auth.WithUser(ctx, auth.CtxUser{ID: "me", Username: "me", Name: "me"})

	res := batchResolver(env)
	n, err := res.BatchDeleteUsers(ctx, []string{"me", "alice", "bob"})
	if err != nil {
		t.Fatalf("batch delete users: %v", err)
	}
	if n != 2 {
		t.Errorf("returned count = %d, want 2 (me must be filtered out)", n)
	}
	if _, ok := env.store.users["me"]; !ok {
		t.Error("self user 'me' was deleted; should have been skipped")
	}
	if _, ok := env.store.users["alice"]; ok {
		t.Error("alice was not deleted")
	}
	if _, ok := env.store.users["bob"]; ok {
		t.Error("bob was not deleted")
	}
}

func TestBatchDeleteUsersRequiresAuth(t *testing.T) {
	env := newTestEnv(t)
	res := batchResolver(env)
	if _, err := res.BatchDeleteUsers(context.Background(), []string{"x"}); err == nil {
		t.Error("expected unauthenticated error, got nil")
	}
}

func TestBatchDeleteUsersOnlySelf(t *testing.T) {
	env := newTestEnv(t)
	env.store.users["me"] = store.User{ID: "me", Username: "me", Name: "me"}
	ctx := auth.WithUser(context.Background(), auth.CtxUser{ID: "me"})

	res := batchResolver(env)
	n, err := res.BatchDeleteUsers(ctx, []string{"me"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if n != 0 {
		t.Errorf("count = %d, want 0 when only self is targeted", n)
	}
	if _, ok := env.store.users["me"]; !ok {
		t.Error("self user was deleted; should have been a no-op")
	}
}

func TestBatchDeleteScenesCountsDeletions(t *testing.T) {
	env := newTestEnv(t)
	env.store.scenes["s1"] = store.Scene{ID: "s1"}
	env.store.scenes["s2"] = store.Scene{ID: "s2"}

	res := batchResolver(env)
	n, err := res.BatchDeleteScenes(context.Background(), []string{"s1", "s2", "missing"})
	if err != nil {
		t.Fatalf("batch delete scenes: %v", err)
	}
	if n != 2 {
		t.Errorf("count = %d, want 2 (missing is ignored)", n)
	}
}

func TestBatchDeleteAutomationsReloadsWhenDeleted(t *testing.T) {
	env := newTestEnv(t)
	env.store.automations["a1"] = store.Automation{ID: "a1"}

	res := batchResolver(env)
	n, err := res.BatchDeleteAutomations(context.Background(), []string{"a1"})
	if err != nil {
		t.Fatalf("batch delete automations: %v", err)
	}
	if n != 1 {
		t.Errorf("count = %d, want 1", n)
	}
	if !env.reloader.wasCalled() {
		t.Error("AutomationReloader.Reload was not called after batch delete")
	}
}

func TestBatchDeleteAutomationsNoReloadWhenEmpty(t *testing.T) {
	env := newTestEnv(t)
	res := batchResolver(env)
	n, err := res.BatchDeleteAutomations(context.Background(), []string{})
	if err != nil {
		t.Fatalf("batch delete automations empty: %v", err)
	}
	if n != 0 {
		t.Errorf("count = %d, want 0", n)
	}
	if env.reloader.wasCalled() {
		t.Error("AutomationReloader.Reload was called on empty batch; should have been skipped")
	}
}
