# Phase 5 — Effect runner (timeline, single-target, no loop)

Status: pending. Part 5 of 10. Depends on Phases 1, 2, 4.
Master plan: `~/.claude/plans/that-is-fine-lets-rosy-plum.md`

## Why

This is the core engine. It walks a timeline Effect's steps over time,
publishing through the existing command pipeline. This phase keeps it
minimal: single-device targets only (group/room expansion is Phase 6),
no loop (Phase 6), no persistence (Phase 7). Everything in-memory; the
runtime substrate is the focus.

## Deliverable

- `internal/effect/runner.go` with a `Runner` registry + per-run
  goroutine.
- `Runner.Start(ctx, effectID, target) (runID, error)` and
  `Runner.Stop(target)`.
- Steps publish `EventCommandRequested` with `OriginEffect(runID)`.
- Consecutive non-`wait` `set_*` steps coalesce into one
  `device.Command` (single MQTT publish).
- Conflict policy: starting B on a target that has A running preempts A
  *transactionally*; A's pending publishes do not leak.
- Native-kind effects: `Start` publishes a single
  `NativeEffectRequest`; preempting a native run publishes the
  appropriate terminator (via the Phase 4 helper) before the new run
  begins.
- `EventEffectStepActivated{RunID, EffectID, StepIndex, Active}`
  emitted around every step (active=true on enter, active=false on
  exit) for the live-UI subscription Phase 8 will surface.

## Files

### New

- `internal/effect/runner.go`
- `internal/effect/runner_test.go`

### Modified

- `internal/eventbus/eventbus.go` — `EventEffectStepActivated`
  constant + payload type

## Implementation

1. Runner shape:

   ```go
   type Runner struct {
       mu      sync.Mutex
       active  map[targetKey]*activeRun
       bus     eventbus.Publisher
       targets device.TargetResolver
       store   store.EffectStore
       term    NativeEffectStopper // small interface for terminator lookup
   }

   type activeRun struct {
       runID  string
       effect effect.Effect
       target Target
       cancel context.CancelFunc
   }

   type targetKey struct{ Type, ID string }
   ```

2. `Start(ctx, effectID, target)`:

   - Acquire `mu`.
   - If `active[target]` exists, capture its record and overwrite the
     slot with the new run record (transactional preempt).
   - Release `mu`.
   - For the preempted run: cancel its ctx; if it was a native run,
     publish its terminator via `term.TerminatorFor(...)`.
   - For the new run: spawn the worker goroutine.
   - Return `runID`.

3. Worker goroutine for a timeline effect:

   - Walk `Steps` in order:
     - `wait`:
       `select { case <-ctx.Done(): return; case <-time.After(d): }`.
     - non-`wait` `set_*`: build a partial `device.Command` from the
       step's config. *Coalesce*: if the next step is also non-`wait`
       `set_*`, merge its fields into the current command and advance
       the cursor without publishing yet. Continue until the next step
       is a `wait` or end-of-list, then publish.
     - Stamp `Origin = OriginEffect(runID)` on the published command.
   - Emit `StepActivated{Active: true}` *before* each publish, then
     `Active: false` *after*.
   - For non-loop, return at end of list. Cleanup unregisters from
     `active`.

4. Worker for a native effect:

   - Single publish of `EventNativeEffectRequested` with origin.
   - Emit `StepActivated{StepIndex: 0, Active: true}` then immediately
     `Active: false`.
   - No further work; the bulb owns the animation.
   - `Stop(target)` for a native run publishes the terminator.

5. `Stop(target)`:

   - Acquire `mu`. Pop `active[target]`. Release.
   - Cancel ctx; if native, publish terminator.

6. The runner publishes `EventCommandRequested` with origin set. The
   adapter (unchanged) receives it. The runner does **not** consult
   `stateMatches` — that gating logic lives only in
   `automation.executeSetDeviceState` and is intentionally bypassed for
   runner publishes (sequencing must not be skipped because the device
   is "already" at a value). Document this in a comment near the
   publish call.

## Tests

- Conflict: A=loopless 3-step timeline; B starts on same target after
  step 1 → A's remaining steps are not published; B's first step is.
- Preempt mid-publish does not leak: assert no publishes from A after
  `Stop` returns.
- Coalescing: `set_color_rgb` immediately followed by `set_brightness`
  (no wait between) → exactly one MQTT publish containing both fields.
- ctx cancellation cleans up: 1000-iteration start/stop loop; goroutine
  count stable.
- No self-stop on echo: simulate `EventDeviceStateChanged` arriving
  with `Origin = OriginEffect(runID)` → runner does not stop. (Drift
  detection wires in Phase 6, but the test fixture starts here.)
- Native effect: `Start(native)` → adapter sees one publish; `Stop` →
  adapter sees terminator.
- Native preempt: A=Hue fireplace, B=any → adapter sees
  `stop_hue_effect` before B's first publish.

## Done when

- `make e2e` green.
- Goroutine count stable across 1000 start/stop cycles.

## Out of scope

- Group/room targets (Phase 6).
- Loop (Phase 6).
- Persistence / reboot (Phase 7).
- GraphQL surface (Phase 8).

## Next

Phase 6 — Loop, group/room expansion, drift detection.
