# Effects v2 — native effects as a timeline step

Status: shelved, post-MVP. Not blocked on anything; pick up when v1 is in
production and we have a clear power-user request for it.

## The idea

In v1, `Effect.kind` is either `timeline` (our orchestrated chain) or
`native` (passthrough wrapper around a device's built-in effect). They sit
side-by-side in the library and do not compose.

v2 adds a new step kind to the timeline editor:

- `trigger_native_effect` — config: `{native_name}`. Required capability:
  `effect` with `native_name` present in `values`.

This lets a user mix native effects into an orchestrated timeline:

```
set_color_rgb(255,0,0, 0.2s) -> wait(2s) -> trigger_native_effect("breathe")
  -> wait(5s) -> trigger_native_effect("stop_effect")
  -> set_color_rgb(0,0,255, 0.5s) -> wait(3s)
```

## Why this works cleanly as a v2 add

- Domain already has both concepts (timeline steps + native effect names),
  so nothing new at the type-system level.
- Required-caps derivation already unions per-step caps; adding the
  `effect`-with-value variant is a one-line change to the cap union logic.
- Editor already renders a row of typed step cards; one new card type.
- Runner already publishes commands per step; the native trigger is a
  one-shot publish like any other.

## Caveats to remember when picking it up

- Native effects are fire-and-forget. The runner has no completion event,
  so a `trigger_native_effect` step finishes the moment the publish
  returns. The user must follow it with an explicit `wait` if they want
  the effect to play out before the next step.
- A group target with mixed-vendor devices will fail the cap check on
  the native step. Either reject at save-time (cleanest) or surface a
  per-device skip at run-time. Probably former — match the rest of the
  required-caps story.
- No equivalent of `stop_effect` is needed inline; the runner's normal
  "starting a new effect on this target stops the previous one" rule
  already issues `stop_effect` before the next state command.

## Trigger to pick this up

Real user asks for it (e.g. "I want a candle effect that fades in over
2s, runs for 30s, then fades out"). Until then, two top-level kinds is
the simpler mental model.
