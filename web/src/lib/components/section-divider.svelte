<script lang="ts">
	import { cn } from "$lib/utils";

	interface Props {
		/** Omit for a plain rule with no heading. */
		label?: string;
		class?: string;
	}

	let { label, class: className }: Props = $props();
</script>

<div class={cn("flex items-center gap-3", className)}>
	{#if label}
		<h2 class="text-sm font-medium text-muted-foreground">{label}</h2>
	{/if}
	<div class="h-px flex-1 bg-border" aria-hidden="true"></div>
</div>
