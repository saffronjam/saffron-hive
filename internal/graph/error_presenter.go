package graph

import (
	"context"

	"github.com/99designs/gqlgen/graphql"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

// scrubbedErrorCodes are gqlgen parse / validation errors whose default
// messages name schema fields or types. Returning the literal text to an
// unauthenticated caller lets them reconstruct the schema one bogus query at
// a time — the H2 finding. Every other error code (including the absence of
// one) passes through, because resolver errors are user-actionable
// (`"invalid username or password"`, `"invalid bootstrap token"`,
// `"too many login attempts; try again in 60s"`) and hiding them turns the
// public surface into a black box for legitimate operators.
var scrubbedErrorCodes = map[string]bool{
	"GRAPHQL_VALIDATION_FAILED": true,
	"GRAPHQL_PARSE_FAILED":      true,
}

// ErrorPresenter rewrites gqlgen validation/parse errors emitted to
// unauthenticated callers so they cannot use those messages as an
// introspection oracle. Resolver-side errors (login failures, bootstrap-token
// rejections, rate-limit notices) are passed through verbatim — they are
// composed by our own code, never include schema field/type names, and are
// the only signal a legitimate operator has to diagnose a failed request.
// Authenticated callers see every error verbatim regardless of code.
func ErrorPresenter(ctx context.Context, err error) *gqlerror.Error {
	presented := graphql.DefaultErrorPresenter(ctx, err)
	if _, ok := auth.UserFromContext(ctx); ok {
		return presented
	}
	code, _ := presented.Extensions["code"].(string)
	if !scrubbedErrorCodes[code] {
		return presented
	}
	return &gqlerror.Error{
		Message:    "request rejected",
		Path:       presented.Path,
		Extensions: map[string]any{"code": code},
	}
}
