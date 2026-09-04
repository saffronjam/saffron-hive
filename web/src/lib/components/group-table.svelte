<script lang="ts" generics="G extends { id: string; name?: string | null; friendlyName?: string | null; source: string; icon?: string | null; members: { memberType: string }[]; createdBy?: { id: string; username: string; name: string } | null }">
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
	import { groupMemberBreakdown } from "$lib/list-helpers";
	import { aggregateSensorReadings } from "$lib/device-tint";
	import { me } from "$lib/stores/me.svelte";
	import type { Device } from "$lib/stores/devices";
	import { Group as GroupIcon, Plus } from "@lucide/svelte";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import { CommandTargetType } from "$lib/gql/graphql";
	import { groupDisplayName } from "$lib/utils";
	import { m } from "$lib/paraglide/messages.js";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		groups: G[];
		selection: TableSelection;
		ondelete: (group: G) => void;
		onrename: (group: G, newName: string) => void;
		oniconchange: (group: G, icon: string | null) => void;
		onAddTo: (group: G) => void;
		editHref: (group: G) => string;
		getDevices?: (group: G) => Device[];
	}

	let { groups, selection, ondelete, onrename, oniconchange, onAddTo, editHref, getDevices }: Props = $props();

	const COLUMNS: ColumnDef<G>[] = $derived.by(() => [
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
			sortValue: (g) => groupDisplayName(g),
			cell: nameCell,
		},
		{
			key: "source",
			label: m.field_source({}, locale.messageOptions()),
			sortValue: (g) => g.source,
			cell: sourceCell,
		},
		{
			key: "members",
			label: m.field_members({}, locale.messageOptions()),
			sortValue: (g) => g.members.length,
			cell: membersCell,
		},
		{
			key: "breakdown",
			label: m.field_breakdown({}, locale.messageOptions()),
			cell: breakdownCell,
		},
		{
			key: "state",
			label: m.field_state({}, locale.messageOptions()),
			cell: stateCell,
		},
		{
			key: "createdBy",
			label: m.field_managed_by({}, locale.messageOptions()),
			sortValue: (g) => g.source === "zigbee2mqtt" ? "Zigbee2MQTT" : g.createdBy?.name ?? null,
			cell: managedByCell,
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

	const tableState = createTableState({ storageKey: "groups", columns: () => COLUMNS });

	const displayRows = $derived(tableState.applySort(groups));
	const displayIds = $derived<readonly string[]>(displayRows.map((g) => g.id));

</script>

{#snippet selectHead()}
	<TableHeaderCheckbox {selection} orderedIds={displayIds} />
{/snippet}

{#snippet selectCell(g: G)}
	<TableRowCheckbox
		id={g.id}
		{selection}
		orderedIds={displayIds}
		ariaLabel={m.shared_select_item({ name: groupDisplayName(g) }, locale.messageOptions())}
	/>
{/snippet}

{#snippet iconCell(g: G)}
	<IconCell value={g.icon} onselect={(icon) => oniconchange(g, icon)} fallback={GroupIcon} />
{/snippet}

{#snippet nameCell(g: G)}
	<InlineEditName name={groupDisplayName(g)} entityType="group" entityId={g.id} onsave={(newName) => onrename(g, newName)} />
{/snippet}

{#snippet sourceCell(g: G)}
	<HiveChip type={g.source === "zigbee2mqtt" ? "hub" : "group"} label={g.source === "zigbee2mqtt" ? "Zigbee" : "Hive"} />
{/snippet}

{#snippet membersCell(g: G)}
	<span class="text-sm text-muted-foreground whitespace-nowrap">
		{m.shared_member_count({ count: g.members.length }, locale.messageOptions())}
	</span>
{/snippet}

{#snippet breakdownCell(g: G)}
	<span class="text-sm text-muted-foreground">
		{#if g.members.length === 0}
			<span>—</span>
		{:else}
			{groupMemberBreakdown(g.members)}
		{/if}
	</span>
{/snippet}

{#snippet stateCell(g: G)}
	{@const devices = getDevices?.(g) ?? []}
	{@const readings = aggregateSensorReadings(
		devices,
		me.user?.temperatureUnit ?? "celsius",
	)}
	{#if readings.length === 0}
		<span class="text-sm text-muted-foreground">—</span>
	{:else}
		<SensorHistoryPopover
			target={{ kind: "group", id: g.id }}
			fields={readings.map((r) => r.field)}
			title={groupDisplayName(g)}
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
{/snippet}

{#snippet managedByCell(g: G)}
	{#if g.source === "zigbee2mqtt"}
		<span class="text-sm text-muted-foreground">Zigbee2MQTT</span>
	{:else}
		<CreatedByCell user={g.createdBy} />
	{/if}
{/snippet}

{#snippet actionsHead()}<ActionsHead />{/snippet}

{#snippet actionsCell(g: G)}
	<RowActionsCell
		editHref={editHref(g)}
		ondelete={g.source === "hive" ? () => ondelete(g) : undefined}
		editLabel={m.group_edit({}, locale.messageOptions())}
		deleteLabel={m.group_delete({}, locale.messageOptions())}
	>
		{#snippet leading()}
			{#if getDevices}
				<CollectionQuickControls
					devices={getDevices(g)}
					name={groupDisplayName(g)}
				target={{ targetType: CommandTargetType.Group, targetId: g.id }}
				/>
			{/if}
			{#if g.source === "hive"}<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => onAddTo(g)}
				aria-label={m.group_add({}, locale.messageOptions())}
			>
				<Plus class="size-4" />
			</Button>{/if}
		{/snippet}
	</RowActionsCell>
{/snippet}

<HiveDataTable
	{tableState}
	columns={COLUMNS}
	rows={displayRows}
	rowId={(g) => g.id}
	rowAttrs={(g) => rowAttrsForSelection(selection, g.id)}
/>
