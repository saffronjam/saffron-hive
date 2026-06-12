# internal/

All Go application code lives here. The `internal/` directory is a Go convention — the compiler prevents any external module from importing these packages, enforcing that this is private application code.

## Packages

- `activity/` — event recorder that enriches bus events with device/room/scene/automation names and persists them; retention loop prunes old rows; in-memory ring buffer feeds the frontend live activity view.
- `adapter/` — protocol adapters that bridge external device protocols to the internal event bus. Zigbee (via zigbee2mqtt) is the current adapter; more protocols drop in as sibling packages.
- `alarms/` — alarm-raising service, live subscription buffer, and system-health monitor. Severity-tagged actionable signals shown on the `/alarms` page; grouped by `alarm_id` in the service so consumers see one logical alarm per group with a count.
- `auth/` — JWT signing + validation, password hashing, bootstrap (initial user / JWT secret on first boot), HTTP middleware that injects the authenticated user into the request context.
- `automation/` — rule engine: expr evaluation, action executor, cooldown tracking, graph-based triggers (event and cron-scheduled).
- `avatars/` — per-user avatar image serving. Files live on the filesystem under a configurable data directory; the `users` table stores only the filename (UUID + extension), keeping GraphQL focused on structured data.
- `config/` — `HIVE_*` environment-variable parsing.
- `device/` — domain types (DeviceState, LightState, SensorState, etc.), target resolver contracts, and in-memory state store interfaces.
- `effect/` — effect runtime: runs timed multi-track sequences ("timeline" effects) and named on-device programs ("native" effects). Handles preemption, drift detection, and per-target run lifecycle.
- `eventbus/` — event bus interface (Publisher/Subscriber) and the channel-based implementation.
- `graph/` — GraphQL resolver implementations (gqlgen-generated boilerplate + hand-written resolvers).
- `history/` — persists device state samples into SQLite and exposes a retention loop that prunes them. The recorder decomposes each `EventDeviceStateChanged` into one row per non-nil scalar field so cross-device time series share a single shape.
- `logging/` — custom slog `TeeHandler` that writes to stderr **and** captures entries into a ring buffer, which the frontend `/logs` page streams via a GraphQL subscription.
- `pubsub/` — tiny in-process fan-out primitives. Used by services (activity, alarms, GraphQL subscription resolvers) to broadcast events to per-subscriber buffered channels.
- `scene/` — scene apply runtime (building command fan-out, default payloads), expected-state snapshot at apply time, and the watcher that compares incoming device-state events against the snapshot to flip `scenes.activated_at`.
- `store/` — database layer. `queries/*.sql` (sqlc input) → `sqlite/` (sqlc-generated Go, committed). Domain-facing wrapper methods on `*store.DB` live in `users.go`, `scenes.go`, etc. `migrations/` holds the golang-migrate schema migrations (unchanged by the sqlc pipeline). See `store/CLAUDE.md` for the query gate patterns.
- `version/` — build-time version string (single const injected via ldflags at build).

## Dependency direction

Every package depends inward toward `device/` (domain types) and `eventbus/` (the interface). Nothing else is universally depended on.

Consumers that need persistence declare a **narrow interface** locally listing only the store methods they use; `*store.DB` satisfies each implicitly via Go's structural typing. There is no global `Store` interface.

```
device/      ← domain types; depended on by nearly everything.
eventbus/    ← Publisher/Subscriber interface; depended on by every component that emits or listens.

adapter/<protocol>/  → device/, eventbus/
activity/            → device/, eventbus/, automation/ (for payload types), narrow activityStore interface
alarms/              → device/, pubsub/, narrow alarmStore interface
auth/                → store/ types (param/result structs), narrow bootstrapStore interface
automation/          → device/, eventbus/, alarms/, effect/, scene/, narrow automationStore interface
avatars/             → auth/, narrow uploader/reader interfaces (uses *store.DB structurally), stdlib filesystem
effect/              → device/, eventbus/, narrow EffectStore interface
graph/               → device/, eventbus/, activity/, adapter/zigbee/, alarms/, auth/, automation/, effect/, history/, scene/, narrow GraphStore interface
history/             → device/, eventbus/, narrow historyStore interface
pubsub/              → stdlib only
scene/               → device/, eventbus/, effect/, narrow sceneStore interface
store/               → device/, store/sqlite/ (generated)
config/, logging/, version/  → stdlib only
```

All wiring happens in `cmd/serve/` — no production package imports `adapter/`, `graph/`, or constructs `*store.DB` except the server entry point.
