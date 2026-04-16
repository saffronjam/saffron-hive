# Plan: Devices List Page

## Dependencies
- layer-0/03-shadcn-theme-setup (sidebar layout + components available)

## Goal
Build the devices list page showing all discovered devices with real-time state updates.

## Components needed from shadcn

Install: Card, Badge, Input (for search/filter), Select (for type filter), ScrollArea

## Page: /devices

- Searchable list of all devices
- Filter by type (light, sensor, switch, all)
- Filter by availability (all, online, offline)
- Each device row/card shows:
  - Name
  - Type badge (Light, Sensor, Switch)
  - Availability dot (green/red)
  - Current state summary (brightness for lights, temp for sensors, last action for switches)
  - Source badge (zigbee, wifi)
- Click a device → navigate to `/devices/[id]`

## Real-time updates

- Subscribe to `deviceStateChanged`, `deviceAvailabilityChanged`, `deviceAdded`, `deviceRemoved`
- Device list updates in real-time without page refresh

## Mobile layout

- Single column card list on mobile
- Two or three column grid on desktop
- Search and filters collapse to a compact bar on mobile

## Files

- `web/src/routes/devices/+page.svelte`
- `web/src/lib/components/device-card.svelte` — reusable device card
- `web/src/lib/components/device-filters.svelte` — search + filter bar

## Tests

- `bun run build` succeeds
- `bun run check` passes
- Manual: devices render, filters work, real-time updates show
