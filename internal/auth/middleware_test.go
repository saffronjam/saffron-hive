package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/store"
)

// fakeLookup returns a single user keyed by ID; unknown IDs produce an error,
// matching the "deleted user" path the middleware guards against.
type fakeLookup struct {
	users map[string]store.User
}

func (f fakeLookup) GetUserByID(_ context.Context, id string) (store.User, error) {
	u, ok := f.users[id]
	if !ok {
		return store.User{}, fmt.Errorf("not found")
	}
	return u, nil
}

func lookupWith(u store.User) fakeLookup {
	return fakeLookup{users: map[string]store.User{u.ID: u}}
}

func emptyLookup() fakeLookup { return fakeLookup{users: map[string]store.User{}} }

// testHandler records whether it was invoked and exposes the user carried on
// the incoming request's context.
type testHandler struct {
	called  bool
	user    CtxUser
	hasUser bool
}

func (t *testHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	t.called = true
	t.user, t.hasUser = UserFromContext(r.Context())
	w.WriteHeader(http.StatusOK)
}

func gqlRequest(t *testing.T, opName string) *http.Request {
	t.Helper()
	body, _ := json.Marshal(map[string]any{
		"operationName": opName,
		"query":         "query { a }",
	})
	return httptest.NewRequest(http.MethodPost, "/graphql", bytes.NewReader(body))
}

// TestMiddlewarePassesThroughMissingToken pins the post-fix behaviour: the
// middleware does NOT reject unauthenticated requests on its own. It passes
// them through with no user attached so the @auth schema directive can decide
// per field whether the call is allowed (login/setupStatus/createInitialUser/me
// stay public; everything else rejects with UNAUTHENTICATED). Before the fix,
// the middleware was the only gate and would 401 here — but it also waved
// through any request whose client-supplied operationName matched a string
// allowlist (CRITICAL bypass). Both behaviours are now gone.
func TestMiddlewarePassesThroughMissingToken(t *testing.T) {
	svc := NewService([]byte("s"), time.Hour)
	h := &testHandler{}
	wrapped := Middleware(svc, lookupWith(store.User{ID: "u-1", Username: "alice", Name: "Alice"}))(h)

	rec := httptest.NewRecorder()
	wrapped.ServeHTTP(rec, gqlRequest(t, "scenes"))
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want 200 (directive enforces auth, not middleware)", rec.Code)
	}
	if !h.called {
		t.Error("downstream not called — middleware should pass through")
	}
	if h.hasUser {
		t.Error("user injected with no token; should be absent for directive to reject")
	}
}

// TestMiddlewareDoesNotHonourOperationNameAllowlist regression-tests the
// CRITICAL operationName bypass: a request claiming operationName=login but
// carrying no token must not result in a user being attached, because the
// middleware no longer treats operationName as authz-relevant. Whether the
// downstream operation runs or rejects is the directive's job — but the
// middleware must never produce a *user-attached* context without a real
// token.
func TestMiddlewareDoesNotHonourOperationNameAllowlist(t *testing.T) {
	svc := NewService([]byte("s"), time.Hour)
	h := &testHandler{}
	wrapped := Middleware(svc, lookupWith(store.User{ID: "u-1", Username: "alice", Name: "Alice"}))(h)

	for _, op := range []string{"setupStatus", "login", "createInitialUser", "IntrospectionQuery"} {
		rec := httptest.NewRecorder()
		wrapped.ServeHTTP(rec, gqlRequest(t, op))
		if h.hasUser {
			t.Errorf("op %q: user attached without token — middleware honoured allowlist", op)
		}
		h.called = false
		h.hasUser = false
		_ = rec
	}
}

func TestMiddlewarePassesThroughInvalidToken(t *testing.T) {
	svc := NewService([]byte("s"), time.Hour)
	h := &testHandler{}
	wrapped := Middleware(svc, lookupWith(store.User{ID: "u-1", Username: "alice", Name: "Alice"}))(h)

	req := gqlRequest(t, "scenes")
	req.Header.Set("Authorization", "Bearer not-a-valid-jwt")

	rec := httptest.NewRecorder()
	wrapped.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want 200 (directive enforces, not middleware)", rec.Code)
	}
	if !h.called {
		t.Error("downstream not called — middleware should pass through")
	}
	if h.hasUser {
		t.Error("invalid token must not produce a user-attached context")
	}
}

