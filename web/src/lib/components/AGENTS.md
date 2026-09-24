# web/src/lib/components/

Shared UI components. Before adding a new file, scan this index — most needs already have a canonical implementation.

## Cards & list rows

- `entity-card.svelte` — base card layout (icon + name + actions + optional footer). Props: `tintColors` + `tintStrength` for radial tint, `brightnessFill` for horizontal fill, `iconArea` snippet to replace the icon block, `dragOpts` for press-and-drag, `onclick` for whole-card click, `readOnly` to suppress the IconPicker / inline-rename / dropdown menu. Used by every dashboard / scene / group / room card.
- `device-collection-card.svelte` — wraps `EntityCard` with brightness, colour, temp and sensor controls for a list of devices (rooms and groups pages).
- `dashboard-room-card.svelte` — room summary. Compact mode shows readings and brightness fill with drag control; desktop navigation uses full-surface tint, with unselected cards slightly faded by the dashboard.
- `dashboard-light-card.svelte` — single light or group, with compact tap/drag controls or explicit desktop switches and brightness sliders. Colour and group members use popovers.
- `dashboard-apartment-card.svelte` — whole-home summary. Compact mode shows aggregate readings and controls lighting; desktop mode selects Apartment with full-surface tint.
- `dashboard-target-panel.svelte` — shared Apartment/Room content: aggregate controls, sensor/contact boxes, room scenes, lights and appliances. Apartment shows aggregate controls and stats. Key each instance by target and presentation so drag and picker callbacks remain scoped to their target.
- `room-drawer.svelte` — bottom Sheet shell for compact room controls, rendered by `DashboardTargetPanel`.
- `device-card.svelte` — the card the `/devices` list renders. Icon + inline rename + quick controls + membership chips, with a brightness throttle and interacting cooldown. Shows disabled devices greyed and without controls.
- `device-quick-controls.svelte` — toggle + brightness slider + colour picker for a single device, designed for the device detail view.

## Controls

- `bulk-brightness-slider.svelte` — **the** brightness slider. Anti-flicker (1500 ms interacting cooldown), 250 ms throttle, trailing edge. Pass `devices` (single element list works for per-device control). **Do not write a raw `<Slider>` over `setTargetState` for brightness.**
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

- `section-divider.svelte` — a section label followed by a hairline rule (`Rooms ————`). Use for any in-page grouping heading.
- `page-header.svelte` — top-bar breadcrumbs + actions, driven by `pageHeader` store.
- `animated-grid.svelte` — list/grid with item enter/exit animations.
- `list-view.svelte` — toggle between card and table renderings.
- `unsaved-guard.svelte` — beforeunload + navigation guard for dirty edit pages.

## Tags / chips / badges

- `hive-chip.svelte` — type-coloured chip / badge. Knows about `light`, `sensor`, `button`, `plug`, `hub`, `room`, `group`, `device`, plus reading types (`temperature`, `humidity`, …) plus `new` for a freshly discovered device and `offline` for an unreachable one. Reuse before adding new colour-coded badges.
- `group-tags-select.svelte` — multi-select for the `LIGHT` / `SENSOR` group tags.

## Status & feedback

- `field-error.svelte` — **the** way to show a form validation error. Renders an
  alert icon plus the message under the field it belongs to, and renders nothing
  when the message is null. Pair it with `aria-invalid` on the input, which the
  shadcn `Input` already styles with a destructive border and ring.
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
