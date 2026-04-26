# Effects v2 — multi-track timeline editor

## Context

The v1 Effects feature shipped a strictly sequential editor: a horizontal
list of "step cards" with implicit `wait` steps inserting silence
between operations. User testing surfaced that this model can't express:

- **Concurrent operations.** Brightness ramping while color shifts in
  parallel.
- **Randomness.** Variable transition times within a [min, max] range
  for organic-looking flicker / breathing effects.
- **Visual time.** Users can't see how long an effect actually takes;
  there's no time scale.

v2 replaces the editor and the underlying data model with a
**multi-track timeline**. Tracks are generic ordered containers; clips
sit at absolute timestamps; clips on parallel tracks fire in parallel;
empty space between clips means "no command." The `wait` step kind
disappears entirely. Loop boundary is a draggable End line on the
timeline, not a numeric field.

This is a clean rewrite of the editor + runner scheduler + persistence
schema. Per the project's "rewrite, don't wrap" rule, the v1 step
model is replaced wholesale; existing `effect_steps` rows are migrated
into single-track `effect_clips` rows on the way.

## Settled design decisions (recorded for future-you)

- **Tracks are generic block containers.** Any clip kind can go in any
  track. No track-type constraint. User can add/remove tracks freely.
- **Clips are absolute.** Each clip stores `startMs` (offset from
  effect start), `transition_min_ms`, `transition_max_ms`, `kind`,
  and a kind-specific `config`. No "previous keyframe" lineage.
- **Width = `transition_max_ms`.** Visual block width represents the
  maximum time the clip *could* take. Random transitions (min < max)
  sample once per clip-execution at runtime. v2 stores both bounds and
  publishes the sampled value via Zigbee's `transition` parameter.
  Random visual indication is deferred (just a cosmetic ghost overlay
  later) — the data model captures the randomness.
- **No coalescing in v2.** Each clip publishes one MQTT command at its
  `startMs`. If two clips on parallel tracks fire at the same time for
  the same device, both commands hit the bulb; firmware does
  last-writer-wins. Defer cross-track coalescing optimization.
- **`wait` is gone.** Empty space between clips on a track = no command
  during that time. The bulb holds whatever value it already has.
- **Loop boundary = draggable End line.** Loop ON renders a vertical
  line on the timeline. Default position: rightmost clip end + 200 ms.
  Constraints: cannot drag left of any clip's right edge; clips
  cannot be created or extended past it. Inter-loop delay is the
  visible gap between the rightmost clip and the End line — implicit,
  with a small numeric label on the line ("End — 350 ms gap").
- **Default zoom = fit-to-viewport** with ~5–10% margin. Manual
  Ctrl+wheel zoom-to-cursor available.
- **Min visual width on clips:** ~30 px floor regardless of zoom or
  `transition_max_ms`. Keeps zero-duration set-on-off clips grabbable.
  Stored value is unchanged; only display floored.
- **Within a track, clips are mutually exclusive in time.** No
  overlapping clips on the same track. The editor enforces this on
  drag/place; the validator enforces on save.
- **Native effect triggers can be clips too.** This subsumes the
  shelved v2 step kind from `plans/layer-6/15-effects-native-as-timeline-step-v2.md`.
  A `native_effect` clip fires `EventNativeEffectRequested` at its
  `startMs`. Clip `transition_max_ms` is the user's guess at the
  effect's runtime (no real ramp; the bulb owns it).

## Architecture

### Data model

#### Domain types (`internal/effect/types.go`)

Replace `Step` / `StepKind` with `Track` / `Clip` / `ClipKind`.

