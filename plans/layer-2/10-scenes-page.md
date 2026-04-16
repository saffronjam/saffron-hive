# Plan: Scenes Page

## Dependencies
- layer-0/03-shadcn-theme-setup
- layer-1/04-groups-db-graphql (groups as targets)
- layer-1/06-scenes-with-groups (scene actions with group targets)
- layer-2/08-device-detail-page (light-controls component reusable)

## Goal
Scenes management page with create/edit/apply and live editing support.

## Page: /scenes

- List all scenes as cards
- Each card shows: name, number of targets, quick-apply button
- Click scene → scene editor

## Scene editor (/scenes/[id] or Dialog)

Two-section layout:

### Edit section (top)
- Scene name (editable)
- List of scene actions, each showing:
  - Target (device or group) with name and type badge
  - Desired state controls (brightness slider, color picker, etc. — reuse light-controls)
  - Remove action button
- "Add target" button → member-picker component (devices + groups)
- A scene cannot include other scenes — picker only shows devices and groups

### Live preview section (bottom, readonly)
- Shows all "effective devices" — the resolved flat list of all devices affected by this scene
- Each device shows its current real state via subscription
- Toggle "Live editing" mode:
  - OFF: changes in edit section are saved but not applied
  - ON: changes in edit section are immediately applied to real devices (sends mutations as you adjust)
- When live editing is ON, each effective device shows the live color/brightness it's currently at
- Clear visual distinction between edit section and preview section (different background, separator)

### Save/Cancel
- Save persists to DB
- Cancel reverts (if live editing was on, optionally restore previous state — or warn user)

## Mobile layout

- Edit and preview sections stack vertically
- Full-width sliders and controls
- Add target picker as Sheet

## Files

- `web/src/routes/scenes/+page.svelte` — scene list
- `web/src/routes/scenes/[id]/+page.svelte` — scene editor
- `web/src/lib/components/scene-card.svelte`
- `web/src/lib/components/scene-editor.svelte`
- `web/src/lib/components/scene-preview.svelte` — readonly effective devices view

## Tests

- `bun run build` + `bun run check` pass
- Manual: create scene, add targets, adjust state, apply, verify devices change
- Manual: live editing mode sends commands in real-time
