<script lang="ts" generics="Row">
	import type { Snippet } from "svelte";
	import { get } from "svelte/store";
	import { createVirtualizer } from "@tanstack/svelte-virtual";
	import ColumnVisibilityMenu from "./column-visibility-menu.svelte";
	import { ChevronDown, ChevronRight } from "@lucide/svelte";
  import type { ColumnDef, TableState } from "$lib/utils/table-state.svelte";
	import { cn } from "$lib/utils.js";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		tableState: TableState<Row>;
		columns: ColumnDef<Row>[];
		rows: Row[];
		rowId: (row: Row) => string;
		rowAttrs?: (row: Row) => Record<string, string | null | undefined>;
		rowClass?: (row: Row) => string | undefined;
    onRowClick?: (row: Row) => void;
		hasMore: boolean;
		loadingMore: boolean;
		onLoadMore: () => void;
		expandedContent?: Snippet<[row: Row]>;
		expandedHeight?: number;
		collapsedHeight?: number;
    scrollElement?: HTMLDivElement | null;
    showColumnMenu?: boolean;
		class?: string;
	}

	let {
		tableState,
		columns,
		rows,
		rowId,
		rowAttrs,
		rowClass,
    onRowClick,
		hasMore,
		loadingMore,
		onLoadMore,
		expandedContent,
		expandedHeight = 320,
		collapsedHeight = 36,
    scrollElement = $bindable(null),
    showColumnMenu = true,
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
      showColumnMenu ? MENU_CELL_WIDTH : null,
		]
			.filter((w): w is string => w !== null)
			.join(" "),
	);

	let expanded = $state<Set<string>>(new Set());

	const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
		count: 0,
    getScrollElement: () => scrollElement!,
		estimateSize: () => collapsedHeight,
		overscan: 8,
	});

	$effect(() => {
		get(virtualizer).setOptions({
			count: rows.length,
      getScrollElement: () => scrollElement!,
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
    void collapsedHeight;
    void expandedHeight;
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

  function activateRow(event: MouseEvent, row: Row) {
    const control =
      event.target instanceof Element
        ? event.target.closest(
            "button, a, input, select, textarea, [role='button'], [role='link'], [contenteditable='true']",
          )
        : null;
    if (control && control !== event.currentTarget) return;
    onRowClick?.(row);
  }

  function activateRowKeydown(event: KeyboardEvent, row: Row) {
    if (event.target !== event.currentTarget) return;
    if (onRowClick && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onRowClick(row);
    }
  }
</script>

{#snippet rowCells(row: Row)}
  {#each visibleColumns as col (col.key)}
    <div class={cn("min-w-0", col.cellClass)}>
      {#if col.cell}
        {@render col.cell(row)}
      {/if}
    </div>
  {/each}
  {#if showColumnMenu}<div></div>{/if}
{/snippet}

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
    {#if showColumnMenu}<div class="flex justify-end">
			<ColumnVisibilityMenu {tableState} {columns} />
      </div>{/if}
	</div>

  <div
    bind:this={scrollElement}
    data-slot="navigation-table-scroll"
    class="min-h-0 flex-1 overflow-auto overscroll-contain"
  >
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
                    <ChevronDown class="size-4 text-muted-foreground" />
									{:else}
                    <ChevronRight class="size-4 text-muted-foreground" />
										{/if}
									</div>
                {@render rowCells(row)}
							</div>
							{#if isOpen}
								<div
									class="bg-muted/30 px-2 py-2"
									style="height: {expandedHeight - collapsedHeight}px;"
								>
									{@render expandedContent(row)}
								</div>
							{/if}
            {:else if onRowClick}
              <div
                role="button"
                tabindex="0"
                onclick={(event) => activateRow(event, row)}
                onkeydown={(event) => activateRowKeydown(event, row)}
                class="grid items-center px-2 text-sm hover:bg-muted/60 focus-visible:outline-none focus-visible:bg-muted/70"
                style="grid-template-columns: {gridTemplate}; height: {collapsedHeight}px;"
              >
                {@render rowCells(row)}
              </div>
						{:else}
							<div
								class="grid items-center px-2 text-sm"
								style="grid-template-columns: {gridTemplate}; height: {collapsedHeight}px;"
							>
                {@render rowCells(row)}
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
		{#if loadingMore}
			<div class="py-3 text-center text-xs text-muted-foreground">
				{m.history_loading_more({}, locale.messageOptions())}
			</div>
		{:else if !hasMore && rows.length > 0}
			<div class="py-3 text-center text-xs text-muted-foreground">
				{m.history_end({}, locale.messageOptions())}
			</div>
		{/if}
	</div>
</div>
