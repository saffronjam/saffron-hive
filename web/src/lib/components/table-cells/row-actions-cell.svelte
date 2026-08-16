<script lang="ts">
	import type { Snippet } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import LazyTooltip from "$lib/components/lazy-tooltip.svelte";
	import { Pencil, Trash2 } from "@lucide/svelte";

	interface Props {
		editHref?: string;
		ondelete?: () => void;
		editLabel?: string;
		deleteLabel?: string;
		editTooltip?: string;
		deleteTooltip?: string;
		leading?: Snippet;
	}

	let {
		editHref,
		ondelete,
		editLabel = "Edit",
		deleteLabel = "Delete",
		editTooltip = "Edit",
		deleteTooltip = "Delete",
		leading,
	}: Props = $props();
</script>

<div class="flex items-center justify-end gap-1">
	{@render leading?.()}
	{#if editHref}
		<LazyTooltip content={editTooltip}>
			{#snippet children(props)}
				<Button
					{...props}
					variant="ghost"
					size="icon-sm"
					href={editHref}
					aria-label={editLabel}
				>
					<Pencil class="size-4" />
				</Button>
			{/snippet}
		</LazyTooltip>
	{/if}
	{#if ondelete}
		<LazyTooltip content={deleteTooltip}>
			{#snippet children(props)}
				<Button
					{...props}
					variant="ghost"
					size="icon-sm"
					onclick={ondelete}
					aria-label={deleteLabel}
					class="text-destructive hover:text-destructive"
				>
					<Trash2 class="size-4" />
				</Button>
			{/snippet}
		</LazyTooltip>
	{/if}
</div>
