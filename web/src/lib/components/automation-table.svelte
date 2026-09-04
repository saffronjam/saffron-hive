<script lang="ts">
	import type { Automation } from "$lib/stores/automations.svelte";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import TableHeaderCheckbox from "$lib/components/table-header-checkbox.svelte";
	import TableRowCheckbox from "$lib/components/table-row-checkbox.svelte";
	import HiveDataTable from "$lib/components/hive-data-table.svelte";
	import IconCell from "$lib/components/table-cells/icon-cell.svelte";
	import CreatedByCell from "$lib/components/table-cells/created-by-cell.svelte";
	import ActionsHead from "$lib/components/table-cells/actions-head.svelte";
	import RowActionsCell from "$lib/components/table-cells/row-actions-cell.svelte";
	import {
		createTableState,
		type ColumnDef,
	} from "$lib/utils/table-state.svelte";
	import type { TableSelection } from "$lib/utils/table-selection.svelte";
	import { rowAttrsForSelection } from "$lib/utils/row-attrs";
	import AutomationComposition from "$lib/components/automation-composition.svelte";
	import { formatFull, formatRelative } from "$lib/time-format";
	import { nowStore } from "$lib/stores/now.svelte";
	import { me } from "$lib/stores/me.svelte";
	import { Workflow } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { entityDisplayName } from "$lib/utils";

	interface Props {
		automations: Automation[];
		selection: TableSelection;
		ontoggle: (a: Automation, enabled: boolean) => void;
		ondelete: (a: Automation) => void;
		onrename: (a: Automation, newName: string) => void;
		oniconchange: (a: Automation, icon: string | null) => void;
	}

	let { automations, selection, ontoggle, ondelete, onrename, oniconchange }: Props = $props();

	const COLUMNS: ColumnDef<Automation>[] = $derived.by(() => {
		const options = locale.messageOptions();
		return [
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
			label: m.automations_column_name({}, options),
			sortValue: (a) => entityDisplayName("automation", a),
			cell: nameCell,
		},
		{
			key: "meta",
			label: m.automations_column_meta({}, options),
			sortValue: (a) => a.nodes.length,
			cell: metaCell,
		},
		{
			key: "composition",
			label: m.automations_column_composition({}, options),
			cell: compositionCell,
		},
		{
			key: "lastTriggered",
			label: m.automations_column_last_triggered({}, options),
			sortValue: (a) => a.lastFiredAt ?? null,
			cell: lastTriggeredCell,
		},
		{
			key: "createdBy",
			label: m.automations_column_created_by({}, options),
			sortValue: (a) => a.createdBy?.name ?? null,
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
		] satisfies ColumnDef<Automation>[];
	});

	const tableState = createTableState({
		storageKey: "automations",
		columns: () => COLUMNS,
	});

	const displayRows = $derived(tableState.applySort(automations));
	const displayIds = $derived<readonly string[]>(
		displayRows.map((a) => a.id),
	);

</script>

{#snippet selectHead()}
	<TableHeaderCheckbox {selection} orderedIds={displayIds} />
{/snippet}

{#snippet selectCell(a: Automation)}
	<TableRowCheckbox
		id={a.id}
		{selection}
		orderedIds={displayIds}
		ariaLabel={m.automations_select({ name: entityDisplayName("automation", a) }, locale.messageOptions())}
	/>
{/snippet}

{#snippet iconCell(a: Automation)}
	<IconCell value={a.icon} onselect={(icon) => oniconchange(a, icon)} fallback={Workflow} />
{/snippet}

{#snippet nameCell(a: Automation)}
	<InlineEditName
		name={entityDisplayName("automation", a)}
		entityType="automation"
		entityId={a.id}
		onsave={(newName) => onrename(a, newName)}
	/>
{/snippet}

{#snippet metaCell(a: Automation)}
	<span class="text-xs text-muted-foreground whitespace-nowrap">
		{m.automations_node_count({ count: a.nodes.length }, locale.messageOptions())}
	</span>
{/snippet}

{#snippet compositionCell(a: Automation)}
	<AutomationComposition nodes={a.nodes} />
{/snippet}

{#snippet lastTriggeredCell(a: Automation)}
	<span class="text-xs text-muted-foreground whitespace-nowrap">
		{#if a.lastFiredAt}
			<Tooltip>
				<TooltipTrigger>
					<span
						>{formatRelative(
							new Date(a.lastFiredAt),
							nowStore.current,
							me.user?.timeFormat ?? "24h",
						)}</span
					>
				</TooltipTrigger>
				<TooltipContent>{formatFull(new Date(a.lastFiredAt))}</TooltipContent>
			</Tooltip>
		{:else}
			<span class="text-muted-foreground">—</span>
		{/if}
	</span>
{/snippet}

{#snippet createdByCell(a: Automation)}
	<CreatedByCell user={a.createdBy} />
{/snippet}

{#snippet actionsHead()}<ActionsHead />{/snippet}

{#snippet actionsCell(a: Automation)}
	<RowActionsCell
		editHref={`/automations/${a.id}`}
		ondelete={() => ondelete(a)}
		editLabel={m.automations_edit({}, locale.messageOptions())}
		deleteLabel={m.automations_delete_title({}, locale.messageOptions())}
	>
		{#snippet leading()}
			<Switch
				checked={a.enabled}
				onCheckedChange={(checked) => ontoggle(a, checked)}
				aria-label={a.enabled ? m.automations_disable({ name: entityDisplayName("automation", a) }, locale.messageOptions()) : m.automations_enable({ name: entityDisplayName("automation", a) }, locale.messageOptions())}
			/>
		{/snippet}
	</RowActionsCell>
{/snippet}

<HiveDataTable
	{tableState}
	columns={COLUMNS}
	rows={displayRows}
	rowId={(a) => a.id}
	rowAttrs={(a) => rowAttrsForSelection(selection, a.id)}
/>
