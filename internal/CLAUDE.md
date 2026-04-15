# internal/

All Go application code lives here. The `internal/` directory is a Go convention — the compiler prevents any external module from importing these packages, enforcing that this is private application code.

## Packages

- `adapter/` — protocol adapters that bridge external device protocols to the internal event bus
- `automation/` — rule engine (expr evaluation), action definitions, action executor, cooldown tracking
- `device/` — domain types (DeviceState, LightState, SensorState, etc.) and the in-memory state store
- `eventbus/` — event bus interface (Publisher/Subscriber) and the channel-based implementation
- `graph/` — GraphQL resolver implementations (gqlgen generated boilerplate + hand-written resolvers)
- `store/` — database layer (sqlc generated queries, golang-migrate migrations)

## Dependency direction

Packages depend inward toward domain types, never outward toward adapters or API:

```
adapter/ ──→ device/ (domain types)
automation/ ──→ device/ (domain types)
graph/ ──→ device/ (domain types)
store/ ──→ device/ (domain types)

All packages ──→ eventbus/ (interface)
```

No package imports `adapter/`, `graph/`, or `store/` — those are wired together in `cmd/`.
