<script lang="ts">
  import { onMount } from "svelte";
  import { ChevronRight } from "@lucide/svelte";
  import { prefersReducedMotion } from "svelte/motion";
  import { slide } from "svelte/transition";
  import { CleaningScope } from "$lib/gql/graphql";
  import { cleaningActivity, cleaningStatus } from "$lib/cleaning";
  import { deviceStore } from "$lib/stores/devices";
  import { roomsStore } from "$lib/stores/rooms.svelte";
  import type { CleaningRobot } from "$lib/stores/cleaning.svelte";
  import { deviceDisplayName } from "$lib/utils";
  import { formatPercent } from "$lib/i18n/format";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  import ResourceLink from "$lib/components/resource-link.svelte";
  import ProgressBar from "$lib/components/progress-bar.svelte";
  import CleaningTaskControls from "$lib/components/cleaning-task-controls.svelte";
  import MapPage from "$lib/components/map-page.svelte";

  let { robot }: { robot: CleaningRobot } = $props();
  let expanded = $state(false);
  let progressMotionReady = $state(false);
  const contentId = $props.id();
  const options = $derived(locale.messageOptions());
  const activity = $derived(cleaningActivity(robot));
  onMount(() => {
    const frame = requestAnimationFrame(() => (progressMotionReady = true));
    return () => cancelAnimationFrame(frame);
  });
</script>

<section class="rounded-lg bg-card p-5 shadow-card">
  <div class="flex flex-wrap items-start justify-between gap-4 md:items-center">
    <div class="min-w-0 flex-1">
      <p class="break-words font-medium">
        <ResourceLink href={`/devices/${robot.id}`}>
          {deviceDisplayName($deviceStore[robot.id] ?? { id: robot.id })}
        </ResourceLink>
        <span aria-hidden="true"> · </span>
        {robot.activeTask?.scope === CleaningScope.Apartment
          ? m.cleaning_whole_apartment({}, options)
          : robot.activeTask?.roomIds
              .map((id) => roomsStore.byId.get(id)?.name ?? id)
              .join(", ") || m.cleaning_title({}, options)}
      </p>
      <p class="mt-1 text-sm text-muted-foreground">
        {cleaningStatus(activity.status)}{robot.elapsedMinutes != null
          ? ` · ${Math.round(robot.elapsedMinutes)} min`
          : ""}
      </p>
    </div>
    <CleaningTaskControls {robot} />
  </div>
  {#if activity.progress != null}
    <div class="mt-4 flex items-center gap-3" transition:slide={{ duration: progressMotionReady && !prefersReducedMotion.current ? 200 : 0 }}>
      <ProgressBar class="min-w-0 flex-1" value={activity.progress} label={activity.estimated ? m.cleaning_estimated_progress({}, options) : m.cleaning_progress({}, options)} />
      <span class="shrink-0 text-right text-xs tabular-nums text-muted-foreground">{formatPercent(activity.progress / 100)}</span>
    </div>
  {/if}
  <button
    type="button"
    class="mt-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
    aria-expanded={expanded}
    aria-controls={contentId}
    onclick={() => (expanded = !expanded)}
  >
    <ChevronRight class="size-3 transition-transform duration-200 motion-reduce:transition-none {expanded ? 'rotate-90' : ''}" />
    {m.map_title({}, options)}
  </button>
  {#if expanded}
    <div id={contentId} transition:slide={{ duration: prefersReducedMotion.current ? 0 : 220 }}>
      <div class="pt-3"><MapPage visible cleaningRobot={robot} /></div>
    </div>
  {/if}
</section>
