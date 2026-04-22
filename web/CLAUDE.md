# web/

Svelte frontend for the Saffron Hive dashboard. Uses bun as package manager and runtime.

## Stack

- Svelte 5 + SvelteKit
- shadcn-svelte for UI components
- Tailwind for styling
- `@urql/svelte` for GraphQL over HTTP (queries/mutations) and WebSocket (subscriptions) via `graphql-ws`
- `@graphql-codegen/client-preset` generates TypeScript types from `api/schema.graphql` into `web/src/lib/gql/`

## Build

The built output (`web/dist/`) is embedded into the Go binary via `go:embed`. The Go server serves the frontend — no separate web server needed.

## GraphQL

`api/schema.graphql` is the single source of truth. graphql-codegen's `client-preset` scans all `.svelte` and `.ts` files for `graphql(\`…\`)` calls, and emits:

- `src/lib/gql/graphql.ts` — all schema types (`Device`, `Scene`, etc.) + operation types (`DevicesListQuery`, `UpdateSceneMutation`, …).
- `src/lib/gql/gql.ts` + `index.ts` — the `graphql()` helper that takes a query string and returns a `TypedDocumentNode<Data, Variables>`.
- `src/lib/gql/fragment-masking.ts` — ready for fragment introduction (no fragments used today).

Regenerate with `make codegen` (or `cd web && bun run codegen`). `make codegen-check` fails when the committed output drifts from the SQL; it runs in `prepare-for-commit` and CI.

**Do not import from `$lib/gql/graphql` directly for schema types unless you need them; prefer letting urql infer operation result/variable types from the `TypedDocumentNode` returned by `graphql()`.**

### Canonical patterns

**Single urql client.** `routes/+layout.svelte` creates one `Client` via `createGraphQLClient()` (which sets up `authenticatedFetch`, `graphql-ws` subscriptions, and auth-refresh handling) and publishes it through `setContextClient`. Every other component pulls it via `getContextClient()` — **never** call `createGraphQLClient()` outside the layout.

**Queries.**
```ts
import { getContextClient, queryStore } from "@urql/svelte";
import { graphql } from "$lib/gql";

const DEVICES_QUERY = graphql(`query Devices { devices { id name } }`);
const client = getContextClient();
const devices = queryStore({ client, query: DEVICES_QUERY });
$effect(() => {
    if ($devices.data) { /* $devices.data.devices is fully typed */ }
});
```

**Subscriptions.**
```ts
import { subscriptionStore } from "@urql/svelte";
const changes = subscriptionStore({ client, query: DEVICE_STATE_CHANGED });
$effect(() => {
    if ($changes.data) deviceStore.updateState(...);
});
```
No manual `.subscribe(sink)` + `onDestroy` unsubscribe sweep — `subscriptionStore` handles teardown when the component unmounts.

**Mutations.** Imperative — the caller awaits completion:
```ts
const result = await client.mutation(UPDATE_DEVICE, { id, input }).toPromise();
if (result.data) deviceStore.updateName(id, result.data.updateDevice.name);
```

**Operation names must be unique across the whole document set.** graphql-codegen rejects duplicates at build time. Use `<PageContext><Action>` naming when the same entity is queried from multiple pages — e.g. `query DashboardDevices { … }` vs `query DevicesList { … }`.

## Theme

Dark and light mode are supported via Tailwind's `dark:` class variant. The `<html>` element gets the `dark` class toggled by the theme store (`$lib/stores/theme.ts`), which persists to localStorage.

### Rules

- Every component MUST support both dark and light mode.
- Use shadcn's CSS variable-based color tokens (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, etc.) instead of hardcoded colors.
- Never hardcode color values — always use CSS variables from the shadcn theme system.
- Use Tailwind's `dark:` variant only when a component needs different styling beyond what the CSS variables provide.
- Test both themes when adding or modifying components.

## Card styling

Content cards use `rounded-lg shadow-card bg-card` — no `border`. The `shadow-card` token provides the visual separation. Never use `border` on content cards; it produces a white outline in dark mode that clashes with the rest of the UI.

## Context menus

Destructive or admin actions that are currently unavailable (e.g. the logged-in
user trying to delete themselves) should render as **disabled with a tooltip**
explaining why, not hidden. Users must be able to see what's possible and why
it isn't available right now — options appearing and disappearing based on
state makes the UI feel unpredictable.

## Cursor styling

Do not set `cursor-*` utilities on interactive elements. Rely on visual cues — hover highlight, border/ring changes, color shifts — to signal interactivity. The default cursor stays the arrow everywhere except real text inputs (where the browser's native text caret applies).

- No `cursor-pointer` on buttons, dropdown items, cards, clickable icons, or toggle affordances.
- No `cursor-help`, `cursor-not-allowed`, or other cursor variants.
- The only acceptable cursor is the browser default on `<input type="text">`, `<textarea>`, and `contenteditable` surfaces.

If an element looks clickable but lacks a hover state, add the hover state — don't swap in `cursor-pointer`.
