package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/saffronjam/saffron-hive/internal/store"
)

// RefreshedTokenHeader carries a freshly signed JWT on every authenticated
// response. The frontend swaps it into localStorage so the session slides
// forward on activity — users stay logged in for as long as they're active.
const RefreshedTokenHeader = "X-Refreshed-Token"

// whitelistedOps are GraphQL operations that must work without authentication.
// setupStatus drives the initial /setup gate; login issues the first token;
// createInitialUser bootstraps the first user on a fresh install;
// IntrospectionQuery is used by codegen tooling and the GraphQL playground.
var whitelistedOps = map[string]bool{
	"setupStatus":        true,
	"login":              true,
	"createInitialUser":  true,
	"IntrospectionQuery": true,
}

// UserLookup loads the current user row. The Middleware calls it after parsing
// the JWT so deleted accounts reject on their next authenticated request. Keep
// the interface narrow so tests can provide a fake without pulling in the
// whole store package.
type UserLookup interface {
	GetUserByID(ctx context.Context, id string) (store.User, error)
}

// Middleware enforces auth on the GraphQL HTTP endpoint.
//
// Behaviour:
//  1. If the operationName of the incoming GraphQL request is in the
//     whitelist, the request is allowed through without a token. The ctx
//     carries no user.
//  2. Otherwise, an `Authorization: Bearer <token>` header is required; the
//     token is verified, the user is reloaded from the DB, and the fresh
//     name/username are attached to the request context via WithUser. A
//     freshly signed token is returned in the X-Refreshed-Token response
//     header.
//  3. If the user lookup returns no row (e.g. an admin deleted the account
//     while the session was live), the request gets a 401 UNAUTHENTICATED
//     so the frontend redirects to /login.
func Middleware(svc *Service, lookup UserLookup) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// WebSocket upgrade requests authenticate via the graphql-ws
			// connection_init payload, handled by the gqlgen transport's
			// InitFunc. Let the upgrade through; the InitFunc will reject
			// bad tokens before any subscription data flows.
			if isWebSocketUpgrade(r) {
				next.ServeHTTP(w, r)
				return
			}
			opName := extractOperationName(r)
			if whitelistedOps[opName] {
				next.ServeHTTP(w, r)
				return
			}

			user, err := authenticate(r, svc, lookup)
			if err != nil {
				writeAuthError(w, err.Error())
				return
			}

			fresh, signErr := svc.Sign(user.ID, user.Username, user.Name)
			if signErr == nil {
				w.Header().Set(RefreshedTokenHeader, fresh)
				w.Header().Add("Access-Control-Expose-Headers", RefreshedTokenHeader)
			}

			next.ServeHTTP(w, r.WithContext(WithUser(r.Context(), user)))
		})
	}
}

// RequireAuth wraps an HTTP handler with JWT + DB-lookup authentication, used
// by non-GraphQL endpoints (e.g. avatar upload). Returns 401 with a clear
// UNAUTHENTICATED code on failure so the frontend's existing 401 handler
// behaves identically for GraphQL and REST.
func RequireAuth(svc *Service, lookup UserLookup) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, err := authenticate(r, svc, lookup)
			if err != nil {
				writeAuthError(w, err.Error())
				return
			}
			next.ServeHTTP(w, r.WithContext(WithUser(r.Context(), user)))
		})
	}
}

func authenticate(r *http.Request, svc *Service, lookup UserLookup) (CtxUser, error) {
	token := extractBearer(r)
	if token == "" {
		return CtxUser{}, errStr("missing authorization token")
	}
	claims, err := svc.Parse(token)
	if err != nil {
		return CtxUser{}, errStr("invalid or expired token")
	}
	u, err := lookup.GetUserByID(r.Context(), claims.UserID)
	if err != nil {
		return CtxUser{}, errStr("user not found")
	}
	return CtxUser{ID: u.ID, Username: u.Username, Name: u.Name}, nil
}

type errStr string

func (e errStr) Error() string { return string(e) }

func isWebSocketUpgrade(r *http.Request) bool {
	if !strings.EqualFold(r.Header.Get("Upgrade"), "websocket") {
		return false
	}
	for _, v := range strings.Split(r.Header.Get("Connection"), ",") {
		if strings.EqualFold(strings.TrimSpace(v), "upgrade") {
			return true
		}
	}
	return false
}

func extractBearer(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if h == "" {
		return ""
	}
	const prefix = "Bearer "
	if !strings.HasPrefix(h, prefix) {
		return ""
	}
	return strings.TrimSpace(h[len(prefix):])
}

// extractOperationName peeks at the GraphQL request to find its operationName.
// For POST requests, the body is parsed and then restored so the downstream
// handler sees it untouched. For GET requests, the query parameter is read.
// Returns "" when the operation name cannot be determined — which falls
// through to the auth check (safe default).
func extractOperationName(r *http.Request) string {
	if r.Method == http.MethodGet {
		return r.URL.Query().Get("operationName")
	}
	if r.Method != http.MethodPost {
		return ""
	}
	if r.Body == nil {
		return ""
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return ""
	}
	r.Body = io.NopCloser(bytes.NewReader(body))

	var payload struct {
		OperationName string `json:"operationName"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return ""
	}
	return payload.OperationName
}

func writeAuthError(w http.ResponseWriter, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"errors": []map[string]any{{
			"message":    msg,
			"extensions": map[string]any{"code": "UNAUTHENTICATED"},
		}},
	})
}
