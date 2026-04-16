# Plan: Automation Graph — DB Store + Engine Refactor

## Dependencies
- layer-0/02-automation-graph-domain (graph types + validation exist)

## Goal
Replace the flat automation DB model and engine with the DAG-based model. Store graph nodes and edges in SQLite. Refactor the engine to evaluate graphs instead of flat rules.

## Migration 003

`internal/store/migrations/003_automation_graph.up.sql`:

Replace the flat model. Since this is pre-production, we can drop and recreate:

```sql
DROP TABLE IF EXISTS automation_actions;
DROP TABLE IF EXISTS automations;

CREATE TABLE automations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    cooldown_seconds INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE automation_nodes (
    id TEXT PRIMARY KEY,
    automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    type TEXT NOT NULL,      -- "trigger", "operator", "action"
    config TEXT NOT NULL     -- JSON
);

CREATE TABLE automation_edges (
    id TEXT PRIMARY KEY,
    automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    from_node_id TEXT NOT NULL REFERENCES automation_nodes(id) ON DELETE CASCADE,
    to_node_id TEXT NOT NULL REFERENCES automation_nodes(id) ON DELETE CASCADE
);
```

## Store interface changes

Remove old automation methods. Replace with:
- `CreateAutomation(ctx, params) (Automation, error)` — params: id, name, enabled, cooldown
- `GetAutomation(ctx, id) (Automation, error)`
- `ListAutomations(ctx) ([]Automation, error)`
- `ListEnabledAutomations(ctx) ([]Automation, error)`
- `UpdateAutomationEnabled(ctx, id, enabled) error`
- `DeleteAutomation(ctx, id) error`
- `CreateAutomationNode(ctx, params) (AutomationNode, error)`
- `ListAutomationNodes(ctx, automationID) ([]AutomationNode, error)`
- `DeleteAutomationNode(ctx, id) error`
- `CreateAutomationEdge(ctx, params) (AutomationEdge, error)`
- `ListAutomationEdges(ctx, automationID) ([]AutomationEdge, error)`
- `DeleteAutomationEdge(ctx, id) error`
- `GetAutomationGraph(ctx, automationID) (AutomationGraph, error)` — loads full graph (automation + nodes + edges)

## Engine refactor

Replace the flat evaluation loop with graph evaluation:

1. On event, find all trigger nodes across all enabled automations that match the event type
2. For each matched trigger, evaluate its condition_expr (if any)
3. Walk forward through edges:
   - At an AND operator: check if ALL incoming edges' source nodes are satisfied
   - At an OR operator: check if ANY incoming edge's source node is satisfied
   - At a NOT operator: negate the single incoming edge
4. When reaching an action node with all upstream satisfied, execute the action
5. Publish node activation states to event bus for live visualization (`EventAutomationNodeActivated`)

The engine compiles all graphs on Reload. For each graph, it precomputes:
- A map of trigger nodes by event type (fast lookup)
- Topological ordering of nodes (for forward evaluation)
- Compiled expr programs for trigger conditions

## Live visualization

Add new event type: `EventAutomationNodeActivated`
Payload: `{ AutomationID string, NodeID string, Active bool }`

Published every time a node lights up or goes dark during evaluation. Frontend subscribes to this for real-time graph highlighting.

## Action target resolution

Action nodes now have `TargetType` (device/group) and `TargetID`. When executing:
- If TargetType is "device", send command directly
- If TargetType is "group", resolve group to device IDs, send command to each

## Tests

### Store tests
- Create automation with nodes and edges, retrieve full graph
- Delete automation cascades nodes and edges
- List enabled automations

### Engine tests
- Simple trigger → action (no operators)
- Trigger → AND → action (two triggers, both must fire)
- Trigger → OR → action (two triggers, either fires)
- Trigger → NOT → action (trigger must NOT be active)
- Chain: trigger → AND → OR → action
- Cooldown applies per-automation (whole graph)
- Condition expr on trigger node filters events
- Action with group target resolves and expands
- Node activation events published during evaluation

### Validation tests
- Valid graph passes
- Cycle rejected
- Trigger with incoming edge rejected
- Action with outgoing edge rejected
