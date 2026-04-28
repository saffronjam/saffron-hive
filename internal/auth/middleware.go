package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/saffronjam/saffron-hive/internal/store"
)

// RefreshedTokenHeader carries a freshly signed JWT on every authenticated
// response. The frontend swaps it into localStorage so the session slides
// forward on activity — users stay logged in for as long as they're active.
const RefreshedTokenHeader = "X-Refreshed-Token"

// UserLookup loads the current user row. The Middleware calls it after parsing
// the JWT so deleted accounts reject on their next authenticated request. Keep
// the interface narrow so tests can provide a fake without pulling in the
// whole store package.
type UserLookup interface {
	GetUserByID(ctx context.Context, id string) (store.User, error)
}

// Middleware attempts to authenticate the request and attaches the user to the
// context when a valid Bearer token is present. Requests without a token (or
// with an invalid one) flow through with no user attached — per-field auth is
// enforced by the @auth schema directive at the GraphQL layer, so public
// operations (login, createInitialUser, setupStatus, me) work without a token
// while every other field rejects with UNAUTHENTICATED.
//
// On success, a freshly signed token is returned in X-Refreshed-Token so the
// frontend can slide the session forward.
//
// WebSocket upgrade requests pass through untouched: the graphql-ws transport
// authenticates via the connection_init payload, handled by the gqlgen
// transport's InitFunc.
func Middleware(svc *Service, lookup UserLookup) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if isWebSocketUpgrade(r) {
				next.ServeHTTP(w, r)
				return
			}

			user, err := authenticate(r, svc, lookup)
			if err != nil {
				next.ServeHTTP(w, r)
				return
			}

			if fresh, signErr := svc.Sign(user.ID, user.Username, user.Name); signErr == nil {
				w.Header().Set(RefreshedTokenHeader, fresh)
				w.Header().Add("Access-Control-Expose-Headers", RefreshedTokenHeader)
			}

			next.ServeHTTP(w, r.WithContext(WithUser(r.Context(), user)))
		})
	}
}

// RequireAuth wraps a non-GraphQL HTTP handler with strict JWT + DB-lookup
// authentication. Used by the avatar upload endpoint, where there is no
// per-field directive to fall back on, so the middleware itself must reject
// unauthenticated callers.
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
