<script lang="ts">
	import type { Snippet } from "svelte";
	import { cn } from "$lib/utils";

	interface Props {
		/** Omit for a plain rule with no heading. */
		label?: string;
		children?: Snippet;
		class?: string;
	}

	let { label, children, class: className }: Props = $props();
</script>

<div class={cn("flex items-center gap-3", className)}>
	{#if label}
		<h2 class="shrink-0 text-sm font-medium text-muted-foreground">{label}</h2>
	{/if}
	<div class="h-px flex-1 bg-border" aria-hidden="true"></div>
	{#if children}<div class="min-w-0 shrink-0">{@render children()}</div>{/if}
</div>
