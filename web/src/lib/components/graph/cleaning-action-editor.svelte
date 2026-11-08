<script lang="ts">
  import { Checkbox } from "$lib/components/ui/checkbox";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "$lib/components/ui/select";
  import SegmentedControl from "$lib/components/segmented-control.svelte";
  import { cleaningStore } from "$lib/stores/cleaning.svelte";
  import { roomsStore } from "$lib/stores/rooms.svelte";
  import { cleaningLinks, expandCleaningRooms } from "$lib/cleaning";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  let {
    deviceId,
    kind,
    value,
    disabled = false,
    onchange,
  }: {
    deviceId: string;
    kind: string;
    value: string;
    disabled?: boolean;
    onchange: (value: string) => void;
  } = $props();
  interface Payload {
    roomIds?: string[];
    options?: {
      repeats?: number;
      suction?: number | null;
      water?: number | null;
    };
    action?: string;
  }
  const payload = $derived.by<Payload>(() => {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  });
  const robot = $derived(cleaningStore.byId.get(deviceId));
  const links = $derived(robot ? cleaningLinks(robot) : []);
  const rooms = $derived(
    roomsStore.items.filter(
      (r) =>
        links.some((l) => l.roomId === r.id) ||
        (payload.roomIds ?? []).includes(r.id),
    ),
  );
  const missing = $derived(
    (payload.roomIds ?? []).filter((id) => !roomsStore.byId.has(id)),
  );
  const unlinked = $derived(
    (payload.roomIds ?? []).some(
      (id) => !links.some((link) => link.roomId === id),
    ),
  );
  const expanded = $derived(expandCleaningRooms(links, payload.roomIds ?? []));
  const options = $derived(locale.messageOptions());
  const actions = $derived([
    { id: "pause", label: m.cleaning_pause({}, options) },
    { id: "resume", label: m.cleaning_resume({}, options) },
    { id: "stop", label: m.cleaning_stop({}, options) },
    { id: "dock", label: m.cleaning_dock({}, options) },
    { id: "locate", label: m.cleaning_locate({}, options) },
    { id: "empty_bin", label: m.cleaning_empty_bin({}, options) },
  ]);
  function toggle(id: string) {
    const group = new Set(expandCleaningRooms(links, [id]));
    const selected = expanded.includes(id)
      ? expanded.filter((id) => !group.has(id))
      : [...expanded, id];
    onchange(
      JSON.stringify({
        ...payload,
        roomIds: expandCleaningRooms(links, selected),
      }),
    );
  }
  function option(key: "suction" | "water" | "repeats", value: number | null) {
    const next = { repeats: 1, ...payload.options, [key]: value };
    onchange(JSON.stringify({ ...payload, options: next }));
  }
</script>

{#if kind === "control_cleaning"}
  <Select
    type="single"
    value={payload.action ?? "dock"}
    {disabled}
    onValueChange={(action) => onchange(JSON.stringify({ action }))}
    ><SelectTrigger aria-label={m.cleaning_control({}, options)}
      >{actions.find((a) => a.id === payload.action)?.label ??
        m.cleaning_dock({}, options)}</SelectTrigger
    ><SelectContent
      >{#each actions as a (a.id)}<SelectItem value={a.id}>{a.label}</SelectItem
        >{/each}</SelectContent
    ></Select
  >
{:else if deviceId}
  <div class="space-y-1">
    {#each rooms as room (room.id)}<label
        class="flex cursor-pointer items-center gap-2 py-1.5 text-xs"
        ><Checkbox
          checked={expanded.includes(room.id)}
          {disabled}
          onCheckedChange={() => toggle(room.id)}
        />{room.name}</label
      >{/each}
  </div>
  {#each missing as id}<label
      class="flex items-center gap-2 py-1.5 text-xs text-muted-foreground"
      ><Checkbox
        checked
        {disabled}
        onCheckedChange={() =>
          onchange(
            JSON.stringify({
              ...payload,
              roomIds: (payload.roomIds ?? []).filter((room) => room !== id),
            }),
          )}
      />{m.cleaning_missing_room({}, options)}</label
    >{/each}
  {#if !rooms.length || unlinked}<a
      href={`/integrations/dreame/${deviceId}/rooms`}
      class="text-xs underline underline-offset-4"
      >{m.cleaning_link_rooms({}, options)}</a
    >{/if}
  {#if expanded.some((id) => expandCleaningRooms(links, [id]).length > 1)}<p
      class="text-xs text-muted-foreground"
    >
      {m.cleaning_shared_rooms({}, options)}
    </p>{/if}
  <details>
    <summary class="cursor-pointer py-2 text-xs"
      >{m.cleaning_options({}, options)}</summary
    >
    <div class="space-y-2">
      <div class="grid justify-items-start gap-1.5">
        <span class="text-xs">{m.cleaning_repeats({}, options)}</span>
        <SegmentedControl
          value={String(payload.options?.repeats ?? 1)}
          options={[1, 2, 3].map((passes) => ({ value: String(passes), label: String(passes), disabled }))}
          ariaLabel={m.cleaning_repeats({}, options)}
          class="w-fit [&_button]:min-w-12 [&_button]:px-4"
          onchange={(passes) => option("repeats", Number(passes))}
        />
      </div>
      {#each ["suction", "water"] as key}
        {@const choices =
          key === "suction"
            ? [
                m.cleaning_quiet({}, options),
                m.cleaning_standard({}, options),
                m.cleaning_strong({}, options),
                m.cleaning_turbo({}, options),
              ]
            : [
                m.cleaning_low({}, options),
                m.cleaning_medium({}, options),
                m.cleaning_high({}, options),
              ]}
        {@const selected = payload.options?.[key as "suction" | "water"]}
        <Select
          type="single"
          value={selected == null ? "default" : String(selected)}
          {disabled}
          onValueChange={(v) =>
            option(
              key as "suction" | "water",
              v === "default" ? null : Number(v),
            )}
          ><SelectTrigger
            aria-label={key === "suction"
              ? m.cleaning_suction({}, options)
              : m.cleaning_water({}, options)}
            >{selected == null
              ? m.cleaning_robot_settings({}, options)
              : choices[selected - (key === "water" ? 1 : 0)]}</SelectTrigger
          ><SelectContent
            ><SelectItem value="default"
              >{m.cleaning_robot_settings({}, options)}</SelectItem
            >{#each choices as name, i}<SelectItem
                value={String(i + (key === "water" ? 1 : 0))}>{name}</SelectItem
              >{/each}</SelectContent
          ></Select
        >
      {/each}
    </div>
  </details>
{/if}
