package graph

import (
	"context"

	"github.com/99designs/gqlgen/graphql"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

// AuthDirective rejects field resolution when the request context carries no
// authenticated user. Wired into graph.Config.Directives.Auth so the @auth
// schema directive is enforced uniformly across queries, mutations, and
// subscriptions. Public fields (login, createInitialUser, setupStatus, me)
// omit @auth and run without a user attached.
func AuthDirective(ctx context.Context, _ any, next graphql.Resolver) (any, error) {
	if _, ok := auth.UserFromContext(ctx); !ok {
		return nil, &gqlerror.Error{
			Message:    "authentication required",
			Extensions: map[string]any{"code": "UNAUTHENTICATED"},
		}
	}
	return next(ctx)
}
