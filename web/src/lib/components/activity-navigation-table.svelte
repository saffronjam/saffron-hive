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
	import { Badge } from "$lib/components/ui/badge/index.js";
	import {
		Tooltip,
		TooltipContent,
		TooltipTrigger,
	} from "$lib/components/ui/tooltip/index.js";
	import JsonInline from "$lib/components/json-inline.svelte";
	import JsonEditor from "$lib/components/json-editor.svelte";
	import HiveNavigationTable from "$lib/components/hive-navigation-table.svelte";
	import TableHeaderCheckbox from "$lib/components/table-header-checkbox.svelte";
	import TableRowCheckbox from "$lib/components/table-row-checkbox.svelte";
	import {
		createTableState,
		type ColumnDef,
	} from "$lib/utils/table-state.svelte";
	import type { TableSelection } from "$lib/utils/table-selection.svelte";
	import { formatRelative, formatFull } from "$lib/time-format";
	import { nowStore } from "$lib/stores/now.svelte";
	import {
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
		selection: TableSelection;
	}

	let {
		events,
		recentIds,
		hasMore,
		loadingMore,
		onLoadMore,
		selection,
	}: Props = $props();

	const eventIds = $derived<readonly string[]>(events.map((e) => e.id));

	const TYPE_LABELS: Record<string, string> = {
		"device.state_changed": "State",
		"device.action_fired": "Action",
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
			case "device.action_fired":
				return "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20";
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

	function prettyJson(raw: string): string {
		try {
			return JSON.stringify(JSON.parse(raw), null, 2);
		} catch {
			return raw;
		}
	}

	const COLUMNS: ColumnDef<ActivityEvent>[] = [
		{
			key: "select",
			label: "",
			hideable: false,
			width: "2rem",
			head: selectHead,
			cell: selectCell,
		},
		{
			key: "time",
			label: "Time",
			hideable: false,
			width: "5rem",
			cell: timeCell,
		},
		{
			key: "type",
			label: "Type",
			width: "6rem",
			cell: typeCell,
		},
		{
			key: "source",
			label: "Source",
			width: "16rem",
			cell: sourceCell,
		},
		{
			key: "message",
			label: "Message",
			width: "minmax(12rem, 1.6fr)",
			cell: messageCell,
		},
		{
			key: "payload",
			label: "Payload",
			width: "minmax(14rem, 1.4fr)",
			cell: payloadCell,
		},
	];

	const tableState = createTableState({
		storageKey: "activity",
		columns: COLUMNS,
	});

	function rowClassFor(event: ActivityEvent) {
		return recentIds.has(event.id) ? "activity-row-new" : undefined;
	}
</script>

{#snippet selectHead()}
	<TableHeaderCheckbox {selection} orderedIds={eventIds} />
{/snippet}

{#snippet selectCell(event: ActivityEvent)}
	<TableRowCheckbox
		id={event.id}
		{selection}
		orderedIds={eventIds}
		ariaLabel="Select activity {event.message}"
	/>
{/snippet}

{#snippet timeCell(event: ActivityEvent)}
	<span class="whitespace-nowrap text-xs text-muted-foreground">
		<Tooltip>
			<TooltipTrigger>
				<span>{formatRelative(new Date(event.timestamp), nowStore.current)}</span>
			</TooltipTrigger>
			<TooltipContent>{formatFull(new Date(event.timestamp))}</TooltipContent>
		</Tooltip>
	</span>
{/snippet}

{#snippet typeCell(event: ActivityEvent)}
	<Badge variant="outline" class="text-xs {typeBadgeClass(event.type)}">
		{typeLabel(event.type)}
	</Badge>
{/snippet}

{#snippet sourceCell(event: ActivityEvent)}
	{@const Icon = sourceIcon(event.source)}
	{@const href = sourceHref(event.source)}
	<div class="flex items-center gap-2 min-w-0">
		<Icon class="size-4 shrink-0 text-muted-foreground" />
		<div class="min-w-0 flex-1">
			{#if event.source.name}
				{#if href}
					<a
						{href}
						onclick={(e) => e.stopPropagation()}
						class="block truncate text-foreground hover:underline"
					>
						{event.source.name}{#if event.source.roomName}<span
								class="text-muted-foreground"
							>
								· {event.source.roomName}</span
							>{/if}
					</a>
				{:else}
					<span class="block truncate text-foreground">
						{event.source.name}{#if event.source.roomName}<span
								class="text-muted-foreground"
							>
								· {event.source.roomName}</span
							>{/if}
					</span>
				{/if}
			{:else}
				<span class="text-muted-foreground">—</span>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet messageCell(event: ActivityEvent)}
	<div class="min-w-0 truncate">{event.message}</div>
{/snippet}

{#snippet payloadCell(event: ActivityEvent)}
	<div class="min-w-0 overflow-hidden">
		<div class="truncate">
			<JsonInline value={event.payload} />
		</div>
	</div>
{/snippet}

{#snippet expandedPayload(event: ActivityEvent)}
	<div class="h-full">
		<JsonEditor value={prettyJson(event.payload)} readonly />
	</div>
{/snippet}

<HiveNavigationTable
	{tableState}
	columns={COLUMNS}
	rows={events}
	rowId={(e) => e.id}
	rowClass={rowClassFor}
	{hasMore}
	{loadingMore}
	{onLoadMore}
	expandedContent={expandedPayload}
/>
