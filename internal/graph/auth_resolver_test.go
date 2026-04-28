package graph

import (
	"encoding/json"
	"log/slog"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// rebuildWithAuth stands up a second httptest server sharing the given mockStore
// and wires an Auth service on the Resolver — needed because the default
// newTestEnv does not attach auth, and the auth resolvers (login,
// createInitialUser) dereference Resolver.Auth.
func rebuildWithAuth(t *testing.T, st *mockStore, svc *auth.Service) *testEnv {
	t.Helper()
	sr := newMockStateReader()
	levelVar := &slog.LevelVar{}
	levelVar.Set(slog.LevelInfo)

	resolver := &Resolver{
		StateReader:        sr,
		Store:              st,
		TargetResolver:     st,
		EventBus:           eventbus.NewChannelBus(),
		AutomationReloader: &mockReloader{},
		LogBuffer:          logging.NewBuffer(),
		LevelVar:           levelVar,
		Auth:               svc,
	}
	srv := handler.New(NewExecutableSchema(Config{
		Resolvers:  resolver,
		Directives: DirectiveRoot{Auth: AuthDirective},
	}))
	srv.AddTransport(transport.POST{})

	ts := httptest.NewServer(srv)
	t.Cleanup(ts.Close)

	return &testEnv{server: ts, store: st, stateReader: sr}
}

func TestSetupStatusResolver(t *testing.T) {
	te := newTestEnv(t)

	// Pre-populate nothing — setup is incomplete.
	resp := te.query(t, `query setupStatus { setupStatus { hasInitialUser mqttConfigured } }`, nil)
	if len(resp.Errors) != 0 {
		t.Fatalf("query errors: %v", resp.Errors)
	}
	var body struct {
		SetupStatus struct {
			HasInitialUser bool `json:"hasInitialUser"`
			MqttConfigured bool `json:"mqttConfigured"`
		} `json:"setupStatus"`
	}
	if err := json.Unmarshal(resp.Data, &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if body.SetupStatus.HasInitialUser {
		t.Error("hasInitialUser should be false on empty users table")
	}
	if body.SetupStatus.MqttConfigured {
		t.Error("mqttConfigured should be false without DB config")
	}

	// Seed a user and an MQTT config, then re-query.
	te.store.users["u-1"] = store.User{ID: "u-1", Username: "alice", Name: "Alice"}
	te.store.mqttConfig = &store.MQTTConfig{Broker: "mqtt.local:1883"}

	resp = te.query(t, `query setupStatus { setupStatus { hasInitialUser mqttConfigured } }`, nil)
	if err := json.Unmarshal(resp.Data, &body); err != nil {
		t.Fatalf("unmarshal 2: %v", err)
	}
	if !body.SetupStatus.HasInitialUser {
		t.Error("hasInitialUser should be true after seeding a user")
	}
	if !body.SetupStatus.MqttConfigured {
		t.Error("mqttConfigured should be true after DB config set")
	}
}

func TestCreateInitialUserAndLogin(t *testing.T) {
	te := newTestEnv(t)
	// Attach an Auth service by wiring a second test env: we rebuild the
	// Resolver on top of the existing mockStore, which is the only piece we
	// actually need shared state with.
	svc := auth.NewService([]byte("s"), time.Hour)
	te2 := rebuildWithAuth(t, te.store, svc)

	createQ := `mutation createInitialUser($input: CreateInitialUserInput!) {
		createInitialUser(input: $input) { token user { id username name } }
	}`
	resp := te2.query(t, createQ, map[string]any{
		"input": map[string]any{"username": "alice", "name": "Alice", "password": "hunter22"},
	})
	if len(resp.Errors) != 0 {
		t.Fatalf("createInitialUser errors: %v", resp.Errors)
	}
	var created struct {
		CreateInitialUser struct {
			Token string `json:"token"`
			User  struct {
				Username string `json:"username"`
				Name     string `json:"name"`
			} `json:"user"`
		} `json:"createInitialUser"`
	}
	if err := json.Unmarshal(resp.Data, &created); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if created.CreateInitialUser.Token == "" {
		t.Fatal("token missing")
	}
	if created.CreateInitialUser.User.Username != "alice" {
		t.Errorf("username = %q", created.CreateInitialUser.User.Username)
	}
	claims, err := svc.Parse(created.CreateInitialUser.Token)
	if err != nil {
		t.Fatalf("parse token: %v", err)
	}
	if claims.Username != "alice" {
		t.Errorf("claims.Username = %q", claims.Username)
	}

	// A second createInitialUser must be rejected — users table is no longer empty.
	resp = te2.query(t, createQ, map[string]any{
		"input": map[string]any{"username": "bob", "name": "Bob", "password": "hunter22"},
	})
	if len(resp.Errors) == 0 {
		t.Error("expected createInitialUser to fail when a user already exists")
	}

	// Login with the created user.
	loginQ := `mutation login($input: LoginInput!) {
		login(input: $input) { token user { username } }
	}`
	resp = te2.query(t, loginQ, map[string]any{
		"input": map[string]any{"username": "alice", "password": "hunter22"},
	})
	if len(resp.Errors) != 0 {
		t.Fatalf("login errors: %v", resp.Errors)
	}
	var loginResp struct {
		Login struct {
			Token string `json:"token"`
		} `json:"login"`
	}
	if err := json.Unmarshal(resp.Data, &loginResp); err != nil {
		t.Fatalf("unmarshal login: %v", err)
	}
	if _, err := svc.Parse(loginResp.Login.Token); err != nil {
		t.Errorf("login token does not parse: %v", err)
	}

	// Wrong password rejected.
	resp = te2.query(t, loginQ, map[string]any{
		"input": map[string]any{"username": "alice", "password": "wrong-password"},
	})
	if len(resp.Errors) == 0 {
		t.Error("expected login with wrong password to fail")
	}
}

// TestAuthDirectiveRejectsUnauthenticatedProtectedField pins the headline
// regression: before the fix, a request with operationName="login" but a body
// like `query login { users { id } }` would slip past the middleware allowlist
// and exfiltrate user data. Now the @auth directive on Query.users rejects
// any caller without a user on the context, regardless of what the operation
// is *named*. The rebuildWithAuth env runs the real AuthDirective without a
// user-injecting wrapper, so this exercises the production rejection path.
func TestAuthDirectiveRejectsUnauthenticatedProtectedField(t *testing.T) {
	te := newTestEnv(t)
	svc := auth.NewService([]byte("s"), time.Hour)
	te2 := rebuildWithAuth(t, te.store, svc)

	// The hostile shape: operation literally named "login" but selecting a
	// protected root field. The schema directive is the gate now, not the
	// operation name.
	resp := te2.query(t, `query login { users { id username } }`, nil)
	if len(resp.Errors) == 0 {
		t.Fatal("expected UNAUTHENTICATED error; got none — bypass regressed")
	}
	if got := resp.Errors[0].Extensions["code"]; got != "UNAUTHENTICATED" {
		t.Errorf("error code = %v, want UNAUTHENTICATED", got)
	}
}

// TestAuthDirectiveAllowsPublicFields pins the negative case: setupStatus,
// login, createInitialUser, and me carry no @auth marker, so an unauth caller
// must reach them. (login/createInitialUser are exercised end-to-end in
// TestCreateInitialUserAndLogin; setupStatus has its own test; this asserts
// `me` returns null cleanly without a user on the context — the SPA relies on
// that to decide between the dashboard and the login screen on cold load.)
func TestAuthDirectiveAllowsPublicFields(t *testing.T) {
	te := newTestEnv(t)
	svc := auth.NewService([]byte("s"), time.Hour)
	te2 := rebuildWithAuth(t, te.store, svc)

	resp := te2.query(t, `query { me { id } }`, nil)
	if len(resp.Errors) != 0 {
		t.Fatalf("unexpected errors on public field: %v", resp.Errors)
	}
	var body struct {
		Me *struct {
			ID string `json:"id"`
		} `json:"me"`
	}
	if err := json.Unmarshal(resp.Data, &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if body.Me != nil {
		t.Errorf("me = %+v, want null for unauthenticated caller", body.Me)
	}
}
