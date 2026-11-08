<script lang="ts">
  import { watchErrorToast } from "$lib/error-toast.svelte";
  import { onMount, tick } from "svelte";
  import { fade } from "svelte/transition";
  import { cubicIn, cubicOut } from "svelte/easing";
  import { prefersReducedMotion } from "svelte/motion";
  import { page } from "$app/state";
  import { goto, pushState, replaceState } from "$app/navigation";
  import { getContextClient } from "@urql/svelte";
  import { ArrowLeft, House, DoorOpen, Loader2 } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "$lib/components/ui/select";
  import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
  import SectionDivider from "$lib/components/section-divider.svelte";
  import CleaningRoomPicker from "$lib/components/cleaning-room-picker.svelte";
  import CleaningOptions from "$lib/components/cleaning-options.svelte";
  import CleaningFlowFooter from "$lib/components/cleaning-flow-footer.svelte";
  import ActiveCleaningCard from "$lib/components/active-cleaning-card.svelte";
  import { cleaningStore } from "$lib/stores/cleaning.svelte";
  import { deviceStore } from "$lib/stores/devices";
  import { floorplanStore } from "$lib/stores/floorplan.svelte";
  import { roomsStore } from "$lib/stores/rooms.svelte";
  import {
    cleaningCandidates,
    cleaningDefaultOptions,
    cleaningLinks,
    cleaningMapId,
    expandCleaningRooms,
  } from "$lib/cleaning";
  import { pageHeader } from "$lib/stores/page-header.svelte";
  import { deviceDisplayName } from "$lib/utils";
  import {
    CleaningScope,
    type CleaningOptionsInput,
    type CleaningSelectionInput,
  } from "$lib/gql/graphql";
  import { graphqlErrorMessage } from "$lib/graphql-error";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  const client = getContextClient();
  const options = $derived(locale.messageOptions());
  type Step = "start" | "rooms" | "options";
  const step = $derived(page.state.cleaningStep ?? "start");
  let renderedStep = $state<Step>("start");
  let pendingStep = $state<Step | null>(null);
  let stepVisible = $state(true);
  let resetOnStart = false;

  function queueStep(next: Step) {
    if (next === renderedStep) {
      pendingStep = null;
      stepVisible = true;
      return;
    }
    pendingStep = next;
    stepVisible = false;
  }

  async function finishStepExit(event: Event) {
    if (event.target !== event.currentTarget) return;
    await tick();
    if (pendingStep === null) return;
    renderedStep = pendingStep;
    if (renderedStep === "start" && resetOnStart) {
      roomIds = [];
      settings = cleaningDefaultOptions(robot);
      resetOnStart = false;
    }
    pendingStep = null;
    stepVisible = true;
  }

  $effect(() => queueStep(step));
  const candidates = $derived(
    cleaningCandidates(cleaningStore.items, $deviceStore),
  );
  let chosenRobot = $state("");
  const robot = $derived(cleaningStore.byId.get(chosenRobot));
  const robotAvailable = $derived(candidates.some(candidate => candidate.id === chosenRobot));
  $effect(() => {
    if (step === "start" && !busy && !candidates.some(candidate => candidate.id === chosenRobot)) {
      chosenRobot = candidates[0]?.id ?? "";
    }
  });
  let scope = $state<CleaningScope>(CleaningScope.Rooms);
  let roomIds = $state<string[]>([]);
  let settings = $state<CleaningOptionsInput>(cleaningDefaultOptions());
  let busy = $state(false),
    error = $state("");
  let replacement = $state<{ id: string; summary: string } | null>(null);
  let approved = $state<{
    input: CleaningSelectionInput;
    revision: string;
    requestId: string;
  } | null>(null);
  const links = $derived(robot ? cleaningLinks(robot) : []);
  const rooms = $derived(
    roomsStore.items.filter((r) => links.some((l) => l.roomId === r.id)),
  );
  const expanded = $derived(
    expandCleaningRooms(links, roomIds).filter((id) =>
      rooms.some((r) => r.id === id),
    ),
  );
  const summary = $derived(
    scope === CleaningScope.Apartment
      ? m.cleaning_whole_apartment({}, options)
      : expanded
          .map((id) => roomsStore.byId.get(id)?.name)
          .filter(Boolean)
          .join(", "),
  );
  const active = $derived(
    cleaningStore.items.filter(
      (r) =>
        r.activeTask &&
        [
          "starting",
          "running",
          "paused",
          "stopping",
          "returning",
          "unknown",
        ].includes(r.activeTask.state),
    ),
  );

  $effect(() => {
    const floorplan = floorplanStore.current;
    if (step !== "start" || !floorplan) return;
    for (const running of active) {
      void cleaningStore.loadMapView(client, running, floorplan.id, floorplan.revision);
    }
  });
  function goBack() {
    if (busy || pendingStep) return;
    error = "";
    approved = null;
    if (window.history.length > 1) window.history.back();
    else void goto("/map");
  }
  function move(next: Step) {
    if (busy || pendingStep) return;
    error = "";
    approved = null;
    queueStep(next);
    pushState("", { ...page.state, cleaningStep: next });
  }
  function choose(next: CleaningScope) {
    scope = next;
    roomIds = [];
    settings = cleaningDefaultOptions(robot);
    move(next === CleaningScope.Rooms ? "rooms" : "options");
  }
  function toggle(id: string) {
    if (busy) return;
    const group = new Set(expandCleaningRooms(links, [id]));
    roomIds = expanded.includes(id)
      ? roomIds.filter((v) => !group.has(v))
      : [...roomIds, id];
    approved = null;
    error = "";
  }
  function changeRobot(id: string) {
    chosenRobot = id;
    settings = cleaningDefaultOptions(candidates.find((candidate) => candidate.id === id));
    roomIds = [];
    approved = null;
    if (scope === CleaningScope.Rooms && step === "options") move("rooms");
  }
  async function start(replaceTaskId?: string) {
    if (!robot || !robotAvailable || busy) return;
    const deviceId = robot.id;
    busy = true;
    error = "";
    try {
      if (!replaceTaskId) {
        const input: CleaningSelectionInput = {
          deviceId,
          mapId: cleaningMapId(robot),
          scope,
          roomIds: scope === CleaningScope.Apartment ? [] : expanded,
          options: settings,
        };
        const plan = await cleaningStore.prepare(client, input);
        if (
          scope === CleaningScope.Rooms &&
          [...plan.roomIds].sort().join("|") !== expanded.join("|")
        ) {
          roomIds = plan.roomIds;
          error = m.cleaning_selection_changed({}, options);
          return;
        }
        approved = {
          input,
          revision: plan.revision,
          requestId: crypto.randomUUID(),
        };
      }
      if (!approved) return;
      await cleaningStore.begin(
        client,
        approved.input,
        approved.revision,
        approved.requestId,
        replaceTaskId,
      );
      replacement = null;
      resetOnStart = true;
      approved = null;
      queueStep("start");
      replaceState("", { ...page.state, cleaningStep: "start" });
    } catch (e) {
      const errors =
        typeof e === "object" && e !== null && "graphQLErrors" in e
          ? (e as { graphQLErrors: { extensions?: Record<string, unknown> }[] })
              .graphQLErrors
          : [];
      const conflict = errors.find(
        (e) => e.extensions?.code === "CLEANING_BUSY",
      );
      if (
        conflict &&
        typeof conflict.extensions?.taskId === "string" &&
        conflict.extensions.taskId
      ) {
        const id = conflict.extensions.taskId;
        await cleaningStore.refresh(client);
        const task = cleaningStore.byId.get(deviceId)?.activeTask;
        replacement = {
          id,
          summary:
            task?.id === id
              ? task.scope === CleaningScope.Apartment
                ? m.cleaning_whole_apartment({}, options)
                : task.roomIds
                    .map((id) => roomsStore.byId.get(id)?.name ?? id)
                    .join(", ") || m.cleaning_external({}, options)
              : m.cleaning_current_task({}, options),
        };
      } else {
        replacement = null;
        error = graphqlErrorMessage(e, m.cleaning_failed({}, options));
      }
    } finally {
      busy = false;
    }
  }
  $effect(() => {
    pageHeader.breadcrumbs = [{ label: m.cleaning_title({}, options) }];
    pageHeader.actions = [];
    pageHeader.viewToggle = null;
  });
  onMount(() => {
    replaceState("", { ...page.state, cleaningStep: "start" });
  });
  watchErrorToast(() => cleaningStore.error, () => cleaningStore.refresh(client));
  watchErrorToast(() => error);
