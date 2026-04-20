package auth

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strings"
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

// Middleware enforces auth on the GraphQL HTTP endpoint.
//
// Behaviour:
//  1. If the operationName of the incoming GraphQL request is in the
//     whitelist, the request is allowed through without a token. The ctx
//     carries no user.
//  2. Otherwise, an `Authorization: Bearer <token>` header is required; the
//     token is verified and its claims are attached to the request context
//     via WithUser. A freshly signed token is returned in the
//     X-Refreshed-Token response header.
func Middleware(svc *Service) func(http.Handler) http.Handler {
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

			token := extractBearer(r)
			if token == "" {
				writeAuthError(w, "missing authorization token")
				return
			}
			claims, err := svc.Parse(token)
			if err != nil {
				writeAuthError(w, "invalid or expired token")
				return
			}

			fresh, err := svc.Sign(claims.UserID, claims.Username, claims.Name)
			if err == nil {
				w.Header().Set(RefreshedTokenHeader, fresh)
				// Expose the header for browser JS (CORS allow-list).
				w.Header().Add("Access-Control-Expose-Headers", RefreshedTokenHeader)
			}

			ctx := WithUser(r.Context(), CtxUser{
				ID:       claims.UserID,
				Username: claims.Username,
				Name:     claims.Name,
			})
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

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
