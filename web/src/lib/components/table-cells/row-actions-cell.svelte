<script lang="ts">
	import type { Snippet } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import { Pencil, Trash2 } from "@lucide/svelte";

	interface Props {
		onedit?: () => void;
		ondelete?: () => void;
		editLabel?: string;
		deleteLabel?: string;
		editTooltip?: string;
		deleteTooltip?: string;
		leading?: Snippet;
	}

	let {
		onedit,
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
	{#if onedit}
		<Tooltip>
			<TooltipTrigger>
				<Button variant="ghost" size="icon-sm" onclick={onedit} aria-label={editLabel}>
					<Pencil class="size-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{editTooltip}</TooltipContent>
		</Tooltip>
	{/if}
	{#if ondelete}
		<Tooltip>
			<TooltipTrigger>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={ondelete}
					aria-label={deleteLabel}
					class="text-destructive hover:text-destructive"
				>
					<Trash2 class="size-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{deleteTooltip}</TooltipContent>
		</Tooltip>
	{/if}
</div>
