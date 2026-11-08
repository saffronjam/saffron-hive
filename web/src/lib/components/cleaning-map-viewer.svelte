<script lang="ts">
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "$lib/components/ui/select";
  import MapViewport from "$lib/components/floorplan/map-viewport.svelte";
  import CleaningMapContent from "$lib/components/cleaning-map-content.svelte";
  import { cleaningMapCorners } from "$lib/cleaning-map";
  import type { CleaningMap } from "$lib/gql/graphql";
  import { m } from "$lib/i18n/messages";
  let {
    maps,
    selectedRoomId,
    onRoomSelect,
    rotation,
  }: {
    maps: CleaningMap[];
    selectedRoomId?: number;
    onRoomSelect?: (id: number) => void;
    rotation?: number;
  } = $props();
  let selectedId = $state("");
  const selected = $derived(
    maps.find((map) => String(map.id) === selectedId) ?? maps[0],
  );
  const angle = $derived(rotation ?? selected?.rotation ?? 0);
</script>

{#if selected}
  {#if maps.length > 1}<Select
      type="single"
      value={String(selected.id)}
      onValueChange={(v) => (selectedId = v)}
    >
      <SelectTrigger class="mb-3 w-full" aria-label={m.cleaning_map_select()}
        >{selected.name ||
          m.cleaning_map_name({ id: selected.id })}</SelectTrigger
      >
      <SelectContent
        >{#each maps as map (map.id)}<SelectItem value={String(map.id)}
            >{map.name || m.cleaning_map_name({ id: map.id })}</SelectItem
          >{/each}</SelectContent
      >
    </Select>{/if}
  <MapViewport
    title={m.cleaning_map_title()}
    framePoints={cleaningMapCorners(selected, angle)}
  >
    {#snippet children(pxPerM)}<CleaningMapContent
        map={selected}
        rotation={angle}
        {pxPerM}
        {selectedRoomId}
        {onRoomSelect}
      />{/snippet}
  </MapViewport>
{/if}
