<script lang="ts">
  import { untrack } from "svelte";
  import CleaningMapLayer from "$lib/components/floorplan/cleaning-map-layer.svelte";
  import type { CleaningRobot } from "$lib/stores/cleaning.svelte";
  let { initial, onstatuschange }: { initial: CleaningRobot; onstatuschange?: (status: "loading" | "available" | "unavailable") => void } = $props();
  let robot = $state(untrack(() => initial));
  let showTrails = $state(false);
  export function setTrails(value: boolean) { showTrails = value; }
  export function report(updatedAt: string) { robot = { ...robot, updatedAt }; }
</script>
<svg><CleaningMapLayer {robot} floorplanId="floor" pxPerM={1} {showTrails} {onstatuschange} /></svg>
