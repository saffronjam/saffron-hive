<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import DynamicIcon from "$lib/components/icons/dynamic-icon.svelte";
	import TableHeaderCheckbox from "$lib/components/table-header-checkbox.svelte";
	import TableRowCheckbox from "$lib/components/table-row-checkbox.svelte";
	import HiveDataTable from "$lib/components/hive-data-table.svelte";
	import {
		createTableState,
		type ColumnDef,
	} from "$lib/utils/table-state.svelte";
	import type { TableSelection } from "$lib/utils/table-selection.svelte";
	import { DoorOpen, Pencil, Plus, Trash2 } from "@lucide/svelte";
	import type { Device } from "$lib/stores/devices";

	interface RoomData {
		id: string;
		name: string;
		icon?: string | null;
		devices: Device[];
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
	}

	let {
		rooms,
		selection,
		onedit,
		ondelete,
		onrename,
		oniconchange,
		onAddTo,
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
			sortValue: (r) => r.devices.length,
			cell: devicesCell,
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

	function rowAttrsFor(r: RoomData) {
		return selection.isSelected(r.id) ? { "data-state": "selected" } : {};
	}
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
	<IconPicker value={r.icon} onselect={(icon) => oniconchange(r, icon)}>
		<button
			type="button"
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
		>
			<DynamicIcon icon={r.icon} class="size-4.5 text-muted-foreground">
				{#snippet fallback()}
					<DoorOpen class="size-4.5 text-muted-foreground" />
				{/snippet}
			</DynamicIcon>
		</button>
	</IconPicker>
{/snippet}

{#snippet nameCell(r: RoomData)}
	<InlineEditName name={r.name} onsave={(newName) => onrename(r, newName)} />
{/snippet}

{#snippet devicesCell(r: RoomData)}
	<span class="text-sm text-muted-foreground whitespace-nowrap">
		{r.devices.length} device{r.devices.length === 1 ? "" : "s"}
	</span>
{/snippet}

{#snippet createdByCell(r: RoomData)}
	<span class="text-sm text-muted-foreground whitespace-nowrap">
		{r.createdBy?.name ?? "—"}
	</span>
{/snippet}

{#snippet actionsHead()}
	<span class="block text-right">Actions</span>
{/snippet}

{#snippet actionsCell(r: RoomData)}
	<div class="flex items-center justify-end gap-1">
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
		<Tooltip>
			<TooltipTrigger>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => onedit(r)}
					aria-label="Edit room"
				>
					<Pencil class="size-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Edit</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => ondelete(r)}
					aria-label="Delete room"
					class="text-destructive hover:text-destructive"
				>
					<Trash2 class="size-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Delete</TooltipContent>
		</Tooltip>
	</div>
{/snippet}

<HiveDataTable
	{tableState}
	columns={COLUMNS}
	rows={displayRows}
	rowId={(r) => r.id}
	rowAttrs={rowAttrsFor}
/>