```go
type Effect struct {
    ID, Name, Icon string
    Kind           Kind   // {timeline, native} — unchanged; user-created always timeline today
    NativeName     string // for KindNative only
    Loop           bool
    DurationMs     int    // for Loop=true: explicit loop length (End line position)
                          // for Loop=false: derived = max clip end across tracks at marshal time
    Tracks         []Track
    CreatedBy      string
    CreatedAt, UpdatedAt time.Time
}

type Track struct {
    ID    string
    Index int    // ordering within Effect.Tracks
    Clips []Clip
}

type Clip struct {
    ID              string
    StartMs         int
    TransitionMinMs int
    TransitionMaxMs int   // visual width = TransitionMaxMs * pxPerMs
    Kind            ClipKind
    Config          ClipConfig
}

type ClipKind string
const (
    ClipSetOnOff      ClipKind = "set_on_off"
    ClipSetBrightness ClipKind = "set_brightness"
    ClipSetColorRGB   ClipKind = "set_color_rgb"
    ClipSetColorTemp  ClipKind = "set_color_temp"
    ClipNativeEffect  ClipKind = "native_effect"
)

type ClipConfig struct {
    SetOnOff      *SetOnOffClipConfig      `json:",omitempty"`
    SetBrightness *SetBrightnessClipConfig `json:",omitempty"`
    SetColorRGB   *SetColorRGBClipConfig   `json:",omitempty"`
    SetColorTemp  *SetColorTempClipConfig  `json:",omitempty"`
    NativeEffect  *NativeEffectClipConfig  `json:",omitempty"`
}

type SetOnOffClipConfig      struct { Value bool }
type SetBrightnessClipConfig struct { Value int }
type SetColorRGBClipConfig   struct { R, G, B int }
type SetColorTempClipConfig  struct { Mireds int }
type NativeEffectClipConfig  struct { Name string }
```

Note `transition_*_ms` is on the `Clip`, not in `Config`. It's
meaningful for every clip kind (including `native_effect` where it
just controls visual width and possibly sets a clip-end deadline for
follow-up clips).

#### Persistence schema (migration `033_effects_tracks_clips`)

```sql
-- 033_effects_tracks_clips.up.sql

CREATE TABLE effect_tracks (
    id          TEXT PRIMARY KEY,
    effect_id   TEXT NOT NULL REFERENCES effects(id) ON DELETE CASCADE,
    track_index INTEGER NOT NULL,
    UNIQUE(effect_id, track_index)
);

CREATE TABLE effect_clips (
    id                  TEXT PRIMARY KEY,
    track_id            TEXT NOT NULL REFERENCES effect_tracks(id) ON DELETE CASCADE,
    start_ms            INTEGER NOT NULL,
    transition_min_ms   INTEGER NOT NULL DEFAULT 0,
    transition_max_ms   INTEGER NOT NULL DEFAULT 0,
    kind                TEXT NOT NULL,
    config              TEXT NOT NULL,
    CHECK (transition_min_ms >= 0),
    CHECK (transition_max_ms >= transition_min_ms),
    CHECK (start_ms >= 0)
);

CREATE INDEX idx_effect_clips_track ON effect_clips(track_id);

ALTER TABLE effects ADD COLUMN duration_ms INTEGER NOT NULL DEFAULT 0;

-- Migrate existing effect_steps -> single-track effect_clips per effect.
-- Cumulative wait + transition = startMs. Wait steps absorbed as gaps.
-- Done via a Go-side one-shot migration (see Phase 1) because the JSON
-- step config needs parsing. The SQL migration creates the empty tables
-- and the duration_ms column; the Go boot-time migration backfills.

DROP TABLE effect_steps;
```

A SQL-only migration of `effect_steps → effect_clips` would be brittle
(JSON parsing, cumulative time computation). Instead: the SQL migration
creates the new tables and drops the old one in a single transaction;
data migration runs as a Go-side one-shot routine *before* the SQL
DROP. Order:

1. SQL migration `033` creates `effect_tracks` and `effect_clips`,
   adds `duration_ms` column to `effects`. Does NOT yet drop
   `effect_steps`.
