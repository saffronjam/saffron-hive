<script lang="ts">
	import { X } from "@lucide/svelte";
	import { cn } from "$lib/utils";

	interface Props {
		message: string;
		ondismiss?: () => void;
		class?: string;
	}

	let { message, ondismiss, class: className }: Props = $props();
</script>

<div
	class={cn(
		"flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive",
		className,
	)}
>
	<span>{message}</span>
	{#if ondismiss}
		<button type="button" onclick={ondismiss} class="ml-2 shrink-0" aria-label="Dismiss">
			<X class="size-4" />
		</button>
	{/if}
</div>
