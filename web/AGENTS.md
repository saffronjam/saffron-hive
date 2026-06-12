# web/

Svelte frontend for the Saffron Hive dashboard. Uses bun as package manager and runtime.

## Reusable building blocks — search before you write

The codebase has matured patterns for the things people repeatedly need to build. Search and reuse before writing anything in this list.

| Need | Use |
|---|---|
| Brightness slider with anti-flicker + 250 ms throttle + trailing edge | `src/lib/components/bulk-brightness-slider.svelte`. Pass a single-element `devices` for per-device control. |
| Throttle a user-driven mutation (colour, temp, brightness drag, …) | `src/lib/throttle.ts` — `Throttle` interface + `throttle()` + `flushThrottle()` (use on drag-release for an immediate final commit). |
| Card layout (icon + name + actions + footer + tint) | `src/lib/components/entity-card.svelte`. Has `iconArea` snippet for custom icon controls, `dragOpts` for press-and-drag, `brightnessFill` for left → right horizontal fill mode. |
| Card tint / brightness fill | CSS classes in `src/app.css`: `.tint-1` / `.tint-2` / `.tint-3` (radial), `.tint-fill-horizontal` (linear horizontal fill at `--brightness-fill`). All driven by the `--tint-color` / `--tint-strength` / `--brightness-fill` `@property`-registered CSS variables. Use `color-mix(in srgb, ${c} 50%, var(--card))` for fades — never bake colours into inline `background:` literals. |
| Press-and-drag to set a numeric value on a card | `src/lib/actions/brightness-drag.ts` — Svelte action. Wire on `EntityCard` via the `dragOpts` prop. |
| Colour / colour-temp picker | `src/lib/components/light-color-picker.svelte`. Capability flags come from `capabilityUnion()` in `src/lib/target-resolve.ts`. |
| Card colour / temp picker that fans out to a group | Reuse `LightColorPicker` inside a Popover whose handlers call `commitGroupColor` / `commitGroupTemp` from `src/lib/group-commands.ts` through the shared `throttle()`. |
| Group / room → device fan-out commits | `src/lib/group-commands.ts`: `commitGroupBrightness`, `commitGroupToggle`, `commitGroupColor`, `commitGroupTemp`, `flattenGroupDevices`. |
| Resolve a scene/group/room target to its flattened device list | `src/lib/target-resolve.ts` — `resolveTargetDevices`, `capabilityUnion`. |
| Aggregate sensor readings across a device list | `src/lib/device-tint.ts` — `aggregateSensorReadings`. Same file: `groupBaseTintColors`, `brightnessToTintStrength`. |
| Drawer for picking from grouped lists | `src/lib/components/hive-drawer.svelte`. For a layout drawer with custom content: shadcn `Sheet` directly with `side="bottom"`. |
| Popover outside-click on a whole-card-clickable surface | bits-ui Popover is non-modal — outside clicks bubble to underlying handlers. Stamp with `markPopoverDismissed()` (from `src/lib/popover-guard.ts`) inside the popover's `onOpenChange(open=false)`, and gate the card's `onclick` with `popoverDismissedRecently()`. |
| Tag / badge with type-coloured palette (`light`, `sensor`, `room`, …) | `src/lib/components/hive-chip.svelte`. |
| Numeric input | `src/lib/components/number-input.svelte` (with `allowDecimal` / `allowNegative` / `nullable`). |
| Mobile detection | `IsMobile` in `src/lib/hooks/is-mobile.svelte.ts` (768 px breakpoint). |
| Live device state | `deviceStore` (writable store) + `devicesHydrated` (readable boolean) in `src/lib/stores/devices.ts`. |
| Editor keyboard guard | `isEditableTarget` (skip global shortcuts when typing). |
| Snapshot-based undo/redo | `HistoryStack`. |

When in doubt, grep first: `grep -rln "<thing-you-want>" src/lib/`. The first hit usually beats writing it again.



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

const DEVICES_QUERY = graphql(`
  query Devices {
    devices {
      id
      name
    }
  }
`);
const client = getContextClient();
const devices = queryStore({ client, query: DEVICES_QUERY });
$effect(() => {
  if ($devices.data) {
    /* $devices.data.devices is fully typed */
  }
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

## Save actions don't toast

An edit page's Save button does not fire `toast.success`. The button's own
state change — the dirty indicator turning off, or "Saving…" reverting to
"Save" — is the visual ack. Toasts are reserved for errors and asynchronous
out-of-band events (a scene drift-deactivating server-side, an alarm
firing, etc.).

Verified pattern: scenes, automations, settings save silently. When you
add a new edit page, follow that pattern. Delete-and-navigate-away flows
may toast (the page is gone before the user could read the button), but
in-place saves do not.

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

## Transitions

Visual state changes should animate, not snap. Color, background, border, opacity, height, width, and transform should all ease between states so the UI feels continuous. A property that flips instantly on click, hover, or data update reads as broken.

- **Default for state-driven properties:** `transition-colors duration-200` for color/background/border swaps; `transition-all duration-200` when several properties change together (e.g. a chip toggling between filled and outlined). 200ms is the baseline — snappy, not sluggish.
- **Height / width changes from content swaps:** prefer holding the container's dimension constant so the swap doesn't resize the layout. If the dimension must change, either animate it (CSS `transition` + explicit height, or Svelte `transition:slide`) or fade the swapped subtree so it doesn't pop.
- **Larger motions** (modals opening, drawers sliding in) can use `duration-300`–`duration-500`. Reserve anything longer for deliberate, user-triggered choreography.
- **Exception:** layout changes that must be instant for correctness (focus scroll, keyboard navigation) are fine. Everything else gets a transition.

When you write a class that changes appearance on a state change, ask whether it should transition. Default answer: yes.

## Number inputs

Numeric input fields use a string-buffered pattern, NOT
`<input type="number">`. The native number input blocks the user from
clearing or partially typing values, which makes editing painful (e.g.
"go from 0 to 1000": users naturally erase the 0, then type 1-0-0-0,
but `type="number"` rejects "" and clamps each keystroke).

Use `web/src/lib/components/number-input.svelte` for any numeric field.
It buffers the typed string, allows invalid intermediate states
(empty, below `min`, lone `-` or `.`), and only clamps + emits a clean
number on blur.

```svelte
<NumberInput bind:value={durationMs} min={50} ariaLabel="Duration" />
```

Opt-ins as needed:
- `allowDecimal` — fractional values (transition seconds, sensor floats).
- `allowNegative` — sign at index 0 (temperature comparators).
- `nullable` — empty buffer commits to `null` instead of falling back
  to `min ?? 0`. Use when "empty" is a meaningful state (e.g. an
  unset capability comparator value that save validation must reject).

Page-level save validation (e.g. `validateTimelineEffect`) is still
responsible for rejecting out-of-range values at submit time.
NumberInput's job is to unblock typing, not to be the gatekeeper.
