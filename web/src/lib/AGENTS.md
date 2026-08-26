# web/src/lib/

Shared TypeScript modules — domain logic, mutation helpers, reactivity primitives. Before adding a new file here, check this index for an existing helper.

## Domain helpers (pure functions)

- `color.ts` — colour-space conversions. `rgbToXy(r,g,b)` for Zigbee XY commands.
- `device-tint.ts` — visual tint derivation. `aggregateSensorReadings(devices)`, `aggregateLightAppearance(devices)`, `rememberedLightPalette(devices)`, `brightnessToTintStrength(brightness)`, `sceneTintFromPayloads(payloads)`, `deviceTint(device)`. Aggregate status surfaces use `aggregateLightAppearance`; picker swatches that remain useful while lights are off use `rememberedLightPalette`.
- `target-resolve.ts` — `resolveTargetDevices({ type, id }, devices, groups, rooms)` flattens a scene/group/room target to its device list (cycle-safe). `capabilityUnion(devices)` and `capabilityUnionForTarget(...)` merge capabilities. `hasCapability(caps, name)` for boolean checks. `resolveTargetDevices` / `evaluateExpression` / `capabilityUnionForTarget` drop runtime-disabled devices by default so the client resolves what the server commands; pass `{ includeDisabled: true }` on editor surfaces that should still render a disabled member (greyed). Deleted devices remain hidden in both modes.
- `memberships.ts` — reverse-index helpers (`chipsByDevice`, `membershipRowsForDevice`).
- `target-tree.ts` — tree-structured target views.
- `list-helpers.ts` — list/array shape helpers (e.g. `groupMemberBreakdown`).
- `integrations.ts` — `integrationMeta(provider)` returns the icon, one-line description and delete semantics (`keepsDevices`) for an integration provider id, with a `PlugZap` fallback for unknown providers. Use it anywhere a provider is rendered — the integrations list, the add dialog, and each detail page.
- `entity-cache.ts` — `loadSnapshot` / `saveSnapshot` / `clearSnapshot` / `clearAllSnapshots` over a `Storage`, keyed `hive:cache:<name>` and stamped with a schema version. Pure, so it is unit-testable; reads are synchronous so a store can paint before the first frame. Every path degrades to empty rather than throwing.
- `session.ts` — `sessionTeardown()` ends an authenticated session: stops and clears every store, drops the disk snapshots, clears `me` and the token. Call it from every logout path, including the involuntary 401s in `graphql/client.ts`.
- `prefetch-detail.ts` — `prefetchDetail(client, kind, id)` warms a scene / automation / effect editor's query on card hover.
- `redacted-secret.ts` — `REDACTED_SECRET`, `hasStoredSecret(fetched)`, `secretToSend(typed, stored)`. The API returns a placeholder in place of a stored secret and accepts it back as "keep the stored value"; use these for any secret input so a blank field never wipes the stored value.

## Mutation helpers