func TestMiddlewareInjectsUserAndRefreshesToken(t *testing.T) {
	svc := NewService([]byte("s"), time.Hour)
	tok, err := svc.Sign("u-1", "alice", "Alice")
	if err != nil {
		t.Fatalf("sign: %v", err)
	}

	h := &testHandler{}
	wrapped := Middleware(svc, lookupWith(store.User{ID: "u-1", Username: "alice", Name: "Alice"}))(h)

	req := gqlRequest(t, "scenes")
	req.Header.Set("Authorization", "Bearer "+tok)

	rec := httptest.NewRecorder()
	wrapped.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if !h.called {
		t.Fatal("downstream handler not called")
	}
	if !h.hasUser {
		t.Fatal("user not injected into context")
	}
	if h.user.ID != "u-1" || h.user.Username != "alice" || h.user.Name != "Alice" {
		t.Errorf("user = %+v, want {u-1 alice Alice}", h.user)
	}

	fresh := rec.Header().Get(RefreshedTokenHeader)
	if fresh == "" {
		t.Error("X-Refreshed-Token header missing")
	}
	claims, err := svc.Parse(fresh)
	if err != nil {
		t.Errorf("refreshed token does not parse: %v", err)
	}
	if claims.UserID != "u-1" {
		t.Errorf("refreshed token claims.UserID = %q, want u-1", claims.UserID)
	}
}

// TestMiddlewareDeletedUserPassesThroughWithoutUser pins the deleted-user
// behaviour to the new model: a token whose user no longer exists in the DB
// is treated as no token at all — the request flows through, no user is
// attached, and the @auth directive rejects whatever protected field was
// asked for.
func TestMiddlewareDeletedUserPassesThroughWithoutUser(t *testing.T) {
	svc := NewService([]byte("s"), time.Hour)
	tok, err := svc.Sign("u-gone", "alice", "Alice")
	if err != nil {
		t.Fatalf("sign: %v", err)
	}

	h := &testHandler{}
	wrapped := Middleware(svc, emptyLookup())(h)

	req := gqlRequest(t, "scenes")
	req.Header.Set("Authorization", "Bearer "+tok)

	rec := httptest.NewRecorder()
	wrapped.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", rec.Code)
	}
	if !h.called {
		t.Error("downstream not called")
	}
	if h.hasUser {
		t.Error("deleted user must not produce a user-attached context")
	}
}

func TestMiddlewareAllowsWebSocketUpgrade(t *testing.T) {
	svc := NewService([]byte("s"), time.Hour)
	h := &testHandler{}
	wrapped := Middleware(svc, lookupWith(store.User{ID: "u-1", Username: "alice", Name: "Alice"}))(h)

	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Upgrade", "websocket")
	req.Header.Set("Connection", "Upgrade")
	// No Authorization — WS handshake authenticates via graphql-ws InitFunc.

	rec := httptest.NewRecorder()
	wrapped.ServeHTTP(rec, req)

	if !h.called {
		t.Error("WS handshake blocked by HTTP middleware — should bypass")
	}
}

// TestRequireAuthRejectsMissingToken pins the non-GraphQL handler behaviour:
// /api/avatars has no per-field directive to fall back on, so the wrapper
// itself must 401 when no token is present.
func TestRequireAuthRejectsMissingToken(t *testing.T) {
	svc := NewService([]byte("s"), time.Hour)
	h := &testHandler{}
	wrapped := RequireAuth(svc, lookupWith(store.User{ID: "u-1", Username: "alice", Name: "Alice"}))(h)

	req := httptest.NewRequest(http.MethodPost, "/api/avatars", nil)
	rec := httptest.NewRecorder()
	wrapped.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
	if h.called {
		t.Error("downstream called despite missing token")
	}
}
