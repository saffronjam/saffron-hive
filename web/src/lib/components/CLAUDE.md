# web/src/lib/components/

Shared UI components. Before adding a new file, scan this index — most needs already have a canonical implementation.

## Cards & list rows

- `entity-card.svelte` — base card layout (icon + name + actions + optional footer). Props: `tintColors` + `tintStrength` for radial tint, `brightnessFill` for horizontal fill, `iconArea` snippet to replace the icon block, `dragOpts` for press-and-drag, `onclick` for whole-card click, `readOnly` to suppress the IconPicker / inline-rename / dropdown menu. Used by every dashboard / scene / group / room card.
- `device-collection-card.svelte` — wraps `EntityCard` with brightness, colour, temp and sensor controls for a list of devices (rooms and groups pages).
- `dashboard-room-card.svelte` — dashboard top-level: room icon + name + sensor readout + click-to-open-drawer + drag-for-brightness.
- `dashboard-light-card.svelte` — drawer Section A: single light or `LIGHT`-tagged group, tap-to-toggle, drag-for-brightness, icon-popover colour picker, expand-popover member rows.
- `dashboard-device-card.svelte` — per-device dashboard card (Connected to the legacy device dashboard surface). Has built-in expand chevron + brightness slider with throttle.
- `dashboard-sensors-panel.svelte` — right-rail aggregated sensor readout list.
- `room-drawer.svelte` — bottom Sheet for a room: header card + scenes + Section A light grid.
- `device-card.svelte` — alternate device card with brightness throttle + interacting cooldown (used by some legacy surfaces).
- `device-quick-controls.svelte` — toggle + brightness slider + colour picker for a single device, designed for the device detail view.

## Controls

- `bulk-brightness-slider.svelte` — **the** brightness slider. Anti-flicker (1500 ms interacting cooldown), 250 ms throttle, trailing edge. Pass `devices` (single element list works for per-device control). **Do not write a raw `<Slider>` over `setDeviceState` for brightness.**
- `light-color-picker.svelte` — colour wheel + colour-temp slider. Pass capability flags from `capabilityUnion()`.
- `number-input.svelte` — buffered numeric input. Use for any numeric field — never raw `<input type="number">`.
- `inline-edit-name.svelte` — click-to-rename text used inside `EntityCard`.
- `bulk-brightness-slider.svelte` is the only brightness-input primitive — every other surface should compose it.

## Pickers / drawers / modals

- `hive-drawer.svelte` — search + grouped item picker. Wraps shadcn `Sheet`. Supports `side="bottom"`.
- `entity-selector.svelte` — search-first command list of entities, used inside `HiveDrawer`.
- `icon-picker.svelte` + `icon-picker-trigger.svelte` — emoji / lucide icon selector for entities with an `icon` field.
- `confirm-dialog.svelte` — destructive-action confirmation.

## Layout / navigation

- `page-header.svelte` — top-bar breadcrumbs + actions, driven by `pageHeader` store.
- `animated-grid.svelte` — list/grid with item enter/exit animations.
- `list-view.svelte` — toggle between card and table renderings.
- `unsaved-guard.svelte` — beforeunload + navigation guard for dirty edit pages.

## Tags / chips / badges

- `hive-chip.svelte` — type-coloured chip / badge. Knows about `light`, `sensor`, `button`, `plug`, `room`, `group`, `device`, plus reading types (`temperature`, `humidity`, …). Reuse before adding new colour-coded badges.
- `group-tags-select.svelte` — multi-select for the `LIGHT` / `SENSOR` group tags.

## Status & feedback

- `error-banner.svelte` — top-of-page error banner (paired with `BannerError` store).
- `activity-feed.svelte` — recent automation node activations.
- `sensor-display.svelte` — formatted sensor reading list.

## Tables & search

- `device-table.svelte`, `group-table.svelte`, `member-table.svelte`, `scene-table.svelte` — tabular variants of the corresponding card lists.
- `hive-searchbar.svelte` — chip-based filter bar.
- `table-selection-toolbar.svelte` — bulk-action toolbar shown when rows are selected.

## UI primitives

`ui/` — shadcn-svelte primitives (`button`, `dialog`, `dropdown-menu`, `popover`, `sheet`, `slider`, `switch`, `tooltip`, …). Don't fork these. Use the underlying primitive when a higher-level wrapper above doesn't exist.

## Conventions

- All cards: `rounded-lg shadow-card bg-card`, no `border`. Tint via the `.tint-*` CSS classes in `app.css`, never inline `background:` literals.
- Whole-card click handlers must guard against popover-dismiss bubble: see `popover-guard.ts` + `markPopoverDismissed()` / `popoverDismissedRecently()`.
- Mutations that fire continuously (drags, slider changes, colour pickers) go through `$lib/throttle`.
- File names are kebab-case; component names are `PascalCase`.
