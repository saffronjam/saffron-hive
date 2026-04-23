<script lang="ts" generics="Row">
	import type { Snippet } from "svelte";
	import { get } from "svelte/store";
	import { createVirtualizer } from "@tanstack/svelte-virtual";
	import ColumnVisibilityMenu from "./column-visibility-menu.svelte";
	import { ChevronDown, ChevronRight } from "@lucide/svelte";
	import type {
		ColumnDef,
		TableState,
	} from "$lib/utils/table-state.svelte";
	import { cn } from "$lib/utils.js";

	interface Props {
		tableState: TableState<Row>;
		columns: ColumnDef<Row>[];
		rows: Row[];
		rowId: (row: Row) => string;
		rowAttrs?: (row: Row) => Record<string, string | null | undefined>;
		rowClass?: (row: Row) => string | undefined;
		hasMore: boolean;
		loadingMore: boolean;
		onLoadMore: () => void;
		expandedContent?: Snippet<[row: Row]>;
		expandedHeight?: number;
		collapsedHeight?: number;
		class?: string;
	}

	let {
		tableState,
		columns,
		rows,
		rowId,
		rowAttrs,
		rowClass,
		hasMore,
		loadingMore,
		onLoadMore,
		expandedContent,
		expandedHeight = 320,
		collapsedHeight = 36,
		class: className,
	}: Props = $props();

	const LOAD_THRESHOLD = 10;
	const MENU_CELL_WIDTH = "2.5rem";
	const CHEVRON_CELL_WIDTH = "1.5rem";

	const columnByKey = $derived(new Map(columns.map((c) => [c.key, c])));

	const visibleColumns = $derived(
		tableState
			.visibleOrderedKeys()
			.map((k) => columnByKey.get(k))
			.filter((c): c is ColumnDef<Row> => c !== undefined),
	);

	const gridTemplate = $derived(
		[
			expandedContent ? CHEVRON_CELL_WIDTH : null,
			...visibleColumns.map((c) => c.width ?? "1fr"),
			MENU_CELL_WIDTH,
		]
			.filter((w): w is string => w !== null)
			.join(" "),
	);

	let scrollEl: HTMLDivElement | null = $state(null);
	let expanded = $state<Set<string>>(new Set());

	const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
		count: 0,
		getScrollElement: () => scrollEl!,
		estimateSize: () => collapsedHeight,
		overscan: 8,
	});

	$effect(() => {
		get(virtualizer).setOptions({
			count: rows.length,
			getScrollElement: () => scrollEl!,
			overscan: 8,
			estimateSize: (index) => {
				const row = rows[index];
				if (!row || !expandedContent) return collapsedHeight;
				const id = rowId(row);
				return expanded.has(id) ? expandedHeight : collapsedHeight;
			},
			getItemKey: (index) => {
				const row = rows[index];
				return row ? rowId(row) : index;
			},
		});
	});

	$effect(() => {
		void rows.length;
		get(virtualizer).measure();
	});

	$effect(() => {
		const items = $virtualizer.getVirtualItems();
		const last = items.at(-1);
		if (!last) return;
		if (!hasMore || loadingMore) return;
		if (last.index >= rows.length - LOAD_THRESHOLD) {
			onLoadMore();
		}
	});

	function toggleExpand(id: string) {
		if (!expandedContent) return;
		const next = new Set(expanded);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		expanded = next;
		get(virtualizer).measure();
	}

	function onRowKeydown(e: KeyboardEvent, id: string) {
		if (!expandedContent) return;
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			toggleExpand(id);
		}
	}
</script>

<div
	class={cn(
		"flex h-full flex-col overflow-hidden rounded-lg shadow-card bg-card",
		className,
	)}
>
	<div
		class="grid flex-shrink-0 items-center border-b border-border/50 bg-card px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
		style="grid-template-columns: {gridTemplate};"
	>
		{#if expandedContent}
			<div></div>
		{/if}
		{#each visibleColumns as col (col.key)}
			<div class={cn("min-w-0 truncate", col.headClass)}>
				{#if col.head}
					{@render col.head()}
				{:else}
					{col.label}
				{/if}
			</div>
		{/each}
		<div class="flex justify-end">
			<ColumnVisibilityMenu {tableState} {columns} />
		</div>
	</div>

	<div bind:this={scrollEl} class="min-h-0 flex-1 overflow-auto">
		<div
			style="height: {$virtualizer.getTotalSize()}px; position: relative; width: 100%;"
		>
			{#each $virtualizer.getVirtualItems() as item (item.key)}
				{@const row = rows[item.index]}
				{#if row}
					{@const id = rowId(row)}
					{@const isOpen = expanded.has(id)}
					{@const extra = rowAttrs?.(row) ?? {}}
					{@const extraClass = rowClass?.(row)}
					<div
						class={cn(
							"absolute left-0 w-full",
							item.index % 2 === 1 && "bg-muted/40",
							extraClass,
						)}
						style="top: {item.start}px; height: {item.size}px;"
						{...extra}
					>
						{#if expandedContent}
							<div
								role="button"
								tabindex="0"
								onclick={() => toggleExpand(id)}
								onkeydown={(e) => onRowKeydown(e, id)}
								class="grid items-center px-2 text-sm hover:bg-muted/60 focus:outline-none focus:bg-muted/70"
								style="grid-template-columns: {gridTemplate}; height: {collapsedHeight}px;"
							>
								<div class="flex items-center">
									{#if isOpen}
										<ChevronDown
											class="size-4 text-muted-foreground"
										/>
									{:else}
										<ChevronRight
											class="size-4 text-muted-foreground"
										/>
									{/if}
								</div>
								{#each visibleColumns as col (col.key)}
									<div class={cn("min-w-0", col.cellClass)}>
										{#if col.cell}
											{@render col.cell(row)}
										{/if}
									</div>
								{/each}
								<div></div>
							</div>
							{#if isOpen}
								<div
									class="bg-muted/30 px-2 py-2"
									style="height: {expandedHeight - collapsedHeight}px;"
								>
									{@render expandedContent(row)}
								</div>
							{/if}
						{:else}
							<div
								class="grid items-center px-2 text-sm"
								style="grid-template-columns: {gridTemplate}; height: {collapsedHeight}px;"
							>
								{#each visibleColumns as col (col.key)}
									<div class={cn("min-w-0", col.cellClass)}>
										{#if col.cell}
											{@render col.cell(row)}
										{/if}
									</div>
								{/each}
								<div></div>
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
		{#if loadingMore}
			<div class="py-3 text-center text-xs text-muted-foreground">
				Loading more…
			</div>
		{:else if !hasMore && rows.length > 0}
			<div class="py-3 text-center text-xs text-muted-foreground">
				End of history
			</div>
		{/if}
	</div>
</div>
