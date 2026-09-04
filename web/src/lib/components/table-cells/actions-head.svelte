<script lang="ts">
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
</script>

<span class="block text-right">{m.shared_actions({}, locale.messageOptions())}</span>
