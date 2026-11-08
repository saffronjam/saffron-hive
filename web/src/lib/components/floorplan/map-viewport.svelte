<script lang="ts">
  import { onDestroy, untrack, type Snippet } from "svelte";
  import { Minus, Plus } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button";
  import FloorplanEditor, {
    emptySelection,
    type FloorplanEditorApi,
    type FloorplanViewport,
  } from "./floorplan-editor.svelte";
  import { detectFaces, type PlanGraph, type Point } from "$lib/floorplan";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";

  let {
    title,
    graph = { vertices: [], walls: [] },
    framePoints,
    children,
    actions,
    onready,
    oncontextmenu,
    onviewchange,
  }: {
    title: string;
    graph?: PlanGraph;
    framePoints?: Point[];
    children?: Snippet<[number]>;
    actions?: Snippet;
    onready?: (api: FloorplanEditorApi) => void;
    oncontextmenu?: (event: MouseEvent, api: FloorplanEditorApi) => void;
    onviewchange?: (viewport: FloorplanViewport, committed: boolean) => void;
  } = $props();
  let api = $state<FloorplanEditorApi>();
  let width = $state(0),
    height = $state(0);
  let hold: ReturnType<typeof setTimeout> | undefined;
  let press: { x: number; y: number } | undefined;
  const faces = $derived(detectFaces(graph));
  const frameKey = $derived(JSON.stringify(framePoints ?? graph.vertices));
  function ready(value: FloorplanEditorApi) {
    api = value;
    untrack(() => onready?.(value));
  }
  $effect(() => {
    void frameKey;
    void width;
    void height;
    if (api) {
      const current = api;
      const frame = requestAnimationFrame(() => {
        current.fitToContent();
        onviewchange?.(current.getViewport(), false);
      });
      return () => cancelAnimationFrame(frame);
    }
  });
  function cancelHold() {
    clearTimeout(hold);
    hold = undefined;
    press = undefined;
  }
  onDestroy(cancelHold);
</script>

<section class="min-w-0">
  <div class="mb-3 flex min-h-8 items-center justify-between gap-3">
    <h3 class="text-sm font-semibold">{title}</h3>
    <div class="flex items-center gap-1">
      {@render actions?.()}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={m.cleaning_map_zoom_out({}, locale.messageOptions())}
        onclick={() => api?.zoomBy(1 / 1.5)}><Minus class="size-4" /></Button
      >
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={m.cleaning_map_zoom_in({}, locale.messageOptions())}
        onclick={() => api?.zoomBy(1.5)}><Plus class="size-4" /></Button
      >
    </div>
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_no_noninteractive_tabindex (Map gestures and keyboard navigation share this viewport.) -->
  <div
    class="h-80 overflow-hidden rounded-lg bg-muted shadow-card dark:bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-96"
    role="region"
    aria-label={title}
    tabindex="0"
    bind:clientWidth={width}
    bind:clientHeight={height}
    oncontextmenu={(event) => {
      cancelHold();
      if (api && oncontextmenu) {
        event.preventDefault();
        event.stopPropagation();
        oncontextmenu(event, api);
      }
    }}
    onkeydown={(event) => {
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        api?.zoomBy(1.5);
      } else if (event.key === "-") {
        event.preventDefault();
        api?.zoomBy(1 / 1.5);
      }
    }}
    onpointerdown={(event) => {
      if (event.pointerType !== "touch" || !oncontextmenu) return;
      if (!event.isPrimary) {
        cancelHold();
        return;
      }
      press = { x: event.clientX, y: event.clientY };
      hold = setTimeout(() => {
        hold = undefined;
        if (api) oncontextmenu?.(event, api);
      }, 500);
    }}
    onpointermove={(event) => {
      if (
        press &&
        Math.hypot(event.clientX - press.x, event.clientY - press.y) > 8
      )
        cancelHold();
    }}
    onpointerup={cancelHold}
    onpointercancel={cancelHold}
  >
    <FloorplanEditor
      {graph}
      {faces}
      {framePoints}
      surface="muted"
      tool="select"
      selection={emptySelection}
      live
      onselectionchange={() => {}}
      onpreview={() => {}}
      oncommit={() => {}}
      onsnapshot={() => {}}
      onready={ready}
      onviewportcommit={() => {
        if (api) onviewchange?.(api.getViewport(), true);
      }}
    >
      {#snippet worldOverlay(pxPerM)}{@render children?.(pxPerM)}{/snippet}
    </FloorplanEditor>
  </div>
</section>
