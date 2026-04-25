# Phase 4 — Native-effect event pipeline

Status: pending. Part 4 of 10. Depends on Phase 1 (origin) and Phase 3
(`effect` capability surfacing).
Master plan: `~/.claude/plans/that-is-fine-lets-rosy-plum.md`

## Why

Native effects are *actions*, not state. Modelling them as a field on
`device.Command` would muddy the contract of "desired state for a
device". Instead, this phase introduces a parallel command path for
"trigger this device's built-in effect by name". Phase 5+ will use it
for native-kind Effects. The shelved v2 (timeline-step variant) will
also use it.

## Deliverable

- `device.NativeEffectRequest` domain type with `Origin`.
- `EventNativeEffectRequested` bus event.
- Zigbee adapter subscribes, translates to `{"effect":"<name>"}` MQTT
  publish to `zigbee2mqtt/<friendly>/set`.
- Per-vendor terminator table (`stop_effect`, `stop_hue_effect`, ...)
  with a public `TerminatorFor(dev) string` helper used by the runner
  in Phase 5/6.

## Files

### New

- `internal/device/native_effect.go` — `NativeEffectRequest`,
  constructors, helper publisher
- `internal/adapter/zigbee/native_effect.go` — translation +
  terminator table

### Modified

- `internal/eventbus/eventbus.go` — register the new event constant
- `internal/adapter/zigbee/adapter.go` — subscribe to
  `EventNativeEffectRequested` alongside `EventCommandRequested`

## Implementation

1. `device.NativeEffectRequest`:

   ```go
   type NativeEffectRequest struct {
       DeviceID DeviceID
       Name     string
       Origin   CommandOrigin
   }
   ```

2. Helper: `device.RequestNativeEffect(bus, deviceID, name, origin)`
   publishes `EventNativeEffectRequested`.

3. Zigbee adapter handler `handleNativeEffect(ctx, req)`:

   - Look up the device by ID; get the friendly name.
   - Confirm the device has the `effect` capability and `name` is in
     its `values`. If not, slog warn and drop (best-effort; do not
     error). Native effects are not strictly validated upstream.
   - Publish `{"effect":"<name>"}` to `zigbee2mqtt/<friendly>/set`.

4. Terminator table — keyed by something detectable from the device
   record (cap-`values` intersection works without per-vendor
   metadata: if `stop_hue_effect` is in `values`, the device is Hue;
   otherwise default to `stop_effect`). Public helper:

   ```go
   func TerminatorFor(dev device.Device) string
   ```

   Returns the right terminator name for a given device. The runner
   calls this through a small interface; the table itself stays inside
   `internal/adapter/zigbee/`.

## Tests

- Adapter unit test: publish a `NativeEffectRequest`; assert MQTT topic
  + payload.
- Adapter unit test: terminator dispatch for Hue device →
  `stop_hue_effect`.
- Adapter unit test: terminator dispatch for generic device →
  `stop_effect`.
- Adapter unit test: device without `effect` cap → no publish, slog
  warn at warn level.

## Done when

- `make e2e` green.
- Smoke check (optional): publish a `NativeEffectRequest` for a real
  Hue bulb via a test-only mutation; bulb plays the effect.

## Out of scope

- The runner that decides when to publish these (Phase 5/6).
- Frontend (Phase 10).
- Liveness tracking ("is the candle still running?") — explicitly out
  of scope; native effects are fire-and-forget.

## Next

Phase 5 — Effect runner (timeline, single-target, no loop).
