<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	let { onreload }: { onreload: () => void } = $props();
</script>

<div
	class="bg-card shadow-card mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg p-4"
	role="status"
>
	<p class="text-sm">{m.editor_changed_elsewhere({}, locale.messageOptions())}</p>
	<Button variant="outline" size="sm" onclick={onreload}
		>{m.editor_reload_saved({}, locale.messageOptions())}</Button
	>
</div>
