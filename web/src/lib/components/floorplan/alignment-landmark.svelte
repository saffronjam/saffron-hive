<script lang="ts">
  import { onDestroy } from "svelte";
  import type { Point } from "$lib/floorplan";
  import type { FloorplanEditorApi } from "./floorplan-editor.svelte";
  import { m } from "$lib/i18n/messages";
  let {
    point,
    index,
    pxPerM,
    api,
    pending = false,
    disabled = false,
    onmove,
    oncommit,
    oncontextmenu,
  }: {
    point: Point;
    index: number;
    pxPerM: number;
    api?: FloorplanEditorApi;
    pending?: boolean;
    disabled?: boolean;
    onmove: (point: Point) => void;
    oncommit: () => void;
    oncontextmenu: (event: MouseEvent) => void;
  } = $props();
  let drag: { id: number; x: number; y: number; moved: boolean } | null = null;
  let hold: ReturnType<typeof setTimeout> | undefined;
  function clearHold() {
    clearTimeout(hold);
    hold = undefined;
  }
  onDestroy(clearHold);
</script>

<g
  transform={`translate(${point.x} ${point.y})`}
  role="button"
  tabindex="0"
  aria-label={m.cleaning_landmark_number({ number: index + 1 })}
  data-plan-hit="marker"
  data-landmark-index={index}
  class="cursor-grab outline-none focus-visible:opacity-70"
  oncontextmenu={(event) => {
    event.preventDefault();
    event.stopPropagation();
    clearHold();
    oncontextmenu(event);
  }}
  onpointerdown={(event) => {
    if (disabled || event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    event.stopPropagation();
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (event.pointerType === "touch")
      hold = setTimeout(() => {
        drag = null;
        oncontextmenu(event);
      }, 500);
  }}
  onpointermove={(event) => {
    if (!drag || drag.id !== event.pointerId || !api) return;
    event.stopPropagation();
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 4) {
      drag.moved = true;
      clearHold();
    }
    if (drag.moved) onmove(api.clientToWorld(event.clientX, event.clientY));
  }}
  onpointerup={(event) => {
    clearHold();
    if (!drag || drag.id !== event.pointerId) return;
    event.stopPropagation();
    if (drag.moved) oncommit();
    drag = null;
  }}
  onpointercancel={() => {
    clearHold();
    if (drag?.moved) oncommit();
    drag = null;
  }}
  onkeydown={(event) => {
    const delta = event.shiftKey ? 0.5 : 0.05;
    const directions: Record<string, Point> = {
      ArrowLeft: { x: -delta, y: 0 },
      ArrowRight: { x: delta, y: 0 },
      ArrowUp: { x: 0, y: -delta },
      ArrowDown: { x: 0, y: delta },
    };
    const d = directions[event.key];
    if (!disabled && d) {
      event.preventDefault();
      event.stopPropagation();
      onmove({ x: point.x + d.x, y: point.y + d.y });
      oncommit();
    }
  }}
>
  <circle r={22 / pxPerM} fill="transparent" />
  <circle
    r={10 / pxPerM}
    fill="var(--primary)"
    stroke="var(--background)"
    stroke-width={2 / pxPerM}
    stroke-dasharray={pending ? `${3 / pxPerM} ${2 / pxPerM}` : undefined}
  />
  <text
    text-anchor="middle"
    dominant-baseline="central"
    font-size={12 / pxPerM}
    fill="var(--primary-foreground)"
    class="pointer-events-none">{index + 1}</text
  >
</g>
