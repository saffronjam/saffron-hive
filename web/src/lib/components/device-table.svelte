<script lang="ts">
	import { goto } from "$app/navigation";
	import { type Device } from "$lib/stores/devices";
	import { stateSummary } from "$lib/device-state";
	import { deviceTint } from "$lib/device-tint";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover/index.js";
	import StateHistoryChart from "$lib/components/state-history-chart.svelte";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import DeviceQuickControls from "$lib/components/device-quick-controls.svelte";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import DynamicIcon from "$lib/components/icons/dynamic-icon.svelte";
	import TableHeaderCheckbox from "$lib/components/table-header-checkbox.svelte";
	import TableRowCheckbox from "$lib/components/table-row-checkbox.svelte";
	import HiveDataTable from "$lib/components/hive-data-table.svelte";
	import {
		createTableState,
		type ColumnDef,
	} from "$lib/utils/table-state.svelte";
	import type { TableSelection } from "$lib/utils/table-selection.svelte";
	import { sentenceCase } from "$lib/utils";
	import { DoorOpen, Group as GroupIcon, Pencil, Plus } from "@lucide/svelte";

	interface MembershipChip {
		id: string;
		name: string;
		icon?: string | null;
	}

	interface Row {
		device: Device;
		roomChips: MembershipChip[];
		groupChips: MembershipChip[];
	}

	interface Props {
		rows: Row[];
		selection: TableSelection;
		onrename: (id: string, newName: string) => void;
		onAddTo: (device: Device) => void;
	}

	let { rows, selection, onrename, onAddTo }: Props = $props();

	const COLUMNS: ColumnDef<Row>[] = [
		{
			key: "select",
			label: "",
			hideable: false,
			headClass: "w-10",
			head: selectHead,
			cell: selectCell,
		},
		{
			key: "status",
			label: "Status",
			hideable: false,
			headClass: "w-8",
			sortValue: (r) => r.device.available,
			cell: statusCell,
		},
		{
			key: "color",
			label: "",
			hideable: false,
			headClass: "w-8",
			cellClass: "w-8",
			cell: colorCell,
		},
		{
			key: "type",
			label: "Type",
			headClass: "w-24",
			sortValue: (r) => r.device.type,
			cell: typeCell,
		},
		{
			key: "name",
			label: "Name",
			sortValue: (r) => r.device.name,
			cell: nameCell,
		},
		{
			key: "source",
			label: "Source",
			sortValue: (r) => r.device.source,
			cell: sourceCell,
		},
		{
			key: "membership",
			label: "Rooms & Groups",
			cell: membershipCell,
		},
		{
			key: "state",
			label: "State",
			cell: stateCell,
		},
		{
			key: "actions",
			label: "",
			hideable: false,
			headClass: "w-24 text-right",
			head: actionsHead,
			cell: actionsCell,
		},
	];

	const tableState = createTableState({ storageKey: "devices", columns: COLUMNS });

	const displayRows = $derived(tableState.applySort(rows));
	const displayIds = $derived<readonly string[]>(
		displayRows.map((r) => r.device.id),
	);

	function rowAttrsFor(row: Row) {
		return selection.isSelected(row.device.id)
			? { "data-state": "selected" }
			: {};
	}
</script>

{#snippet selectHead()}
	<TableHeaderCheckbox {selection} orderedIds={displayIds} />
{/snippet}

{#snippet selectCell(row: Row)}
	<TableRowCheckbox
		id={row.device.id}
		{selection}
		orderedIds={displayIds}
		ariaLabel="Select {row.device.name}"
	/>
{/snippet}

{#snippet statusCell(row: Row)}
	<span
		class="inline-block h-2.5 w-2.5 shrink-0 rounded-full {row.device.available
			? 'bg-green-500'
			: 'bg-destructive'}"
		aria-label={row.device.available ? "Online" : "Offline"}
	></span>
{/snippet}

{#snippet colorCell(row: Row)}
	<span
		class="inline-block h-3 w-3 shrink-0 rounded-full border border-border"
		style:background-color={deviceTint(row.device)}
	></span>
{/snippet}

{#snippet typeCell(row: Row)}
	<HiveChip type={row.device.type} />
{/snippet}

{#snippet nameCell(row: Row)}
	<InlineEditName
		name={row.device.name}
		onsave={(newName) => onrename(row.device.id, newName)}
	/>
{/snippet}

{#snippet sourceCell(row: Row)}
	<Badge variant="outline">{sentenceCase(row.device.source)}</Badge>
{/snippet}

{#snippet membershipCell(row: Row)}
	{#if row.roomChips.length === 0 && row.groupChips.length === 0}
		<span class="text-muted-foreground">—</span>
	{:else}
		<div class="flex flex-wrap items-center gap-1">
			{#each row.roomChips as chip (chip.id)}
				<HiveChip type="room" label={chip.name} iconOverride={chip.icon} href={`/rooms?edit=${chip.id}`} />
			{/each}
			{#each row.groupChips as chip (chip.id)}
				<HiveChip type="group" label={chip.name} iconOverride={chip.icon} href={`/groups?edit=${chip.id}`} />
			{/each}
		</div>
	{/if}
{/snippet}

{#snippet stateCell(row: Row)}
	{@const summary = stateSummary(row.device.state, row.device.type)}
	{#if row.device.type === "button" || summary === "Unknown" || summary === "—"}
		<span class="text-sm text-muted-foreground">{summary}</span>
	{:else}
		<Popover>
			<PopoverTrigger>
				{#snippet child({ props })}
					<button
						type="button"
						{...props}
						class="rounded text-sm text-muted-foreground hover:text-foreground hover:underline focus-visible:underline focus-visible:outline-none"
					>
						{summary}
					</button>
				{/snippet}
			</PopoverTrigger>
			<PopoverContent class="w-[min(80vw,640px)] p-3" align="start">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium">{row.device.name}</span>
					<Button variant="link" size="sm" class="h-auto p-0 text-xs" href={`/data-viewer?sources=${row.device.id}`}>
						Open in data viewer
					</Button>
				</div>
				<StateHistoryChart
					deviceIds={[row.device.id]}
					from={new Date(Date.now() - 24 * 60 * 60 * 1000)}
					to={new Date()}
					height="h-56"
				/>
			</PopoverContent>
		</Popover>
	{/if}
{/snippet}

{#snippet actionsHead()}
	<span class="block text-right">Actions</span>
{/snippet}

{#snippet actionsCell(row: Row)}
	<div class="flex items-center justify-end gap-1">
		<DeviceQuickControls device={row.device} />
		<Tooltip>
			<TooltipTrigger>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => onAddTo(row.device)}
					aria-label="Add to room or group"
				>
					<Plus class="size-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Add to…</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => goto(`/devices/${row.device.id}`)}
					aria-label="Edit device"
				>
					<Pencil class="size-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Edit</TooltipContent>
		</Tooltip>
	</div>
{/snippet}

<HiveDataTable
	{tableState}
	columns={COLUMNS}
	rows={displayRows}
	rowId={(r) => r.device.id}
	rowAttrs={rowAttrsFor}
/>
