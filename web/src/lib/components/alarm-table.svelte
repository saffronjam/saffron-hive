<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import AlarmSeverityBadge from "$lib/components/alarm-severity-badge.svelte";
	import TableHeaderCheckbox from "$lib/components/table-header-checkbox.svelte";
	import TableRowCheckbox from "$lib/components/table-row-checkbox.svelte";
	import HiveDataTable from "$lib/components/hive-data-table.svelte";
	import ActionsHead from "$lib/components/table-cells/actions-head.svelte";
	import {
		createTableState,
		type ColumnDef,
	} from "$lib/utils/table-state.svelte";
	import type { TableSelection } from "$lib/utils/table-selection.svelte";
	import { rowAttrsForSelection } from "$lib/utils/row-attrs";
	import { formatRelative, formatFull } from "$lib/time-format";
	import { nowStore } from "$lib/stores/now.svelte";
	import { Trash2 } from "@lucide/svelte";
	import type { Alarm } from "$lib/stores/alarms.svelte";

	interface Props {
		alarms: Alarm[];
		selection: TableSelection;
		ondelete: (alarm: Alarm) => void;
	}

	let { alarms, selection, ondelete }: Props = $props();

	function kindLabel(k: Alarm["kind"]): string {
		return k === "AUTO" ? "Auto" : "One-shot";
	}

	const COLUMNS: ColumnDef<Alarm>[] = [
		{
			key: "select",
			label: "",
			hideable: false,
			headClass: "w-10",
			head: selectHead,
			cell: selectCell,
		},
		{
			key: "severity",
			label: "Severity",
			headClass: "w-28",
			sortValue: (a) => a.severity,
			cell: severityCell,
		},
		{
			key: "kind",
			label: "Kind",
			headClass: "w-24",
			sortValue: (a) => a.kind,
			cell: kindCell,
		},
		{
			key: "message",
			label: "Message",
			sortValue: (a) => a.message,
			cellClass: "truncate max-w-md",
			cell: messageCell,
		},
		{
			key: "id",
			label: "ID",
			defaultHidden: true,
			headClass: "w-48",
			cell: idCell,
		},
		{
			key: "source",
			label: "Source",
			headClass: "w-40",
			sortValue: (a) => a.source,
			cell: sourceCell,
		},
		{
			key: "count",
			label: "Count",
			headClass: "w-16 text-right",
			cellClass: "text-right tabular-nums",
			sortValue: (a) => a.count,
			cell: countCell,
		},
		{
			key: "lastRaised",
			label: "Last raised",
			headClass: "w-32",
			sortValue: (a) => a.lastRaisedAt,
			cell: lastRaisedCell,
		},
		{
			key: "actions",
			label: "",
			hideable: false,
			headClass: "w-16 text-right",
			head: actionsHead,
			cell: actionsCell,
		},
	];

	const tableState = createTableState({ storageKey: "alarms", columns: COLUMNS });

	const displayRows = $derived(tableState.applySort(alarms));
	const displayIds = $derived<readonly string[]>(displayRows.map((a) => a.id));

</script>

{#snippet selectHead()}
	<TableHeaderCheckbox {selection} orderedIds={displayIds} />
{/snippet}

{#snippet selectCell(a: Alarm)}
	<TableRowCheckbox
		id={a.id}
		{selection}
		orderedIds={displayIds}
		ariaLabel="Select alarm {a.id}"
	/>
{/snippet}

{#snippet severityCell(a: Alarm)}
	<AlarmSeverityBadge severity={a.severity} />
{/snippet}

{#snippet kindCell(a: Alarm)}
	<Badge variant="outline">{kindLabel(a.kind)}</Badge>
{/snippet}

{#snippet messageCell(a: Alarm)}
	<span>{a.message}</span>
{/snippet}

{#snippet idCell(a: Alarm)}
	<span class="font-mono text-xs text-muted-foreground truncate">{a.id}</span>
{/snippet}

{#snippet sourceCell(a: Alarm)}
	<span class="text-xs text-muted-foreground">{a.source}</span>
{/snippet}

{#snippet countCell(a: Alarm)}
	{a.count}
{/snippet}

{#snippet lastRaisedCell(a: Alarm)}
	<span class="text-xs text-muted-foreground">
		<Tooltip>
			<TooltipTrigger>
				<span>{formatRelative(new Date(a.lastRaisedAt), nowStore.current)}</span>
			</TooltipTrigger>
			<TooltipContent>{formatFull(new Date(a.lastRaisedAt))}</TooltipContent>
		</Tooltip>
	</span>
{/snippet}

{#snippet actionsHead()}<ActionsHead />{/snippet}

{#snippet actionsCell(a: Alarm)}
	<div class="flex items-center justify-end">
		<Button
			variant="ghost"
			size="icon"
			aria-label="Delete alarm"
			onclick={() => ondelete(a)}
		>
			<Trash2 class="size-4 text-destructive" />
		</Button>
	</div>
{/snippet}

<HiveDataTable
	{tableState}
	columns={COLUMNS}
	rows={displayRows}
	rowId={(a) => a.id}
	rowAttrs={(a) => rowAttrsForSelection(selection, a.id)}
/>
