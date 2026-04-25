# Phase 7 — Persistence and reboot recovery

Status: pending. Part 7 of 10. Depends on Phase 6.
Master plan: `~/.claude/plans/that-is-fine-lets-rosy-plum.md`

## Why

Loop timeline runs need to survive backend restarts so a "lava lamp"
loop comes back automatically. Non-loop and native runs explicitly
should not — they were either one-shots or owned by the bulb's
firmware. This phase wires `active_effects` rows in and adds a startup
hydration step.

## Deliverable

- `Runner.Start` writes an `active_effects` row.
  `volatile = (effect.Loop && effect.Kind == KindTimeline) ? 0 : 1`.
- `Runner.Stop` and natural completion delete the row.
- On startup, hydration deletes all `volatile=1` rows and re-launches
  the rest from step 0.
- The DB unique constraint on `(target_type, target_id)` enforces
  conflict policy at the storage layer too.

## Files

### Modified

- `internal/effect/runner.go` — write/delete rows on
  Start/Stop/complete
- `cmd/serve/main.go` (or wherever the boot sequence wires
  dependencies) — call `Runner.Hydrate(ctx)` after dependencies are
  wired
- `internal/store/queries/effects.sql` — confirm
  `DeleteVolatileActiveEffects` and `ListActiveEffects` exist; add if
  missing

### New

- `internal/effect/hydrate.go` — `Hydrate(ctx)` boot helper
- `internal/effect/persistence_test.go` — reboot recovery tests

## Implementation

1. In `Start`, after the transactional preempt, write the new
   `active_effects` row via `UpsertActiveEffect` so the unique
   constraint silently overwrites the preempted row's slot.

2. In `Stop` and at non-loop natural completion, delete the row.

3. `Hydrate(ctx)`:

   - `DeleteVolatileActiveEffects` — purge transient rows from any
     prior crash.
   - `ListActiveEffects` — for each remaining row, call
     `Start(ctx, effect_id, target)` against the runner. The runner
     re-resolves the target and re-launches from step 0.

4. Document in `runner.go` (top-of-file comment) the design decision:
   loop runs hydrate from step 0 — no mid-step resume. Loops are
   intended to be ambient/idempotent. Wake-up-style loops should not
   be modelled as Effects.

## Tests

- Reboot mid-loop: write a `volatile=0` row pointing at a known
  effect + target, call `Hydrate` against a fresh runner → run is
  active, loop publishes resume.
- Reboot mid-non-loop: write `volatile=1` rows for non-loop / native
  → after `Hydrate`, no active runs and the rows are gone.
- Unique-target constraint: two `Start` calls on the same target
  produce exactly one row in `active_effects`.
- Crash simulation: launch a non-loop run, kill the runner mid-step
  (drop the goroutine), call `Hydrate` → no relaunch, row purged.

## Done when

- `make e2e` green.
- Manual reboot smoke (optional): start a loop in dev, stop the
  backend, restart → loop continues.

## Out of scope

- GraphQL surface (Phase 8).

## Next

Phase 8 — GraphQL surface.
