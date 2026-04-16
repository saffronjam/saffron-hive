# Plan: Automations Page

## Dependencies
- layer-0/03-shadcn-theme-setup
- layer-1/05-automation-graph-db-engine (graph model in DB + engine)
- layer-2/09-groups-page (member-picker component)

## Goal
Automations management page with visual graph editor and live execution visualization.

## Node editor library

Use Svelte Flow (svelvet or @xyflow/svelte) for the graph editor. This provides:
- Draggable nodes
- Connectable ports (edges)
- Auto-layout
- Zoom/pan
- Touch support for mobile

Install: `bun add @xyflow/svelte` (or evaluate alternatives)

## Page: /automations

- List all automations as cards
- Each card shows: name, enabled toggle, node count summary, last triggered time
- Click automation → graph editor

## Automation graph editor (/automations/[id])

### Toolbar
- Automation name (editable)
- Enable/disable toggle
- Cooldown setting
- Add node buttons: "Add Trigger", "Add Operator", "Add Action"
- Save button
- Delete automation button

### Graph canvas
- Nodes rendered as cards inside the flow canvas
- Three node types with distinct visual styling:

**Trigger nodes (left side, colored e.g. blue):**
- Event type dropdown (device.state_changed, device.availability_changed, etc.)
- Optional device filter (device picker)
- Optional condition expression input (text input with syntax hints)

**Operator nodes (middle, colored e.g. yellow):**
- Type selector: AND / OR / NOT
- Visual: shows the operator symbol prominently

**Action nodes (right side, colored e.g. green):**
- Action type dropdown (set_device_state, activate_scene)
- Target picker (device or group, using member-picker)
- Payload editor (state controls — brightness, color, etc.)

### Edges
- Drag from output port of one node to input port of another
- Validate on connect (no cycles, respect node type rules)
- Delete edge by selecting and pressing delete

### Live visualization mode
- When NOT in edit mode, the graph shows real-time execution
- Subscribed to `automationNodeActivated` events
- When a node fires, it "lights up" (glow animation, color pulse)
- The lighting flows through the graph: trigger lights up → operator lights up → action lights up
- Fade out after a few seconds

### View modes
- **Edit mode** — nodes are draggable, ports are connectable, changes are staged
- **Live mode** — nodes are static, execution visualization is active

## Mobile layout

- Graph canvas is scrollable/pannable (Svelte Flow handles touch)
- Toolbar collapses to essential buttons
- Node config opens as Sheet when tapping a node (instead of inline editing)
- May want a simplified "list view" alternative on very small screens

## GraphQL additions

Subscriptions:
```graphql
subscription {
  automationNodeActivated(automationId: ID): AutomationNodeEvent!
}

type AutomationNodeEvent {
  automationId: ID!
  nodeId: ID!
  active: Boolean!
}
```

Queries/mutations for graph CRUD (from layer-1/05).

## Files

- `web/src/routes/automations/+page.svelte` — automation list
- `web/src/routes/automations/[id]/+page.svelte` — graph editor
- `web/src/lib/components/automation-card.svelte`
- `web/src/lib/components/graph/trigger-node.svelte`
- `web/src/lib/components/graph/operator-node.svelte`
- `web/src/lib/components/graph/action-node.svelte`
- `web/src/lib/components/graph/automation-flow.svelte` — wraps Svelte Flow with custom nodes

## Tests

- `bun run build` + `bun run check` pass
- Manual: create automation, add nodes, connect edges, save
- Manual: live mode shows execution flow when events fire
- Manual: mobile view is usable
