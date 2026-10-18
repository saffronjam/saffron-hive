# api/

GraphQL schema — the single source of truth for the API contract.

## Files

- `schema.graphql` — domain type definitions, queries, mutations, subscriptions
- `authoring.graphql` — shared typed automation/effect authoring and scene state construction
- `assistant.graphql` — Claude integration and private assistant conversations
- `gqlgen.yml` — gqlgen configuration (maps GraphQL types to Go types, resolver output paths)

## Code generation

From this schema, two things are generated:

1. **Go** (via gqlgen) — resolver interfaces and GraphQL DTO types into `internal/graph/`
2. **TypeScript** (via graphql-codegen) — typed query/mutation/subscription hooks into `web/src/lib/gql/`

Both generators read `schema.graphql`, `assistant.graphql` and `authoring.graphql`. The schema is the contract — if it changes, both sides update.

## Design principles

- Queries return full objects. Subscriptions return partial updates (only changed fields) for efficiency, plus a full snapshot on initial subscribe.
- Mutations return the updated object so the client can update its local state without waiting for a subscription event.
- Device-type-specific fields (light state, sensor readings) are modeled as union types or interfaces in the schema.

## Update semantics

Configuration updates require `expectedRevision` from the entity being edited.
Return the committed revision with mutation results and subscription snapshots.
Omitted fields preserve stored values. Null clears only explicitly nullable
properties. Complete room/group membership lists can be saved atomically with
metadata; immediate membership patches advance the same parent revision.

`REVISION_CONFLICT` rejects the whole write. `CONFIGURATION_INVALID` carries
structured `issues` with node IDs, paths and severity. Disabled automation drafts
allow incomplete values; enabling requires a fully valid effective graph.
Integration save results distinguish persisted configuration from runtime
connection/application status. Secrets retain the redacted-sentinel contract.
