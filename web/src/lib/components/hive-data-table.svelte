<script lang="ts" generics="Row">
	import { flip } from "svelte/animate";
	import { onDestroy } from "svelte";
	import {
		Table,
		TableBody,
		TableHeader,
		TableRow,
	} from "$lib/components/ui/table/index.js";
	import ColumnVisibilityMenu from "./column-visibility-menu.svelte";
	import { ArrowDown, ArrowUp, ChevronsUpDown } from "@lucide/svelte";
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
		class?: string;
	}

	let {
		tableState,
		columns,
		rows,
		rowId,
		rowAttrs,
		class: className,
	}: Props = $props();

	const columnByKey = $derived(new Map(columns.map((c) => [c.key, c])));

	let dragKey = $state<string | null>(null);
	// Ephemeral override of the visible column order while a drag is in
	// progress. Non-null values drive the {#each} loop so animate:flip can
	// animate cells into their new slots as the pointer crosses midpoints.
	// The authoritative tableState.order is only updated on pointerup.
	let dragVisualOrder = $state<string[] | null>(null);
	// Pixels to translate the dragged header so it follows the pointer.
	let dragTranslateX = $state(0);
	let dropBeforeKey: string | null = null;
	let suppressSortClick = false;
	let suppressTimer: ReturnType<typeof setTimeout> | null = null;

	let pressState: { key: string; x: number; y: number } | null = null;
	let headerRowEl = $state<HTMLElement | null>(null);
	// Pixel offset into the grabbed cell where the pointer first landed,
	// captured at pointerdown and used to keep the pointer at the same
	// relative position within the cell for the duration of the drag.
	let grabOffsetX = 0;
	// Widths captured once at pointerdown. Midpoints are then computed
	// analytically (headerRow.left + cumulative widths) instead of via
	// getBoundingClientRect, so the flip animation's transforms can't feed
	// back into drop-target detection and cause oscillation.
	const widthsByKey = new Map<string, number>();

	const visibleColumns = $derived(
		(dragVisualOrder ?? tableState.visibleOrderedKeys())
			.map((k) => columnByKey.get(k))
			.filter((c): c is ColumnDef<Row> => c !== undefined),
	);

	const DRAG_THRESHOLD = 6;
	const FLIP_OPTS = { duration: 220 };

	function isPinned(key: string): boolean {
		return columnByKey.get(key)?.hideable === false;
	}

	function onHeadPointerDown(e: PointerEvent, key: string) {
		if (e.button !== 0) return;
		if (isPinned(key)) return;
		if (e.currentTarget instanceof HTMLElement) {
			grabOffsetX = e.clientX - e.currentTarget.getBoundingClientRect().left;
		} else {
			grabOffsetX = 0;
		}
		captureWidths();
		pressState = { key, x: e.clientX, y: e.clientY };
		window.addEventListener("pointermove", onWindowPointerMove);
		window.addEventListener("pointerup", onWindowPointerUp, { once: true });
	}

	function captureWidths() {
		widthsByKey.clear();
		if (!headerRowEl) return;
		for (const el of Array.from(
			headerRowEl.querySelectorAll("[data-col-key]"),
		)) {
			if (!(el instanceof HTMLElement)) continue;
			const k = el.dataset.colKey;
			if (typeof k !== "string") continue;
			widthsByKey.set(k, el.offsetWidth);
		}
	}

	function onWindowPointerMove(e: PointerEvent) {
		if (!pressState) return;
		const dx = e.clientX - pressState.x;
		const dy = e.clientY - pressState.y;
		if (dragKey === null) {
			if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
			dragKey = pressState.key;
		}
		updateDropTarget(e.clientX);
		updateDragTranslate(e.clientX);
	}

	function updateDragTranslate(pointerX: number) {
		if (!headerRowEl || dragKey === null) {
			dragTranslateX = 0;
			return;
		}
		const currentOrder =
			dragVisualOrder ?? tableState.visibleOrderedKeys();
		let accLeft = headerRowEl.getBoundingClientRect().left;
		for (const k of currentOrder) {
			if (k === dragKey) break;
			accLeft += widthsByKey.get(k) ?? 0;
		}
		dragTranslateX = pointerX - accLeft - grabOffsetX;
	}

	function updateDropTarget(pointerX: number) {
		if (!headerRowEl || dragKey === null) return;
		const currentOrder =
			dragVisualOrder ?? tableState.visibleOrderedKeys();
		const rowLeft = headerRowEl.getBoundingClientRect().left;
		let accLeft = rowLeft;
		let chosenBefore: string | null = null;
		for (const k of currentOrder) {
			const w = widthsByKey.get(k) ?? 0;
			if (k === dragKey || isPinned(k)) {
				accLeft += w;
				continue;
			}
			const mid = accLeft + w / 2;
			if (pointerX < mid) {
				chosenBefore = k;
				break;
			}
			accLeft += w;
		}
		if (chosenBefore === null) {
			// Pointer past every non-pinned midpoint: place at the end of the
			// non-pinned range, i.e. immediately before the first right-pinned
			// column (or null if none exists).
			const order = tableState.orderedKeys();
			for (let i = order.length - 1; i >= 0; i--) {
				const k = order[i];
				if (k === dragKey) continue;
				if (!isPinned(k)) {
					chosenBefore = i + 1 < order.length ? order[i + 1] : null;
					break;
				}
			}
		}
		if (chosenBefore === dropBeforeKey) return;
		dropBeforeKey = chosenBefore;
		dragVisualOrder = computeVisualOrder(dragKey, chosenBefore);
	}

	function computeVisualOrder(
		draggedKey: string,
		beforeKey: string | null,
	): string[] {
		const base = tableState
			.visibleOrderedKeys()
			.filter((k) => k !== draggedKey);
		let insertAt = base.length;
		if (beforeKey !== null) {
			const idx = base.indexOf(beforeKey);
			if (idx !== -1) insertAt = idx;
		}
		const next = base.slice();
		next.splice(insertAt, 0, draggedKey);
		return next;
	}

	function onWindowPointerUp() {
		window.removeEventListener("pointermove", onWindowPointerMove);
		if (dragKey !== null) {
			tableState.moveColumnBefore(dragKey, dropBeforeKey);
			suppressSortClick = true;
			if (suppressTimer !== null) clearTimeout(suppressTimer);
			suppressTimer = setTimeout(() => {
				suppressSortClick = false;
				suppressTimer = null;
			}, 50);
		}
		dragKey = null;
		dragVisualOrder = null;
		dragTranslateX = 0;
		dropBeforeKey = null;
		grabOffsetX = 0;
		pressState = null;
	}

	onDestroy(() => {
		window.removeEventListener("pointermove", onWindowPointerMove);
		if (suppressTimer !== null) clearTimeout(suppressTimer);
	});

	function ariaSort(key: string): "ascending" | "descending" | "none" {
		const dir = tableState.sortDir(key);
		if (dir === "asc") return "ascending";
		if (dir === "desc") return "descending";
		return "none";
	}

	// Wrap `flip` so the dragged header's animation is a no-op. Its visual
	// position is driven by the inline `translateX` that tracks the pointer,
	// and flip's own transform would fight it during mid-drag swaps.
	function flipUnlessDragged(
		node: Element,
		rect: { from: DOMRect; to: DOMRect },
		params: Parameters<typeof flip>[2],
	) {
		const key = node instanceof HTMLElement ? node.dataset.colKey : undefined;
		if (key !== undefined && key === dragKey) {
			return { duration: 0 };
		}
		return flip(node, rect, params);
	}

	function onSortClick(key: string) {
		if (dragKey !== null || suppressSortClick) return;
		tableState.toggleSort(key);
	}
