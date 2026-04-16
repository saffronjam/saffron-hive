# Plan: Dashboard Page

## Dependencies
- layer-2/07-device-list-page (device-card component)
- layer-2/10-scenes-page (scene-card component with apply button)

## Goal
The main dashboard — an at-a-glance view of the home with quick controls.

## Page: / (dashboard)

### Layout
- Top row: quick scene buttons (favorites / most used scenes)
- Main area: device grid grouped by room/group
  - Each group is a collapsible section with the group name as header
  - Ungrouped devices in an "Other" section
- Sidebar (on desktop): sensor readings summary, recent automation activity

### Device cards (compact mode)
- Smaller than the full device-card on the devices page
- Light: name, on/off toggle, brightness arc/bar indicator
- Sensor: name, primary reading (temperature or humidity)
- Switch: name, last action

### Quick actions
- Tap a scene button → applies immediately
- Tap a light card → toggles on/off
- Long-press / expand → reveals full controls (slider, color)

### Real-time
- Everything updates via subscriptions
- Recent automation activity feed shows last N triggered automations with timestamps

## Mobile layout
- Scene buttons as horizontal scrollable row
- Device grid as single column
- Sensor summary moves to top (above devices)
- No sidebar on mobile — activity feed accessible via tab or expandable section

## Files

- `web/src/routes/+page.svelte` — replace current placeholder
- `web/src/lib/components/dashboard-device-card.svelte` — compact device card
- `web/src/lib/components/scene-quick-bar.svelte` — horizontal scene buttons
- `web/src/lib/components/activity-feed.svelte` — recent automation triggers

## Tests

- `bun run build` + `bun run check` pass
- Manual: dashboard loads with grouped devices, scene buttons work, real-time updates flow
