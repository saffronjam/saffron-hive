<script lang="ts" generics="G extends { id: string; name: string; icon?: string | null; members: { memberType: string }[]; createdBy?: { id: string; username: string; name: string } | null }">
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
	import { groupMemberBreakdown } from "$lib/list-helpers";
	import { aggregateSensorReadings } from "$lib/device-tint";
	import { me } from "$lib/stores/me.svelte";
	import type { Device } from "$lib/stores/devices";
	import { Group as GroupIcon, Plus } from "@lucide/svelte";

	interface Props {
		groups: G[];
		selection: TableSelection;
		onedit: (group: G) => void;
		ondelete: (group: G) => void;
		onrename: (group: G, newName: string) => void;
		oniconchange: (group: G, icon: string | null) => void;
		onAddTo: (group: G) => void;
		getDevices?: (group: G) => Device[];
	}

	let { groups, selection, onedit, ondelete, onrename, oniconchange, onAddTo, getDevices }: Props = $props();

	const COLUMNS: ColumnDef<G>[] = [
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
			sortValue: (g) => g.name,
			cell: nameCell,
		},
		{
			key: "members",
			label: "Members",
			sortValue: (g) => g.members.length,
			cell: membersCell,
		},
		{
			key: "breakdown",
			label: "Breakdown",
			cell: breakdownCell,
		},
		{
			key: "state",
			label: "State",
			cell: stateCell,
		},
		{
			key: "createdBy",
			label: "Created by",
			sortValue: (g) => g.createdBy?.name ?? null,
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

	const tableState = createTableState({ storageKey: "groups", columns: COLUMNS });

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
		ariaLabel="Select {g.name}"
	/>
{/snippet}

{#snippet iconCell(g: G)}
	<IconCell value={g.icon} onselect={(icon) => oniconchange(g, icon)} fallback={GroupIcon} />
{/snippet}

{#snippet nameCell(g: G)}
	<InlineEditName name={g.name} onsave={(newName) => onrename(g, newName)} />
{/snippet}

{#snippet membersCell(g: G)}
	<span class="text-sm text-muted-foreground whitespace-nowrap">
		{g.members.length} member{g.members.length === 1 ? "" : "s"}
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
			title={g.name}
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

{#snippet createdByCell(g: G)}
	<CreatedByCell user={g.createdBy} />
{/snippet}

{#snippet actionsHead()}<ActionsHead />{/snippet}

{#snippet actionsCell(g: G)}
	<RowActionsCell
		onedit={() => onedit(g)}
		ondelete={() => ondelete(g)}
		editLabel="Edit group"
		deleteLabel="Delete group"
	>
		{#snippet leading()}
			{#if getDevices}
				<CollectionQuickControls devices={getDevices(g)} name={g.name} />
			{/if}
			<Tooltip>
				<TooltipTrigger>
					<Button
						variant="ghost"
						size="icon-sm"
						onclick={() => onAddTo(g)}
						aria-label="Add to group"
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
	rowId={(g) => g.id}
	rowAttrs={(g) => rowAttrsForSelection(selection, g.id)}
/>
