<script lang="ts">
  import { watchErrorToast } from "$lib/error-toast.svelte";
  import ChargingIndicator from "$lib/components/charging-indicator.svelte";
  import { deviceChargeState } from "$lib/device-charging";
  import { getContextClient } from "@urql/svelte";
  import { Loader2, MapPin } from "@lucide/svelte";
  import {
    Popover,
    PopoverTrigger,
    PopoverContent,
  } from "$lib/components/ui/popover";
  import { Button } from "$lib/components/ui/button";
  import RobotVacuumIcon from "$lib/components/icons/robot-vacuum-icon.svelte";
  import {
    cleaningStore,
    type CleaningRobot,
  } from "$lib/stores/cleaning.svelte";
  import { deviceStore } from "$lib/stores/devices";
  import { CleaningAction } from "$lib/gql/graphql";
  import { cleaningStatus } from "$lib/cleaning";
  import { deviceDisplayName } from "$lib/utils";
  import { markPopoverDismissed } from "$lib/popover-guard";
  import { graphqlErrorMessage } from "$lib/graphql-error";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  let {
    robot,
    x,
    y,
    angle,
    pxPerM,
    fresh,
  }: {
    robot: CleaningRobot;
    x: number;
    y: number;
    angle: number;
    pxPerM: number;
    fresh: boolean;
  } = $props();
  const client = getContextClient(),
    options = $derived(locale.messageOptions());
  const name = $derived(
    deviceDisplayName($deviceStore[robot.id] ?? { id: robot.id }),
  );
  const chargeState = $derived(
    deviceChargeState({
      ...$deviceStore[robot.id],
      state: { battery: robot.battery, cleaningStatus: robot.status },
    }),
  );
  const pending = $derived(!!cleaningStore.pending[robot.id]);
  const markerScale = $derived(Math.min(1, Math.max(20 / 36, pxPerM / 60)));
  let error = $state("");
  async function locate() {
    error = "";
    try {
      await cleaningStore.control(client, robot.id, CleaningAction.Locate);
    } catch (e) {
      error = graphqlErrorMessage(e, m.cleaning_failed({}, options));
    }
  }
  watchErrorToast(() => error);
</script>

<g
  transform={`translate(${x} ${y}) scale(${1 / pxPerM})`}
  class="pointer-events-auto"
>
  <path
    d="M17 -4L24 0L17 4Z"
    transform={`rotate(${angle}) scale(${markerScale})`}
    fill="var(--primary)"
    opacity={fresh ? 1 : 0.5}
  />
  <foreignObject x="-22" y="-22" width="44" height="44" overflow="visible">
    <!-- svelte-ignore a11y_no_static_element_interactions (Keep marker interactions inside the popover.) -->
    <span
      onpointerdown={(e) => e.stopPropagation()}
      onpointerup={(e) => e.stopPropagation()}
    >
      <Popover
        onOpenChange={(open) => {
          if (!open) markPopoverDismissed();
        }}
      >
        <PopoverTrigger
          >{#snippet child({ props })}<button
              {...props}
              type="button"
              class="group relative flex size-11 items-center justify-center rounded-full text-foreground outline-none"
              aria-label={name}
              style:opacity={fresh ? 1 : 0.6}
              ><span
                class="relative flex size-9 items-center justify-center rounded-full bg-card shadow-card ring-1 ring-border group-focus-visible:ring-2 group-focus-visible:ring-ring"
                style:transform={`scale(${markerScale})`}
                data-vacuum-marker
              ><RobotVacuumIcon class="size-5" /><ChargingIndicator state={chargeState} /></span></button
            >{/snippet}</PopoverTrigger
        >
        <PopoverContent class="w-60 space-y-3 p-4" side="top">
          <div>
            <p class="text-sm font-medium">{name}</p>
            <p class="text-xs text-muted-foreground">
              {cleaningStatus(robot.status)}{robot.battery != null
                ? ` · ${robot.battery}%`
                : ""}
            </p>
          </div>
          {#if !fresh && robot.liveAt}<p class="text-xs text-muted-foreground">
              {m.cleaning_last_seen(
                {
                  time: new Date(robot.liveAt).toLocaleTimeString(
                    locale.intlLocale,
                    { hour: "2-digit", minute: "2-digit" },
                  ),
                },
                options,
              )}
            </p>{/if}
          {#if robot.controls?.some(control => control.action === CleaningAction.Locate)}<Button
            variant="outline"
            size="sm"
            disabled={pending || !robot.controls?.find(control => control.action === CleaningAction.Locate)?.enabled}
            onclick={locate}
            >{#if pending}<Loader2 class="size-4 animate-spin" />{:else}<MapPin
                class="size-4"
              />{/if}{m.cleaning_locate({}, options)}</Button
          >{/if}

        </PopoverContent>
      </Popover>
    </span>
  </foreignObject>
</g>
