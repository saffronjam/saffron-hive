<script lang="ts">
  import { getContextClient } from "@urql/svelte";
  import {
    cleaningStore,
    type CleaningRobot,
  } from "$lib/stores/cleaning.svelte";
  import { transformCleaningPoint } from "$lib/cleaning-map";
  import { nowStore } from "$lib/stores/now.svelte";
  import CleaningRobotMarker from "./cleaning-robot-marker.svelte";
  let {
    robot,
    floorplanId,
    floorplanRevision = 0,
    pxPerM,
    showTrails = false,
    onstatuschange,
  }: {
    robot: CleaningRobot;
    floorplanId: string;
    floorplanRevision?: number;
    pxPerM: number;
    showTrails?: boolean;
    onstatuschange?: (status: "loading" | "available" | "unavailable") => void;
  } = $props();
  const client = getContextClient();
  const view = $derived(cleaningStore.mapView(robot, floorplanId));
  const data = $derived(view.data);
  const loaded = $derived(view.loaded);
  $effect(() => {
    void cleaningStore.loadMapView(client, robot, floorplanId, floorplanRevision);
  });
  const calibration = $derived(data?.cleaningCalibration);
  const fresh = $derived(
    !!robot.liveAt &&
      nowStore.current.getTime() - new Date(robot.liveAt).getTime() < 30000,
  );
  const transform = $derived(
    calibration?.enabled && calibration.valid ? calibration.transform : null,
  );
  const robotPosition = $derived(data?.cleaningDevice?.liveMap?.robot);
  const position = $derived(
    transform && robotPosition
      ? transformCleaningPoint(transform, robotPosition)
      : null,
  );
  const heading = $derived(
    transform && robotPosition
      ? robotPosition.angle +
          (Math.atan2(transform.b, transform.a) * 180) / Math.PI
      : 0,
  );
  const trail = $derived(
    transform && showTrails
      ? (data?.cleaningDevice?.liveMap?.path ?? []).map((point) => {
          const mapped = transformCleaningPoint(transform, point);
          return `${mapped.x},${mapped.y}`;
        })
      : [],
  );
  $effect(() => onstatuschange?.(position ? "available" : loaded ? "unavailable" : "loading"));
</script>

{#if position}
  {#if trail.length > 1}<polyline
      data-cleaning-trail
      points={trail.join(" ")}
      fill="none"
      stroke="var(--primary)"
      stroke-opacity="0.65"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
      class="pointer-events-none"
    />{/if}
  <CleaningRobotMarker
    {robot}
    x={position.x}
    y={position.y}
    angle={heading}
    {pxPerM}
    {fresh}
  />
{/if}
