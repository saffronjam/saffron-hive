<script lang="ts">
  import { onMount, tick } from "svelte";
  import { toast } from "svelte-sonner";
  import { page } from "$app/state";
  import { getContextClient } from "@urql/svelte";
  import {
    Save,
    Undo2,
    Redo2,
    RotateCcw,
    RotateCw,
    Plus,
    Trash2,
  } from "@lucide/svelte";
  import { graphql } from "$lib/gql";
  import { CLEANING_MAP, cleaningStore } from "$lib/stores/cleaning.svelte";
  import { floorplanStore } from "$lib/stores/floorplan.svelte";
  import { pageHeader } from "$lib/stores/page-header.svelte";
  import { HistoryStack } from "$lib/stores/history.svelte";
  import { Button } from "$lib/components/ui/button";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "$lib/components/ui/select";
  import { Slider } from "$lib/components/ui/slider";
  import { DropdownMenuItem } from "$lib/components/ui/dropdown-menu";
  import MapViewport from "$lib/components/floorplan/map-viewport.svelte";
  import AlignmentLandmark from "$lib/components/floorplan/alignment-landmark.svelte";
  import PlanPointMenu from "$lib/components/floorplan/plan-point-menu.svelte";
  import type {
    FloorplanEditorApi,
    FloorplanViewport,
  } from "$lib/components/floorplan/floorplan-editor.svelte";
  import CleaningMapContent from "$lib/components/cleaning-map-content.svelte";
  import CleaningOverlay from "$lib/components/floorplan/cleaning-overlay.svelte";
  import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
  import ExternalChangeBanner from "$lib/components/external-change-banner.svelte";
  import { createEditorRefresh } from "$lib/editor-refresh.svelte";
  import { floorplanToGraph } from "$lib/floorplan-editable";
  import { formatMeters, type Point } from "$lib/floorplan";
  import { isEditableTarget } from "$lib/utils/keyboard";
  import { cleaningMapId } from "$lib/cleaning";
  import {
    fitCleaningMap,
    transformCleaningPoint,
    rotateCleaningPoint,
    cleaningMapCorners,
  } from "$lib/cleaning-map";
  import type { CleaningAnchor, CleaningMap } from "$lib/gql/graphql";
  import { graphqlErrorMessage } from "$lib/graphql-error";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";

  type Side = "robot" | "hive";
  type Draft = {
    anchors: CleaningAnchor[];
    rotation: number;
    pending: { side: Side; point: Point } | null;
    viewports: Partial<Record<Side, FloorplanViewport>>;
  };
  type Menu = {
    side: Side;
    point: Point;
    x: number;
    y: number;
    index: number | null;
  };
  const UPDATE = graphql(`
    mutation CleaningAlignmentSave($input: CleaningCalibrationInput!) {
      updateCleaningCalibration(input: $input) {
        revision
      }
    }
  `);
  const client = getContextClient();
  const id = $derived(page.params.id ?? "");
  const options = $derived(locale.messageOptions());
  const floorplan = $derived(floorplanStore.current);
  const plan = $derived(floorplan ? floorplanToGraph(floorplan) : null);
  let maps = $state<CleaningMap[]>([]),
    mapId = $state("");
  let revision = $state(0),
    enabled = $state(false),
    rotation = $state(0);
  let anchors = $state<CleaningAnchor[]>([]);
  let pending = $state<Draft["pending"]>(null);
  let opacity = $state(0.5),
    original = $state("");
  let loaded = $state(false),
    saving = $state(false);
  let apis = $state<Partial<Record<Side, FloorplanEditorApi>>>({});
  let panes = $state<Partial<Record<Side, HTMLDivElement>>>({});
  let menu = $state<Menu | null>(null),
    menuOpen = $state(false),
    menuRequest = 0;
  let viewports = $state<Partial<Record<Side, FloorplanViewport>>>({});
  const history = new HistoryStack<Draft>();
  const map = $derived(maps.find((item) => String(item.id) === mapId));
  const transform = $derived(fitCleaningMap(anchors));
  function snapshot(): Draft {
    return structuredClone(
      $state.snapshot({ anchors, rotation, pending, viewports }),
    );
  }
  function record() {
    const value = snapshot();
    if (JSON.stringify(value) !== JSON.stringify(history.current))
      history.push(value);
  }
  function restore(value: Draft | null) {
    if (value) {
      const restored = structuredClone($state.snapshot(value));
      anchors = restored.anchors;
      rotation = restored.rotation;
      pending = restored.pending;
      void tick().then(() =>
        requestAnimationFrame(() => {
          for (const side of ["robot", "hive"] as const) {
            const viewport = restored.viewports[side];
            if (viewport) apis[side]?.setViewport(viewport);
          }
          viewports = restored.viewports;
        }),
      );
    }
  }
  const dirty = $derived(
    loaded && JSON.stringify({ anchors, rotation, pending }) !== original,
  );
  const fitError = $derived.by(() =>
    !transform || !anchors.length
      ? null
      : Math.sqrt(
          anchors.reduce((sum, a) => {
            const p = transformCleaningPoint(transform, a.robot);
            return sum + (p.x - a.hive.x) ** 2 + (p.y - a.hive.y) ** 2;
          }, 0) / anchors.length,
        ),
  );

  async function read() {
    await Promise.all([
      cleaningStore.refresh(client),
      floorplanStore.refresh(client),
    ]);
    const robot = cleaningStore.byId.get(id),
      selected = mapId || (robot ? cleaningMapId(robot) : "");
    if (!floorplan || !selected) return null;
    const result = await client
      .query(
        CLEANING_MAP,
        { id, mapId: selected, floorplanId: floorplan.id },
        { requestPolicy: "network-only" },
      )
      .toPromise();
    if (result.error) throw result.error;
    return {
      data: {
        cleaningDevice: { maps: result.data?.cleaningDevice?.maps ?? [] },
        cleaningCalibration: result.data?.cleaningCalibration,
      },
      mapId: selected,
      floorplanRevision: floorplan.revision,
    };
  }
  function apply(value: Awaited<ReturnType<typeof read>>) {
    maps = value?.data?.cleaningDevice?.maps ?? [];
    mapId = value?.mapId ?? "";
    const calibration = value?.data?.cleaningCalibration;
    revision = calibration?.revision ?? 0;
    enabled = calibration?.enabled ?? false;
    rotation = calibration?.mapRotation ?? 0;
    anchors =
      calibration?.anchors.map((a) => ({
        robot: { x: a.robot.x, y: a.robot.y },
        hive: { x: a.hive.x, y: a.hive.y },
      })) ?? [];
    pending = null;
    menuOpen = false;
    original = JSON.stringify({ anchors, rotation, pending });
    history.reset(snapshot());
  }
  const guard = createEditorRefresh({
    read,
    apply,
    dirty: () => dirty,
    busy: () => saving || !loaded,
  });
  async function selectMap(value: string) {
    mapId = value;
    loaded = false;
    try {
      const result = await read();
      apply(result);
      guard.accept(result);
    } catch (e) {
      toast.error(
        graphqlErrorMessage(e, m.cleaning_alignment_load_failed({}, options)),
      );
    } finally {
      loaded = true;
    }
  }
  function worldPoint(side: Side, p: Point) {
    return side === "robot" && map ? rotateCleaningPoint(map, p, -rotation) : p;
  }
  function displayPoint(side: Side, p: Point) {
    return side === "robot" && map ? rotateCleaningPoint(map, p, rotation) : p;
  }
  function moveLandmark(side: Side, index: number, p: Point) {
    if (saving) return;
    const raw = worldPoint(side, p),
      point = {
        x: Math.round(raw.x * 1000) / 1000,
        y: Math.round(raw.y * 1000) / 1000,
      };
    if (index === anchors.length && pending) {
      pending = { side, point };
      return;
    }
    anchors = anchors.map((a, i) =>
      i === index ? { ...a, [side]: point } : a,
    );
  }
  async function openMenu(value: Menu) {
    const request = ++menuRequest;
    menuOpen = false;
    menu = value;
    await tick();
    if (request === menuRequest) menuOpen = true;
  }
  function context(side: Side, event: MouseEvent, api = apis[side]) {
    if (!api || saving) return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.target instanceof Element ? event.target : null,
      indexValue = target
        ?.closest("[data-landmark-index]")
        ?.getAttribute("data-landmark-index");
    const center =
      event.clientX === 0 && event.clientY === 0
        ? api.worldToClient(api.getViewportCenterWorld())
        : null;
    const x = center?.left ?? event.clientX,
      y = center?.top ?? event.clientY;
    void openMenu({
      side,
      x,
      y,
      index: indexValue == null ? null : Number(indexValue),
      point: worldPoint(side, api.clientToWorld(x, y)),
    });
  }
  async function retargetMenu(event: MouseEvent) {
    const { clientX: x, clientY: y } = event;
    const side = (["robot", "hive"] as const).find((candidate) => {
      const bounds = panes[candidate]
        ?.querySelector('[role="region"]')
        ?.getBoundingClientRect();
      return (
        bounds &&
        x >= bounds.left &&
        x <= bounds.right &&
        y >= bounds.top &&
        y <= bounds.bottom
      );
    });
    if (!side || !apis[side]) {
      if (menuOpen) { event.preventDefault(); menuOpen = false; }
      return;
    }
    event.preventDefault();
    menuOpen = false;
    await tick();
    const points = anchors.map((anchor) => anchor[side]);
    if (pending?.side === side) points.push(pending.point);
    let index: number | null = null;
    let distance = 22;
    for (const [candidate, point] of points.entries()) {
      const screen = apis[side]!.worldToClient(displayPoint(side, point));
      if (!screen) continue;
      const delta = Math.hypot(screen.left - x, screen.top - y);
      if (delta <= distance) {
        index = candidate;
        distance = delta;
      }
    }
    await openMenu({
      side,
      x,
      y,
      index,
      point: worldPoint(side, apis[side]!.clientToWorld(x, y)),
    });
  }
  function place() {
    const value = menu;
    menuOpen = false;
    if (!value || saving) return;
    if (pending && pending.side !== value.side) {
      anchors = [
        ...anchors,
        pending.side === "robot"
          ? { robot: pending.point, hive: value.point }
          : { robot: value.point, hive: pending.point },
      ];
      pending = null;
    } else pending = { side: value.side, point: value.point };
    record();
  }
  function remove() {
    const value = menu;
    menuOpen = false;
    if (!value || value.index === null || saving) return;
    if (value.index === anchors.length) pending = null;
    else anchors = anchors.filter((_, i) => i !== value.index);
    record();
  }
  async function rotate(delta: number) {
    rotation = (rotation + delta + 360) % 360;
    await tick();
    apis.robot?.fitToContent();
    if (apis.robot)
      viewports = { ...viewports, robot: apis.robot.getViewport() };
    record();
  }
  function viewportChanged(
    side: Side,
    viewport: FloorplanViewport,
    committed: boolean,
  ) {
    viewports = { ...viewports, [side]: viewport };
    if (committed) record();
    else if (history.stack.length === 1) history.reset(snapshot());
  }
  function keydown(event: KeyboardEvent) {
    if (isEditableTarget(event.target) || saving || menuOpen) return;
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key.toLowerCase() === "z") {
      event.preventDefault();
      restore(event.shiftKey ? history.redo() : history.undo());
    } else if (mod && event.key.toLowerCase() === "y") {
      event.preventDefault();
      restore(history.redo());
    } else if (event.key === "Escape" && pending) {
      pending = null;
      record();
    }
  }
  async function save() {
    if (!floorplan || !map || pending || guard.conflict) return;
    saving = true;
    try {
      const result = await client
        .mutation(UPDATE, {
          input: {
            enabled,
            mapRotation: rotation,
            deviceId: id,
            mapId,
            floorplanId: floorplan.id,
            expectedRevision: revision,
            mapRevision: map.revision,
            floorplanRevision: floorplan.revision,
            anchors: anchors.map((a) => ({
              robot: { x: a.robot.x, y: a.robot.y },
              hive: { x: a.hive.x, y: a.hive.y },
            })),
          },
        })
        .toPromise();
      if (result.error) throw result.error;
      const value = await read();
      apply(value);
      guard.accept(value);
    } catch (e) {
      toast.error(
        graphqlErrorMessage(e, m.cleaning_alignment_save_failed({}, options)),
      );
    } finally {
      saving = false;
    }
  }
  $effect(() => {
    pageHeader.breadcrumbs = [
      { label: m.nav_integrations({}, options), href: "/integrations" },
      { label: "Dreame", href: "/integrations/dreame" },
      { label: m.cleaning_align({}, options) },
    ];
    pageHeader.viewToggle = null;
    pageHeader.actions = [
      {
        label: m.common_save({}, options),
        icon: Save,
        saving,
        onclick: save,
        disabled: !dirty || !!pending || saving || guard.conflict,
      },
    ];
  });
  onMount(() => {
    void read()
      .then((value) => {
        apply(value);
        guard.accept(value);
        loaded = true;
      })
      .catch((e) => {
        toast.error(
          graphqlErrorMessage(e, m.cleaning_alignment_load_failed({}, options)),
        );
        loaded = true;
      });
  });
