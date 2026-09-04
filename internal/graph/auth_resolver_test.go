package graph

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
	"golang.org/x/crypto/bcrypt"
)

func TestUpdateCurrentUserLanguage(t *testing.T) {
	st := newMockStore()
	st.users["u-1"] = store.User{ID: "u-1", Username: "alice", Name: "Alice", Language: "en"}
	resolver := &mutationResolver{&Resolver{Store: st}}
	ctx := auth.WithPrincipal(context.Background(), auth.Principal{ID: "u-1"})
	language := model.LanguageSv

	updated, err := resolver.UpdateCurrentUser(ctx, model.UpdateCurrentUserInput{
		Language: graphql.OmittableOf(&language),
	})
	if err != nil {
		t.Fatalf("UpdateCurrentUser: %v", err)
	}
	if updated.Language == nil || *updated.Language != model.LanguageSv {
		t.Fatalf("language = %v, want SV", updated.Language)
	}
	stored, err := st.GetUserByID(ctx, "u-1")
	if err != nil {
		t.Fatal(err)
	}
	if stored.Language != "sv" {
		t.Fatalf("stored language = %q, want sv", stored.Language)
	}
	if ref := mapUserRef(&store.UserRef{ID: "u-1", Username: "alice", Name: "Alice"}); ref.Language != nil {
		t.Fatalf("attribution language = %v, want nil", ref.Language)
	}
}

// mockBootstrapToken is an in-memory BootstrapTokenChecker so resolver tests
// can exercise the createInitialUser gate without touching the filesystem.
type mockBootstrapToken struct {
	value    string
	consumed bool
}

func (m *mockBootstrapToken) Read() (string, error) {
	if m.consumed {
		return "", errors.New("token consumed")
	}
	return m.value, nil
}

func (m *mockBootstrapToken) ConsumeAndDelete() error {
	m.consumed = true
	return nil
}

// rebuildWithAuth stands up a second httptest server sharing the given mockStore
// and wires an Auth service plus a fixed bootstrap token onto the Resolver —
// needed because the default newTestEnv does not attach auth, and the auth
// resolvers (login, createInitialUser) dereference Resolver.Auth /
// Resolver.BootstrapToken.
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
		BootstrapToken:     &mockBootstrapToken{value: testBootstrapToken},
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

const testBootstrapToken = "test-bootstrap-token"

