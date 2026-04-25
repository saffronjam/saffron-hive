# Phase 3 — Capability discovery for `effect`

Status: pending. Part 3 of 10. Independent of Phase 2; can land in
parallel.
Master plan: `~/.claude/plans/that-is-fine-lets-rosy-plum.md`

## Why

Native effects in zigbee2mqtt are exposed via the device's `effect`
enum feature with a `values` list. The current Zigbee discovery code
does not recognise this feature, so Hue's `fireplace`/`candle`/etc. and
the Identify cluster's `breathe`/`blink`/etc. never reach our
`Device.capabilities`. Adding it unblocks every later phase that
targets native effects.

## Deliverable

- `device.CapEffect` constant.
- `internal/adapter/zigbee/discovery.go::knownCapabilities` recognises
  `"effect"` and emits a
  `Capability{Name: CapEffect, Type: "enum", Values: [...]}`.
- All capable bulbs surface the cap through `Device.capabilities`
  automatically (no schema change — `Capability.values` is already
  exposed in GraphQL).

## Files

### Modified

- `internal/device/types.go` — new constant
- `internal/adapter/zigbee/discovery.go` — `knownCapabilities` map
- `internal/adapter/zigbee/discovery_test.go` — new fixtures

### Read

- existing `discovery.go` enum-exposes parsing path
- `api/schema.graphql` — confirm `Capability.values` already exposed

## Implementation

1. Add `CapEffect = "effect"` near the existing `CapOnOff`,
   `CapBrightness`, etc.

2. Add `"effect": device.CapEffect` to the `knownCapabilities` map.

3. Confirm enum parsing emits `Values` from the z2m exposes payload.
   The generic enum-exposes path already supports `values` for other
   features — verify it also picks them up here. If not, add a parse
   step that copies `values: []string` from the raw expose.

4. Do **not** filter terminator names (`stop_effect`, `finish_effect`,
   `stop_hue_effect`) at the capability level. They are valid commands
   and should remain part of the device's reported `values`. Filtering
   for the user-facing picker happens later, in the GraphQL
   `nativeEffectOptions` resolver (Phase 8) and in the frontend
   (Phase 10).

## Tests

- Discovery fixture: a Hue bulb's `bridge/devices` payload — assert
  `effect` cap present with the full Hue effect list including
  terminators.
- Discovery fixture: a generic Identify-only bulb — assert `effect`
  cap present with the standard subset (`blink`, `breathe`, `okay`,
  `channel_change`, `finish_effect`, `stop_effect`).
- Discovery fixture: a non-light device (e.g. switch) — assert no
  `effect` cap.

## Done when

- `make e2e` green.
- Smoke check (optional, not blocker): a real Hue bulb hydrated from a
  live broker shows the `effect` cap in `Device.capabilities`.

## Out of scope

- Triggering the effect (Phase 4).
- Filtering terminators for the picker (Phase 8 and 10).

## Next

Phase 4 — Native-effect event pipeline.
