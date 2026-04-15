# api/

GraphQL schema — the single source of truth for the API contract.

## Files

- `schema.graphql` — type definitions, queries, mutations, subscriptions
- `gqlgen.yml` — gqlgen configuration (maps GraphQL types to Go types, resolver output paths)

## Code generation

From this schema, two things are generated:

1. **Go** (via gqlgen) — resolver interfaces and GraphQL DTO types into `internal/graph/`
2. **TypeScript** (via graphql-codegen) — typed query/mutation/subscription hooks into `web/src/lib/graphql/`

Both generators read the same `schema.graphql`. The schema is the contract — if it changes, both sides update.

## Design principles

- Queries return full objects. Subscriptions return partial updates (only changed fields) for efficiency, plus a full snapshot on initial subscribe.
- Mutations return the updated object so the client can update its local state without waiting for a subscription event.
- Device-type-specific fields (light state, sensor readings) are modeled as union types or interfaces in the schema.
