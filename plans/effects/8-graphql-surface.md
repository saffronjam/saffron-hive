# Phase 8 — GraphQL surface

Status: pending. Part 8 of 10. Depends on Phases 2 through 7.
Master plan: `~/.claude/plans/that-is-fine-lets-rosy-plum.md`

## Why

Until now everything is back-end. This phase exposes Effects to the
API: CRUD, run/stop, the live-step subscription, and the derived
`nativeEffectOptions` query that drives the editor's dropdown. After
this phase the back-end half is complete; integrations (scene/
automation) and the UI come last.

## Deliverable

- `api/schema.graphql` adds `Effect`, `EffectStep`, `EffectStepKind`,
  input types, mutations, a subscription, and queries.
- Resolvers wire to the store + runner from earlier phases.
- `Query.nativeEffectOptions` aggregates `effect`-cap values across all
  devices, deduped, with terminator names filtered out, sentence-cased
  for display, with a supporting-device count.

## Files

### Modified

- `api/schema.graphql`
- `internal/graph/schema.resolvers.go` (or new
  `internal/graph/effect.resolvers.go`)
- `gqlgen.yml` if needed for new model bindings

### New (frontend codegen will pick up automatically)

- `web/src/lib/graphql/effects.graphql` — or inline in pages
  depending on scenes' existing convention; match it.

## Schema sketch

```graphql
enum EffectKind { TIMELINE NATIVE }
enum EffectStepKind {
  WAIT SET_ON_OFF SET_BRIGHTNESS SET_COLOR_RGB SET_COLOR_TEMP
}

type Effect {
  id: ID!
  name: String!
  icon: String
  kind: EffectKind!
  nativeName: String
  loop: Boolean!
  steps: [EffectStep!]!
  requiredCapabilities: [String!]!
  createdBy: User
  createdAt: Time!
  updatedAt: Time!
}

type EffectStep {
  id: ID!
  index: Int!
  kind: EffectStepKind!
  config: String!
}

input EffectStepInput {
  kind: EffectStepKind!
  config: String!
}

input CreateEffectInput {
  name: String!
  icon: String
  kind: EffectKind!
  nativeName: String
  loop: Boolean!
  steps: [EffectStepInput!]!
}

input UpdateEffectInput {
  id: ID!
  name: String
  icon: String
  loop: Boolean
  nativeName: String
  steps: [EffectStepInput!]
}

type ActiveEffect {
  id: ID!
  effect: Effect!
  targetType: String!
  targetId: ID!
  startedAt: Time!
  volatile: Boolean!
}

type NativeEffectOption {
  name: String!
  displayName: String!
  supportedDeviceCount: Int!
}

type EffectStepEvent {
  runId: ID!
  effectId: ID!
  stepIndex: Int!
  active: Boolean!
}

extend type Query {
  effects: [Effect!]!
  effect(id: ID!): Effect
  activeEffects: [ActiveEffect!]!
  nativeEffectOptions: [NativeEffectOption!]!
}

extend type Mutation {
  createEffect(input: CreateEffectInput!): Effect!
  updateEffect(input: UpdateEffectInput!): Effect!
  deleteEffect(id: ID!): Boolean!
  runEffect(effectId: ID!, targetType: String!, targetId: ID!): ActiveEffect!
  stopEffect(targetType: String!, targetId: ID!): Boolean!
}

extend type Subscription {
  effectStepActivated(runId: ID): EffectStepEvent!
}
```

## Resolvers

- `runEffect` calls `Runner.Start`. Returns the `ActiveEffect` row.
- `stopEffect` calls `Runner.Stop`.
- `nativeEffectOptions` walks the device store, collects every
  `effect` cap's `values`, dedupes, filters out `stop_effect`,
  `finish_effect`, `stop_hue_effect`, sentence-cases for display, and
  counts supporting devices.
- `effectStepActivated` subscribes to `EventEffectStepActivated`. If
  `runId` is provided, filter; otherwise broadcast.

## Tests

- gqlgen generates without errors.
- Resolver round-trips for create / update / delete / run / stop.
- Subscription delivery: start an effect, assert
  `effectStepActivated` events arrive in step order.
- `nativeEffectOptions` filters terminators and dedupes correctly
  given a fixture device set.
- `bun run codegen` produces typed documents and passes lint.

## Done when

- `make e2e` green (Go + TS).
- `make sqlc-check` clean.
- Web codegen output committed.

## Out of scope

- Scene / automation integration (Phase 9).
- Frontend pages (Phase 10).

## Next

Phase 9 — Scene + automation backend integration.
