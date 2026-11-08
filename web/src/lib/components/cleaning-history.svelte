<script lang="ts">
  import { watchErrorToast } from "$lib/error-toast.svelte";
  import { getContextClient } from "@urql/svelte";
  import { ChevronRight, Loader2 } from "@lucide/svelte";
  import { prefersReducedMotion } from "svelte/motion";
  import { slide } from "svelte/transition";
  import { Button } from "$lib/components/ui/button";
  import { CLEANING_HISTORY, cleaningStore } from "$lib/stores/cleaning.svelte";
  import { roomsStore } from "$lib/stores/rooms.svelte";
  import { cleaningStatus } from "$lib/cleaning";
  import { CleaningScope, type CleaningHistoryQuery } from "$lib/gql/graphql";
  import { graphqlErrorMessage } from "$lib/graphql-error";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  let { deviceId, collapsible = true, limit = 10 }: { deviceId: string; collapsible?: boolean; limit?: number } = $props();
  const client = getContextClient(),
    options = $derived(locale.messageOptions());
  const contentId = $props.id();
  let open = $state(false),
    loading = $state(false),
    error = $state(""),
    more = $state(false);
  let rows = $state<CleaningHistoryQuery["cleaningHistory"]>([]);
  let requestId = 0;
  let loadedDeviceId = "";
  async function load(before?: string) {
    const request = ++requestId;
    const id = deviceId;
    if (loadedDeviceId !== id) {
      rows = [];
      more = false;
      loadedDeviceId = id;
    }
    loading = true;
    error = "";
    try {
      const result = await client
        .query(
          CLEANING_HISTORY,
          { id, before, limit },
          { requestPolicy: "network-only" },
        )
        .toPromise();
      if (request !== requestId || id !== deviceId) return;
      if (result.error) throw result.error;
      const page = result.data?.cleaningHistory ?? [];
      const items = page.filter(item => item.cleanedArea != null && item.cleanedArea > 0);
      rows = [...new Map((before ? [...rows, ...items] : items).map(item => [item.id,item])).values()];
      more = page.length === limit;
    } catch (e) {
      if (request === requestId) error = graphqlErrorMessage(e, m.cleaning_failed({}, options));
    } finally {
      if (request === requestId) loading = false;
    }
  }
  const visible = $derived(!collapsible || open);
  const activeTaskId = $derived(cleaningStore.byId.get(deviceId)?.activeTask?.id);
  $effect(() => {
    void activeTaskId;
    if (visible) void load();
  });
  watchErrorToast(() => error);
</script>

<div>
  {#if collapsible}<button
    type="button"
    class="flex items-center gap-1 text-sm text-muted-foreground"
    aria-expanded={open}
    aria-controls={contentId}
    onclick={() => (open = !open)}
  >
    <ChevronRight class="size-3 transition-transform duration-200 motion-reduce:transition-none {open ? 'rotate-90' : ''}" />
    {m.cleaning_history({}, options)}
    {#if loading}<Loader2 class="ml-1 size-3 animate-spin" />{/if}
  </button>{/if}
  {#if visible && (rows.length || !loading)}<div id={contentId} transition:slide={{ duration: !collapsible || prefersReducedMotion.current ? 0 : 200 }}>
    <div class="divide-y" class:mt-3={collapsible}>
      {#each rows as task (task.id)}<div
          class="flex items-center justify-between gap-3 py-3 text-sm"
        >
          <div>
            <time datetime={task.createdAt}
              >{new Date(task.createdAt).toLocaleString(locale.intlLocale, {
                dateStyle: "medium",
                timeStyle: "short",
              })}</time
            >
            <p class="text-xs text-muted-foreground">
              {task.scope === CleaningScope.Apartment
                ? m.cleaning_whole_apartment({}, options)
                : task.roomIds
                    .map((id) => roomsStore.byId.get(id)?.name ?? id)
                    .join(", ") || m.cleaning_external_origin({}, options)}
            </p>
          </div>
          <div class="text-right">
            <p class="tabular-nums">
              {task.elapsedMinutes != null
                ? `${task.elapsedMinutes} min`
                : ""}{task.cleanedArea != null
                ? ` · ${task.cleanedArea} m²`
                : ""}
            </p>
            <p class="text-xs text-muted-foreground">
              {cleaningStatus(task.state)}
            </p>
          </div>
        </div>{/each}
    </div>
    {#if more}<Button
        size="sm"
        variant="ghost"
        class="mt-3 px-0"
        disabled={loading}
        onclick={() => load(rows.at(-1)?.createdAt)}
        >{m.cleaning_load_more({}, options)}</Button
      >{/if}
    {#if !loading && !rows.length}<p class="mt-3 text-sm text-muted-foreground">
        {m.cleaning_no_history({}, options)}
      </p>{/if}

    </div>
  {/if}
</div>