- `throttle.ts` — `Throttle` interface + `throttle(t, fire, ms?)` (default 250 ms) + `flushThrottle(t)`. Use for any user-driven mutation stream (colour pickers, drags, brightness sliders that don't already use `BulkBrightnessSlider`).
- `group-commands.ts` — fan-out helpers for groups / rooms: `commitGroupBrightness`, `commitGroupToggle`, `commitGroupColor`, `commitGroupTemp`, `flattenGroupDevices`. Compose with `throttle` for live drags.

## Editable / form state

- `automation-config.ts` — automation node config builders + types.
- `effect-editable.ts` — effect timeline editable state.
- `scene-editable.ts` — scene editable state including `ActionPayload` shape.
- `profile-core.ts` — user profile read/write helpers.
- `time-format.ts` — relative + absolute time formatting.

## Routing

- `auth-gate.ts` — `nextRoute(state)` returns the route the root layout's gate should redirect to, or `null` to stay put. Pure, so the precedence between setup / login / forced-password-change is table-testable; `+layout.svelte` gathers the state and performs the `goto`.

## Reactivity primitives

- `popover-guard.ts` — module-level "popover just dismissed" stamp. `markPopoverDismissed()` / `popoverDismissedRecently()`. Required for cards with whole-card `onclick` to suppress the bubble-up of an outside-click that just closed a popover.
- `actions/` — Svelte actions:
  - `brightness-drag.ts` — press-and-drag horizontal brightness control. Wires onto `EntityCard` via the `dragOpts` prop. Tap (no movement past threshold) falls through to the host's `onclick`; drag commits via `oncommit`.
- Kept-alive pages: the sidebar's main pages live in `components/*-page.svelte`
  (dashboard, map, devices, rooms, groups, scenes, automations, effects,
  alarms), mounted once by the root layout's `KEPT_PAGES` registry and hidden
  when not the active route, so returning to one costs no rebuild. Their
  `routes/**/+page.svelte` files are empty shells that only make the URL
  resolve. Each page takes a `visible` prop and must gate on it: page-header
  writes, URL-reading effects, polls, global listeners and one-shot work. A
  page that cannot scope its globals to visibility (data-viewer writes the URL;
  activity grows its feed unboundedly) stays a normal route.
- `stores/` — Svelte stores:
  - `entity-store.svelte.ts` — `createEntityStore({ name, version, query, select })`, the primitive every shared list is built on. Hydrates from its disk snapshot at module evaluation, fetches once on `start`, and exposes `items` / `byId` / `hydrated` / `error` plus `upsert` / `remove` / `removeMany` / `replaceAll` / `refresh` / `clear`. The root layout calls `refresh` after WebSocket recovery. Bump `version` whenever the selection set changes so old snapshots are discarded.
  - `rooms.svelte.ts`, `groups.svelte.ts`, `scenes.svelte.ts`, `automations.svelte.ts`, `effects.svelte.ts`, `floorplan.svelte.ts` — the shared lists, each owning its own mutations so a write lands in the cache without a follow-up fetch. They hold ids and membership only; join `deviceStore` for device detail. `scenesStore` also owns the single `sceneActiveChanged` subscription and the optimistic `apply`.
  - `devices.ts` — `deviceStore` (writable Map of live device state) + `devicesHydrated` (readable boolean for first-snapshot complete).
  - `theme.ts` — dark/light mode toggle, persisted to localStorage.
  - `profile.svelte.ts` — user profile reactive store.
  - `page-header.svelte.ts` — `pageHeader` (breadcrumbs + actions + view toggle).
  - `banner-error.svelte.ts` — `BannerError` for top-of-page error banners.
- `hooks/` — composable reactive hooks:
  - `is-mobile.svelte.ts` — `IsMobile` class wrapping a `MediaQuery` (768 px breakpoint).

## GraphQL

- `gql/` — graphql-codegen output (do not edit manually — regenerate with `just codegen`).
- `graphql/client.ts` — `createGraphQLConnection()` + `authenticatedFetch`. **Only call `createGraphQLConnection()` from `routes/+layout.svelte`.** Every other file uses `getContextClient()` from `@urql/svelte`.
- `graphql/app-recovery.ts` — lifecycle reconnect triggers, connection context, and `onGraphQLRecovered()` for reconciling persistent page-local query data after subscriptions resume.
- `graphql/setup-status.ts` — `SETUP_STATUS_QUERY`, shared by the routing gate and `/setup`. Operation names must be unique across the document set, so a second copy of this query only survives codegen while byte-identical — import it rather than re-declaring it.
- `graphql-error.ts` — `stripErrorPrefix(message)` drops urql's `[GraphQL] ` / `[Network] ` prefix; `graphqlErrorMessage(error, fallback)` pulls the most useful message out of an urql error. Use instead of hand-rolling the regex.

## Utilities

- `utils.ts` / `utils/` — `cn()` (clsx + tailwind-merge), `deviceDisplayName()`, `deviceIcon()`, `sentenceCase()`, plus shared `WithoutChildrenOrChild` / `WithElementRef` types. `Device.name` is nullable (it is only the user's override), so read `deviceDisplayName(d)` anywhere a device name is rendered, sorted or searched.
- `data/` — static data tables (icon registry, etc.).

## Conventions

- Files are kebab-case; exports are camelCase or PascalCase depending on kind.
- Stores live in `stores/` and use the `.svelte.ts` extension when they're reactive (using runes).
- Svelte actions live in `actions/`. Use the standard `Action<HTMLElement, OptsType>` type from `svelte/action`.
- New utility modules: lowercase noun (`throttle.ts`, `color.ts`), one concept per file. If you add a third throttle-like helper, extract a shared module before merging.
- No inline comments unless the logic is non-obvious; encourage JSDoc on exported types and functions.
