package auth

import (
	"context"
	"time"
)

// Principal is the authenticated user or guest attached to a request context.
type Principal struct {
	ID                 string
	Username           string
	Name               string
	Guest              bool
	MustChangePassword bool
	TokenVersion       int64
	HardExpiresAt      time.Time
	AccessExpiresAt    time.Time
}

type ctxKey struct{}

// WithPrincipal returns a copy of ctx carrying the given identity.
func WithPrincipal(ctx context.Context, principal Principal) context.Context {
	return context.WithValue(ctx, ctxKey{}, principal)
}

// PrincipalFromContext returns the identity attached to ctx, if any.
// ok is false when the request is unauthenticated (e.g. whitelisted operations
// like login, setupStatus, createInitialUser).
func PrincipalFromContext(ctx context.Context) (Principal, bool) {
	principal, ok := ctx.Value(ctxKey{}).(Principal)
	return principal, ok
}
