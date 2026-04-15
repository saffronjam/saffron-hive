# web/

Svelte frontend for the Saffron Hive dashboard. Uses bun as package manager and runtime.

## Stack

- Svelte + SvelteKit
- shadcn-svelte for UI components
- Tailwind for styling
- graphql-codegen for TypeScript types generated from the GraphQL schema
- urql (or similar) for GraphQL client with subscription support

## Build

The built output (`web/dist/`) is embedded into the Go binary via `go:embed`. The Go server serves the frontend — no separate web server needed.

## Data flow

All data fetching, mutations, and real-time updates go through GraphQL:
- Queries for initial data load
- Mutations for user actions (toggle light, apply scene, save automation)
- Subscriptions for live state updates (device changes, sensor readings)

The frontend maintains a local state store that is hydrated on connect and kept in sync via subscriptions.
