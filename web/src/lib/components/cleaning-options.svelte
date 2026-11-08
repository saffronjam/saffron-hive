<script lang="ts">
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "$lib/components/ui/select";
  import SegmentedControl from "$lib/components/segmented-control.svelte";
  import type { CleaningOptionsInput } from "$lib/gql/graphql";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  let {
    value = $bindable(),
    disabled = false,
  }: { value: CleaningOptionsInput; disabled?: boolean } = $props();
  const options = $derived(locale.messageOptions());
  const suctions = $derived([
    m.cleaning_quiet({}, options),
    m.cleaning_standard({}, options),
    m.cleaning_strong({}, options),
    m.cleaning_turbo({}, options),
  ]);
  const waters = $derived([
    m.cleaning_low({}, options),
    m.cleaning_medium({}, options),
    m.cleaning_high({}, options),
  ]);
</script>

<div class="grid gap-5 sm:grid-cols-3">
  <div class="grid gap-1.5">
    <span class="text-sm font-medium">{m.cleaning_suction({}, options)}</span>
    <Select
      type="single"
      value={value.suction == null ? "" : String(value.suction)}
      {disabled}
      onValueChange={(v) =>
        (value = { ...value, suction: v === "" ? null : Number(v) })}
    >
      <SelectTrigger class="w-full" aria-label={m.cleaning_suction({}, options)}
        >{value.suction == null
          ? m.cleaning_robot_settings({}, options)
          : suctions[value.suction]}</SelectTrigger
      >
      <SelectContent
        ><SelectItem value=""
          >{m.cleaning_robot_settings({}, options)}</SelectItem
        >{#each suctions as label, i}<SelectItem value={String(i)}
            >{label}</SelectItem
          >{/each}</SelectContent
      >
    </Select>
  </div>
  <div class="grid gap-1.5">
    <span class="text-sm font-medium">{m.cleaning_water({}, options)}</span>
    <Select
      type="single"
      value={value.water == null ? "" : String(value.water)}
      {disabled}
      onValueChange={(v) =>
        (value = { ...value, water: v === "" ? null : Number(v) })}
    >
      <SelectTrigger class="w-full" aria-label={m.cleaning_water({}, options)}
        >{value.water == null
          ? m.cleaning_robot_settings({}, options)
          : waters[value.water - 1]}</SelectTrigger
      >
      <SelectContent
        ><SelectItem value=""
          >{m.cleaning_robot_settings({}, options)}</SelectItem
        >{#each waters as label, i}<SelectItem value={String(i + 1)}
            >{label}</SelectItem
          >{/each}</SelectContent
      >
    </Select>
  </div>
  <div class="grid gap-1.5">
    <span class="text-sm font-medium"
      >{m.cleaning_repeats({}, options)}</span
    >
    <SegmentedControl
      value={String(value.repeats ?? 1)}
      options={[1, 2, 3].map((passes) => ({ value: String(passes), label: String(passes), disabled }))}
      ariaLabel={m.cleaning_repeats({}, options)}
      class="w-fit [&_button]:min-w-12 [&_button]:px-4"
      onchange={(passes) => (value = { ...value, repeats: Number(passes) })}
    />
  </div>
</div>
