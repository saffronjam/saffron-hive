<script lang="ts">
	import type { Snippet } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Pencil, Trash2 } from "@lucide/svelte";

	interface Props {
		editHref?: string;
		ondelete?: () => void;
		editLabel?: string;
		deleteLabel?: string;
		leading?: Snippet;
	}

	let {
		editHref,
		ondelete,
		editLabel = "Edit",
		deleteLabel = "Delete",
		leading,
	}: Props = $props();
</script>

<div class="flex items-center justify-end gap-1">
	{@render leading?.()}
	{#if editHref}
		<Button variant="ghost" size="icon-sm" href={editHref} aria-label={editLabel}>
			<Pencil class="size-4" />
		</Button>
	{/if}
	{#if ondelete}
		<Button
			variant="ghost"
			size="icon-sm"
			onclick={ondelete}
			aria-label={deleteLabel}
			class="text-destructive hover:text-destructive"
		>
			<Trash2 class="size-4" />
		</Button>
	{/if}
</div>
