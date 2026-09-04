package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/saffronjam/saffron-hive/internal/store"
)

// MaxGuestLifetime is the longest a guest may exist from creation.
const MaxGuestLifetime = 7 * 24 * time.Hour

// RefreshedTokenHeader carries a freshly signed JWT on every authenticated
// response. The frontend swaps it into localStorage so the session slides
// forward on activity — users stay logged in for as long as they're active.
const RefreshedTokenHeader = "X-Refreshed-Token"

// PrincipalLookup loads current user and guest rows after JWT verification.
type PrincipalLookup interface {
	GetUserByID(ctx context.Context, id string) (store.User, error)
	GetActiveGuestByID(ctx context.Context, id string, now time.Time) (store.Guest, error)
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
func Middleware(svc *Service, lookup PrincipalLookup) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if IsWebSocketUpgrade(r) {
				next.ServeHTTP(w, r)
				return
			}

			principal, err := authenticate(r, svc, lookup)
			if err != nil {
				next.ServeHTTP(w, r)
				return
			}

			fresh, signErr := refreshToken(svc, principal)
			if signErr == nil {
				w.Header().Set(RefreshedTokenHeader, fresh)
				w.Header().Add("Access-Control-Expose-Headers", RefreshedTokenHeader)
			}

			next.ServeHTTP(w, r.WithContext(WithPrincipal(r.Context(), principal)))
		})
	}
}

// RequireAuth wraps a non-GraphQL HTTP handler with strict JWT + DB-lookup
// authentication. Used by the avatar upload endpoint, where there is no
// per-field directive to fall back on, so the middleware itself must reject
// unauthenticated callers.
func RequireAuth(svc *Service, lookup PrincipalLookup) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			principal, err := authenticate(r, svc, lookup)
			if err != nil {
				writeAuthError(w, err.Error())
				return
			}
			next.ServeHTTP(w, r.WithContext(WithPrincipal(r.Context(), principal)))
		})
	}
}

// RequireUser protects an HTTP handler from unauthenticated and guest callers.
func RequireUser(svc *Service, lookup PrincipalLookup) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			principal, err := authenticate(r, svc, lookup)
			if err != nil || principal.Guest {
				writeAuthError(w, "user authentication required")
				return
			}
			next.ServeHTTP(w, r.WithContext(WithPrincipal(r.Context(), principal)))
		})
	}
}

func authenticate(r *http.Request, svc *Service, lookup PrincipalLookup) (Principal, error) {
	token := extractBearer(r)
	if token == "" {
		return Principal{}, errStr("missing authorization token")
	}
	return AuthenticateToken(r.Context(), svc, lookup, token, time.Now())
}

// AuthenticateToken verifies a token and reloads its current principal row.
func AuthenticateToken(ctx context.Context, svc *Service, lookup PrincipalLookup, token string, now time.Time) (Principal, error) {
	claims, err := svc.Parse(token)
	if err != nil {
		return Principal{}, errStr("invalid or expired token")
	}
	if claims.Guest {
		guest, err := lookup.GetActiveGuestByID(ctx, claims.PrincipalID, now)
		if err != nil {
			return Principal{}, errStr("guest access expired or revoked")
		}
		return Principal{
			ID:              guest.ID,
			Name:            guest.Name,
			Guest:           true,
			HardExpiresAt:   guest.CreatedAt.Add(MaxGuestLifetime),
			AccessExpiresAt: guest.ExpiresAt,
		}, nil
	}
	u, err := lookup.GetUserByID(ctx, claims.PrincipalID)
	if err != nil {
		return Principal{}, errStr("user not found")
	}
	if claims.TokenVersion != u.TokenVersion {
		return Principal{}, errStr("session revoked")
	}
	return Principal{
		ID:                 u.ID,
		Username:           u.Username,
		Name:               u.Name,
		MustChangePassword: u.MustChangePassword,
		TokenVersion:       u.TokenVersion,
	}, nil
}

func refreshToken(svc *Service, principal Principal) (string, error) {
	if principal.Guest {
		return svc.SignGuest(principal.ID, principal.Name, principal.HardExpiresAt)
	}
	return svc.SignUser(principal.ID, principal.Username, principal.Name, principal.TokenVersion)
}

type errStr string

func (e errStr) Error() string { return string(e) }

// IsWebSocketUpgrade reports whether a request is a WebSocket handshake.
// Middleware that wraps the ResponseWriter must let these through untouched,
// since the upgrade needs the original writer's http.Hijacker.
func IsWebSocketUpgrade(r *http.Request) bool {
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
