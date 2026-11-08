<script lang="ts">
  import { cleaningRoomColor } from "$lib/cleaning-map";
  import type { CleaningMap, CleaningTransform } from "$lib/gql/graphql";
  let { map, transform, opacity }: {
    map: CleaningMap;
    transform: CleaningTransform;
    opacity: number;
  } = $props();
</script>

<g
  class="pointer-events-none"
  transform={`matrix(${transform.a} ${transform.b} ${-transform.b} ${transform.a} ${transform.x} ${transform.y})`}
>
  <g
    transform={`translate(${map.origin.x} ${map.origin.y}) scale(${map.metersPerPixel})`}
    {opacity}
  >
    {#each map.layers as layer (`${layer.kind}-${layer.roomId}`)}
      <path
        d={layer.path}
        fill={layer.kind === "wall" ? "var(--foreground)" : cleaningRoomColor(layer.roomId)}
        fill-opacity={layer.kind === "wall" ? 0.7 : 0.6}
      />
    {/each}
  </g>
</g>
