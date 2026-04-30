# web/src/lib/

Shared TypeScript modules — domain logic, mutation helpers, reactivity primitives. Before adding a new file here, check this index for an existing helper.

## Domain helpers (pure functions)

- `color.ts` — colour-space conversions. `rgbToXy(r,g,b)` for Zigbee XY commands.
- `device-tint.ts` — visual tint derivation. `aggregateSensorReadings(devices)`, `groupBaseTintColors(devices)`, `groupTintColors(devices)`, `brightnessToTintStrength(brightness)`, `sceneTintFromPayloads(payloads)`, `deviceTint(device)`. Reuse for any card / row that wants colour-from-state.
- `target-resolve.ts` — `resolveTargetDevices({ type, id }, devices, groups, rooms)` flattens a scene/group/room target to its device list (cycle-safe). `capabilityUnion(devices)` and `capabilityUnionForTarget(...)` merge capabilities. `hasCapability(caps, name)` for boolean checks.
- `memberships.ts` — reverse-index helpers (`chipsByDevice`, `membershipRowsForDevice`).
- `target-tree.ts` — tree-structured target views.
- `list-helpers.ts` — list/array shape helpers (e.g. `groupMemberBreakdown`).

## Mutation helpers

- `throttle.ts` — `Throttle` interface + `throttle(t, fire, ms?)` (default 250 ms) + `flushThrottle(t)`. Use for any user-driven mutation stream (colour pickers, drags, brightness sliders that don't already use `BulkBrightnessSlider`).
- `group-commands.ts` — fan-out helpers for groups / rooms: `commitGroupBrightness`, `commitGroupToggle`, `commitGroupColor`, `commitGroupTemp`, `flattenGroupDevices`. Compose with `throttle` for live drags.

## Editable / form state

- `automation-config.ts` — automation node config builders + types.
- `effect-editable.ts` — effect timeline editable state.
- `scene-editable.ts` — scene editable state including `ActionPayload` shape.
- `profile-core.ts` — user profile read/write helpers.
- `time-format.ts` — relative + absolute time formatting.

## Reactivity primitives

- `popover-guard.ts` — module-level "popover just dismissed" stamp. `markPopoverDismissed()` / `popoverDismissedRecently()`. Required for cards with whole-card `onclick` to suppress the bubble-up of an outside-click that just closed a popover.
- `actions/` — Svelte actions:
  - `brightness-drag.ts` — press-and-drag horizontal brightness control. Wires onto `EntityCard` via the `dragOpts` prop. Tap (no movement past threshold) falls through to the host's `onclick`; drag commits via `oncommit`.
- `stores/` — Svelte stores:
  - `devices.ts` — `deviceStore` (writable Map of live device state) + `devicesHydrated` (readable boolean for first-snapshot complete).
  - `theme.ts` — dark/light mode toggle, persisted to localStorage.
  - `profile.svelte.ts` — user profile reactive store.
  - `page-header.svelte.ts` — `pageHeader` (breadcrumbs + actions + view toggle).
  - `banner-error.svelte.ts` — `BannerError` for top-of-page error banners.
- `hooks/` — composable reactive hooks:
  - `is-mobile.svelte.ts` — `IsMobile` class wrapping a `MediaQuery` (768 px breakpoint).

## GraphQL

- `gql/` — graphql-codegen output (do not edit manually — regenerate with `make codegen`).
- `graphql/client.ts` — `createGraphQLClient()` + `authenticatedFetch`. **Only call `createGraphQLClient()` from `routes/+layout.svelte`.** Every other file uses `getContextClient()` from `@urql/svelte`.

## Utilities

- `utils.ts` / `utils/` — `cn()` (clsx + tailwind-merge), `deviceIcon()`, `sentenceCase()`, plus shared `WithoutChildrenOrChild` / `WithElementRef` types.
- `data/` — static data tables (icon registry, etc.).

## Conventions

- Files are kebab-case; exports are camelCase or PascalCase depending on kind.
- Stores live in `stores/` and use the `.svelte.ts` extension when they're reactive (using runes).
- Svelte actions live in `actions/`. Use the standard `Action<HTMLElement, OptsType>` type from `svelte/action`.
- New utility modules: lowercase noun (`throttle.ts`, `color.ts`), one concept per file. If you add a third throttle-like helper, extract a shared module before merging.
- No inline comments unless the logic is non-obvious; encourage JSDoc on exported types and functions.
