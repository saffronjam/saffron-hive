# Plan: GraphQL Schema + Resolver Updates (consolidation)

## Dependencies
- layer-1/04-groups-db-graphql
- layer-1/05-automation-graph-db-engine
- layer-1/06-scenes-with-groups

## Goal
Update the GraphQL schema, regenerate gqlgen code, and update all resolvers to match the new data model (groups, graph automations, scene targets).

## Schema changes summary

### New types
- `Group`, `GroupMember`, `SceneTarget` union
- `AutomationGraph` with `AutomationNode`, `AutomationEdge`
- `TriggerConfig`, `OperatorConfig`, `ActionConfig`
- `AutomationNodeEvent` for live visualization

### Modified types
- `SceneAction` — `targetType`/`targetId` instead of `deviceId`
- `Automation` — graph-based (nodes + edges) instead of flat (triggerEvent + conditionExpr + actions)

### New queries
- `groups`, `group(id)`

### New mutations
- `createGroup`, `updateGroup`, `deleteGroup`, `addGroupMember`, `removeGroupMember`
- `createAutomationNode`, `deleteAutomationNode`, `createAutomationEdge`, `deleteAutomationEdge`
- Update scene mutations for target type

### New subscriptions
- `automationNodeActivated(automationId)` — live execution events

## Process

1. Update `api/schema.graphql`
2. Regenerate gqlgen: `go run github.com/99designs/gqlgen generate --config api/gqlgen.yml`
3. Implement new resolvers
4. Update existing resolvers for changed types
5. Update all tests

## Files

- `api/schema.graphql`
- `internal/graph/generated.go` (regenerated)
- `internal/graph/model/models_gen.go` (regenerated)
- `internal/graph/schema.resolvers.go` (updated)
- `internal/graph/resolver.go` (add group store dependency)
- All test files in `internal/graph/`

## Tests

- All existing graph tests updated to pass
- New tests for group queries/mutations
- New tests for graph automation queries/mutations
- Subscription test for automationNodeActivated
