<script lang="ts" module>
	export interface ActivitySource {
		kind: string;
		id?: string | null;
		name?: string | null;
		type?: string | null;
		roomId?: string | null;
		roomName?: string | null;
	}

	export interface ActivityEvent {
		id: string;
		type: string;
		timestamp: string;
		message: string;
		payload: string;
		source: ActivitySource;
	}
</script>

<script lang="ts">
	import { get } from "svelte/store";
	import { createVirtualizer } from "@tanstack/svelte-virtual";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import JsonInline from "$lib/components/json-inline.svelte";
	import JsonEditor from "$lib/components/json-editor.svelte";
	import { formatRelative, formatFull } from "$lib/time-format";
	import {
		ChevronRight,
		ChevronDown,
		Lightbulb,
		Gauge,
		ToggleRight,
		Clapperboard,
		Workflow,
		Activity as ActivityIcon,
	} from "@lucide/svelte";

	interface Props {
		events: ActivityEvent[];
		recentIds: Set<string>;
		hasMore: boolean;
		loadingMore: boolean;
		onLoadMore: () => void;
	}

	let { events, recentIds, hasMore, loadingMore, onLoadMore }: Props = $props();

	let scrollEl: HTMLDivElement | null = $state(null);
	let expanded = $state<Set<string>>(new Set());

	const COLLAPSED_ROW = 36;
	const EXPANDED_ROW = 320;
	const LOAD_THRESHOLD = 10;

	const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
		count: 0,
		getScrollElement: () => scrollEl!,
		estimateSize: () => COLLAPSED_ROW,
		overscan: 8,
	});

	// Keep the virtualiser's options in sync with current events + expand state.
	// estimateSize is re-read whenever we call measure(), so toggling expand just
	// invalidates the cached heights.
	$effect(() => {
		get(virtualizer).setOptions({
			count: events.length,
			getScrollElement: () => scrollEl!,
			overscan: 8,
			estimateSize: (index) => {
				const id = events[index]?.id;
				return id && expanded.has(id) ? EXPANDED_ROW : COLLAPSED_ROW;
			},
			getItemKey: (index) => events[index]?.id ?? index,
		});
	});

	// When events grow (either live-prepended or paginated), ask the virtualiser
	// to recompute. Reading events.length establishes the reactive dependency.
	$effect(() => {
		void events.length;
		get(virtualizer).measure();
	});

	// Trigger pagination when the last rendered row is within LOAD_THRESHOLD of
	// the end of our loaded set.
	$effect(() => {
		const items = $virtualizer.getVirtualItems();
		const last = items.at(-1);
		if (!last) return;
		if (!hasMore || loadingMore) return;
		if (last.index >= events.length - LOAD_THRESHOLD) {
			onLoadMore();
		}
	});

	function toggle(id: string) {
		const next = new Set(expanded);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		expanded = next;
		get(virtualizer).measure();
	}

	function prettyJson(raw: string): string {
		try {
			return JSON.stringify(JSON.parse(raw), null, 2);
		} catch {
			return raw;
		}
	}

	const TYPE_LABELS: Record<string, string> = {
		"device.state_changed": "State",
		"device.availability_changed": "Availability",
		"device.added": "Added",
		"device.removed": "Removed",
		"command.requested": "Command",
		"scene.applied": "Scene",
		"automation.triggered": "Automation",
		"automation.node_activated": "Node",
	};

	function typeLabel(t: string): string {
		return TYPE_LABELS[t] ?? t;
	}

	function typeBadgeClass(t: string): string {
		switch (t) {
			case "device.state_changed":
				return "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20";
			case "device.availability_changed":
				return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
			case "device.added":
				return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
			case "device.removed":
				return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
			case "command.requested":
				return "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20";
			case "scene.applied":
				return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20";
			case "automation.triggered":
			case "automation.node_activated":
				return "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/20";
			default:
				return "";
		}
	}

	function sourceIcon(src: ActivitySource) {
		if (src.kind === "scene") return Clapperboard;
		if (src.kind === "automation") return Workflow;
		if (src.kind === "device") {
			switch (src.type) {
				case "light":
					return Lightbulb;
				case "sensor":
					return Gauge;
				case "switch":
					return ToggleRight;
				default:
					return ActivityIcon;
			}
		}
		return ActivityIcon;
	}

	function sourceHref(src: ActivitySource): string | null {
		if (!src.id) return null;
		if (src.kind === "device") return `/devices/${src.id}`;
		if (src.kind === "scene") return `/scenes/${src.id}`;
		if (src.kind === "automation") return `/automations/${src.id}`;
		return null;
	}

	// Grid template for every row + header.
	const GRID_COLS =
		"1.5rem 5rem 6rem 16rem minmax(12rem, 1.6fr) minmax(14rem, 1.4fr)";
