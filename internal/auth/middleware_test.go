package auth

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

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

func TestMiddlewareWhitelistedBypassesAuth(t *testing.T) {
	svc := NewService([]byte("s"), time.Hour)
	h := &testHandler{}
	wrapped := Middleware(svc)(h)

	for _, op := range []string{"setupStatus", "login", "createInitialUser", "IntrospectionQuery"} {
		rec := httptest.NewRecorder()
		wrapped.ServeHTTP(rec, gqlRequest(t, op))
		if rec.Code != http.StatusOK {
			t.Errorf("op %q: status %d, want 200", op, rec.Code)
		}
		if !h.called {
			t.Errorf("op %q: downstream handler not called", op)
		}
		if h.hasUser {
			t.Errorf("op %q: user should not be injected on whitelisted request", op)
		}
		h.called = false
		h.hasUser = false
	}
}

func TestMiddlewareRejectsMissingToken(t *testing.T) {
	svc := NewService([]byte("s"), time.Hour)
	h := &testHandler{}
	wrapped := Middleware(svc)(h)

	rec := httptest.NewRecorder()
	wrapped.ServeHTTP(rec, gqlRequest(t, "scenes"))
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
	if h.called {
		t.Error("downstream called despite missing token")
	}
}

func TestMiddlewareRejectsInvalidToken(t *testing.T) {
	svc := NewService([]byte("s"), time.Hour)
	h := &testHandler{}
	wrapped := Middleware(svc)(h)

	req := gqlRequest(t, "scenes")
	req.Header.Set("Authorization", "Bearer not-a-valid-jwt")

	rec := httptest.NewRecorder()
	wrapped.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
	if h.called {
		t.Error("downstream called despite invalid token")
	}
}

func TestMiddlewareInjectsUserAndRefreshesToken(t *testing.T) {
	svc := NewService([]byte("s"), time.Hour)
	tok, err := svc.Sign("u-1", "alice", "Alice")
	if err != nil {
		t.Fatalf("sign: %v", err)
	}

	h := &testHandler{}
	wrapped := Middleware(svc)(h)

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
	// JWT `iat`/`exp` have second-level resolution; two signs within the same
	// second produce identical tokens. The important guarantee is that the
	// header is set with a valid, parseable JWT.
	claims, err := svc.Parse(fresh)
	if err != nil {
		t.Errorf("refreshed token does not parse: %v", err)
	}
	if claims.UserID != "u-1" {
		t.Errorf("refreshed token claims.UserID = %q, want u-1", claims.UserID)
	}
}

func TestMiddlewareAllowsWebSocketUpgrade(t *testing.T) {
	svc := NewService([]byte("s"), time.Hour)
	h := &testHandler{}
	wrapped := Middleware(svc)(h)

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

func TestExtractOperationNameGET(t *testing.T) {
	// GET carries operationName as a query param.
	req := httptest.NewRequest(http.MethodGet, "/graphql?operationName=setupStatus&query=x", nil)
	if got := extractOperationName(req); got != "setupStatus" {
		t.Errorf("extractOperationName GET = %q, want setupStatus", got)
	}
}

func TestExtractOperationNamePreservesBody(t *testing.T) {
	// Peeking at the body must not consume it — the downstream handler needs
	// to read the JSON too.
	body := `{"operationName":"login","query":"mutation { login }"}`
	req := httptest.NewRequest(http.MethodPost, "/graphql", strings.NewReader(body))

	if got := extractOperationName(req); got != "login" {
		t.Errorf("extractOperationName = %q, want login", got)
	}
	buf := new(bytes.Buffer)
	if _, err := buf.ReadFrom(req.Body); err != nil {
		t.Fatalf("read body after peek: %v", err)
	}
	if buf.String() != body {
		t.Errorf("body after peek = %q, want %q", buf.String(), body)
	}
}
