<script lang="ts">
  import { watchErrorToast } from "$lib/error-toast.svelte";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { Save } from "@lucide/svelte";
  import { getContextClient } from "@urql/svelte";
  import { graphql } from "$lib/gql";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Button } from "$lib/components/ui/button";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "$lib/components/ui/select";
  import CleaningMapViewer from "$lib/components/cleaning-map-viewer.svelte";
  import ExternalChangeBanner from "$lib/components/external-change-banner.svelte";
  import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
  import { createEditorRefresh } from "$lib/editor-refresh.svelte";
  import { cleaningStore, CLEANING_DETAILS } from "$lib/stores/cleaning.svelte";
  import { roomsStore } from "$lib/stores/rooms.svelte";
  import { pageHeader } from "$lib/stores/page-header.svelte";
  import { graphqlErrorMessage } from "$lib/graphql-error";
  import type { CleaningDetailsQuery } from "$lib/gql/graphql";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  const UPDATE = graphql(`
    mutation CleaningRoomLinksSave($input: CleaningRoomLinksInput!) {
      updateCleaningRoomLinks(input: $input) {
        mapId
        mapRevision
        revision
        links {
          roomId
          areaId
        }
      }
    }
  `);
  const client = getContextClient();
  const options = $derived(locale.messageOptions());
  const id = $derived(page.params.id ?? "");
  let maps = $state<
    NonNullable<CleaningDetailsQuery["cleaningDevice"]>["maps"]
  >([]);
  let mapId = $state("");
  let selectedArea = $state("");
  let links = $state<{ roomId: string; areaId: string }[]>([]);
  let revision = $state(0);
  let original = $state("");
  let loaded = $state(false);
  let saving = $state(false);
  let error = $state("");
  const map = $derived(maps.find((item) => String(item.id) === mapId));
  function snapshotLinks() {
    return JSON.stringify(links.toSorted((a, b) =>
      a.areaId.localeCompare(b.areaId) || a.roomId.localeCompare(b.roomId),
    ));
  }
  const dirty = $derived(loaded && snapshotLinks() !== original);
  async function read() {
    await cleaningStore.refresh(client);
    const result = await client
      .query(CLEANING_DETAILS, { id }, { requestPolicy: "network-only" })
      .toPromise();
    if (result.error) throw result.error;
    return {
      maps: result.data?.cleaningDevice?.maps ?? [],
      sets: cleaningStore.byId.get(id)?.roomLinks ?? [],
    };
  }
  function selectMap(next: string) {
    mapId = next;
    const set = cleaningStore.byId
      .get(id)
      ?.roomLinks.find((s) => s.mapId === next);
    links = (set?.links ?? []).map((l) => ({
      roomId: l.roomId,
      areaId: l.areaId,
    }));
    revision = set?.revision ?? 0;
    original = snapshotLinks();
    selectedArea = String(
      maps.find((m) => String(m.id) === next)?.rooms[0]?.id ?? "",
    );
  }
  function apply(value: Awaited<ReturnType<typeof read>>) {
    maps = value.maps;
    selectMap(
      mapId && maps.some((m) => String(m.id) === mapId)
        ? mapId
        : String(maps[0]?.id ?? ""),
    );
    loaded = true;
  }
  const guard = createEditorRefresh({
    read,
    apply,
    dirty: () => dirty,
    busy: () => saving || !loaded,
  });
  function toggle(roomId: string) {
    if (links.some((l) => l.roomId === roomId && l.areaId === selectedArea))
      links = links.filter(
        (l) => l.roomId !== roomId || l.areaId !== selectedArea,
      );
    else links = [...links, { roomId, areaId: selectedArea }];
  }
  async function save() {
    if (!map || guard.conflict) return;
    saving = true;
    error = "";
    try {
      const result = await client
        .mutation(UPDATE, {
          input: {
            deviceId: id,
            mapId,
            mapRevision: map.revision,
            expectedRevision: revision,
            links,
          },
        })
        .toPromise();
      if (result.error) throw result.error;
      await cleaningStore.refresh(client);
      const value = await read();
      apply(value);
      guard.accept(value);
    } catch (e) {
      error = graphqlErrorMessage(e, m.cleaning_failed({}, options));
    } finally {
      saving = false;
    }
  }
  $effect(() => {
    pageHeader.breadcrumbs = [
      { label: m.nav_integrations({}, options), href: "/integrations" },
      { label: "Dreame", href: "/integrations/dreame" },
      { label: m.cleaning_link_rooms({}, options) },
    ];
    pageHeader.viewToggle = null;
    pageHeader.actions = [
      {
        label: m.common_save({}, options),
        icon: Save,
        saving,
        onclick: save,
        disabled: !dirty || saving || guard.conflict,
      },
    ];
  });
  onMount(() => {
    void read()
      .then((value) => {
        apply(value);
        guard.accept(value);
      })
      .catch(
        (e) =>
          (error = graphqlErrorMessage(
            e,
            m.common_error_load_data({}, options),
          )),
      );
  });
  watchErrorToast(() => error);
</script>

<UnsavedGuard {dirty} />
{#if guard.conflict}<ExternalChangeBanner
    onreload={() => void guard.refresh(true)}
  />{/if}

{#if !loaded}<p class="text-sm text-muted-foreground">
    {m.common_loading({}, options)}
  </p>
{:else if !maps.length}<p class="text-sm text-muted-foreground">
    {m.cleaning_map({}, options)}: {cleaningStore.byId.get(id)?.mapError ??
      m.cleaning_status_unknown({}, options)}
  </p>
{:else}
  {#if maps.length > 1}<Select
      type="single"
      value={mapId}
      onValueChange={selectMap}
      disabled={dirty || saving}
      ><SelectTrigger class="max-w-sm" aria-label={m.cleaning_map({}, options)}
        >{map?.name || mapId}</SelectTrigger
      ><SelectContent
        >{#each maps as item (item.id)}<SelectItem value={String(item.id)}
            >{item.name || String(item.id)}</SelectItem
          >{/each}</SelectContent
      ></Select
    >{/if}
  {#if map}<div
      class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <CleaningMapViewer
        maps={[map]}
        selectedRoomId={Number(selectedArea)}
        onRoomSelect={(area) => (selectedArea = String(area))}
      />
      <section class="rounded-lg bg-card p-5 shadow-card">
        <h2 class="mb-2 text-sm font-semibold">{m.cleaning_dreame_rooms({}, options)}</h2>
        <div class="mb-5 flex flex-wrap gap-2">
          {#each map.rooms as area (area.id)}<Button
              variant={selectedArea === String(area.id) ? "secondary" : "ghost"}
              size="sm"
              onclick={() => (selectedArea = String(area.id))}
              >{area.name ||
                m.cleaning_map_room({ id: area.id }, options)}</Button
            >{/each}
        </div>
        <h2 class="mb-2 text-sm font-semibold">
          {m.cleaning_hive_rooms({}, options)}
        </h2>
        <div class="grid gap-1">
          {#each roomsStore.items as room (room.id)}<label
              class="flex cursor-pointer items-center gap-3 py-2 text-sm"
              ><Checkbox
                checked={links.some(
                  (l) => l.roomId === room.id && l.areaId === selectedArea,
                )}
                disabled={saving || !selectedArea}
                onCheckedChange={() => toggle(room.id)}
              />{room.name}</label
            >{/each}
        </div>
      </section>
    </div>{/if}
{/if}
