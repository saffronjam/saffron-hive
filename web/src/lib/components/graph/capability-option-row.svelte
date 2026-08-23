<script lang="ts">
	import { capabilityIcon } from "$lib/utils";

	interface Props {
		type: string;
		label: string;
		unit?: string | null;
	}

	let { type, label, unit = null }: Props = $props();
	const Icon = $derived(capabilityIcon(type));
</script>

<span class="flex min-w-0 items-center gap-2">
	<Icon class="size-3.5 shrink-0 text-muted-foreground" />
	<span class="truncate">{label}</span>
	{#if unit}
		<span class="shrink-0 text-muted-foreground">({unit})</span>
	{/if}
</span>
