# Phase 1 — Origin tagging across the system

Status: pending. Part 1 of 10.
Master plan: `~/.claude/plans/that-is-fine-lets-rosy-plum.md`
v2 deferred: `plans/layer-6/15-effects-native-as-timeline-step-v2.md`

## Why

The Effects runner (Phase 5+) must distinguish its own state echoes from
foreign commands so it can stop on real drift without stopping on itself.
That requires a `CommandOrigin` field threaded through every event-bus
publisher. This phase introduces no user-visible behaviour change — it is
the substrate every later phase relies on.

## Deliverable

`device.CommandOrigin` exists, every existing publisher of
`EventCommandRequested` stamps it, and `EventDeviceStateChanged` carries
the origin of the upstream command so consumers can match echoes to
sources.

## Files

### New

- `internal/device/origin.go`

### Modified

- `internal/device/command.go`
- `internal/eventbus/eventbus.go` (event payload — confirm origin
  propagates on `EventCommandRequested` and `EventDeviceStateChanged`)
- `internal/scene/apply.go`
- `internal/automation/action.go`
- `internal/graph/schema.resolvers.go` (every direct-command path)
- `internal/scene/watcher.go` (origin parameter on drift handler;
  behaviour unchanged)

## Implementation

1. `CommandOrigin` shape:

   ```go
   type CommandOrigin struct {
       Kind string // "scene" | "automation" | "effect" | "user" | ""
       ID   string
   }
   ```

   Constructors: `OriginScene(id)`, `OriginAutomation(id)`,
   `OriginEffect(runID)`, `OriginUser()`.

2. Add `Origin CommandOrigin` to `device.Command`. JSON `omitempty` on
   the nested struct so existing persisted shapes (if any) still
   round-trip.

3. Audit every literal `device.Command{...}` and `&device.Command{...}`
   construction. Update each:

   - `internal/scene/apply.go::BuildApplyCommands` →
     `OriginScene(sceneID)`
   - `internal/automation/action.go::executeSetDeviceState` →
     `OriginAutomation(automationID)`
   - `internal/automation/action.go::executeActivateScene` — delegates
     to scene apply, which already stamps `OriginScene(...)`
   - `internal/graph/schema.resolvers.go::setDeviceState` and any peers
     → `OriginUser()`

4. `EventDeviceStateChanged` payload: confirm it carries the origin of
   the upstream command. The adapter is the natural place to forward it
   — when the adapter publishes an `EventCommandRequested`'s mapped MQTT
   payload, the resulting state echo (which the adapter receives back)
   should reflect the same origin tag back onto
   `EventDeviceStateChanged`. If the current adapter does not preserve
   this lineage, extend the payload type and the adapter.

5. `scene.Watcher.handleDeviceStateChanged` accepts the origin in the
   comparison routine. Behaviour unchanged in this phase: scene drift
   still fires on any non-matching state. Future-proofs the assumption
   so Phase 9's effect-payload disarm logic has somewhere to plug in.

## Tests

- `device.Command.Origin` JSON round-trip.
- Every existing `device.Command` build site stamps a non-empty origin
  (assertion in package-level tests using a fixture bus that captures
  publishes).
- Existing scene + automation + e2e suites continue to pass.

## Done when

- `make e2e` green.
- `git grep -n 'device.Command{' internal/` shows no construction
  without an origin (or via a helper that supplies one).

## Out of scope

- Effect-specific runtime (Phase 5/6).
- Scene watcher actually skipping echoes (does not need to yet —
  scene expected state is static).

## Next

Phase 2 — Effect schema, sqlc, and domain types.
