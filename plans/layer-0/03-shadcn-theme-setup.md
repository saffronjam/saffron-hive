# Plan: shadcn-svelte + Dark/Light Theme Setup

## Goal
Install shadcn-svelte, configure dark/light mode theming, set up the responsive sidebar layout. This is the foundation for all frontend work.

## Steps

1. Install shadcn-svelte: `bunx shadcn-svelte@latest init` in `web/`
2. Configure for dark mode — Tailwind dark class strategy
3. Add a theme toggle (dark/light) using shadcn's Switch or Button component
4. Persist theme preference in localStorage

## Theme requirements (STRICT)

Every component and page MUST support both dark and light mode. Use Tailwind's `dark:` variant consistently. Never hardcode colors — always use CSS variables from shadcn's theme system.

Update `web/CLAUDE.md` to enforce this rule.

## Sidebar layout

Install shadcn components: Sidebar, Sheet, Button, Badge, Switch, ScrollArea

Layout structure:
- Desktop: persistent sidebar on the left, content area on the right
- Mobile: sidebar hidden, toggle button in top-left opens Sheet (slide-over)

Sidebar contents:
- App name/logo at top
- Navigation links:
  - Dashboard
  - Devices
  - Scenes
  - Automations
  - Groups
- Theme toggle at bottom

## Responsive breakpoints

- `< 768px` — mobile (sidebar as Sheet)
- `>= 768px` — desktop (persistent sidebar)

## Files

- Update `web/src/routes/+layout.svelte` — sidebar layout
- `web/src/lib/components/sidebar.svelte` — sidebar component
- `web/src/lib/components/theme-toggle.svelte` — dark/light toggle
- `web/src/lib/stores/theme.ts` — theme state with localStorage persistence
- Update `web/CLAUDE.md` — dark/light mode enforcement rule

## Tests

- `bun run build` succeeds
- `bun run check` passes
- Verify sidebar renders on desktop
- Verify sidebar toggles on mobile viewport
- Verify theme toggle switches between dark/light
