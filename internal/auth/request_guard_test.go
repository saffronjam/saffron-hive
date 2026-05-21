package auth

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRequestGuardForwardsValidBody(t *testing.T) {
	called := false
	var seen []byte
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Fatalf("downstream read body: %v", err)
		}
		seen = body
		w.WriteHeader(http.StatusOK)
	})

	body := `{"query":"{ me { id } }"}`
	req := httptest.NewRequest(http.MethodPost, "/graphql", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	RequestGuard(MaxGraphQLRequestBytes)(next).ServeHTTP(rec, req)

	if !called {
		t.Fatal("downstream handler was not invoked for a valid body")
	}
	if string(seen) != body {
		t.Errorf("downstream body = %q, want %q", seen, body)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestRequestGuardRejectsMalformedJSON(t *testing.T) {
	next := http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		t.Fatal("downstream handler must not run for malformed JSON")
	})

	rawBody := "not-json-deadbeef"
	req := httptest.NewRequest(http.MethodPost, "/graphql", strings.NewReader(rawBody))
	rec := httptest.NewRecorder()

	RequestGuard(MaxGraphQLRequestBytes)(next).ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rec.Code)
	}
	respBody := rec.Body.String()
	if !strings.Contains(respBody, `"invalid request body"`) {
		t.Errorf("response missing generic message; got %q", respBody)
	}
	if strings.Contains(respBody, rawBody) {
		t.Errorf("response echoed raw body bytes: %q", respBody)
	}
}

func TestRequestGuardRejectsOversizeBody(t *testing.T) {
	next := http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		t.Fatal("downstream handler must not run when body exceeds the cap")
	})

	limit := int64(1024)
	body := bytes.Repeat([]byte("a"), int(limit)+1)
	req := httptest.NewRequest(http.MethodPost, "/graphql", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	RequestGuard(limit)(next).ServeHTTP(rec, req)

	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("status = %d, want 413", rec.Code)
	}
}

func TestRequestGuardPassesThroughGet(t *testing.T) {
	called := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	rec := httptest.NewRecorder()

	RequestGuard(MaxGraphQLRequestBytes)(next).ServeHTTP(rec, req)

	if !called {
		t.Fatal("GET request must reach the downstream handler")
	}
}

func TestRequestGuardPassesThroughWebSocketUpgrade(t *testing.T) {
	called := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusSwitchingProtocols)
	})

	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Upgrade", "websocket")
	req.Header.Set("Connection", "Upgrade")
	rec := httptest.NewRecorder()

	RequestGuard(MaxGraphQLRequestBytes)(next).ServeHTTP(rec, req)

	if !called {
		t.Fatal("WebSocket upgrade must bypass the JSON probe")
	}
}
