<script lang="ts">
  import { Card, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Switch } from "$lib/components/ui/switch";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  let { checked, onchange, disabled = false }: { checked: boolean; onchange: (checked: boolean) => void; disabled?: boolean } = $props();
</script>

<Card>
  <CardHeader>
    <div class="flex items-center justify-between gap-4">
      <CardTitle>{m.device_power({}, locale.messageOptions())}</CardTitle>
      <Switch {checked} {disabled} onCheckedChange={onchange} aria-label={m.device_power({}, locale.messageOptions())} />
    </div>
  </CardHeader>
</Card>
