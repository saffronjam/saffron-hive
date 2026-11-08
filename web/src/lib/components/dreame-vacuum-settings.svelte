<script lang="ts">
  import { watchErrorToast } from "$lib/error-toast.svelte";
  import { getContextClient } from "@urql/svelte";
  import { graphql } from "$lib/gql";
  import { Button } from "$lib/components/ui/button";
  import { Switch } from "$lib/components/ui/switch";
  import { Crosshair, Link2, Loader2 } from "@lucide/svelte";
  import EmptyBinIcon from "$lib/components/icons/empty-bin-icon.svelte";
  import { CleaningAction, type CleaningMapViewQuery } from "$lib/gql/graphql";
  import {
    cleaningStore,
    CLEANING_MAP,
    type CleaningRobot,
  } from "$lib/stores/cleaning.svelte";
  import { floorplanStore } from "$lib/stores/floorplan.svelte";
  import { deviceStore } from "$lib/stores/devices";
  import { cleaningMapId } from "$lib/cleaning";
  import { deviceDisplayName } from "$lib/utils";
  import ResourceLink from "$lib/components/resource-link.svelte";
  import RobotVacuumIcon from "$lib/components/icons/robot-vacuum-icon.svelte";
  import CleaningHistory from "$lib/components/cleaning-history.svelte";
  import { graphqlErrorMessage } from "$lib/graphql-error";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  let { robot, disabled = false }: { robot: CleaningRobot; disabled?: boolean } = $props();
  const client = getContextClient(),
    options = $derived(locale.messageOptions());
  const mapId = $derived(cleaningMapId(robot));
  let data = $state<CleaningMapViewQuery | null>(null),
    error = $state(""),
    busy = $state(false);
  const calibration = $derived(data?.cleaningCalibration);
  let overlay = $state<boolean | null>(null);
  export function isDirty() {
    return overlay !== null && overlay !== (calibration?.enabled ?? false);
  }
  const SAVE = graphql(`
    mutation CleaningOverlaySave($input: CleaningCalibrationInput!) {
      updateCleaningCalibration(input: $input) {
        revision
        enabled
      }
    }
  `);
  $effect(() => {
    const id = robot.id,
      map = mapId,
      floorplanId = floorplanStore.current?.id,
      revision = floorplanStore.current?.revision;
    if (!map || !floorplanId) {
      data = null;
      return;
    }
    let active = true;
    void revision;
    client
      .query(
        CLEANING_MAP,
        { id, mapId: map, floorplanId },
        { requestPolicy: "network-only" },
      )
      .toPromise()
      .then((result) => {
        if (!active) return;
        data = result.data ?? null;
        if (result.error)
          error = graphqlErrorMessage(
            result.error,
            m.cleaning_failed({}, options),
          );
      });
    return () => {
      active = false;
    };
  });
  export async function save() {
    if (!isDirty()) return;
    const enabled = overlay ?? false;
    const c = calibration,
      fp = floorplanStore.current;
    if (!c?.valid || !fp) throw new Error(m.cleaning_align_first({}, options));
    if (busy) return;
    busy = true;
    error = "";
    try {
      const res = await client
        .mutation(SAVE, {
          input: {
            deviceId: robot.id,
            mapId,
            floorplanId: fp.id,
            expectedRevision: c.revision,
            mapRevision: c.mapRevision,
            floorplanRevision: fp.revision,
            enabled,
            mapRotation: c.mapRotation,
            anchors: c.anchors.map((a) => ({
              robot: { x: a.robot.x, y: a.robot.y },
              hive: { x: a.hive.x, y: a.hive.y },
            })),
          },
        })
        .toPromise();
      if (res.error) throw res.error;
      if (res.data && data)
        data = {
          ...data,
          cleaningCalibration: { ...c, ...res.data.updateCleaningCalibration },
        };
      overlay = null;
    } finally {
      busy = false;
    }
  }
  async function emptyBin() {
    try {
      await cleaningStore.control(client, robot.id, CleaningAction.EmptyBin);
    } catch (e) {
      error = graphqlErrorMessage(e, m.cleaning_failed({}, options));
    }
  }
  watchErrorToast(() => error);
</script>

<section class="space-y-5 rounded-lg bg-card p-6 shadow-card">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <h2 class="flex min-w-0 items-center gap-3 font-semibold">
      <RobotVacuumIcon class="size-5 shrink-0 text-muted-foreground" />
      <ResourceLink href={`/devices/${robot.id}`}>{deviceDisplayName($deviceStore[robot.id] ?? { id: robot.id })}</ResourceLink>
    </h2>
    <div class="flex max-w-full shrink-0 flex-wrap items-center gap-2">
      <Button
        href={`/integrations/dreame/${robot.id}/rooms`}
        variant="outline"
        size="sm"
        class="w-8 px-0 md:w-auto md:px-2.5"
        aria-label={m.cleaning_link_rooms({}, options)}><Link2 class="size-4" /><span class="hidden md:inline">{m.cleaning_link_rooms({}, options)}</span></Button>
      <Button
        href={`/integrations/dreame/${robot.id}/align`}
        variant="outline"
        size="sm"
        class="w-8 px-0 md:w-auto md:px-2.5"
        aria-label={m.cleaning_align({}, options)}
        disabled={!floorplanStore.current}><Crosshair class="size-4" /><span class="hidden md:inline">{m.cleaning_align({}, options)}</span></Button>
      {#if robot.controls?.some(control => control.action === CleaningAction.EmptyBin)}<Button
        variant="outline"
        size="sm"
        class="w-8 px-0 md:w-auto md:px-2.5"
        aria-label={m.cleaning_empty_bin({}, options)}
        disabled={!robot.controls?.find(control => control.action === CleaningAction.EmptyBin)?.enabled || !!cleaningStore.pending[robot.id]}
        onclick={emptyBin}
        >{#if cleaningStore.pending[robot.id]}<Loader2 class="size-4 animate-spin" />{:else}<EmptyBinIcon />{/if}<span class="hidden md:inline">{m.cleaning_empty_bin({}, options)}</span></Button>{/if}
    </div>
  </div>
  <div class="flex items-center gap-3">
    <Switch
      id={`cleaning-overlay-${robot.id}`}
      checked={overlay ?? calibration?.enabled ?? false}
      disabled={disabled || !calibration?.valid || busy}
      onCheckedChange={(value) => { overlay = value; error = ""; }}
    /><label for={`cleaning-overlay-${robot.id}`} class="text-sm"
      >{m.cleaning_show_on_map({}, options)}</label
    >
  </div>
  {#if !calibration?.valid}<p class="text-xs text-muted-foreground">
      {m.cleaning_align_first({}, options)}
    </p>{/if}

  <CleaningHistory deviceId={robot.id} />
</section>