2. Go-side migration helper `MigrateEffectStepsToTracks(ctx)` runs at
   boot if any rows exist in `effect_steps`. Reads each effect's
   steps in order, computes cumulative startMs (sum of prior wait
   `duration_ms` + prior non-wait `transition_ms`), creates one
   `effect_tracks` row per effect, and one `effect_clips` row per
   non-wait step. Wait steps are absorbed into gaps (their duration
   is added to subsequent clips' startMs, then they vanish). For
   each effect, sets `effects.duration_ms` to `max(clip.startMs +
   clip.transitionMaxMs)` plus a default 200 ms loop tail if `loop=1`.
3. After migration completes successfully, a follow-up SQL migration
   `034_drop_effect_steps.up.sql` drops the now-empty `effect_steps`
   table.

This avoids partial states and keeps the migration reversible during
development. (The user manages git/commits — they may collapse 033 and
034 if they prefer a single non-reversible boot-time migration.)

#### sqlc queries (`internal/store/queries/effects.sql`)

Replace `effect_steps` queries (`ListEffectSteps`,
`SaveEffectSteps`, etc.) with track + clip queries. Keep the named-
arg / upsert patterns. No em-dashes in comments.

Suggested new queries:
- `ListEffectTracks` (by effect_id, ordered by track_index)
- `ListEffectClips` (by track_id, ordered by start_ms)
- `ReplaceEffectTracksAndClips` (atomic: delete old tracks for effect,
  bulk insert new tracks + their clips). Implementation lives at the
  store-method level since it spans two tables in a transaction —
  same pattern as `SaveEffectSteps` today.
- `UpdateEffectDuration`

`*store.DB.LoadEffect` (the domain-typed loader) updates to assemble
`Effect.Tracks` from the new tables.

### Runtime (`internal/effect/runner.go`)

The runner's public surface is unchanged: `Start(ctx, effectID, target)`,
`Stop(target)`, `StartNative(...)`, `Hydrate(ctx)`, `Run(ctx)`. The
internals change.

**Scheduler rewrite.** The current worker walks `Steps` in order and
sleeps between them. The new worker walks a *flat sorted event list*
derived from all clips across all tracks:

```go
type scheduledEvent struct {
    StartMs int
    Clip    Clip
}

events := make([]scheduledEvent, 0)
for _, t := range eff.Tracks {
    for _, c := range t.Clips {
        events = append(events, scheduledEvent{c.StartMs, c})
    }
}
sort.Slice(events, func(i, j int) bool { return events[i].StartMs < events[j].StartMs })
```

Worker loop:
```go
for {
    if err := ctx.Err(); err != nil { return }
    iterStart := time.Now()
    for _, ev := range events {
        select {
        case <-ctx.Done(): return
        case <-time.After(time.Until(iterStart.Add(time.Duration(ev.StartMs) * time.Millisecond))):
        }
        publishClip(ev.Clip, runID, target)  // sample transition_ms, build Command, publish
    }
    if !eff.Loop { return }
    // Inter-loop delay: sleep until iterStart + DurationMs
    select {
    case <-ctx.Done(): return
    case <-time.After(time.Until(iterStart.Add(time.Duration(eff.DurationMs) * time.Millisecond))):
    }
}
```

`publishClip` samples `transition_ms = rand.IntN(max-min+1) + min` (or
just `min` when `min == max`), builds the appropriate `device.Command`
or `device.NativeEffectRequest`, stamps `OriginEffect(runID)`, and
publishes via the existing event bus.

**Capability fan-out** (group/room targets) stays. The existing
`device.FilterCommandFields` per-device filter applies at publish time
just like today.

**Drift detection** (Phase 6 origin-aware) stays unchanged. The
runner's drift goroutine watches `EventCommandRequested` for foreign
origins on devices it owns. The flat-event model doesn't change drift.

**Native preempt + terminator** stays. `Stop` and conflict-with-preempt
publish terminators for native runs.

**Coalescing intentionally dropped for v2.** If the broker complains,
add it back as a pre-publish merge pass over events with the same
`StartMs` and same target device. Easy to layer on top later.

### GraphQL surface (`api/schema.graphql`)

Replace effect-related types:

```graphql
type Effect {
  id: ID!
  name: String!
  icon: String
  kind: EffectKind!
  nativeName: String
  loop: Boolean!
  durationMs: Int!
  tracks: [EffectTrack!]!
  requiredCapabilities: [String!]!
  createdBy: User
  createdAt: Time!
  updatedAt: Time!
}

type EffectTrack {
  id: ID!
  index: Int!
  clips: [EffectClip!]!
}

type EffectClip {
  id: ID!
  startMs: Int!
  transitionMinMs: Int!
  transitionMaxMs: Int!
  kind: EffectClipKind!
  config: String!  # JSON, kind-specific
}

enum EffectClipKind {
  SET_ON_OFF
  SET_BRIGHTNESS
  SET_COLOR_RGB
  SET_COLOR_TEMP
  NATIVE_EFFECT
}

input CreateEffectInput {
  name: String!
  icon: String
  kind: EffectKind!
  nativeName: String
  loop: Boolean!
  durationMs: Int!
  tracks: [EffectTrackInput!]!
}

input UpdateEffectInput {
  id: ID!
  name: String
  icon: String
  loop: Boolean
  durationMs: Int
  tracks: [EffectTrackInput!]
}

input EffectTrackInput {
  clips: [EffectClipInput!]!
}

input EffectClipInput {
  startMs: Int!
  transitionMinMs: Int!
  transitionMaxMs: Int!
  kind: EffectClipKind!
  config: String!
}
```

`EffectStep`, `EffectStepKind`, `EffectStepInput` are deleted.
`requiredCapabilities` continues to be derived (now from clip kinds
across all tracks).

### Frontend (`web/src/`)

#### Domain helpers (`web/src/lib/effect-editable.ts`)

Replace `EditableStep` with `EditableTrack` + `EditableClip`. Lift the
existing patterns:

```ts
type EditableTrack = {
  uid: string;
  clips: EditableClip[];
};

type EditableClip = {
  uid: string;
  startMs: number;
  transitionMinMs: number;
  transitionMaxMs: number;
  kind: ClipKind;
  config: ClipConfig;
};
```

Helpers:
- `defaultClipConfig(kind)` — initial values per kind.
- `parseClipConfig(kind, raw)` / `stringifyClipConfig` — JSON
  round-trip.
- `effectToEditable(effect)` / `editableToInput(...)` — domain ↔
  GraphQL.
- `computeRequiredCapabilities(tracks)` — union over clip kinds.
- `validateTimelineEffect(name, durationMs, loop, tracks)` — non-empty
  name, non-negative durations, no overlapping clips within a track,
  no clip extending past `durationMs` when loop=true.

#### Timeline editor (`web/src/lib/components/effect-timeline-editor.svelte`)

Rewrite. Component owns:
- Track header column on the left (track index, "remove track" button).
- Ruler bar at the top with auto-scaling ticks based on `pxPerMs`.
- Track grid: each track is an absolutely-positioned row of clips.
- Add-track button below the last track.
- Loop toggle (delegated up to the page).
- End line (when loop=true): vertical drag-handle line at
  `durationMs * pxPerMs`, with a label showing the gap from the
  rightmost clip end.
- Zoom controls: + / − buttons, "Fit" button. Ctrl+wheel zoom-to-cursor.
- Per-clip editor opens in a popover or inline panel below the clip
  on click (value picker + transition min/max sliders/inputs).

Rendering: HTML/CSS, `position: absolute` per clip, no canvas. Our
scale (handful of tracks, few dozen clips total) does not need
canvas-level optimization.

Behaviours:
- **Drag clip horizontally** within its track: updates `startMs`.
- **Drag clip vertically across tracks**: moves to a different track
  (insert if out-of-bounds creates a new track; or just clamps).
- **Drag right-edge handle**: updates `transitionMaxMs`. If
  `transitionMinMs` is in lock-step (default), it tracks `max`.
- **Random transition toggle** on the clip popover: when enabled,
  exposes a separate `transitionMinMs` slider.
- **Snap**: to ruler ticks, to other clip edges (within the same
  track), to the End line. Snap-to-visible only.
- **Min visual width** of 30 px regardless of `transitionMaxMs`.
- **No-overlap constraint** within a track: editor refuses to drop a
  clip onto another clip's range; visual feedback (red drop shadow).

#### Edit page (`web/src/routes/effects/[id]/+page.svelte`)

Update to consume the new types. Save mutation passes
`tracks: [...]` instead of `steps: [...]`. Otherwise the page chrome
stays identical.

#### List page (`web/src/routes/effects/+page.svelte`)

No structural change. Card subtitle still derives from the effect
metadata. The "Loop · N steps" subtitle becomes "Loop · N tracks · M
clips" or simply "Loop" / "Once" — pick during implementation.

#### Scene editor + automation action node

These reference effects by `id` only. No UI change required; but the
references still validate at save time. The validator `internal/graph/
helpers.go::validateRunEffectActions` checks effect existence — that
stays.

## Phasing

Per the master pattern from `plans/effects/`, this redesign should
land as several PR-sized phases. Suggested split, all backend before
frontend so the GraphQL contract is stable when the editor is built:

1. **Schema + data migration (1 PR).** Migration `033`, Go-side
   `MigrateEffectStepsToTracks`, follow-up migration `034` dropping
   `effect_steps`. Updated `*store.DB.LoadEffect` returning the new
   domain types. Tests: round-trip CRUD, migration converts a fixture
   set of v1 effects into expected v2 shape.

2. **Domain types + runner rewrite (1 PR).** Replace `effect.Step` with
   `effect.Track` / `effect.Clip`. Rewrite `Runner` scheduler to walk
   a flat sorted event list. Random transition sampling.
   `runtime.RequiredCapabilities` derived from clip kinds. `Hydrate`
   continues to relaunch loop=true rows from t=0. Tests: runner conflict
   matrix + drift detection (re-run the existing tests against the new
   types), random transition reproducibility (seeded RNG), parallel
   tracks publish independent commands at correct times,
   capability-mismatch fan-out unchanged.

3. **GraphQL surface (1 PR).** Replace `EffectStep` with
   `EffectTrack` / `EffectClip`, regenerate gqlgen + graphql-codegen,
   update validators. Tests: resolver round-trips for create / update,
   `requiredCapabilities` computed correctly.

4. **Frontend rewrite (1 PR — large).** Rewrite
   `effect-timeline-editor.svelte` as the multi-track editor. Update
   `effect-editable.ts` and the edit page. List page card subtitles.
   Tests: web unit tests for `effect-editable.ts` helpers
   (effectToEditable round-trip, validateTimelineEffect cases).
   Manual smoke for editor behaviour.

5. **(Optional) Random transition visualisation polish.** A subtle
   ghost overlay on the right portion of a clip when
   `transition_min_ms < transition_max_ms`, indicating the uncertain
   range. Defer to its own PR; not blocking v2 ship.

## Critical files

### New

- `internal/store/migrations/033_effects_tracks_clips.up.sql` + `.down.sql`
- `internal/store/migrations/034_drop_effect_steps.up.sql` + `.down.sql`
- `internal/effect/migrate.go` — Go-side `MigrateEffectStepsToTracks`
- (rewrite) `web/src/lib/components/effect-timeline-editor.svelte` —
  full replacement, not a diff

### Modified

- `internal/effect/types.go` — replace `Step`/`StepKind` with
  `Track`/`Clip`/`ClipKind`. Update marshal/unmarshal.
- `internal/effect/runner.go` — rewrite scheduler; keep public surface
- `internal/effect/required_caps.go` — derive from clips
- `internal/store/queries/effects.sql` — replace step queries with
  track + clip queries
- `internal/store/effects.go` — `LoadEffect` assembles tracks/clips;
  new save method `SaveEffectTracks(ctx, effectID, tracks)`
- `api/schema.graphql` — replace step types with track/clip types
- `internal/graph/effect.resolvers.go` — update mappers + validation
- `internal/graph/schema.resolvers.go` — `CreateEffect`/`UpdateEffect`
  now accept tracks
- `internal/graph/helpers.go` — validator updates
- `web/src/lib/effect-editable.ts` — replace `EditableStep` with
  `EditableTrack`/`EditableClip` + helpers
- `web/src/routes/effects/[id]/+page.svelte` — consume new types
- `web/src/routes/effects/+page.svelte` — card subtitle update only
- `web/src/lib/gql/*` — graphql-codegen regen
- `internal/graph/generated.go`, `internal/graph/model/models_gen.go` —
  gqlgen regen
- `cmd/serve/serve.go` — call `MigrateEffectStepsToTracks` at boot,
  before scene watcher / effect runner Hydrate

### Deleted

- `effect_steps` table (in migration 034)
- All `Step`-suffixed types and helpers in `effect-editable.ts`
- `effect.StepKind`, `effect.Step`, `effect.StepConfig`

## Reuse

- `internal/eventbus/eventbus.go::EventEffectStepActivated` — repurpose
  for clip-level activation. The subscription contract on the frontend
  is per-runID, indifferent to the underlying step/clip change. The
  payload's `stepIndex` field becomes a flat clip ordinal (sort by
  `startMs`) for backward compat, or rename to `clipIndex` if cleanly
  feasible.
