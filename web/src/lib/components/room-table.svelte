<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import TableHeaderCheckbox from "$lib/components/table-header-checkbox.svelte";
	import TableRowCheckbox from "$lib/components/table-row-checkbox.svelte";
	import HiveDataTable from "$lib/components/hive-data-table.svelte";
	import IconCell from "$lib/components/table-cells/icon-cell.svelte";
	import CreatedByCell from "$lib/components/table-cells/created-by-cell.svelte";
	import ActionsHead from "$lib/components/table-cells/actions-head.svelte";
	import RowActionsCell from "$lib/components/table-cells/row-actions-cell.svelte";
	import CollectionQuickControls from "$lib/components/collection-quick-controls.svelte";
	import SensorHistoryPopover from "$lib/components/sensor-history-popover.svelte";
	import {
		createTableState,
		type ColumnDef,
	} from "$lib/utils/table-state.svelte";
	import type { TableSelection } from "$lib/utils/table-selection.svelte";
	import { rowAttrsForSelection } from "$lib/utils/row-attrs";
	import { aggregateSensorReadings } from "$lib/device-tint";
	import { me } from "$lib/stores/me.svelte";
	import type { Device } from "$lib/stores/devices";
	import { DoorOpen, Plus } from "@lucide/svelte";

	interface RoomData {
		id: string;
		name: string;
		icon?: string | null;
		resolvedDevices: { id: string }[];
		members: { id: string; memberType: string; memberId: string }[];
		createdBy?: { id: string; username: string; name: string } | null;
	}

	interface Props {
		rooms: RoomData[];
		selection: TableSelection;
		onedit: (room: RoomData) => void;
		ondelete: (room: RoomData) => void;
		onrename: (room: RoomData, newName: string) => void;
		oniconchange: (room: RoomData, icon: string | null) => void;
		onAddTo: (room: RoomData) => void;
		getDevices?: (room: RoomData) => Device[];
	}

	let {
		rooms,
		selection,
		onedit,
		ondelete,
		onrename,
		oniconchange,
		onAddTo,
		getDevices,
	}: Props = $props();

	const COLUMNS: ColumnDef<RoomData>[] = [
		{
			key: "select",
			label: "",
			hideable: false,
			headClass: "w-10",
			head: selectHead,
			cell: selectCell,
		},
		{
			key: "icon",
			label: "",
			hideable: false,
			headClass: "w-12",
			cell: iconCell,
		},
		{
			key: "name",
			label: "Name",
			sortValue: (r) => r.name,
			cell: nameCell,
		},
		{
			key: "devices",
			label: "Devices",
			sortValue: (r) => r.resolvedDevices.length,
			cell: devicesCell,
		},
		{
			key: "state",
			label: "State",
			cell: stateCell,
		},
		{
			key: "createdBy",
			label: "Created by",
			sortValue: (r) => r.createdBy?.name ?? null,
			cell: createdByCell,
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

	const tableState = createTableState({ storageKey: "rooms", columns: COLUMNS });

	const displayRows = $derived(tableState.applySort(rooms));
	const displayIds = $derived<readonly string[]>(displayRows.map((r) => r.id));

</script>

{#snippet selectHead()}
	<TableHeaderCheckbox {selection} orderedIds={displayIds} />
{/snippet}

{#snippet selectCell(r: RoomData)}
	<TableRowCheckbox
		id={r.id}
		{selection}
		orderedIds={displayIds}
		ariaLabel="Select {r.name}"
	/>
{/snippet}

{#snippet iconCell(r: RoomData)}
	<IconCell value={r.icon} onselect={(icon) => oniconchange(r, icon)} fallback={DoorOpen} />
{/snippet}

{#snippet nameCell(r: RoomData)}
	<InlineEditName name={r.name} onsave={(newName) => onrename(r, newName)} />
{/snippet}

{#snippet devicesCell(r: RoomData)}
	<span class="text-sm text-muted-foreground whitespace-nowrap">
		{r.resolvedDevices.length} device{r.resolvedDevices.length === 1 ? "" : "s"}
	</span>
{/snippet}

{#snippet stateCell(r: RoomData)}
	{@const devices = getDevices?.(r) ?? []}
	{@const readings = aggregateSensorReadings(
		devices,
		me.user?.temperatureUnit ?? "celsius",
	)}
	{#if readings.length === 0}
		<span class="text-sm text-muted-foreground">—</span>
	{:else}
		<SensorHistoryPopover
			target={{ kind: "room", id: r.id }}
			fields={readings.map((rd) => rd.field)}
			title={r.name}
			triggerClass="group rounded focus-visible:outline-none"
		>
			<div class="flex items-center gap-3 text-sm tabular-nums">
				{#each readings as rd (rd.label)}
					<span class="flex items-center gap-1 text-muted-foreground transition-colors group-hover:text-foreground group-focus-visible:text-foreground">
						<rd.icon class="size-4" />
						<span class="text-foreground"
							>{rd.value}<span class="ml-0.5 text-xs">{rd.unit}</span></span
						>
					</span>
				{/each}
			</div>
		</SensorHistoryPopover>
	{/if}
{/snippet}

{#snippet createdByCell(r: RoomData)}
	<CreatedByCell user={r.createdBy} />
{/snippet}

{#snippet actionsHead()}<ActionsHead />{/snippet}

{#snippet actionsCell(r: RoomData)}
	<RowActionsCell
		onedit={() => onedit(r)}
		ondelete={() => ondelete(r)}
		editLabel="Edit room"
		deleteLabel="Delete room"
	>
		{#snippet leading()}
			{#if getDevices}
				<CollectionQuickControls devices={getDevices(r)} name={r.name} />
			{/if}
			<Tooltip>
				<TooltipTrigger>
					<Button
						variant="ghost"
						size="icon-sm"
						onclick={() => onAddTo(r)}
						aria-label="Add to room"
					>
						<Plus class="size-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Add…</TooltipContent>
			</Tooltip>
		{/snippet}
	</RowActionsCell>
{/snippet}

<HiveDataTable
	{tableState}
	columns={COLUMNS}
	rows={displayRows}
	rowId={(r) => r.id}
	rowAttrs={(r) => rowAttrsForSelection(selection, r.id)}
/>
