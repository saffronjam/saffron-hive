<script lang="ts" generics="Row">
	import type { Snippet } from "svelte";
	import { ArrowDown, ArrowUp, ChevronsUpDown } from "@lucide/svelte";
	import { TableHead } from "$lib/components/ui/table/index.js";
	import type { TableState } from "$lib/utils/table-state.svelte";
	import { cn } from "$lib/utils.js";

	interface Props {
		columnKey: string;
		state: TableState<Row>;
		class?: string;
		children?: Snippet;
	}

	let { columnKey, state, class: className, children }: Props = $props();

	const sortable = $derived(state.isSortable(columnKey));
	const dir = $derived(state.sortDir(columnKey));
	const ariaSort = $derived<"ascending" | "descending" | "none">(
		dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none",
	);

	function toggle() {
		if (sortable) state.toggleSort(columnKey);
	}

	function onkeydown(e: KeyboardEvent) {
		if (!sortable) return;
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			toggle();
		}
	}
</script>

<TableHead class={className} aria-sort={ariaSort}>
	{#if sortable}
		<button
			type="button"
			onclick={toggle}
			{onkeydown}
			class={cn(
				"group inline-flex items-center gap-1 select-none bg-transparent p-0 font-medium uppercase tracking-wide transition-colors focus:outline-none",
				dir
					? "text-foreground"
					: "text-muted-foreground hover:text-foreground focus-visible:text-foreground",
			)}
		>
			{#if children}{@render children()}{/if}
			{#if dir === "asc"}
				<ArrowUp class="size-3.5" />
			{:else if dir === "desc"}
				<ArrowDown class="size-3.5" />
			{:else}
				<ChevronsUpDown
					class="size-3.5 opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60"
				/>
			{/if}
		</button>
	{:else if children}
		{@render children()}
	{/if}
</TableHead>
