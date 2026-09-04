<script lang="ts">
	import { type Device } from "$lib/stores/devices";
	import { stateSummary } from "$lib/device-state";
	import { aggregateSensorReadings } from "$lib/device-tint";
	import { me } from "$lib/stores/me.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import SensorHistoryPopover from "$lib/components/sensor-history-popover.svelte";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import DeviceQuickControls from "$lib/components/device-quick-controls.svelte";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import IconCell from "$lib/components/table-cells/icon-cell.svelte";
	import TableHeaderCheckbox from "$lib/components/table-header-checkbox.svelte";
	import TableRowCheckbox from "$lib/components/table-row-checkbox.svelte";
	import HiveDataTable from "$lib/components/hive-data-table.svelte";
	import ActionsHead from "$lib/components/table-cells/actions-head.svelte";
	import RowActionsCell from "$lib/components/table-cells/row-actions-cell.svelte";
	import {
		createTableState,
		type ColumnDef,
	} from "$lib/utils/table-state.svelte";
	import type { TableSelection } from "$lib/utils/table-selection.svelte";
	import { rowAttrsForSelection } from "$lib/utils/row-attrs";
	import { deviceIcon, deviceDisplayName } from "$lib/utils";
	import { Ban, CircleCheck, DoorOpen, Group as GroupIcon, Plus, Trash2, Undo2 } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

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
		oniconchange: (id: string, icon: string | null) => void;
		onAddTo: (device: Device) => void;
		ontoggleenabled: (device: Device) => void;
		ondelete: (device: Device) => void;
		onrestore: (device: Device) => void;
		/** Ids that were unseen when the list mounted. */
		newDeviceIds?: ReadonlySet<string>;
	}

	let {
		rows,
		selection,
		onrename,
		oniconchange,
		onAddTo,
		ontoggleenabled,
		ondelete,
		onrestore,
		newDeviceIds,
	}: Props = $props();

	const COLUMNS = $derived.by<ColumnDef<Row>[]>(() => [
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
			cellClass: "w-12",
			cell: iconCell,
		},
		{
			key: "name",
			label: m.field_name({}, locale.messageOptions()),
			sortValue: (r) => deviceDisplayName(r.device),
			cell: nameCell,
		},
		{
			key: "type",
			label: m.field_type({}, locale.messageOptions()),
			headClass: "w-24",
			sortValue: (r) => r.device.type,
			cell: typeCell,
		},
		{
			key: "source",
			label: m.field_source({}, locale.messageOptions()),
			sortValue: (r) => r.device.source,
			cell: sourceCell,
		},
		{
			key: "membership",
			label: m.field_rooms_groups({}, locale.messageOptions()),
			cell: membershipCell,
		},
		{
			key: "state",
			label: m.field_state({}, locale.messageOptions()),
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
	]);

	const tableState = createTableState({ storageKey: "devices", columns: () => COLUMNS });

	const displayRows = $derived(tableState.applySort(rows));
	const displayIds = $derived<readonly string[]>(
		displayRows.map((r) => r.device.id),
	);

</script>

