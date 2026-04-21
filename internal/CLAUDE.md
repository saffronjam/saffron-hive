# internal/

All Go application code lives here. The `internal/` directory is a Go convention — the compiler prevents any external module from importing these packages, enforcing that this is private application code.

## Packages

- `activity/` — event recorder that enriches bus events with device/room/scene/automation names and persists them; retention loop prunes old rows; in-memory ring buffer feeds the frontend live activity view.
- `adapter/` — protocol adapters that bridge external device protocols to the internal event bus. Zigbee (via zigbee2mqtt) is the current adapter; more protocols drop in as sibling packages.
- `auth/` — JWT signing + validation, password hashing, bootstrap (initial user / JWT secret on first boot), HTTP middleware that injects the authenticated user into the request context.
- `automation/` — rule engine: expr evaluation, action executor, cooldown tracking, graph-based triggers (event and cron-scheduled).
- `config/` — `HIVE_*` environment-variable parsing.
- `device/` — domain types (DeviceState, LightState, SensorState, etc.), target resolver contracts, and in-memory state store interfaces.
- `eventbus/` — event bus interface (Publisher/Subscriber) and the channel-based implementation.
- `graph/` — GraphQL resolver implementations (gqlgen-generated boilerplate + hand-written resolvers).
- `logging/` — custom slog `TeeHandler` that writes to stderr **and** captures entries into a ring buffer, which the frontend `/logs` page streams via a GraphQL subscription.
- `store/` — database layer. `queries/*.sql` (sqlc input) → `sqlite/` (sqlc-generated Go, committed). Domain-facing wrapper methods on `*store.DB` live in `users.go`, `scenes.go`, etc. `migrations/` holds the golang-migrate schema migrations (unchanged by the sqlc pipeline). See `store/CLAUDE.md` for the query gate patterns.

## Dependency direction

Every package depends inward toward `device/` (domain types) and `eventbus/` (the interface). Nothing else is universally depended on.

Consumers that need persistence declare a **narrow interface** locally listing only the store methods they use; `*store.DB` satisfies each implicitly via Go's structural typing. There is no global `Store` interface.

```
device/      ← domain types; depended on by nearly everything.
eventbus/    ← Publisher/Subscriber interface; depended on by every component that emits or listens.

adapter/<protocol>/  → device/, eventbus/
activity/            → device/, eventbus/, automation/ (for payload types), narrow activityStore interface
automation/          → device/, eventbus/, narrow automationStore interface
auth/                → store/ types (param/result structs), narrow bootstrapStore interface
graph/               → device/, eventbus/, narrow GraphStore interface
store/               → device/, store/sqlite/ (generated)
config/, logging/    → stdlib only
```

All wiring happens in `cmd/serve/` — no production package imports `adapter/`, `graph/`, or constructs `*store.DB` except the server entry point.