- `internal/effect/runner.go::Runner.preempt`, `Stop`, native
  terminator dispatch, drift goroutine — all stay.
- `internal/effect/runner.go::Runner.Hydrate` — stays; it just
  re-launches loop runs which now use the new scheduler.
- `web/src/lib/components/effect-run-target-drawer.svelte` — unchanged.
  It runs effects by ID; the new schema doesn't change the run path.
- `web/src/lib/components/hive-chip.svelte` — capability chips keep
  the v1.x sentence-cased + HiveChip styling work from the most
  recent UX-fix pass.
- `web/src/lib/components/number-input.svelte` (new from the recent
  UX-fix pass) — used for the per-clip transition min/max inputs in
  the popover. Keeps the buffered-string idiom consistent.

## Verification

After every phase:

- `make sqlc-check`
- `cd web && bun run check`
- `cd web && bun run build`
- `cd web && bun run test`
- `make e2e` (Go + TS)

After the full v2 ships, manual smoke:

1. Open `/effects/<id>` for an effect that existed pre-v2 (i.e. one
   that was migrated from `effect_steps`). Verify it renders as a
   single-track timeline with the same clip count as the original
   non-wait step count, with `startMs` reflecting the absorbed waits.
2. Add a second track. Add a brightness clip on it overlapping the
   first track's color clip. Save. Run on a colour-capable bulb. Both
   commands fire at their respective `startMs`; bulb visibly transitions
   color and brightness in parallel.
