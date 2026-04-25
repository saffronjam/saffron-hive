# Phase 2 — Effect schema, sqlc, and domain types

Status: pending. Part 2 of 10. Depends on Phase 1.
Master plan: `~/.claude/plans/that-is-fine-lets-rosy-plum.md`

## Why

With origin tagging in place, the next substrate is the persistence
layer and the Go domain types. No runtime, no GraphQL — just storage
and types so later phases compose against a stable representation.

## Deliverable

Tables for `effects`, `effect_steps`, `active_effects`. sqlc queries.
`internal/effect/` domain types with `RequiredCapabilities()` and
`StepConfig` JSON round-trip. Store-layer CRUD works.

## Files

### New

- `internal/store/migrations/031_effects.up.sql` + `.down.sql`
- `internal/store/queries/effects.sql`
- `internal/store/effects.go`
- `internal/effect/types.go`
- `internal/effect/required_caps.go`

### Read first

- `internal/store/migrations/030_room_members.up.sql` — numbering
- `internal/store/queries/scenes.sql` — sqlc style
- `internal/store/scenes.go` — store-layer wrapper pattern

## Schema

```sql
CREATE TABLE effects (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    icon        TEXT,
    kind        TEXT NOT NULL CHECK (kind IN ('timeline','native')),
    native_name TEXT,
    loop        INTEGER NOT NULL DEFAULT 0,
    created_by  TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE effect_steps (
    id         TEXT PRIMARY KEY,
    effect_id  TEXT NOT NULL REFERENCES effects(id) ON DELETE CASCADE,
    step_index INTEGER NOT NULL,
    kind       TEXT NOT NULL,
    config     TEXT NOT NULL,
    UNIQUE(effect_id, step_index)
);

CREATE TABLE active_effects (
    id           TEXT PRIMARY KEY,
    effect_id    TEXT NOT NULL REFERENCES effects(id) ON DELETE CASCADE,
    target_type  TEXT NOT NULL,
    target_id    TEXT NOT NULL,
    started_at   TIMESTAMP NOT NULL,
    volatile     INTEGER NOT NULL DEFAULT 1,
    UNIQUE(target_type, target_id)
);
```

Down migration drops in reverse order. No em-dashes in any SQL
comments (sqlc v1.31.0 mis-parses them).

## sqlc queries (named args)

- `CreateEffect`, `UpdateEffect`, `DeleteEffect`, `GetEffect`,
  `ListEffects`
- `ReplaceEffectSteps` — delete-then-bulk-insert for atomic rewrite
- `ListEffectSteps`
- `UpsertActiveEffect`, `DeleteActiveEffect`,
  `GetActiveEffectByTarget`, `ListActiveEffects`
- `DeleteVolatileActiveEffects`

## Domain types

```go
type Kind string
const (
    KindTimeline Kind = "timeline"
    KindNative   Kind = "native"
)

type StepKind string
const (
    StepWait          StepKind = "wait"
    StepSetOnOff      StepKind = "set_on_off"
    StepSetBrightness StepKind = "set_brightness"
    StepSetColorRGB   StepKind = "set_color_rgb"
    StepSetColorTemp  StepKind = "set_color_temp"
)

type Effect struct {
    ID, Name, Icon string
    Kind           Kind
    NativeName     string
    Loop           bool
    Steps          []Step
    CreatedBy      string
    CreatedAt, UpdatedAt time.Time
}

type Step struct {
    ID     string
    Index  int
    Kind   StepKind
    Config StepConfig
}

type StepConfig struct {
    Wait          *WaitConfig
    SetOnOff      *SetOnOffConfig
    SetBrightness *SetBrightnessConfig
    SetColorRGB   *SetColorRGBConfig
    SetColorTemp  *SetColorTempConfig
}

type WaitConfig          struct { DurationMS int }
type SetOnOffConfig      struct { Value bool;  TransitionMS int }
type SetBrightnessConfig struct { Value int;   TransitionMS int }
type SetColorRGBConfig   struct { R, G, B int; TransitionMS int }
type SetColorTempConfig  struct { Mireds int;  TransitionMS int }
```

JSON marshal of `Step.Config` matches disk shape exactly:

```json
{"r": 244, "g": 42, "b": 23, "transition_ms": 200}
```

`RequiredCapabilities()` walks `Steps` and returns the union of declared
caps (empty for `native` — native cap derivation lives in Phase 8 via
`nativeEffectOptions`).

## Tests

- Schema migration up + down round-trip.
- sqlc CRUD round-trip.
- `RequiredCapabilities()` table test (every step combination).
- `StepConfig` JSON round-trip per kind.

## Done when

- `make sqlc && make sqlc-check` clean.
- `make e2e` green.

## Out of scope

- Runner (Phase 5).
- GraphQL (Phase 8).
- `effect` capability discovery (Phase 3).

## Next

Phase 3 — Capability discovery for `effect`.