func TestSetupStatusResolver(t *testing.T) {
	te := newTestEnv(t)

	// Pre-populate nothing — setup is incomplete.
	resp := te.query(t, `query setupStatus { setupStatus { hasInitialUser } }`, nil)
	if len(resp.Errors) != 0 {
		t.Fatalf("query errors: %v", resp.Errors)
	}
	var body struct {
		SetupStatus struct {
			HasInitialUser bool `json:"hasInitialUser"`
		} `json:"setupStatus"`
	}
	if err := json.Unmarshal(resp.Data, &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if body.SetupStatus.HasInitialUser {
		t.Error("hasInitialUser should be false on empty users table")
	}

	te.store.users["u-1"] = store.User{ID: "u-1", Username: "alice", Name: "Alice"}

	resp = te.query(t, `query setupStatus { setupStatus { hasInitialUser } }`, nil)
	if err := json.Unmarshal(resp.Data, &body); err != nil {
		t.Fatalf("unmarshal 2: %v", err)
	}
	if !body.SetupStatus.HasInitialUser {
		t.Error("hasInitialUser should be true after seeding a user")
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
		"input": map[string]any{
			"username":       "alice",
			"name":           "Alice",
			"password":       "Hunter22-passes",
			"bootstrapToken": testBootstrapToken,
		},
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
	assertStoredArgon2idPassword(t, te.store, "alice", "Hunter22-passes")
	claims, err := svc.Parse(created.CreateInitialUser.Token)
	if err != nil {
		t.Fatalf("parse token: %v", err)
	}
	if claims.Username != "alice" {
		t.Errorf("claims.Username = %q", claims.Username)
	}

	// A second createInitialUser must be rejected — users table is no longer empty.
	resp = te2.query(t, createQ, map[string]any{
		"input": map[string]any{
			"username":       "bob",
			"name":           "Bob",
			"password":       "Hunter22-passes",
			"bootstrapToken": testBootstrapToken,
		},
	})
	if len(resp.Errors) == 0 {
		t.Error("expected createInitialUser to fail when a user already exists")
	}

	// Login with the created user.
	loginQ := `mutation login($input: LoginInput!) {
		login(input: $input) { token user { username } }
	}`
	resp = te2.query(t, loginQ, map[string]any{
		"input": map[string]any{"username": "alice", "password": "Hunter22-passes"},
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
		"input": map[string]any{"username": "alice", "password": "WrongPw0000123"},
	})
	if len(resp.Errors) == 0 {
		t.Error("expected login with wrong password to fail")
	}
}

// TestCreateInitialUserRequiresBootstrapToken pins the L3/L4 fix: the first-
// boot setup mutation refuses callers who do not present the matching
// bootstrap token, blocking the public-deploy land-grab where the first
// stranger to hit the URL would otherwise claim the admin account.
func TestCreateInitialUserRequiresBootstrapToken(t *testing.T) {
	te := newTestEnv(t)
	svc := auth.NewService([]byte("s"), time.Hour)
	te2 := rebuildWithAuth(t, te.store, svc)

	createQ := `mutation createInitialUser($input: CreateInitialUserInput!) {
		createInitialUser(input: $input) { token }
	}`

	resp := te2.query(t, createQ, map[string]any{
		"input": map[string]any{
			"username":       "intruder",
			"name":           "Intruder",
			"password":       "Hunter22-passes",
			"bootstrapToken": "not-the-token",
		},
	})
	if len(resp.Errors) == 0 {
		t.Fatal("wrong bootstrap token must be rejected")
	}

	// Right token succeeds.
	resp = te2.query(t, createQ, map[string]any{
		"input": map[string]any{
			"username":       "owner",
			"name":           "Owner",
			"password":       "Hunter22-passes",
			"bootstrapToken": testBootstrapToken,
		},
	})
	if len(resp.Errors) != 0 {
		t.Fatalf("correct token rejected: %v", resp.Errors)
	}

	// Token has now been consumed — a second call with the same token must
	// fail (initial user already exists check fires first, but the token
	// store would also have been wiped).
	resp = te2.query(t, createQ, map[string]any{
		"input": map[string]any{
			"username":       "another",
			"name":           "Another",
			"password":       "Hunter22-passes",
			"bootstrapToken": testBootstrapToken,
		},
	})
	if len(resp.Errors) == 0 {
		t.Error("second createInitialUser must be rejected once an admin exists")
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

func TestLoginPersistsArgon2idAfterBcryptVerification(t *testing.T) {
	st := newMockStore()
	bcryptHash, err := bcrypt.GenerateFromPassword([]byte("BcryptPassword123"), 12)
	if err != nil {
		t.Fatalf("GenerateFromPassword: %v", err)
	}
	st.users["u-1"] = store.User{
		ID:           "u-1",
		Username:     "alice",
		Name:         "Alice",
		PasswordHash: string(bcryptHash),
	}
	resolver := &mutationResolver{&Resolver{
		Store: st,
		Auth:  auth.NewService([]byte("secret"), time.Hour),
	}}

	payload, err := resolver.Login(context.Background(), model.LoginInput{
		Username: "alice",
		Password: "BcryptPassword123",
	})
	if err != nil {
		t.Fatalf("Login(first): %v", err)
	}
	if payload == nil || payload.Token == "" {
		t.Fatal("Login(first) returned no token")
	}
	stored, err := st.GetUserByID(context.Background(), "u-1")
	if err != nil {
		t.Fatalf("GetUserByID: %v", err)
	}
	if !strings.HasPrefix(stored.PasswordHash, "$argon2id$") {
		t.Fatalf("password hash was not upgraded: %q", stored.PasswordHash)
	}
	if err := auth.VerifyPassword(stored.PasswordHash, "BcryptPassword123"); err != nil {
		t.Fatalf("upgraded hash does not verify: %v", err)
	}
	if st.updatePasswordHashCalls != 1 {
		t.Fatalf("password hash updates = %d, want 1", st.updatePasswordHashCalls)
	}

	payload, err = resolver.Login(context.Background(), model.LoginInput{
		Username: "alice",
		Password: "BcryptPassword123",
	})
	if err != nil {
		t.Fatalf("Login(second): %v", err)
	}
	if payload == nil || payload.Token == "" {
		t.Fatal("Login(second) returned no token")
	}
	if st.updatePasswordHashCalls != 1 {
		t.Fatalf("Argon2id login rewrote password hash; updates = %d", st.updatePasswordHashCalls)
	}
}

func TestLoginWrongPasswordDoesNotUpgradeBcrypt(t *testing.T) {
	st := newMockStore()
	bcryptHash, err := bcrypt.GenerateFromPassword([]byte("BcryptPassword123"), 12)
	if err != nil {
		t.Fatalf("GenerateFromPassword: %v", err)
	}
	st.users["u-1"] = store.User{ID: "u-1", Username: "alice", Name: "Alice", PasswordHash: string(bcryptHash)}
	resolver := &mutationResolver{&Resolver{Store: st, Auth: auth.NewService([]byte("secret"), time.Hour)}}

	payload, err := resolver.Login(context.Background(), model.LoginInput{Username: "alice", Password: "WrongPassword123"})
	if err == nil {
		t.Fatal("Login accepted the wrong password")
	}
	if payload != nil {
		t.Fatal("failed login returned an auth payload")
	}
	if st.updatePasswordHashCalls != 0 {
		t.Fatalf("failed login updated password hash %d times", st.updatePasswordHashCalls)
	}
	stored, getErr := st.GetUserByID(context.Background(), "u-1")
	if getErr != nil {
		t.Fatalf("GetUserByID: %v", getErr)
	}
	if stored.PasswordHash != string(bcryptHash) {
		t.Fatal("failed login changed the stored bcrypt hash")
	}
}

func TestLoginRehashPersistenceFailureReturnsNoToken(t *testing.T) {
	st := newMockStore()
	bcryptHash, err := bcrypt.GenerateFromPassword([]byte("BcryptPassword123"), 12)
	if err != nil {
		t.Fatalf("GenerateFromPassword: %v", err)
	}
	st.users["u-1"] = store.User{ID: "u-1", Username: "alice", Name: "Alice", PasswordHash: string(bcryptHash)}
	st.updatePasswordHashErr = errors.New("database unavailable")
	resolver := &mutationResolver{&Resolver{Store: st, Auth: auth.NewService([]byte("secret"), time.Hour)}}

	payload, err := resolver.Login(context.Background(), model.LoginInput{Username: "alice", Password: "BcryptPassword123"})
	if err == nil {
		t.Fatal("Login succeeded despite password-hash persistence failure")
	}
	if payload != nil {
		t.Fatal("password-hash persistence failure returned an auth payload")
	}
	if st.updatePasswordHashCalls != 1 {
		t.Fatalf("password hash updates = %d, want 1", st.updatePasswordHashCalls)
	}
	stored, getErr := st.GetUserByID(context.Background(), "u-1")
	if getErr != nil {
		t.Fatalf("GetUserByID: %v", getErr)
	}
	if stored.PasswordHash != string(bcryptHash) {
		t.Fatal("failed persistence changed the stored bcrypt hash")
	}
}

func TestLoginAbsentUserDoesNotWrite(t *testing.T) {
	st := newMockStore()
	resolver := &mutationResolver{&Resolver{Store: st, Auth: auth.NewService([]byte("secret"), time.Hour)}}

	payload, err := resolver.Login(context.Background(), model.LoginInput{Username: "missing", Password: "Password123"})
	if err == nil {
		t.Fatal("Login accepted an absent user")
	}
	if payload != nil {
		t.Fatal("absent user returned an auth payload")
	}
	if st.updatePasswordHashCalls != 0 {
		t.Fatalf("absent user updated password hash %d times", st.updatePasswordHashCalls)
	}
	if len(st.users) != 0 {
		t.Fatalf("absent-user login changed user count to %d", len(st.users))
	}
}

func TestLoginDurationLogOmitsCredentials(t *testing.T) {
	st := newMockStore()
	hash, err := auth.HashPassword("PrivatePassword123")
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	st.users["u-private"] = store.User{
		ID:           "u-private",
		Username:     "private-user",
		Name:         "Private User",
		PasswordHash: hash,
	}
	resolver := &mutationResolver{&Resolver{Store: st, Auth: auth.NewService([]byte("secret"), time.Hour)}}

	previousLogger := slog.Default()
	var logs bytes.Buffer
	slog.SetDefault(slog.New(slog.NewTextHandler(&logs, &slog.HandlerOptions{Level: slog.LevelDebug})))
	t.Cleanup(func() { slog.SetDefault(previousLogger) })

	payload, err := resolver.Login(context.Background(), model.LoginInput{
		Username: "private-user",
		Password: "PrivatePassword123",
	})
	if err != nil || payload == nil {
		t.Fatalf("Login = %+v, %v", payload, err)
	}
	output := logs.String()
	for _, field := range []string{
		"msg=\"login completed\"",
		"duration_ms=",
		"hash_algorithm=argon2id",
		"rehash=false",
		"success=true",
	} {
		if !strings.Contains(output, field) {
			t.Errorf("login log missing %q: %s", field, output)
		}
	}
	for _, secret := range []string{"private-user", "PrivatePassword123", hash} {
		if strings.Contains(output, secret) {
			t.Errorf("login log contains credential material %q: %s", secret, output)
		}
	}
}

func TestPasswordWritingMutationsStoreArgon2id(t *testing.T) {
	t.Run("create user", func(t *testing.T) {
		st := newMockStore()
		resolver := &mutationResolver{&Resolver{Store: st}}
		ctx := auth.WithPrincipal(context.Background(), auth.Principal{ID: "admin"})
		created, err := resolver.CreateUser(ctx, model.CreateUserInput{
			Username: "created",
			Name:     "Created User",
			Password: "CreatePassword123",
		})
		if err != nil {
			t.Fatalf("CreateUser: %v", err)
		}
		assertStoredArgon2idPasswordByID(t, st, created.ID, "CreatePassword123")
	})

	t.Run("change password", func(t *testing.T) {
		st := newMockStore()
		oldHash, err := auth.HashPassword("OriginalPassword123")
		if err != nil {
			t.Fatalf("HashPassword: %v", err)
		}
		st.users["u-1"] = store.User{ID: "u-1", Username: "change", Name: "Change", PasswordHash: oldHash}
		resolver := &mutationResolver{&Resolver{Store: st}}
		ctx := auth.WithPrincipal(context.Background(), auth.Principal{ID: "u-1"})
		ok, err := resolver.ChangePassword(ctx, model.ChangePasswordInput{
			OldPassword: "OriginalPassword123",
			NewPassword: "ChangedPassword123",
		})
		if err != nil || !ok {
			t.Fatalf("ChangePassword = %v, %v", ok, err)
		}
		assertStoredArgon2idPasswordByID(t, st, "u-1", "ChangedPassword123")
	})

	t.Run("complete first password change", func(t *testing.T) {
		st := newMockStore()
		st.users["u-1"] = store.User{ID: "u-1", Username: "first", Name: "First", MustChangePassword: true}
		resolver := &mutationResolver{&Resolver{Store: st}}
		ctx := auth.WithPrincipal(context.Background(), auth.Principal{ID: "u-1"})
		ok, err := resolver.CompleteFirstPasswordChange(ctx, "CompletedPassword123")
		if err != nil || !ok {
			t.Fatalf("CompleteFirstPasswordChange = %v, %v", ok, err)
		}
		assertStoredArgon2idPasswordByID(t, st, "u-1", "CompletedPassword123")
	})

	t.Run("reset password", func(t *testing.T) {
		st := newMockStore()
		st.users["u-1"] = store.User{ID: "u-1", Username: "reset", Name: "Reset"}
		resolver := &mutationResolver{&Resolver{Store: st}}
		ctx := auth.WithPrincipal(context.Background(), auth.Principal{ID: "admin"})
		ok, err := resolver.ResetUserPassword(ctx, "u-1", "ResetPassword123")
		if err != nil || !ok {
			t.Fatalf("ResetUserPassword = %v, %v", ok, err)
		}
		assertStoredArgon2idPasswordByID(t, st, "u-1", "ResetPassword123")
	})
}

func assertStoredArgon2idPassword(t *testing.T, st *mockStore, username, password string) {
	t.Helper()
	user, err := st.GetUserByUsername(context.Background(), username)
	if err != nil {
		t.Fatalf("GetUserByUsername(%q): %v", username, err)
	}
	assertArgon2idPassword(t, user.PasswordHash, password)
}

func assertStoredArgon2idPasswordByID(t *testing.T, st *mockStore, id, password string) {
	t.Helper()
	user, err := st.GetUserByID(context.Background(), id)
	if err != nil {
		t.Fatalf("GetUserByID(%q): %v", id, err)
	}
	assertArgon2idPassword(t, user.PasswordHash, password)
}

func assertArgon2idPassword(t *testing.T, hash, password string) {
	t.Helper()
	if !strings.HasPrefix(hash, "$argon2id$v=19$m=19456,t=2,p=1$") {
		t.Fatalf("password hash does not use Hive Argon2id parameters: %q", hash)
	}
	if err := auth.VerifyPassword(hash, password); err != nil {
		t.Fatalf("stored password does not verify: %v", err)
	}
}
