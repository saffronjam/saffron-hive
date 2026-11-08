<script lang="ts">
  import type { Snippet } from "svelte";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  let { children }: { children: Snippet } = $props();
</script>

<Card>
  <CardHeader><CardTitle>{m.device_control({}, locale.messageOptions())}</CardTitle></CardHeader>
  <CardContent>{@render children()}</CardContent>
</Card>