3. Toggle Loop ON. End line appears with a default 200 ms gap to the
   rightmost clip. Drag the End line right; gap label updates. Save,
   run, observe the inter-loop delay equals the dragged gap.
4. Configure a clip's transition with a randomness range (min=200,
   max=1000). Run multiple loop iterations. Each iteration's transition
   is visibly different (within bounds).
5. Verify the editor's fit-to-viewport on load: open an effect with a
   total duration of 8 s; it fits in the viewport with a small margin.
6. Verify Ctrl+wheel zoom-to-cursor: zoom to 1 ms-per-px scale, then
   back out to fit. Clips and ruler reflow correctly.

## Out of scope (deferred)

- **Cross-track coalescing.** If MQTT broker / Zigbee mesh complains
  about high command rates from parallel tracks, add a pre-publish
  merge pass: clips at the same `startMs` for the same target device
  with non-conflicting fields fold into one MQTT publish. Layer on
  top of v2; not architectural.
- **Random visual indication** beyond the data model. A ghost overlay
  showing the [min, max] uncertainty range on a clip's right edge.
  Cosmetic.
- **Random value (not just transition) per clip.** E.g. brightness
  randomly between 100 and 200 per loop. Plausible v3 — same pattern
  applied to value config fields. Not v2.
- **Snap config (interval, on/off toggle).** v2 hard-codes snap to
  ruler ticks + clip edges + End line, snap-to-visible. User-facing
  config later if asked.
