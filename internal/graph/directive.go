package graph

import (
	"context"

	"github.com/99designs/gqlgen/graphql"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

// forcedChangeAllowlist names the GraphQL fields a user with
// must_change_password set is permitted to call. It must be tight enough that
// no other authenticated operation succeeds while the flag is set, and wide
// enough that the frontend can read the flag (`me`) and clear it
// (`completeFirstPasswordChange`).
var forcedChangeAllowlist = map[string]bool{
	"me":                          true,
	"completeFirstPasswordChange": true,
}

// AuthDirective rejects field resolution when the request context carries no
// authenticated user, and additionally blocks every field outside
// forcedChangeAllowlist when the user's must_change_password flag is set.
// Wired into graph.Config.Directives.Auth so the @auth schema directive is
// enforced uniformly across queries, mutations, and subscriptions. Public
// fields (login, createInitialUser, setupStatus) omit @auth and run without
// a user attached.
func AuthDirective(ctx context.Context, _ any, next graphql.Resolver) (any, error) {
	user, ok := auth.UserFromContext(ctx)
	if !ok {
		return nil, &gqlerror.Error{
			Message:    "authentication required",
			Extensions: map[string]any{"code": "UNAUTHENTICATED"},
		}
	}
	if user.MustChangePassword {
		field := graphql.GetFieldContext(ctx).Field.Name
		if !forcedChangeAllowlist[field] {
			return nil, &gqlerror.Error{
				Message:    "password change required",
				Extensions: map[string]any{"code": "PASSWORD_CHANGE_REQUIRED"},
			}
		}
	}
	return next(ctx)
}
