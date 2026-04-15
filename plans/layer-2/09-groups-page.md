# Plan: Groups Page

## Dependencies
- layer-0/03-shadcn-theme-setup (sidebar + components)
- layer-1/04-groups-db-graphql (groups in GraphQL)

## Goal
CRUD page for managing device groups.

## Components needed from shadcn

Install: Dialog, Command (searchable picker), DropdownMenu

## Page: /groups

- List all groups as cards
- Each card shows: name, member count, member type breakdown (X devices, Y groups)
- Quick-expand to see members inline
- Create group button → Dialog with name input
- Click group → group detail/edit view

## Group edit (inline or separate page)

- Group name (editable)
- Member list showing each member with type badge
- "Add member" button → Command component (searchable picker showing all devices and groups, excluding the current group and any group that would cause a cycle)
- Remove member button per member
- If a member is a group, show it expandable to see its contents

## Circular dependency UX

When adding a group as a member, the backend rejects cycles. The frontend should:
- Pre-filter the picker to exclude the group itself
- Show an error toast if the backend rejects (for deeper cycles the frontend can't easily detect)

## Mobile layout

- Single column card list
- Add member picker as full-screen Sheet on mobile
- Edit inline on mobile (no separate page)

## Files

- `web/src/routes/groups/+page.svelte`
- `web/src/lib/components/group-card.svelte`
- `web/src/lib/components/member-picker.svelte` — reusable device/group picker with search

## Tests

- `bun run build` + `bun run check` pass
- Manual: create group, add members, remove members, verify circular rejection
