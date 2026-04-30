<script lang="ts">
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
	import HiveColorSwatch from "$lib/components/hive-color-swatch.svelte";
	import {
		createTableState,
		type ColumnDef,
	} from "$lib/utils/table-state.svelte";
	import type { TableSelection } from "$lib/utils/table-selection.svelte";
	import { rowAttrsForSelection } from "$lib/utils/row-attrs";
	import { sceneTargetBreakdown } from "$lib/list-helpers";
	import { Clapperboard, Play, Plus } from "@lucide/svelte";
	import { sceneTintFromPayloads } from "$lib/device-tint";
	import { parsePayload } from "$lib/scene-editable";

	interface SceneAction {
		targetType: string;
		targetId: string;
	}

	interface SceneDevicePayload {
		deviceId: string;
		payload: string;
	}

	interface SceneRoomRef {
		id: string;
		name: string;
	}

	interface SceneData {
		id: string;
		name: string;
		icon?: string | null;
		rooms: SceneRoomRef[];
		actions: SceneAction[];
		devicePayloads: SceneDevicePayload[];
		effectivePayloads: SceneDevicePayload[];
		createdBy?: { id: string; username: string; name: string } | null;
		activatedAt?: string | null;
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
		onAddTo?: (scene: SceneData) => void;
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
		onAddTo,
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
			key: "rooms",
			label: "Rooms",
			sortValue: (s) => s.rooms.map((r) => r.name).join(", "),
			cell: roomsCell,
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
			headClass: "w-40 text-right",
			head: actionsHead,
			cell: actionsCell,
		},
	];

	const tableState = createTableState({ storageKey: "scenes", columns: COLUMNS });

	const displayRows = $derived(tableState.applySort(scenes));
	const displayIds = $derived<readonly string[]>(displayRows.map((s) => s.id));

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
	{@const active = s.activatedAt != null}
	<div class="transition-opacity duration-300 ease-out" style="opacity: {active ? 1 : 0.35}">
		<HiveColorSwatch color={sceneTintFromPayloads(s.effectivePayloads.map((p) => parsePayload(p.payload)))} />
	</div>
{/snippet}

{#snippet iconCell(s: SceneData)}
	<IconCell value={s.icon} onselect={(icon) => oniconchange(s, icon)} fallback={Clapperboard} />
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

{#snippet roomsCell(s: SceneData)}
	<span class="text-sm text-muted-foreground">
		{s.rooms.length === 0 ? "—" : s.rooms.map((r) => r.name).join(", ")}
	</span>
{/snippet}

{#snippet createdByCell(s: SceneData)}
	<CreatedByCell name={s.createdBy?.name} />
{/snippet}

{#snippet actionsHead()}<ActionsHead />{/snippet}

{#snippet actionsCell(s: SceneData)}
	{@const noTargets = s.actions.length === 0}
	{@const applying = applyingId === s.id}
	{@const active = s.activatedAt != null}
	<RowActionsCell
		onedit={() => onedit(s)}
		ondelete={() => ondelete(s)}
		editLabel="Edit scene"
		deleteLabel="Delete scene"
	>
		{#snippet leading()}
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => onapply(s)}
				disabled={applying || noTargets || active}
				class="transition-opacity duration-200"
				aria-label="Apply scene"
			>
				<Play class="size-4" />
			</Button>
			{#if onAddTo}
				<Tooltip>
					<TooltipTrigger>
						<Button
							variant="ghost"
							size="icon-sm"
							onclick={() => onAddTo?.(s)}
							aria-label="Add target"
						>
							<Plus class="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Add…</TooltipContent>
				</Tooltip>
			{/if}
		{/snippet}
	</RowActionsCell>
{/snippet}

<HiveDataTable
	{tableState}
	columns={COLUMNS}
	rows={displayRows}
	rowId={(s) => s.id}
	rowAttrs={(s) => rowAttrsForSelection(selection, s.id)}
/>