</script>

{#snippet robotSelector()}
  {#if robot}
  <Select type="single" value={robot.id} disabled={busy} onValueChange={changeRobot}>
    <SelectTrigger class="w-52 max-w-full" aria-label={m.cleaning_select_robot({}, options)}>
      {deviceDisplayName($deviceStore[robot.id])}
    </SelectTrigger>
    <SelectContent>
      {#each candidates as item (item.id)}
        <SelectItem value={item.id}>{deviceDisplayName($deviceStore[item.id])}</SelectItem>
      {/each}
    </SelectContent>
  </Select>
  {/if}
{/snippet}

<div class="w-full pb-28 md:pb-0">
  {#if !cleaningStore.hydrated}
    <p class="mx-auto max-w-4xl text-sm text-muted-foreground">{m.common_loading({}, options)}</p>
  {:else if stepVisible}
  <div
    data-cleaning-page
    class="w-full"
    inert={!stepVisible}
    onintrostart={(event) => {
      if (event.target === event.currentTarget) event.currentTarget.inert = false;
    }}
    onoutrostart={(event) => {
      if (event.target === event.currentTarget) event.currentTarget.inert = true;
    }}
    onoutroend={finishStepExit}
    in:fade={{ duration: prefersReducedMotion.current ? 0 : 180, easing: cubicOut }}
    out:fade={{ duration: prefersReducedMotion.current ? 0 : 140, easing: cubicIn }}
  >
  {#if renderedStep !== "start"}
  <div class="mx-auto mb-6 hidden w-full max-w-4xl md:flex">
    <Button variant="ghost" size="sm" class="-ml-3 hidden md:inline-flex" disabled={busy || pendingStep !== null} onclick={goBack}>
      <ArrowLeft class="size-4" />{m.common_back({}, options)}
    </Button>
  </div>
  {/if}


  <div data-cleaning-step={renderedStep} class="mx-auto {renderedStep === 'rooms' ? 'w-full' : 'max-w-4xl'}">
  {#if renderedStep === "start"}
  {#each active as running (running.id)}
    <div
      data-cleaning-active-card
      class="w-full pb-6"
    >
    <ActiveCleaningCard robot={running} />
    </div>
  {/each}
  {#if active.length}
    <SectionDivider label={m.cleaning_start_new({}, options)} class="mb-4">
      {#if candidates.length > 1}{@render robotSelector()}{/if}
    </SectionDivider>
  {:else if candidates.length > 1}
    <div class="mb-4 flex justify-end">{@render robotSelector()}</div>
  {/if}
  {/if}
  <div class="space-y-6">
  {#if !robot}<p class="text-sm text-muted-foreground">
      {m.cleaning_no_available({}, options)}
    </p>
  {:else}
    {#if renderedStep === "start"}
      <div data-cleaning-scope-choices class="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          class="rounded-lg bg-card p-6 text-left shadow-card transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onclick={() => choose(CleaningScope.Apartment)}
          ><House class="mb-5 size-7 text-muted-foreground" /><span
            class="block text-lg font-medium"
            >{m.cleaning_whole_apartment({}, options)}</span
          ></button
        >
        <button
          type="button"
          class="rounded-lg bg-card p-6 text-left shadow-card transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onclick={() => choose(CleaningScope.Rooms)}
          ><DoorOpen class="mb-5 size-7 text-muted-foreground" /><span
            class="block text-lg font-medium"
            >{m.cleaning_rooms({}, options)}</span
          ></button
        >
      </div>
    {:else}
      {#if renderedStep === "rooms"}
        <CleaningRoomPicker
          {rooms}
          selected={expanded}
          disabled={busy}
          ontoggle={toggle}
        >
          {#snippet footer(contained)}
            <CleaningFlowFooter {contained}>
              <Button class="ml-auto" disabled={!expanded.length} onclick={() => move("options")}>{m.common_continue({}, options)}</Button>
            </CleaningFlowFooter>
          {/snippet}
        </CleaningRoomPicker>
      {:else}
        <section class="space-y-6 rounded-lg bg-card p-6 shadow-card">
          <p class="font-medium">{summary}</p>
          {#if !robotAvailable}<p role="status" class="text-sm text-muted-foreground">{deviceDisplayName($deviceStore[robot.id] ?? { id: robot.id })} · {m.state_unavailable({}, options)}</p>{/if}
          <CleaningOptions bind:value={settings} disabled={busy} />
        </section>
        <div class="flex justify-end">
            <Button
              disabled={busy || !robotAvailable ||
                (scope === CleaningScope.Rooms && !expanded.length)}
              onclick={() => start()}
              >{#if busy}<Loader2
                  class="size-4 animate-spin"
                />{/if}{m.cleaning_start({}, options)}</Button
            >
        </div>
      {/if}
    {/if}
  {/if}
  </div>
  </div>
  </div>
  {/if}
</div>
<ConfirmDialog
  open={replacement !== null}
  title={m.cleaning_replace_title({}, options)}
  description={replacement?.summary ?? ""}
  confirmLabel={m.cleaning_replace({}, options)}
  variant="default"
  loading={busy}
  oncancel={() => (replacement = null)}
  onconfirm={() => {
    if (replacement) void start(replacement.id);
  }}
/>
