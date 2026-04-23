<script lang="ts">
	import { goto } from "$app/navigation";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
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
	import { automationNodeCounts } from "$lib/list-helpers";
	import { formatFull, formatRelative } from "$lib/time-format";
	import { nowStore } from "$lib/stores/now.svelte";
	import { GitMerge, Pencil, Play, Trash2, Workflow, Zap } from "@lucide/svelte";

	interface AutomationNode {
		id: string;
		type: string;
		config: string;
	}

	interface AutomationEdge {
		id: string;
		fromNodeId: string;
		toNodeId: string;
	}

	interface AutomationData {
		id: string;
		name: string;
		icon?: string | null;
		enabled: boolean;
		lastFiredAt?: string | null;
		nodes: AutomationNode[];
		edges: AutomationEdge[];
		createdBy?: { id: string; username: string; name: string } | null;
	}

	interface Props {
		automations: AutomationData[];
		selection: TableSelection;
		ontoggle: (id: string, enabled: boolean) => void;
		ondelete: (id: string) => void;
		onrename: (id: string, newName: string) => void;
		oniconchange: (id: string, icon: string | null) => void;
	}

	let { automations, selection, ontoggle, ondelete, onrename, oniconchange }: Props = $props();

	const COLUMNS: ColumnDef<AutomationData>[] = [
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
			sortValue: (a) => a.name,
			cell: nameCell,
		},
		{
			key: "meta",
			label: "Meta",
			sortValue: (a) => a.nodes.length,
			cell: metaCell,
		},
		{
			key: "composition",
			label: "Composition",
			cell: compositionCell,
		},
		{
			key: "lastTriggered",
			label: "Last triggered",
			sortValue: (a) => a.lastFiredAt ?? null,
			cell: lastTriggeredCell,
		},
		{
			key: "createdBy",
			label: "Created by",
			sortValue: (a) => a.createdBy?.name ?? null,
			cell: createdByCell,
		},
		{
			key: "enabled",
			label: "Enabled",
			headClass: "w-20",
			sortValue: (a) => a.enabled,
			cell: enabledCell,
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

	const tableState = createTableState({
		storageKey: "automations",
		columns: COLUMNS,
	});

	const displayRows = $derived(tableState.applySort(automations));
	const displayIds = $derived<readonly string[]>(
		displayRows.map((a) => a.id),
	);

	function rowAttrsFor(a: AutomationData) {
		return selection.isSelected(a.id) ? { "data-state": "selected" } : {};
	}
</script>

{#snippet selectHead()}
	<TableHeaderCheckbox {selection} orderedIds={displayIds} />
{/snippet}

{#snippet selectCell(a: AutomationData)}
	<TableRowCheckbox
		id={a.id}
		{selection}
		orderedIds={displayIds}
		ariaLabel="Select {a.name}"
	/>
{/snippet}

{#snippet iconCell(a: AutomationData)}
	<IconPicker
		value={a.icon}
		onselect={(icon) => oniconchange(a.id, icon)}
	>
		<button
			type="button"
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
		>
			<DynamicIcon icon={a.icon} class="size-4.5 text-muted-foreground">
				{#snippet fallback()}
					<Workflow class="size-4.5 text-muted-foreground" />
				{/snippet}
			</DynamicIcon>
		</button>
	</IconPicker>
{/snippet}

{#snippet nameCell(a: AutomationData)}
	<InlineEditName
		name={a.name}
		onsave={(newName) => onrename(a.id, newName)}
	/>
{/snippet}

{#snippet metaCell(a: AutomationData)}
	<span class="text-xs text-muted-foreground whitespace-nowrap">
		{a.nodes.length} node{a.nodes.length === 1 ? "" : "s"}
	</span>
{/snippet}

{#snippet compositionCell(a: AutomationData)}
	{@const c = automationNodeCounts(a.nodes)}
	{#if c.trigger === 0 && c.operator === 0 && c.action === 0}
		<span class="text-muted-foreground">—</span>
	{:else}
		<div class="flex flex-wrap gap-1">
			{#if c.trigger > 0}
				<Badge variant="secondary" class="gap-1 text-xs">
					<Zap class="size-3 text-blue-500" />
					{c.trigger}
				</Badge>
			{/if}
			{#if c.operator > 0}
				<Badge variant="secondary" class="gap-1 text-xs">
					<GitMerge class="size-3 text-yellow-500" />
					{c.operator}
				</Badge>
			{/if}
			{#if c.action > 0}
				<Badge variant="secondary" class="gap-1 text-xs">
					<Play class="size-3 text-green-500" />
					{c.action}
				</Badge>
			{/if}
		</div>
	{/if}
{/snippet}

{#snippet lastTriggeredCell(a: AutomationData)}
	<span class="text-xs text-muted-foreground whitespace-nowrap">
		{#if a.lastFiredAt}
			<Tooltip>
				<TooltipTrigger>
					<span>{formatRelative(new Date(a.lastFiredAt), nowStore.current)}</span>
				</TooltipTrigger>
				<TooltipContent>{formatFull(new Date(a.lastFiredAt))}</TooltipContent>
			</Tooltip>
		{:else}
			<span class="text-muted-foreground">—</span>
		{/if}
	</span>
{/snippet}

{#snippet createdByCell(a: AutomationData)}
	<span class="text-sm text-muted-foreground whitespace-nowrap">
		{a.createdBy?.name ?? "—"}
	</span>
{/snippet}

{#snippet enabledCell(a: AutomationData)}
	<Switch
		checked={a.enabled}
		onCheckedChange={(checked) => ontoggle(a.id, checked)}
	/>
{/snippet}

{#snippet actionsHead()}
	<span class="block text-right">Actions</span>
{/snippet}

{#snippet actionsCell(a: AutomationData)}
	<div class="flex items-center justify-end gap-1">
		<Tooltip>
			<TooltipTrigger>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => goto(`/automations/${a.id}`)}
					aria-label="Edit automation"
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
					onclick={() => ondelete(a.id)}
					aria-label="Delete automation"
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
	rowId={(a) => a.id}
	rowAttrs={rowAttrsFor}
/>