</script>

<div class="flex flex-col overflow-hidden rounded-lg shadow-card bg-card">
	<div
		class="sticky top-0 z-10 grid items-center border-b border-border bg-card px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
		style="grid-template-columns: {GRID_COLS};"
	>
		<div></div>
		<div>Time</div>
		<div>Type</div>
		<div>Source</div>
		<div>Message</div>
		<div>Payload</div>
	</div>

	<div bind:this={scrollEl} class="flex-1 overflow-auto" style="min-height: 20rem;">
		<div style="height: {$virtualizer.getTotalSize()}px; position: relative; width: 100%;">
			{#each $virtualizer.getVirtualItems() as row (row.key)}
				{@const event = events[row.index]}
				{#if event}
					{@const isOpen = expanded.has(event.id)}
					{@const isNew = recentIds.has(event.id)}
					{@const Icon = sourceIcon(event.source)}
					{@const href = sourceHref(event.source)}
					<div
						role="button"
						tabindex="0"
						onclick={() => toggle(event.id)}
						onkeydown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								toggle(event.id);
							}
						}}
						class="absolute left-0 w-full cursor-pointer border-b border-border/50 hover:bg-muted/40 focus:outline-none focus:bg-muted/50 {isNew
							? 'activity-row-new'
							: ''}"
						style="top: {row.start}px; height: {row.size}px;"
					>
						<div
							class="grid h-9 items-center px-2 text-sm"
							style="grid-template-columns: {GRID_COLS};"
						>
							<div class="flex items-center">
								{#if isOpen}
									<ChevronDown class="size-4 text-muted-foreground" />
								{:else}
									<ChevronRight class="size-4 text-muted-foreground" />
								{/if}
							</div>
							<div class="whitespace-nowrap text-xs text-muted-foreground">
								<Tooltip>
									<TooltipTrigger>
										<span>{formatRelative(new Date(event.timestamp))}</span>
									</TooltipTrigger>
									<TooltipContent>{formatFull(new Date(event.timestamp))}</TooltipContent>
								</Tooltip>
							</div>
							<div>
								<Badge variant="outline" class="text-xs {typeBadgeClass(event.type)}">
									{typeLabel(event.type)}
								</Badge>
							</div>
							<div class="flex items-center gap-2 min-w-0">
								<Icon class="size-4 shrink-0 text-muted-foreground" />
								<div class="min-w-0 flex-1">
									{#if event.source.name}
										{#if href}
											<a
												href={href}
												onclick={(e) => e.stopPropagation()}
												class="block truncate text-foreground hover:underline"
											>
												{event.source.name}{#if event.source.roomName}<span class="text-muted-foreground"> · {event.source.roomName}</span>{/if}
											</a>
										{:else}
											<span class="block truncate text-foreground">
												{event.source.name}{#if event.source.roomName}<span class="text-muted-foreground"> · {event.source.roomName}</span>{/if}
											</span>
										{/if}
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								</div>
							</div>
							<div class="min-w-0 truncate">{event.message}</div>
							<div class="min-w-0 overflow-hidden">
								<div class="truncate">
									<JsonInline value={event.payload} />
								</div>
							</div>
						</div>
						{#if isOpen}
							<div class="border-t border-border/40 bg-muted/30 px-2 py-2" style="height: {EXPANDED_ROW - COLLAPSED_ROW}px;">
								<div class="h-full">
									<JsonEditor value={prettyJson(event.payload)} readonly />
								</div>
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
		{#if loadingMore}
			<div class="py-3 text-center text-xs text-muted-foreground">Loading more…</div>
		{:else if !hasMore && events.length > 0}
			<div class="py-3 text-center text-xs text-muted-foreground">End of history</div>
		{/if}
	</div>
</div>