- **Clip copy/paste, undo/redo.** Editor v2 is single-action edits
  only. Multi-select + copy/paste is later.
- **Track headers / per-track mute / per-track lock.** v2 tracks have
  no header beyond an index and a remove button. DAW-style mute/solo
  is later if useful.
- **Migration rollback story.** The 033/034 split allows reverting to
  v1 at the cost of losing v2-only data. Past 034 (drop), there's no
  reverse. Acceptable since user manages git and the project has no
  external production deployment yet.

## Risks worth knowing

- **MQTT command rate.** Parallel tracks fan-out can produce many
  commands at the same `startMs`. Today's broker handles ~10 cmd/s per
  device comfortably; bursty peaks are fine. Stress test during
  Phase 4 manual smoke with a 4-track effect on a single device, all
  starting at t=0 — confirm no broker errors / no command drops.
- **Migration correctness.** v1 cumulative-time conversion has one
  subtle edge case: a leading wait step (effect starts with a wait).
  Current model: that's a delay before the first command. v2 model:
  that's `startMs > 0` on the first clip. Handle by accumulating wait
  durations before the first non-wait step and applying as the first
  clip's `startMs`. Cover in migration tests with a fixture that has
  a leading wait.
- **`requiredCapabilities` change.** Today derived per-step in
  `RequiredCapabilities()`. New: per-clip across all tracks. Result
  set should be identical (union of step kinds → clip kinds), but
  a regression here breaks scene/automation cap-filtered pickers.
  Cover with a unit test: effect with one of each clip kind →
  required caps = `{on_off, brightness, color, color_temp}`.
- **EventEffectStepActivated payload field name.** v1 uses
  `stepIndex`. If we rename to `clipIndex`, the frontend subscription
  consumer needs updating in lockstep. If we keep `stepIndex` and
  semantically interpret it as "ordinal of the current event in the
  flat-sorted list," we don't break the subscription. Pragmatic choice:
  keep the field name, document the new meaning in the schema comment.