</script>

<svelte:window onkeydown={keydown} oncontextmenu={retargetMenu} />
<UnsavedGuard {dirty} />
{#if guard.conflict}<ExternalChangeBanner
    onreload={() => void guard.refresh(true)}
  />{/if}

{#if !loaded}<p class="text-sm text-muted-foreground">
    {m.common_loading({}, options)}
  </p>
{:else if !floorplan || !plan}<Button href="/map" variant="outline"
    >{m.cleaning_create_floorplan({}, options)}</Button
  >
{:else if !map}<p class="text-sm text-muted-foreground">
    {m.cleaning_position_unavailable({}, options)}
  </p>
{:else}
  <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={m.map_undo({}, options)}
        disabled={saving || !history.canUndo}
        onclick={() => restore(history.undo())}><Undo2 class="size-4" /></Button
      >
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={m.map_redo({}, options)}
        disabled={saving || !history.canRedo}
        onclick={() => restore(history.redo())}><Redo2 class="size-4" /></Button
      >
    </div>
    {#if pending}<span class="text-sm text-muted-foreground"
        >{m.cleaning_landmark_partner(
          {
            number: anchors.length + 1,
            map:
              pending.side === "robot"
                ? floorplan.name
                : m.cleaning_map_title(),
          },
          options,
        )}</span
      >{/if}
    {#if maps.length > 1}<Select
        type="single"
        value={mapId}
        disabled={dirty || saving}
        onValueChange={selectMap}
        ><SelectTrigger class="w-48" aria-label={m.cleaning_map({}, options)}
          >{map.name || map.id}</SelectTrigger
        ><SelectContent
          >{#each maps as item (item.id)}<SelectItem value={String(item.id)}
              >{item.name || item.id}</SelectItem
            >{/each}</SelectContent
        ></Select
      >{/if}
  </div>
  <div class="grid items-start gap-4 lg:grid-cols-2">
    <div data-alignment-side="robot" bind:this={panes.robot}>
      <MapViewport
        title={m.cleaning_map_title({}, options)}
        framePoints={cleaningMapCorners(map, rotation)}
        onready={(api) => (apis.robot = api)}
        onviewchange={(viewport, committed) =>
          viewportChanged("robot", viewport, committed)}
        oncontextmenu={(e, api) => context("robot", e, api)}
      >
        {#snippet actions()}
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={saving}
            aria-label={m.cleaning_rotate_left({}, options)}
            onclick={() => rotate(-90)}><RotateCcw class="size-4" /></Button
          >
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={saving}
            aria-label={m.cleaning_rotate_right({}, options)}
            onclick={() => rotate(90)}><RotateCw class="size-4" /></Button
          >
        {/snippet}
        {#snippet children(pxPerM)}
          <CleaningMapContent {map} {rotation} {pxPerM} />
          {#each anchors as anchor, index}<AlignmentLandmark
              point={displayPoint("robot", anchor.robot)}
              {index}
              {pxPerM}
              api={apis.robot}
              disabled={saving || menuOpen}
              onmove={(p) => moveLandmark("robot", index, p)}
              oncommit={record}
              oncontextmenu={(e) => context("robot", e)}
            />{/each}
          {#if pending?.side === "robot"}<AlignmentLandmark
              point={displayPoint("robot", pending.point)}
              index={anchors.length}
              {pxPerM}
              api={apis.robot}
              pending
              disabled={saving || menuOpen}
              onmove={(p) => moveLandmark("robot", anchors.length, p)}
              oncommit={record}
              oncontextmenu={(e) => context("robot", e)}
            />{/if}
        {/snippet}
      </MapViewport>
    </div>
    <div data-alignment-side="hive" bind:this={panes.hive}>
      <MapViewport
        title={floorplan.name}
        graph={plan.graph}
        onready={(api) => (apis.hive = api)}
        onviewchange={(viewport, committed) =>
          viewportChanged("hive", viewport, committed)}
        oncontextmenu={(e, api) => context("hive", e, api)}
      >
        {#snippet children(pxPerM)}
          {#if transform}<CleaningOverlay {map} {transform} {opacity} />{/if}
          {#each anchors as anchor, index}<AlignmentLandmark
              point={anchor.hive}
              {index}
              {pxPerM}
              api={apis.hive}
              disabled={saving || menuOpen}
              onmove={(p) => moveLandmark("hive", index, p)}
              oncommit={record}
              oncontextmenu={(e) => context("hive", e)}
            />{/each}
          {#if pending?.side === "hive"}<AlignmentLandmark
              point={pending.point}
              index={anchors.length}
              {pxPerM}
              api={apis.hive}
              pending
              disabled={saving || menuOpen}
              onmove={(p) => moveLandmark("hive", anchors.length, p)}
              oncommit={record}
              oncontextmenu={(e) => context("hive", e)}
            />{/if}
        {/snippet}
      </MapViewport>
      <div class="mt-4 flex items-center gap-3">
        <span class="text-sm">{m.cleaning_overlay({}, options)}</span>
        <Slider
          type="single"
          class="w-40"
          min={0}
          max={1}
          step={0.05}
          bind:value={opacity}
          aria-label={m.cleaning_overlay({}, options)}
        />
        {#if fitError !== null}<span
            class="text-xs tabular-nums text-muted-foreground"
            >{formatMeters(fitError)}</span
          >{/if}
      </div>
    </div>
  </div>
{/if}
<PlanPointMenu bind:open={menuOpen} at={menu ? { x: menu.x, y: menu.y } : null}>
  {#if menu?.index != null}<DropdownMenuItem
      variant="destructive"
      disabled={saving}
      onclick={remove}
      ><Trash2 class="size-4" />{m.common_delete({}, options)}</DropdownMenuItem
    >
  {:else}<DropdownMenuItem disabled={saving} onclick={place}
      ><Plus class="size-4" />{pending
        ? m.cleaning_place_landmark({ number: anchors.length + 1 }, options)
        : m.cleaning_add_landmark({}, options)}</DropdownMenuItem
    >{/if}
</PlanPointMenu>
