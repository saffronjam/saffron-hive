package auth

import "context"

// CtxUser is the user identity attached to authenticated request contexts.
// It intentionally carries only the denormalized fields — enough to render
// attribution and populate createdBy — so resolvers never need to fetch the
// user record on every request. MustChangePassword is loaded fresh from the
// store on every request so the AuthDirective can gate the forced-change
// flow without an additional DB lookup per resolver.
type CtxUser struct {
	ID                 string
	Username           string
	Name               string
	MustChangePassword bool
}

type ctxKey struct{}

// WithUser returns a copy of ctx carrying the given user identity.
func WithUser(ctx context.Context, u CtxUser) context.Context {
	return context.WithValue(ctx, ctxKey{}, u)
}

// UserFromContext returns the user attached to ctx, if any.
// ok is false when the request is unauthenticated (e.g. whitelisted operations
// like login, setupStatus, createInitialUser).
func UserFromContext(ctx context.Context) (CtxUser, bool) {
	u, ok := ctx.Value(ctxKey{}).(CtxUser)
	return u, ok
}
