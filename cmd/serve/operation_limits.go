package serve

import (
	"context"

	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/errcode"
	"github.com/vektah/gqlparser/v2/ast"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

// Pre-execution caps on incoming GraphQL documents. The complexity limit is
// enforced by gqlgen's stock ComplexityLimit extension; the alias / operation
// counters here close gaps that complexity alone does not cover:
//
//   - ComplexityLimit only measures the operation gqlgen actually selects to
//     execute. A document that bundles many unused operations still costs
//     parser memory and walker time. MaxOperationsPerDocument bounds that.
//
//   - The fanout limit gives a hard, low-noise ceiling on the alias-batching
//     pattern — `query { a1: login(...) a2: login(...) ... aN: login(...) }`
//     would otherwise let a single HTTP request invoke a resolver N times.
//     Only the operation's top-level selections are counted, so deep but
//     narrow queries are bounded by MaxQueryComplexity rather than this cap,
//     keeping the policy easy to reason about even if MaxQueryComplexity is
//     later raised.
const (
	MaxQueryComplexity       = 1000
	MaxAliasesPerOperation   = 50
	MaxOperationsPerDocument = 5
)

const operationLimitErrorCode = "OPERATION_LIMIT_EXCEEDED"

// OperationLimitsExtension rejects documents that bundle too many operations
// or any operation whose top-level selection fanout (counting each top-level
// field, including aliases) exceeds the configured maximum.
type OperationLimitsExtension struct {
	MaxAliasesPerOperation   int
	MaxOperationsPerDocument int
}

var _ interface {
	graphql.HandlerExtension
	graphql.OperationContextMutator
} = OperationLimitsExtension{}

// ExtensionName returns the gqlgen extension identifier.
func (OperationLimitsExtension) ExtensionName() string { return "OperationLimits" }

// Validate is required by the HandlerExtension interface; no schema-time
// validation is needed.
func (OperationLimitsExtension) Validate(graphql.ExecutableSchema) error { return nil }

// MutateOperationContext inspects the parsed document before resolvers run.
// Returning a non-nil error short-circuits the request with a 422.
func (e OperationLimitsExtension) MutateOperationContext(
	_ context.Context,
	opCtx *graphql.OperationContext,
) *gqlerror.Error {
	if opCtx.Doc == nil {
		return nil
	}
	if e.MaxOperationsPerDocument > 0 && len(opCtx.Doc.Operations) > e.MaxOperationsPerDocument {
		err := gqlerror.Errorf(
			"document contains %d operations, which exceeds the limit of %d",
			len(opCtx.Doc.Operations),
			e.MaxOperationsPerDocument,
		)
		errcode.Set(err, operationLimitErrorCode)
		return err
	}
	if e.MaxAliasesPerOperation > 0 {
		for _, op := range opCtx.Doc.Operations {
			if count := countTopLevelFields(op.SelectionSet); count > e.MaxAliasesPerOperation {
				err := gqlerror.Errorf(
					"operation contains %d fields, which exceeds the limit of %d",
					count,
					e.MaxAliasesPerOperation,
				)
				errcode.Set(err, operationLimitErrorCode)
				return err
			}
		}
	}
	return nil
}

// countTopLevelFields totals the top-level *ast.Field selections of an
// operation. Inline fragments and (resolved) fragment spreads are expanded in
// place so they cannot smuggle extra top-level fields, but nested field
// selection sets are not descended into — query depth is bounded by the
// complexity limit, not here. Each alias of the same underlying field counts
// independently, which is exactly the fanout we want to bound.
func countTopLevelFields(set ast.SelectionSet) int {
	var n int
	for _, sel := range set {
		switch s := sel.(type) {
		case *ast.Field:
			n++
		case *ast.InlineFragment:
			n += countTopLevelFields(s.SelectionSet)
		case *ast.FragmentSpread:
			if s.Definition != nil {
				n += countTopLevelFields(s.Definition.SelectionSet)
			}
		}
	}
	return n
}
