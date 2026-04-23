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
	import { sceneTargetBreakdown } from "$lib/list-helpers";
	import { Clapperboard, Pencil, Play, Trash2 } from "@lucide/svelte";
	import { sceneTintFromPayloads } from "$lib/device-tint";
	import { parsePayload } from "$lib/scene-editable";

	interface SceneAction {
		id: string;
		targetType: string;
		targetId: string;
	}

	interface SceneDevicePayload {
		deviceId: string;
		payload: string;
	}

	interface SceneData {
		id: string;
		name: string;
		icon?: string | null;
		actions: SceneAction[];
		devicePayloads: SceneDevicePayload[];
		createdBy?: { id: string; username: string; name: string } | null;
	}

	interface Props {
		scenes: SceneData[];
		selection: TableSelection;
		applyingId: string | null;
		onapply: (scene: SceneData) => void;
		onedit: (scene: SceneData) => void;
		ondelete: (scene: SceneData) => void;
		onrename: (scene: SceneData, newName: string) => void;
		oniconchange: (scene: SceneData, icon: string | null) => void;
	}

	let {
		scenes,
		selection,
		applyingId,
		onapply,
		onedit,
		ondelete,
		onrename,
		oniconchange,
	}: Props = $props();

	const COLUMNS: ColumnDef<SceneData>[] = [
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
			key: "color",
			label: "",
			hideable: false,
			headClass: "w-8",
			cellClass: "w-8",
			cell: colorCell,
		},
		{
			key: "name",
			label: "Name",
			sortValue: (s) => s.name,
			cell: nameCell,
		},
		{
			key: "targets",
			label: "Targets",
			sortValue: (s) => s.actions.length,
			cell: targetsCell,
		},
		{
			key: "breakdown",
			label: "Breakdown",
			cell: breakdownCell,
		},
		{
			key: "createdBy",
			label: "Created by",
			sortValue: (s) => s.createdBy?.name ?? null,
			cell: createdByCell,
		},
		{
			key: "actions",
			label: "",
			hideable: false,
			headClass: "w-32 text-right",
			head: actionsHead,
			cell: actionsCell,
		},
	];

	const tableState = createTableState({ storageKey: "scenes", columns: COLUMNS });

	const displayRows = $derived(tableState.applySort(scenes));
	const displayIds = $derived<readonly string[]>(displayRows.map((s) => s.id));

	function rowAttrsFor(s: SceneData) {
		return selection.isSelected(s.id) ? { "data-state": "selected" } : {};
	}
</script>

{#snippet selectHead()}
	<TableHeaderCheckbox {selection} orderedIds={displayIds} />
{/snippet}

{#snippet selectCell(s: SceneData)}
	<TableRowCheckbox
		id={s.id}
		{selection}
		orderedIds={displayIds}
		ariaLabel="Select {s.name}"
	/>
{/snippet}

{#snippet colorCell(s: SceneData)}
	<span
		class="inline-block h-3 w-3 shrink-0 rounded-full border border-border"
		style="background: {sceneTintFromPayloads(s.devicePayloads.map((p) => parsePayload(p.payload)))}"
	></span>
{/snippet}

{#snippet iconCell(s: SceneData)}
	<IconPicker value={s.icon} onselect={(icon) => oniconchange(s, icon)}>
		<button
			type="button"
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
		>
			<DynamicIcon icon={s.icon} class="size-4.5 text-muted-foreground">
				{#snippet fallback()}
					<Clapperboard class="size-4.5 text-muted-foreground" />
				{/snippet}
			</DynamicIcon>
		</button>
	</IconPicker>
{/snippet}

{#snippet nameCell(s: SceneData)}
	<InlineEditName name={s.name} onsave={(newName) => onrename(s, newName)} />
{/snippet}

{#snippet targetsCell(s: SceneData)}
	<span class="text-sm text-muted-foreground whitespace-nowrap">
		{s.actions.length} target{s.actions.length === 1 ? "" : "s"}
	</span>
{/snippet}

{#snippet breakdownCell(s: SceneData)}
	<span class="text-sm text-muted-foreground">
		{sceneTargetBreakdown(s.actions)}
	</span>
{/snippet}

{#snippet createdByCell(s: SceneData)}
	<span class="text-sm text-muted-foreground whitespace-nowrap">
		{s.createdBy?.name ?? "—"}
	</span>
{/snippet}

{#snippet actionsHead()}
	<span class="block text-right">Actions</span>
{/snippet}

{#snippet actionsCell(s: SceneData)}
	{@const noTargets = s.actions.length === 0}
	{@const applying = applyingId === s.id}
	<div class="flex items-center justify-end gap-1">
		<Tooltip>
			<TooltipTrigger>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => onapply(s)}
					disabled={applying || noTargets}
					aria-label="Apply scene"
				>
					<Play class="size-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{#if noTargets}
					Add a target to activate scene
				{:else if applying}
					Applying...
				{:else}
					Apply scene
				{/if}
			</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => onedit(s)}
					aria-label="Edit scene"
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
					onclick={() => ondelete(s)}
					aria-label="Delete scene"
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
	rowId={(s) => s.id}
	rowAttrs={rowAttrsFor}
/>
