<script lang="ts">
  import { cleaningRoomColor } from "$lib/cleaning-map";
  import type { CleaningMap, CleaningMapPoint } from "$lib/gql/graphql";
  import { m } from "$lib/i18n/messages";
  let {
    map,
    rotation = 0,
    pxPerM,
    selectedRoomId,
    onRoomSelect,
  }: {
    map: CleaningMap;
    rotation?: number;
    pxPerM: number;
    selectedRoomId?: number;
    onRoomSelect?: (id: number) => void;
  } = $props();
  const labelSize = $derived(12 / (pxPerM * map.metersPerPixel));
  const markerSize = $derived(5 / (pxPerM * map.metersPerPixel));
  function imagePoint(p: Pick<CleaningMapPoint, "x" | "y">) {
    return {
      x: (p.x - map.origin.x) / map.metersPerPixel,
      y: (p.y - map.origin.y) / map.metersPerPixel,
    };
  }
  function points(items: CleaningMapPoint[]) {
    return items
      .map(imagePoint)
      .map((p) => `${p.x},${p.y}`)
      .join(" ");
  }
</script>

<g
  role="img"
  aria-label={map.name || m.cleaning_map_name({ id: map.id })}
  transform={`translate(${map.origin.x} ${map.origin.y}) scale(${map.metersPerPixel}) rotate(${rotation} ${map.width / 2} ${map.height / 2})`}
>
  {#each map.layers as layer (`${layer.kind}-${layer.roomId}`)}
    {#if onRoomSelect && layer.kind === "room"}
      <g
        role="button"
        tabindex="0"
        aria-label={map.rooms.find((r) => r.id === layer.roomId)?.name ||
          m.cleaning_map_room({ id: layer.roomId })}
        aria-pressed={selectedRoomId === layer.roomId}
        class="cursor-pointer outline-none focus-visible:opacity-60"
        onclick={() => onRoomSelect?.(layer.roomId)}
        onkeydown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onRoomSelect?.(layer.roomId);
          }
        }}
      >
        <path
          d={layer.path}
          fill={cleaningRoomColor(layer.roomId)}
          opacity={selectedRoomId === layer.roomId ? 1 : 0.45}
        />
      </g>
    {:else}<path
        d={layer.path}
        fill={layer.kind === "wall"
          ? "var(--muted-foreground)"
          : layer.kind === "floor"
            ? "var(--border)"
            : cleaningRoomColor(layer.roomId)}
      />{/if}
  {/each}
  {#each map.areas as area, index (index)}<polygon
      points={points(area.points)}
      fill="var(--destructive)"
      fill-opacity={area.kind === "no_mop" ? 0.08 : 0.2}
      stroke="var(--destructive)"
      stroke-width="1.5"
      stroke-dasharray={area.kind === "no_mop" ? "4 3" : undefined}
      vector-effect="non-scaling-stroke"
    />{/each}
  {#each map.walls as wall, index (index)}<polyline
      points={points(wall)}
      fill="none"
      stroke="var(--destructive)"
      stroke-width="2"
      vector-effect="non-scaling-stroke"
    />{/each}
  {#each map.rooms as room (room.id)}{@const p = imagePoint(room)}
    <text
      x={p.x}
      y={p.y}
      transform={`rotate(${-rotation} ${p.x} ${p.y})`}
      text-anchor="middle"
      dominant-baseline="middle"
      font-size={labelSize}
      font-weight="600"
      fill="var(--foreground)"
      stroke="var(--card)"
      stroke-width={labelSize / 4}
      stroke-linejoin="round"
      pointer-events="none"
      paint-order="stroke">{room.name || room.id}</text
    >
  {/each}
  {#if map.dock}{@const p = imagePoint(map.dock)}<rect
      x={p.x - markerSize}
      y={p.y - markerSize}
      width={markerSize * 2}
      height={markerSize * 2}
      fill="var(--foreground)"
      stroke="var(--card)"
      stroke-width="2"
      vector-effect="non-scaling-stroke"
      ><title>{m.cleaning_map_dock()}</title></rect
    >{/if}
</g>
