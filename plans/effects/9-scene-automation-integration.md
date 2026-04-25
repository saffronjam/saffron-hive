# Phase 9 — Scene + automation backend integration

Status: pending. Part 9 of 10. Depends on Phase 8.
Master plan: `~/.claude/plans/that-is-fine-lets-rosy-plum.md`

## Why

Effects are most powerful when they plug into the existing surfaces: a
scene's per-device payload can dispatch an effect (the "fireplace lamp"
use case), and an automation action can fire an effect. This phase
widens both contracts and adds the drift handshake that prevents the
scene watcher from fighting the runner.

## Deliverable

- `scene_device_payloads.payload` accepts `{"kind":"static",...}` or
  `{"kind":"effect","effect_id":"..."}`. Existing rows backfilled.
- Scene apply branches on `kind`: static → publish command (existing
  path), effect → start an effect run on that device.
- Scene watcher disarms drift on devices whose scene-payload is
  effect-kind, for the lifetime of the run.
- Deactivating a scene stops effect runs spawned by that scene
  activation.
- New automation action `run_effect`. Validator + executor branch.

## Files

### New

- `internal/store/migrations/032_scene_payload_kind.up.sql` + `.down.sql`

### Modified

- `internal/scene/apply.go`
- `internal/scene/watcher.go`
- `internal/scene/expected.go` (kind-aware comparison if needed)
- `internal/store/scenes.go` (deserialize tagged payload)
- `internal/automation/action.go` — `ActionRunEffect` const + case
- `internal/automation/validate.go` — config schema for `run_effect`
- `api/schema.graphql` — doc-comment on `SceneDevicePayloadInput`
  describing the widened JSON shape (the field stays `String!`)

## Migration 032

```sql
-- 032_scene_payload_kind.up.sql

UPDATE scene_device_payloads
SET payload = json_insert(payload, '$.kind', 'static')
WHERE json_extract(payload, '$.kind') IS NULL;
```

Idempotent: only writes the `kind` field when missing. Down migration
removes the `kind` field via `json_remove`.

## Implementation

1. Deserializer in `scenes.go` parses `payload` into a tagged struct:

   ```go
   type ScenePayload struct {
       Kind     string       `json:"kind"`
       Static   *StaticState // populated when Kind == "static"
       EffectID string       `json:"effect_id,omitempty"`
   }
   ```

   Custom `UnmarshalJSON` switches on `kind`.

2. `scene.apply.go::BuildApplyCommands`:

   - For `Kind == "static"`, build a `device.Command` (existing logic).
   - For `Kind == "effect"`, return a side-channel "run effect on this
     device" record. The caller (scene activation pathway) calls
     `Runner.Start(ctx, effectID, Target{Type:"device", ID:deviceID})`
     for each.

3. `scene.watcher.go`:

   - Maintain a per-scene set of "devices currently driven by an
     effect spawned for this scene".
   - In `handleDeviceStateChanged`, skip drift comparison for devices
     in that set. Their state is intentionally evolving.
   - Subscribe to `EventEffectStepActivated` (or a dedicated
     `EventEffectEnded` if it makes the bookkeeping cleaner) so the
     watcher knows when a run finishes prematurely.
   - On scene deactivation (manual or by drift on a *static* device),
     iterate the per-scene set and stop those effect runs.

4. `automation.action.go`:

   - `ActionRunEffect = "run_effect"` const.
   - `executeRunEffect(ctx, cfg)` calls `Runner.Start`. The runner's
     own publishes carry `OriginEffect(runID)`; the activity log can
     correlate run → automation via the lineage stored at start time.

5. `automation.validate.go`:

   - For `run_effect`: require `effect_id` exists; `target_type` ∈
     `{device, group, room}`; `target_id` resolves.
   - Soft-warn (do not fail) if any device in a group/room target
     lacks the required caps. Runtime fan-out logs at debug when a
     step is dropped per device.

## Tests

- Scene with mixed static + effect device payloads: activate → command
  published for static, run started for effect; deactivate → effect
  run stops.
- Foreign command on a *static* device drift-deactivates the scene →
  effect runs spawned by that scene also stop.
- Foreign command on a device driven by an effect → that effect run
  stops; scene's other static devices are unaffected.
- Migration up: existing rows gain `"kind":"static"`; idempotent on
  re-run.
- Migration down: `kind` field removed cleanly.
- Automation `run_effect`: validator accepts good config, rejects
  missing `effect_id`, warns (not fails) on incomplete cap coverage.
- e2e: a scene with a fireplace effect on one bulb plus a static state
  on another — activate, observe both, deactivate.

## Done when

- `make e2e` green.
- `make sqlc-check` clean.

## Out of scope

- Frontend (Phase 10).

## Next

Phase 10 — Frontend.
