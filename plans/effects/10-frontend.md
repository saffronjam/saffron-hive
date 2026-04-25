# Phase 10 — Frontend

Status: pending. Part 10 of 10. Depends on all prior phases.
Master plan: `~/.claude/plans/that-is-fine-lets-rosy-plum.md`

## Why

Final phase: surface Effects to the user. New `/effects` library page
(list with cards/table toggle), an edit page that switches body by
kind (timeline editor vs native editor) with a shared Play-mode pane,
and the touchpoints in scene editor / automation action node / device
detail. After this phase the feature is shipped end-to-end.

## Deliverable

- `/effects` route with list page and edit pages (`new`, `[id]`).
- Sidebar entry under the **Action** group.
- Scene editor extension for "Use static state | Run effect".
- Automation action node "Run Effect" picker.
- Device detail "Play effect…" affordance.
- e2e tests covering the golden path for each.

## Files

### New

- `web/src/routes/effects/+page.svelte`
- `web/src/routes/effects/new/+page.svelte`
- `web/src/routes/effects/[id]/+page.svelte`
- `web/src/lib/components/effect-timeline-editor.svelte`
- `web/src/lib/components/effect-native-editor.svelte`
- `web/src/lib/components/effect-play-pane.svelte`
- `web/src/lib/effect-editable.ts` — domain helpers (mirror
  `scene-editable.ts`)
- `web/e2e/effects.test.ts`

### Modified

- `web/src/lib/components/app-sidebar.svelte` — sidebar entry
- `web/src/lib/components/scene-editor.svelte` — payload mode switch
- `web/src/lib/scene-editable.ts` — `ActionPayload` discriminator
- `web/src/routes/scenes/[id]/+page.svelte` — wire effect picker into
  the scene drawer
- `web/src/lib/components/graph/action-node.svelte` — add "Run Effect"
- `web/src/lib/automation-config.ts` — `actionKind` recognises
  `run_effect`
- `web/src/routes/devices/[id]/+page.svelte` — "Play effect…" button

## List page (mirror `/scenes/+page.svelte`)

- Cards via `EntityCard` and `AnimatedGrid`. List view via `ListView`
  toggle persisted to `profile.listView`.
- Card content: icon, name, kind chip (only on `native` — muted
  styling), required-cap chips, Play button.
- Top-right "New" button → drawer with kind picker → routes to
  `/effects/new?kind=...`.
- Operations: `EFFECTS_QUERY`, `CREATE_EFFECT`, `UPDATE_EFFECT`,
  `DELETE_EFFECT`, `RUN_EFFECT`, `STOP_EFFECT`.

## Edit page

Shared chrome (header, save bar, target picker, play controls). Body
switches by kind.

### Timeline editor (`effect-timeline-editor.svelte`)

- Horizontal step row in a flex container. Cards drag-reorder. `+`
  between cards inserts a new step (type picker pops).
- Per-step inline editor:
  - `wait`: ms input, min 50.
  - `set_on_off`: toggle + transition (ms).
  - `set_brightness`: slider 0–254 + transition.
  - `set_color_rgb`: color picker (RGB, hex input that converts) +
    transition.
  - `set_color_temp`: mireds slider + transition.
- Loop toggle. When `loop=true`, append a non-deletable trailing wait
  card (default 200 ms, min 50). When `loop=false`, remove it.
- Required-caps panel computed live from steps; updates as steps
  change.

### Native editor (`effect-native-editor.svelte`)

- Name + icon.
- Native-effect dropdown sourced from `nativeEffectOptions`.
  Sentence-cased labels. Terminator names already filtered server-side.
- Live "supported on N devices" count from the option's
  `supportedDeviceCount`.

### Play-mode pane (`effect-play-pane.svelte`)

- Target picker filtered by required-caps (devices missing caps are
  disabled with a tooltip).
- Play / Stop buttons.
- Current-step indicator: timeline editor visually highlights the
  active step (pulse animation matching automation graph
  node-activation pattern).
- Subscribes to `effectStepActivated(runId)` via
  `client.subscription().subscribe()` with `onDestroy` teardown — copy
  pattern from `web/src/routes/automations/[id]/+page.svelte`.

## Scene editor extension

- Per-device payload row in `scene-editor.svelte` gets a segmented
  control: "Static state" / "Run effect".
- Effect mode swaps the inline state controls for an effect picker
  (drawer; pattern from existing scene drawer).
- Effect list filtered by *this device's caps*.
- `lib/scene-editable.ts::ActionPayload` becomes a discriminated
  union:

  ```ts
  type ActionPayload =
    | { kind: "static"; on?: boolean; brightness?: number; ... }
    | { kind: "effect"; effectId: string };
  ```

## Automation action node

- `actionTypes` in `action-node.svelte` adds
  `{ value: "run_effect", label: "Run Effect" }`.
- Conditional UI for `run_effect`: effect drawer + target drawer
  (target picker reuses the scenes' component).
- `lib/automation-config.ts::actionKind` returns `"run_effect"` for
  that config shape; add `referencedEffectIds` helper mirroring
  `referencedSceneIds`.

## Device detail "Play effect…" button

- Below existing controls on `devices/[id]/+page.svelte`.
- Opens an effect picker filtered by this device's caps.
- Selecting calls `runEffect` with `targetType: "device"`. Toast on
  success. Stop button shown if currently running on this device.

## Tests (e2e — `web/e2e/effects.test.ts`)

- Create timeline effect (red → wait → blue → wait, loop on), save,
  run on a device, observe steps fire, stop.
- Create native effect (Fireplace), run on a Hue-capable fixture
  device.
- Toggle loop on/off in editor → trailing wait card appears /
  disappears.
- Add an effect-mode device to a scene → activate → effect runs →
  deactivate → effect stops.
- Automation with `run_effect` action → trigger → effect starts.
- Device detail "Play effect…" → effect runs.

## Verification — manual smoke

After merge, walk the master plan's end-to-end smoke:

1. Sidebar → Effects → New → Timeline. Build red/wait/blue/wait, loop
   on. Save. Pick a colour bulb. Play.
2. Stop.
3. Native Fireplace on Hue. Play.
4. Scene with one effect-mode device + one static. Activate.
   Deactivate.
5. Automation Action node Run Effect. Trigger.
6. Restart backend. Loop ramp resumes (from step 0). Native effect
   does not.

## Done when

- `make e2e` green (Go + TS).
- Manual smoke passes for all six steps.
- No TypeScript or oxlint errors.

## Out of scope

- The v2 `trigger_native_effect` step inside a timeline (shelved at
  `plans/layer-6/15-effects-native-as-timeline-step-v2.md`).
- Mid-step resume on reboot (explicitly chosen against in v1).
- Vendor-specific extra effect catalogs beyond what zigbee2mqtt
  exposes.
