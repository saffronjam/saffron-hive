<script lang="ts">
  import type { Snippet } from "svelte";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import FloorplanEditor, {
    emptySelection,
    type FloorplanEditorApi,
  } from "$lib/components/floorplan/floorplan-editor.svelte";
  import { floorplanStore } from "$lib/stores/floorplan.svelte";
  import { floorplanToGraph } from "$lib/floorplan-editable";
  import { detectFaces, faceKey } from "$lib/floorplan";
  let {
    rooms,
    selected,
    disabled = false,
    ontoggle,
    footer,
  }: {
    rooms: { id: string; name: string }[];
    selected: string[];
    disabled?: boolean;
    ontoggle: (id: string) => void;
    footer?: Snippet<[boolean]>;
  } = $props();
  const floorplan = $derived(floorplanStore.current);
  const plan = $derived(floorplan ? floorplanToGraph(floorplan) : null);
  const faces = $derived(plan ? detectFaces(plan.graph) : []);
  const names = $derived(new Map(rooms.map((r) => [r.id, r.name])));
  const roomByFace = $derived(
    new Map(
      (floorplan?.rooms ?? [])
        .filter((r) => r.roomId && names.has(r.roomId))
        .map((r) => [faceKey(r), r.roomId!]),
    ),
  );
  const mapped = $derived(new Set(roomByFace.values()));
  const labels = $derived(
    new Map([...roomByFace].map(([key, id]) => [key, names.get(id)!])),
  );
  const highlights = $derived(
    new Set(
      [...roomByFace]
        .filter(([, id]) => selected.includes(id))
        .map(([key]) => key),
    ),
  );
  const unplaced = $derived(rooms.filter((r) => !mapped.has(r.id)));
  let focused = $state("");
  function toggle(index: number) {
    const id = roomByFace.get(faceKey(faces[index]));
    if (id && !disabled) ontoggle(id);
  }
  function ready(api: FloorplanEditorApi) {
    requestAnimationFrame(() => api.fitToContent());
  }
</script>

{#snippet roomList(items: { id: string; name: string }[])}
  <div class="grid gap-2 sm:grid-cols-2">
    {#each items as room (room.id)}
      <label
        class="flex cursor-pointer items-center gap-3 rounded-lg bg-card p-4 shadow-card"
      >
        <Checkbox
          checked={selected.includes(room.id)}
          {disabled}
          onCheckedChange={() => ontoggle(room.id)}
        />{room.name}
      </label>
    {/each}
  </div>
{/snippet}

{#if plan && mapped.size}
  <div
    data-room-selection-panel
    class="flex h-[calc(100dvh-9rem)] flex-col overflow-hidden rounded-lg bg-background shadow-card md:h-[calc(100dvh-10rem)] md:overflow-visible md:rounded-none md:shadow-none"
  >
    <div
      class="min-h-0 flex-1 overflow-y-auto"
    >
      <div
        class="{unplaced.length ? 'h-64 md:h-[calc(100%-8rem)]' : 'h-full'}"
      >
        <FloorplanEditor
          graph={plan.graph}
          {faces}
          tool="select"
          selection={emptySelection}
          live
          fitOnResize
          faceLabels={labels}
          highlightedFaces={highlights}
          onselectionchange={() => {}}
          onpreview={() => {}}
          oncommit={() => {}}
          onsnapshot={() => {}}
          onfacetap={toggle}
          onready={ready}
        >
          {#snippet worldOverlay()}
            {#each faces as face, index (faceKey(face))}
              {@const id = roomByFace.get(faceKey(face))}
              {#if id}<g
                  role="checkbox"
                  aria-label={names.get(id)}
                  aria-checked={selected.includes(id)}
                  aria-disabled={disabled}
                  tabindex={disabled ? -1 : 0}
                  class="pointer-events-none outline-none"
                  onfocusin={() => (focused = id)}
                  onfocusout={() => (focused = "")}
                  onkeydown={(event) => {
                    if (event.key === " " || event.key === "Enter") {
                      event.preventDefault();
                      toggle(index);
                    }
                  }}
                >
                  <polygon
                    points={face.polygon.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke={focused === id ? "var(--ring)" : "transparent"}
                    stroke-width="3"
                    vector-effect="non-scaling-stroke"
                  />
                </g>{/if}
            {/each}
          {/snippet}
        </FloorplanEditor>
      </div>
      {#if unplaced.length}<div class="p-4 md:px-0">
          {@render roomList(unplaced)}
        </div>{/if}
    </div>
    {@render footer?.(true)}
  </div>
{:else}
  {@render roomList(rooms)}
  {@render footer?.(false)}
{/if}
