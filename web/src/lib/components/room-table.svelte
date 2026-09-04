<script lang="ts">
	import { entityDisplayName } from "$lib/utils";
	import { Button } from "$lib/components/ui/button/index.js";
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
	import { CommandTargetType } from "$lib/gql/graphql";
	import { m } from "$lib/paraglide/messages.js";
	import { locale } from "$lib/i18n/locale.svelte";

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
		ondelete: (room: RoomData) => void;
		onrename: (room: RoomData, newName: string) => void;
		oniconchange: (room: RoomData, icon: string | null) => void;
		onAddTo: (room: RoomData) => void;
		editHref: (room: RoomData) => string;
		getDevices?: (room: RoomData) => Device[];
	}

	let {
		rooms,
		selection,
		ondelete,
		onrename,
		oniconchange,
		onAddTo,
		editHref,
		getDevices,
	}: Props = $props();

	const COLUMNS: ColumnDef<RoomData>[] = $derived.by(() => [
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
			label: m.field_name({}, locale.messageOptions()),
			sortValue: (r) => entityDisplayName("room", r),
			cell: nameCell,
		},
		{
			key: "devices",
			label: m.nav_devices({}, locale.messageOptions()),
			sortValue: (r) => r.resolvedDevices.length,
			cell: devicesCell,
		},
		{
			key: "state",
			label: m.field_state({}, locale.messageOptions()),
			cell: stateCell,
		},
		{
			key: "createdBy",
			label: m.field_created_by({}, locale.messageOptions()),
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
	]);

	const tableState = createTableState({ storageKey: "rooms", columns: () => COLUMNS });

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
		ariaLabel={m.shared_select_item({ name: entityDisplayName("room", r) }, locale.messageOptions())}
	/>
{/snippet}

{#snippet iconCell(r: RoomData)}
	<IconCell value={r.icon} onselect={(icon) => oniconchange(r, icon)} fallback={DoorOpen} />
{/snippet}

{#snippet nameCell(r: RoomData)}
	<InlineEditName name={entityDisplayName("room", r)} entityType="room" entityId={r.id} onsave={(newName) => onrename(r, newName)} />
{/snippet}

{#snippet devicesCell(r: RoomData)}
	<span class="text-sm text-muted-foreground whitespace-nowrap">
		{m.shared_device_count({ count: r.resolvedDevices.length }, locale.messageOptions())}
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
			title={entityDisplayName("room", r)}
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
		editHref={editHref(r)}
		ondelete={() => ondelete(r)}
		editLabel={m.room_edit({}, locale.messageOptions())}
		deleteLabel={m.room_delete({}, locale.messageOptions())}
	>
		{#snippet leading()}
			{#if getDevices}
				<CollectionQuickControls
					devices={getDevices(r)}
					name={entityDisplayName("room", r)}
				target={{ targetType: CommandTargetType.Room, targetId: r.id }}
				/>
			{/if}
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => onAddTo(r)}
				aria-label={m.room_add({}, locale.messageOptions())}
			>
				<Plus class="size-4" />
			</Button>
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
