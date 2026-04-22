<script lang="ts">
	import type { Snippet } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { X } from "@lucide/svelte";

	interface Props {
		count: number;
		onclear: () => void;
		actions: Snippet;
	}

	let { count, onclear, actions }: Props = $props();
</script>

<div
	class="flex h-9 items-center gap-3 whitespace-nowrap rounded-md shadow-card bg-card pl-3 pr-1"
	role="toolbar"
	aria-label="Batch actions"
>
	<span class="text-sm font-medium">{count} selected</span>
	<div class="flex items-center gap-1">
		{@render actions()}
		<Button
			variant="ghost"
			size="icon-sm"
			onclick={onclear}
			aria-label="Clear selection"
		>
			<X class="size-4" />
		</Button>
	</div>
</div>
