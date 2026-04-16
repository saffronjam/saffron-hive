# Plan: Device Detail Page

## Dependencies
- layer-0/03-shadcn-theme-setup (components available)
- layer-2/07-device-list-page (device-card component exists)

## Goal
Per-device page showing full info and interactive controls.

## Components needed from shadcn

Install: Slider, Switch (toggle), Tabs, Separator, Tooltip

Custom components: ColorPicker (build or find a Svelte color picker that works with shadcn styling)

## Page: /devices/[id]

### Info section (Card)
- Device name (editable inline?)
- Device ID (readonly, copyable)
- Type, Source
- IEEE address (for zigbee devices)
- First seen / Last seen timestamps
- Availability status

### Controls section (Card) — varies by device type

**Light:**
- On/off toggle (shadcn Switch)
- Brightness slider (shadcn Slider, 0-254)
- Color temperature slider (if supported)
- Color picker (if supported, RGB or XY)
- Transition time input
- All controls send mutations on change (debounced for sliders)

**Sensor:**
- Current readings displayed as large numbers
- Placeholder card for "History" (graphs come later)
- Battery level if available

**Switch:**
- Last action displayed
- Timestamp of last action

### Groups section (Card)
- List of groups this device belongs to
- Each group is a link to the group page

### Controls UX
- Slider changes are debounced (200ms) to avoid spamming mutations
- All state updates reflected in real-time via subscription
- Controls show "sending..." state briefly while command is in flight

## Mobile layout
- Sections stack vertically
- Sliders are full-width
- Color picker adapts to screen width

## Files

- `web/src/routes/devices/[id]/+page.svelte`
- `web/src/lib/components/light-controls.svelte`
- `web/src/lib/components/sensor-display.svelte`
- `web/src/lib/components/switch-display.svelte`
- `web/src/lib/components/color-picker.svelte`

## Tests

- `bun run build` + `bun run check` pass
- Manual: toggle light, adjust brightness slider, see real-time update