{#snippet selectHead()}
	<TableHeaderCheckbox {selection} orderedIds={displayIds} />
{/snippet}

{#snippet selectCell(row: Row)}
	<TableRowCheckbox
		id={row.device.id}
		{selection}
		orderedIds={displayIds}
		ariaLabel={m.shared_select_item(
			{ name: deviceDisplayName(row.device) },
			locale.messageOptions(),
		)}
	/>
{/snippet}

{#snippet typeCell(row: Row)}
	<HiveChip type={row.device.type} />
{/snippet}

{#snippet iconCell(row: Row)}
	<IconCell
		value={row.device.icon}
		onselect={(icon) => oniconchange(row.device.id, icon)}
		fallback={deviceIcon(row.device.type, row.device.roles.contact)}
	/>
{/snippet}

{#snippet nameCell(row: Row)}
	<div class="flex items-center gap-2">
		<InlineEditName
			name={deviceDisplayName(row.device)}
			entityType="device"
			entityId={row.device.id}
			onsave={(newName) => onrename(row.device.id, newName)}
		/>
		{#if newDeviceIds?.has(row.device.id)}
			<HiveChip type="new" label={m.field_new({}, locale.messageOptions())} />
		{/if}
		{#if row.device.deleted}
			<Trash2
				class="size-3.5 shrink-0 text-muted-foreground"
				title={m.field_deleted({}, locale.messageOptions())}
				aria-label={m.field_deleted({}, locale.messageOptions())}
			/>
		{:else if row.device.disabled}
			<Ban
				class="size-3.5 shrink-0 text-muted-foreground"
				title={m.field_disabled({}, locale.messageOptions())}
				aria-label={m.field_disabled({}, locale.messageOptions())}
			/>
		{:else if !row.device.available}
			<HiveChip type="offline" label={m.devices_offline({}, locale.messageOptions())} />
		{/if}
	</div>
{/snippet}

{#snippet sourceCell(row: Row)}
	<Badge variant="outline">{row.device.source}</Badge>
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
	{#if row.device.type === "sensor"}
		{@const readings = aggregateSensorReadings(
			[row.device],
			me.user?.temperatureUnit ?? "celsius",
			{ includeGeneralContact: true },
		)}
		{#if readings.length === 0}
			<span class="text-sm text-muted-foreground">—</span>
		{:else}
			<SensorHistoryPopover
				target={{ kind: "device", id: row.device.id }}
				fields={readings.map((r) => r.field)}
				title={deviceDisplayName(row.device)}
				triggerClass="group rounded focus-visible:outline-none"
			>
				<div class="flex items-center gap-3 text-sm tabular-nums">
					{#each readings as r (r.label)}
						<span class="flex items-center gap-1 text-muted-foreground transition-colors group-hover:text-foreground group-focus-visible:text-foreground">
							<r.icon class="size-4" />
							<span class="text-foreground"
								>{r.value}<span class="ml-0.5 text-xs">{r.unit}</span></span
							>
						</span>
					{/each}
				</div>
			</SensorHistoryPopover>
		{/if}
	{:else}
		{@const summary = stateSummary(row.device.state, row.device.type)}
		{#if row.device.type === "button" || summary === m.state_unknown({}, locale.messageOptions()) || summary === "—"}
			<span class="text-sm text-muted-foreground">{summary}</span>
		{:else}
			<SensorHistoryPopover
				target={{ kind: "device", id: row.device.id }}
				title={deviceDisplayName(row.device)}
				triggerClass="group rounded focus-visible:outline-none"
			>
				<span
					class="text-sm text-muted-foreground transition-colors group-hover:text-foreground group-focus-visible:text-foreground"
					>{summary}</span
				>
			</SensorHistoryPopover>
		{/if}
	{/if}
{/snippet}

{#snippet actionsHead()}<ActionsHead />{/snippet}

{#snippet actionsCell(row: Row)}
	<RowActionsCell
		editHref={`/devices/${row.device.id}`}
		editLabel={m.devices_edit({}, locale.messageOptions())}
		ondelete={row.device.deleted ? undefined : () => ondelete(row.device)}
		deleteLabel={m.devices_delete_named(
			{ name: deviceDisplayName(row.device) },
			locale.messageOptions(),
		)}
	>
		{#snippet leading()}
			{#if row.device.deleted}
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => onrestore(row.device)}
					aria-label={m.devices_restore_named(
						{ name: deviceDisplayName(row.device) },
						locale.messageOptions(),
					)}
				>
					<Undo2 class="size-4" />
				</Button>
			{:else}
				<DeviceQuickControls device={row.device} variant="swatch" />
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => onAddTo(row.device)}
					aria-label={m.devices_add_to_action({}, locale.messageOptions())}
				>
					<Plus class="size-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => ontoggleenabled(row.device)}
					aria-label={row.device.disabled
						? m.devices_enable({}, locale.messageOptions())
						: m.devices_disable({}, locale.messageOptions())}
				>
					{#if row.device.disabled}
						<CircleCheck class="size-4" />
					{:else}
						<Ban class="size-4" />
					{/if}
				</Button>
			{/if}
		{/snippet}
	</RowActionsCell>
{/snippet}

<HiveDataTable
	{tableState}
	columns={COLUMNS}
	rows={displayRows}
	rowId={(r) => r.device.id}
	rowAttrs={(r) => ({
		...rowAttrsForSelection(selection, r.device.id),
		class: r.device.disabled || r.device.deleted || !r.device.available ? "opacity-60" : undefined,
	})}
/>
