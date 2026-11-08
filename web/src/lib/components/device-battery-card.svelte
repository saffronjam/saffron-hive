<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import ProgressBar from "$lib/components/progress-bar.svelte";
  import { formatPercent } from "$lib/i18n/format";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  let { value }: { value?: number | null } = $props();
  const reported = $derived(value != null && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null);
</script>

{#if reported !== null}
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between gap-4">
        <CardTitle>{m.field_battery({}, locale.messageOptions())}</CardTitle>
        <span class="text-sm tabular-nums text-muted-foreground">{formatPercent(reported / 100)}</span>
      </div>
    </CardHeader>
    <CardContent><ProgressBar value={reported} label={m.field_battery({}, locale.messageOptions())} warnLow /></CardContent>
  </Card>
{/if}
