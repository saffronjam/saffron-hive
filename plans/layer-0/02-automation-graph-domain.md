# Plan: Automation Graph Domain Model

## Goal
Replace the flat automation model (trigger + condition + actions) with a DAG-based model. An automation is a directed acyclic graph of nodes (triggers, operators, actions) connected by edges. This enables visual AND/OR composition and live execution visualization.

## Domain types

Add to `internal/automation/` (or a new `internal/automation/graph/` subpackage):

- `NodeID` — string type
- `NodeType` — string type: `"trigger"`, `"operator"`, `"action"`
- `OperatorKind` — string type: `"and"`, `"or"`, `"not"`

- `Node` struct:
  - `ID NodeID`
  - `AutomationID string`
  - `Type NodeType`
  - `Config NodeConfig`

- `NodeConfig` interface or typed union:
  - `TriggerConfig` — `EventType string`, `DeviceID *string`, `ConditionExpr string` (expr filter on this trigger)
  - `OperatorConfig` — `Op OperatorKind`
  - `ActionConfig` — `ActionType string` (set_device_state, activate_scene), `TargetType string` (device, group), `TargetID string`, `Payload string` (JSON)

- `Edge` struct:
  - `ID string`
  - `AutomationID string`
  - `FromNodeID NodeID`
  - `ToNodeID NodeID`

- `AutomationGraph` struct:
  - `ID string`
  - `Name string`
  - `Enabled bool`
  - `CooldownSeconds int`
  - `Nodes []Node`
  - `Edges []Edge`

## Graph validation

On save, validate:
- Graph is a DAG (no cycles)
- Trigger nodes have no incoming edges
- Action nodes have no outgoing edges
- Operator nodes have at least one incoming and one outgoing edge
- All referenced node IDs in edges exist

## Files

- `internal/automation/graph.go` — all graph domain types
- `internal/automation/validate.go` — DAG validation, structural checks

## Tests

- Valid graph passes validation
- Cycle detection rejects cyclic graph
- Trigger with incoming edge rejected
- Action with outgoing edge rejected
- Orphan node (no edges) — decide policy (warn or reject)
- Empty graph is valid (no nodes = no-op automation)
