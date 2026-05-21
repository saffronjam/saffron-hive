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
//     We cap N independently of overall complexity so the policy stays easy to
//     reason about even if MaxQueryComplexity is later raised.
const (
	MaxQueryComplexity       = 1000
	MaxAliasesPerOperation   = 50
	MaxOperationsPerDocument = 5
)

const operationLimitErrorCode = "OPERATION_LIMIT_EXCEEDED"

// OperationLimitsExtension rejects documents that bundle too many operations
// or any operation whose selection-set fanout (counting every field node,
// including aliases) exceeds the configured maximum.
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
			if count := countFields(op.SelectionSet); count > e.MaxAliasesPerOperation {
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

// countFields recursively totals every *ast.Field reachable from a selection
// set, including those inside inline fragments and (resolved) fragment
// spreads. Each alias of the same underlying field counts independently —
// that is exactly the fanout we want to bound.
func countFields(set ast.SelectionSet) int {
	var n int
	for _, sel := range set {
		switch s := sel.(type) {
		case *ast.Field:
			n++
			n += countFields(s.SelectionSet)
		case *ast.InlineFragment:
			n += countFields(s.SelectionSet)
		case *ast.FragmentSpread:
			if s.Definition != nil {
				n += countFields(s.Definition.SelectionSet)
			}
		}
	}
	return n
}
