<script lang="ts">
  import type { Snippet } from "svelte";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { slide } from "svelte/transition";
  import { prefersReducedMotion } from "svelte/motion";
  import { TriangleAlert, Loader2 } from "@lucide/svelte";
  import RobotVacuumIcon from "$lib/components/icons/robot-vacuum-icon.svelte";
  import ProgressBar from "$lib/components/progress-bar.svelte";
  import CleaningHistory from "$lib/components/cleaning-history.svelte";
  import type { Device } from "$lib/stores/devices";
  import type { CleaningRobot } from "$lib/stores/cleaning.svelte";
  import { cleaningActivity, cleaningStatus } from "$lib/cleaning";
  import { cleaningConsumableLabel, cleaningMaintenanceAction } from "$lib/cleaning-maintenance";
  import { maintenanceStore } from "$lib/stores/maintenance.svelte";
  import { Button } from "$lib/components/ui/button";
  import { CleaningScope, MaintenanceKind } from "$lib/gql/graphql";
  import { roomsStore } from "$lib/stores/rooms.svelte";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  import { formatMeasurement, formatShortDuration, formatPercent } from "$lib/i18n/format";
  let { device, robot, controls, battery, settings }: { device: Device; robot?: CleaningRobot; controls?: Snippet; battery?: Snippet; settings?: Snippet } = $props();
  const options = $derived(locale.messageOptions());
  const activity = $derived(robot ? cleaningActivity(robot) : null);
  const status = $derived(!device.available ? "offline" : activity?.status ?? device.state?.cleaningStatus ?? "unknown");
  const active = $derived(robot?.activeTask != null && !["completed", "cancelled", "ended", "failed"].includes(robot.activeTask.state));
  const consumables = $derived(robot?.consumables.filter(c => Number.isFinite(c.percent) && c.percent >= 0 && c.percent <= 100) ?? []);
</script>

<Card>
  <CardHeader><CardTitle>{m.device_status({}, options)}</CardTitle></CardHeader>
  <CardContent class="space-y-5">
    <div class="flex items-center gap-4">
      <div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted"><RobotVacuumIcon class="size-6 text-muted-foreground" /></div>
      <div class="min-w-0 flex-1">
        <p class="text-xl font-semibold">{cleaningStatus(status)}</p>
        {#if active && robot?.activeTask}<p class="mt-1 text-sm text-muted-foreground">{robot.activeTask.scope === CleaningScope.Apartment ? m.cleaning_whole_apartment({},options) : robot.activeTask.roomIds.map(id=>roomsStore.byId.get(id)?.name ?? m.cleaning_missing_room({},options)).join(", ") || m.cleaning_external({},options)}</p>{/if}
      </div>

    </div>
    {#if robot && active}
      <dl class="flex flex-wrap gap-x-8 gap-y-3">
        {#if robot.elapsedMinutes != null}<div><dt class="text-sm text-muted-foreground">{m.cleaning_elapsed({},options)}</dt><dd class="mt-1 tabular-nums">{formatShortDuration(robot.elapsedMinutes,"minute",locale.currentLanguage,{maximumFractionDigits:0})}</dd></div>{/if}
        {#if robot.cleanedArea != null}<div><dt class="text-sm text-muted-foreground">{m.cleaning_area_cleaned({},options)}</dt><dd class="mt-1 tabular-nums">{formatMeasurement(robot.cleanedArea,"m²",{maximumFractionDigits:1})}</dd></div>{/if}
      </dl>
      {#if activity?.progress != null}<div class="flex items-center gap-3"><ProgressBar class="min-w-0 flex-1" value={activity.progress} label={activity.estimated ? m.cleaning_estimated_progress({},options) : m.cleaning_progress({},options)} /><span class="text-sm tabular-nums">{formatPercent(activity.progress/100)}</span></div>{/if}
    {/if}
    {#if device.disabled}<p class="text-sm text-muted-foreground">{m.device_controls_disabled({},options)}</p>{/if}
    {#if robot?.error}<p class="text-sm text-destructive" role="status">{robot.error}</p>{/if}
  </CardContent>
</Card>

{@render controls?.()}

{@render battery?.()}

{@render settings?.()}

{#if consumables.length}
<Card>
  <CardHeader><CardTitle>{m.cleaning_maintenance({}, options)}</CardTitle></CardHeader>
  <CardContent class="space-y-5">
    {#each consumables as item (item.name)}
      {@const task = maintenanceStore.items.find(t => t.kind === MaintenanceKind.Cleaning && t.device?.id === device.id && t.context === item.name)}
      <div class="space-y-2">
        <div class="flex items-center justify-between gap-4"><span class="text-sm">{cleaningConsumableLabel(item.name)}</span><span class="text-sm tabular-nums text-muted-foreground">{formatPercent(item.percent/100)}</span></div>
        <ProgressBar value={item.percent} label={`${cleaningConsumableLabel(item.name)} — ${m.cleaning_remaining({},options)}`} warnLow />
        {#if item.percent<=10}<div transition:slide={{ duration: prefersReducedMotion.current ? 0 : 200 }} class="flex flex-wrap items-center justify-between gap-3"><p class="flex items-center gap-2 text-sm text-yellow-500"><TriangleAlert class="size-4 shrink-0" />{cleaningMaintenanceAction(item.name)}{item.percent>0 ? ` · ${m.cleaning_due_soon({},options)}` : ""}</p>{#if task}<Button variant="outline" size="xs" aria-busy={maintenanceStore.isPending(task.id)} disabled={!task.canComplete || maintenanceStore.isPending(task.id)} onclick={() => void maintenanceStore.completeOne(task.id)}>{#if maintenanceStore.isPending(task.id)}<Loader2 class="size-3.5 animate-spin" />{/if}{item.name === "sensors" ? m.cleaning_mark_cleaned({},options) : m.cleaning_mark_replaced({},options)}</Button>{/if}</div>{/if}
      </div>
    {/each}
  </CardContent>
</Card>
{/if}

{#if robot}
<Card>
  <CardHeader><CardTitle>{m.cleaning_history({},options)}</CardTitle></CardHeader>
  <CardContent><CleaningHistory deviceId={device.id} collapsible={false} limit={3} /></CardContent>
</Card>
{/if}
