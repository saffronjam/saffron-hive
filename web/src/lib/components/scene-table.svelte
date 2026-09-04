<script lang="ts">
	import { entityDisplayName } from "$lib/utils";
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
	import HiveChip from "$lib/components/hive-chip.svelte";
	import {
		createTableState,
		type ColumnDef,
	} from "$lib/utils/table-state.svelte";
	import type { TableSelection } from "$lib/utils/table-selection.svelte";
	import { rowAttrsForSelection } from "$lib/utils/row-attrs";
	import { sceneTargetBreakdown } from "$lib/list-helpers";
	import { Clapperboard, Play, Plus, Square } from "@lucide/svelte";
	import { scenePreviewGradient } from "$lib/device-tint";
	import type { Scene as SceneData } from "$lib/stores/scenes.svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		scenes: SceneData[];
		selection: TableSelection;
		applyingId: string | null;
		onapply: (scene: SceneData) => void;
		onstop?: (scene: SceneData) => void;
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
		onstop,
		ondelete,
		onrename,
		oniconchange,
		onAddTo,
	}: Props = $props();

	const COLUMNS: ColumnDef<SceneData>[] = $derived.by(() => {
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
			key: "color",
			label: "",
			hideable: false,
			headClass: "w-8",
			cellClass: "w-8",
			cell: colorCell,
		},
		{
			key: "name",
			label: m.scenes_column_name({}, options),
			sortValue: (s) => entityDisplayName("scene", s),
			cell: nameCell,
		},
		{
			key: "targets",
			label: m.scenes_column_targets({}, options),
			sortValue: (s) => s.targets.length + s.supportingStates.length,
			cell: targetsCell,
		},
		{
			key: "breakdown",
			label: m.scenes_column_breakdown({}, options),
			cell: breakdownCell,
		},
		{
			key: "rooms",
			label: m.scenes_column_rooms({}, options),
			sortValue: (s) => s.rooms.map((r) => entityDisplayName("room", r)).join(", "),
			cell: roomsCell,
		},
		{
			key: "createdBy",
			label: m.scenes_column_created_by({}, options),
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
		] satisfies ColumnDef<SceneData>[];
	});

	const tableState = createTableState({ storageKey: "scenes", columns: () => COLUMNS });

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
		ariaLabel={m.scenes_select({ name: entityDisplayName("scene", s) }, locale.messageOptions())}
	/>
{/snippet}

{#snippet colorCell(s: SceneData)}
	{@const active = s.activatedAt != null}
	<div class="transition-opacity duration-300 ease-out" style="opacity: {active ? 1 : 0.35}">
		<HiveColorSwatch color={scenePreviewGradient(s.preview)} />
	</div>
{/snippet}

{#snippet iconCell(s: SceneData)}
	<IconCell value={s.icon} onselect={(icon) => oniconchange(s, icon)} fallback={Clapperboard} />
{/snippet}

{#snippet nameCell(s: SceneData)}
	<InlineEditName name={entityDisplayName("scene", s)} entityType="scene" entityId={s.id} onsave={(newName) => onrename(s, newName)} />
{/snippet}

{#snippet targetsCell(s: SceneData)}
	{@const count = s.targets.length + s.supportingStates.length}
	<span class="text-sm text-muted-foreground whitespace-nowrap">
		{#if count === 0}
			{m.scenes_no_targets({}, locale.messageOptions())}
		{:else}
			{m.scenes_target_count({ count }, locale.messageOptions())}
		{/if}
	</span>
{/snippet}

{#snippet breakdownCell(s: SceneData)}
	<span class="text-sm text-muted-foreground">
		{sceneTargetBreakdown(s.targets)}
	</span>
{/snippet}

{#snippet roomsCell(s: SceneData)}
	{#if s.rooms.length === 0}
		<span class="text-sm text-muted-foreground">—</span>
	{:else}
		<div class="flex flex-wrap items-center gap-1">
			{#each s.rooms as r (r.id)}
				<HiveChip type="room" label={entityDisplayName("room", r)} iconOverride={r.icon} href={`/rooms?edit=${r.id}`} />
			{/each}
		</div>
	{/if}
{/snippet}

{#snippet createdByCell(s: SceneData)}
	<CreatedByCell user={s.createdBy} />
{/snippet}

{#snippet actionsHead()}<ActionsHead />{/snippet}

{#snippet actionsCell(s: SceneData)}
	{@const noTargets = s.targets.length + s.supportingStates.length === 0}
	{@const applying = applyingId === s.id}
	{@const active = s.activatedAt != null}
	<RowActionsCell
		editHref={`/scenes/${s.id}`}
		ondelete={() => ondelete(s)}
		editLabel={m.scenes_edit({}, locale.messageOptions())}
		deleteLabel={m.scenes_delete_title({}, locale.messageOptions())}
	>
		{#snippet leading()}
			{#if noTargets}
				<Tooltip>
					<TooltipTrigger>
						<Button variant="ghost" size="icon-sm" disabled class="transition-opacity duration-200" aria-label={m.scenes_apply({}, locale.messageOptions())}>
							<Play class="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>{m.scenes_no_targets({}, locale.messageOptions())}</TooltipContent>
				</Tooltip>
			{:else if active}
				<Button variant="ghost" size="icon-sm" haptic="execute" onclick={() => onstop?.(s)} disabled={applying} aria-label={m.scenes_stop({}, locale.messageOptions())}>
					<Square class="size-4" />
				</Button>
			{:else}
				<Button
					variant="ghost"
					size="icon-sm"
					haptic="execute"
					onclick={() => onapply(s)}
					disabled={applying}
					class="transition-opacity duration-200"
					aria-label={m.scenes_apply({}, locale.messageOptions())}
				>
					<Play class="size-4" />
				</Button>
			{/if}
			{#if onAddTo}
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => onAddTo?.(s)}
					aria-label={m.scenes_add_target({}, locale.messageOptions())}
				>
					<Plus class="size-4" />
				</Button>
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
