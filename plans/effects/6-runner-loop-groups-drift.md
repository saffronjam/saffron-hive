# Phase 6 — Loop, group/room expansion, drift detection

Status: pending. Part 6 of 10. Depends on Phase 5.
Master plan: `~/.claude/plans/that-is-fine-lets-rosy-plum.md`

## Why

The runner from Phase 5 only handles single-device targets and never
loops. This phase adds the three remaining behaviours: looping, fanning
out across groups/rooms (with mid-loop membership change tolerance),
and the drift detection that stops a run when a *foreign* command
arrives on a device the run is currently driving.

## Deliverable

- Looping timeline runs cycle the step list indefinitely until stopped.
- Group/room targets resolve via `device.TargetResolver` *each
  iteration*; mid-loop membership change is observed at the next loop
  boundary (added members join, removed members stop receiving).
- A run stops when an `EventDeviceStateChanged` whose origin is *not*
  the run's `OriginEffect(runID)` lands on a device the run is
  currently driving.

## Files

### Modified

- `internal/effect/runner.go` — extend the worker
- `internal/effect/runner_test.go` — drift + group fixtures

### New

- `internal/effect/drift.go` — origin-aware comparator + bus
  subscriber
- `internal/effect/expand.go` — target resolution per iteration

### Read

- `internal/scene/watcher.go` — comparable drift scaffold (mirror in
  shape; do not import `internal/scene/`)

## Implementation

1. Loop semantics: when the effect has `loop=true`, the worker wraps
   the step walk in `for ctx.Err() == nil { ... }`. After the last
   step (which is the user-enforced trailing wait — see Phase 10's
   editor rule), it re-resolves the target and starts again.

2. Group/room expansion: at each iteration boundary, call
   `targets.ResolveTargetDeviceIDs(ctx, target.Type, target.ID)`.
   Build commands for the resolved set. The runner publishes one
   `EventCommandRequested` per resolved device; the adapter decides
   whether to coalesce into a Zigbee group publish where supported.

3. Drift detection — a goroutine inside the runner subscribes to
   `EventDeviceStateChanged`. For each event:

   - Look up any `active[target]` whose currently-resolved device set
     contains the event's device ID.
   - Compare event origin to the run's `OriginEffect(runID)`. If
     equal, ignore.
   - Otherwise call `Stop(target)`.

4. The drift comparator does **not** look at the *value* of the state
   change — only at the origin. Any non-self change stops the run.
   This is symmetric with the conflict policy: external authorities
   (user, automation, scene) take precedence over a running effect.

5. Capability fan-out: continue using
   `device.FilterCommandFields(cmd, dev)` per resolved device so
   per-step caps are filtered without breaking. Devices that drop all
   fields (full mismatch) are no-op'd; log at debug level, not error.

## Tests

- Loop: 2-step loop runs ≥ 3 cycles within a test window; assert
  publish count grows.
- Membership change mid-loop: add a member to the targeted group
  between iterations → next iteration's publish set includes the new
  device. Remove a member → next iteration no longer commands it.
- Self echo does not stop: feed the runner an
  `EventDeviceStateChanged` whose origin equals the run's runID →
  still active.
- Foreign command stops: feed an event with `OriginUser()` → runner
  stops within one tick.
- Capability fan-out: group with mixed CT/RGB bulbs receiving an RGB
  step → CT-only bulb sees no command (or a filtered subset), RGB
  bulb sees the command. No errors.
- Native preempt under loop: A is looping, B=native starts → A is
  cancelled cleanly; B's terminator-then-trigger sequence fires.

## Done when

- `make e2e` green.
- Loop+drift tests are deterministic (use a fake clock or short
  waits — no flakes).

## Out of scope

- Persistence / reboot (Phase 7).
- GraphQL surface (Phase 8).

## Next

Phase 7 — Persistence and reboot recovery.
