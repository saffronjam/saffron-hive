<script lang="ts" generics="G extends { id: string; name: string; icon?: string | null; members: { memberType: string }[]; createdBy?: { id: string; username: string; name: string } | null }">
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
	import { groupMemberBreakdown } from "$lib/list-helpers";
	import { Group as GroupIcon, Pencil, Plus, Trash2 } from "@lucide/svelte";

	interface Props {
		groups: G[];
		selection: TableSelection;
		onedit: (group: G) => void;
		ondelete: (group: G) => void;
		onrename: (group: G, newName: string) => void;
		oniconchange: (group: G, icon: string | null) => void;
		onAddTo: (group: G) => void;
	}

	let { groups, selection, onedit, ondelete, onrename, oniconchange, onAddTo }: Props = $props();

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

	function rowAttrsFor(g: G) {
		return selection.isSelected(g.id) ? { "data-state": "selected" } : {};
	}
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
	<IconPicker value={g.icon} onselect={(icon) => oniconchange(g, icon)}>
		<button
			type="button"
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
		>
			<DynamicIcon icon={g.icon} class="size-4.5 text-muted-foreground">
				{#snippet fallback()}
					<GroupIcon class="size-4.5 text-muted-foreground" />
				{/snippet}
			</DynamicIcon>
		</button>
	</IconPicker>
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

{#snippet createdByCell(g: G)}
	<span class="text-sm text-muted-foreground whitespace-nowrap">
		{g.createdBy?.name ?? "—"}
	</span>
{/snippet}

{#snippet actionsHead()}
	<span class="block text-right">Actions</span>
{/snippet}

{#snippet actionsCell(g: G)}
	<div class="flex items-center justify-end gap-1">
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
		<Tooltip>
			<TooltipTrigger>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => onedit(g)}
					aria-label="Edit group"
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
					onclick={() => ondelete(g)}
					aria-label="Delete group"
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
	rowId={(g) => g.id}
	rowAttrs={rowAttrsFor}
/>
