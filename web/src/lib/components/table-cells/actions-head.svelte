<script lang="ts">
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	let { label }: { label?: string } = $props();
</script>

<span class="block text-right">{label ?? m.shared_actions({}, locale.messageOptions())}</span>