</script>

<div
	class={cn(
		"relative overflow-x-auto rounded-lg shadow-card bg-card",
		dragKey !== null && "[&_*]:pointer-events-none",
		className,
	)}
>
	<Table>
		<TableHeader>
			<TableRow bind:ref={headerRowEl}>
				{#each visibleColumns as col (col.key)}
					{@const sorted = tableState.sortDir(col.key)}
					{@const isDragged = dragKey === col.key}
					<th
						animate:flipUnlessDragged={FLIP_OPTS}
						data-col-key={col.key}
						aria-sort={ariaSort(col.key)}
						class={cn(
							"h-9 px-2 text-left align-middle text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap [&:has([role=checkbox])]:pr-0",
							col.headClass,
							isDragged &&
								"relative z-10 bg-card/95 opacity-80 shadow-md ring-1 ring-primary/40",
							!isPinned(col.key) && !isDragged && "select-none",
						)}
						style={isDragged
							? `transform: translateX(${dragTranslateX}px);`
							: undefined}
						onpointerdown={(e) => onHeadPointerDown(e, col.key)}
					>
						{#if col.head}
							{@render col.head()}
						{:else if col.sortValue}
							<button
								type="button"
								onclick={() => onSortClick(col.key)}
								class={cn(
									"group inline-flex items-center gap-1 select-none bg-transparent p-0 font-medium uppercase tracking-wide transition-colors focus:outline-none",
									sorted
										? "text-foreground"
										: "text-muted-foreground hover:text-foreground focus-visible:text-foreground",
								)}
							>
								{col.label}
								{#if sorted === "asc"}
									<ArrowUp class="size-3.5" />
								{:else if sorted === "desc"}
									<ArrowDown class="size-3.5" />
								{:else}
									<ChevronsUpDown
										class="size-3.5 opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60"
									/>
								{/if}
							</button>
						{:else}
							{col.label}
						{/if}
					</th>
				{/each}
				<th
					class="h-9 w-10 px-2 text-right align-middle text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap"
				>
					<ColumnVisibilityMenu {tableState} {columns} />
				</th>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each rows as row (rowId(row))}
				{@const extra = rowAttrs?.(row) ?? {}}
				<TableRow {...extra}>
					{#each visibleColumns as col (col.key)}
						<td
							animate:flip={FLIP_OPTS}
							data-col-key={col.key}
							class={cn(
								"px-2 py-1.5 align-middle text-sm whitespace-nowrap [&:has([role=checkbox])]:pr-0",
								col.cellClass,
								dragKey === col.key && "opacity-70",
							)}
						>
							{#if col.cell}
								{@render col.cell(row)}
							{/if}
						</td>
					{/each}
					<td></td>
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</div>
