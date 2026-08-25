<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import TableHeaderCheckbox from "$lib/components/table-header-checkbox.svelte";
	import TableRowCheckbox from "$lib/components/table-row-checkbox.svelte";
	import HiveDataTable from "$lib/components/hive-data-table.svelte";
	import IconCell from "$lib/components/table-cells/icon-cell.svelte";
	import CreatedByCell from "$lib/components/table-cells/created-by-cell.svelte";
	import ActionsHead from "$lib/components/table-cells/actions-head.svelte";
	import RowActionsCell from "$lib/components/table-cells/row-actions-cell.svelte";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import { createTableState, type ColumnDef } from "$lib/utils/table-state.svelte";
	import type { TableSelection } from "$lib/utils/table-selection.svelte";
	import { rowAttrsForSelection } from "$lib/utils/row-attrs";
	import { effectCapabilityLabel } from "$lib/effect-display";
	import { EffectKind } from "$lib/gql/graphql";
	import { nativeEffectSupportSummary } from "$lib/native-effect";
	import { Play, Sparkles, Zap } from "@lucide/svelte";

	interface CreatedBy {
		id: string;
		username: string;
		name: string;
	}

	interface EffectTableEffect {
		id: string;
		name: string;
		source: string;
		icon?: string | null;
		kind: EffectKind;
		nativeName?: string | null;
		loop: boolean;
		durationMs: number;
		requiredCapabilities: string[];
		tracks: { id: string; clips: { id: string }[] }[];
		createdBy?: CreatedBy | null;
	}

	interface EffectTableNativeOption {
		name: string;
		displayName: string;
		source: string;
		confirmedDeviceCount: number;
		untestedDeviceCount: number;
		unsupportedDeviceCount: number;
	}

	type EffectTableRow =
		| { id: string; kind: "timeline"; effect: EffectTableEffect }
		| { id: string; kind: "native"; option: EffectTableNativeOption };

	interface Props {
		effects: EffectTableEffect[];
		nativeOptions: EffectTableNativeOption[];
		selection: TableSelection;
		onrun: (effect: EffectTableEffect) => void;
		onrunnative: (option: EffectTableNativeOption) => void;
		ondelete: (effect: EffectTableEffect) => void;
		onrename: (effect: EffectTableEffect, newName: string) => void;
		oniconchange: (effect: EffectTableEffect, icon: string | null) => void;
	}

	let {
		effects,
		nativeOptions,
		selection,
		onrun,
		onrunnative,
		ondelete,
		onrename,
		oniconchange,
	}: Props = $props();

	const rows = $derived<EffectTableRow[]>([
		...effects.map((effect) => ({ id: effect.id, kind: "timeline" as const, effect })),
		...nativeOptions.map((option) => ({ id: `native:${option.name}`, kind: "native" as const, option })),
	]);

	function rowName(row: EffectTableRow): string {
		return row.kind === "timeline" ? row.effect.name : row.option.displayName;
	}

	function rowSource(row: EffectTableRow): string {
		return row.kind === "timeline" ? row.effect.source : row.option.source;
	}

	function clipCount(effect: EffectTableEffect): number {
		return effect.tracks.reduce((sum, track) => sum + track.clips.length, 0);
	}

	const COLUMNS: ColumnDef<EffectTableRow>[] = [
		{ key: "select", label: "", hideable: false, headClass: "w-10", head: selectHead, cell: selectCell },
		{ key: "icon", label: "", hideable: false, headClass: "w-12", cell: iconCell },
		{ key: "name", label: "Name", sortValue: rowName, cell: nameCell },
		{ key: "source", label: "Source", sortValue: rowSource, cell: sourceCell },
		{ key: "details", label: "Details", sortValue: rowName, cell: detailsCell },
		{ key: "capabilities", label: "Required", cell: capabilitiesCell },
		{
			key: "createdBy",
			label: "Created by",
			sortValue: (row) => (row.kind === "timeline" ? row.effect.createdBy?.name ?? null : null),
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

	const tableState = createTableState({ storageKey: "effects", columns: COLUMNS });
	const displayRows = $derived(tableState.applySort(rows));
	const displayIds = $derived<readonly string[]>(displayRows.map((row) => row.id));
</script>

{#snippet selectHead()}
	<TableHeaderCheckbox {selection} orderedIds={displayIds} />
{/snippet}

{#snippet selectCell(row: EffectTableRow)}
	<TableRowCheckbox
		id={row.id}
		{selection}
		orderedIds={displayIds}
		ariaLabel="Select {rowName(row)}"
		tooltip={row.kind === "native" ? "Managed by Zigbee2MQTT" : undefined}
	/>
{/snippet}

{#snippet iconCell(row: EffectTableRow)}
	{#if row.kind === "timeline"}
		<IconCell
			value={row.effect.icon}
			onselect={(icon) => oniconchange(row.effect, icon)}
			fallback={Sparkles}
		/>
	{:else}
		<div class="flex size-9 items-center justify-center rounded-md bg-muted">
			<Zap class="size-4.5 text-muted-foreground" />
		</div>
	{/if}
{/snippet}

{#snippet nameCell(row: EffectTableRow)}
	{#if row.kind === "timeline"}
		<InlineEditName name={row.effect.name} onsave={(name) => onrename(row.effect, name)} />
	{:else}
		<span class="text-sm font-medium text-foreground">{row.option.displayName}</span>
	{/if}
{/snippet}

{#snippet sourceCell(row: EffectTableRow)}
	<HiveChip
		type={row.kind === "timeline" ? "group" : "hub"}
		label={row.kind === "timeline" ? "Hive" : "Zigbee"}
	/>
{/snippet}

{#snippet detailsCell(row: EffectTableRow)}
	<span class="text-sm text-muted-foreground whitespace-nowrap">
		{#if row.kind === "timeline"}
			{@const tracks = row.effect.tracks.length}
			{@const clips = clipCount(row.effect)}
			{row.effect.loop ? "Loop" : "Once"} · {tracks} track{tracks === 1 ? "" : "s"} · {clips} clip{clips === 1 ? "" : "s"}
		{:else}
			{nativeEffectSupportSummary(row.option)}
		{/if}
	</span>
{/snippet}

{#snippet capabilitiesCell(row: EffectTableRow)}
	{#if row.kind === "timeline" && row.effect.requiredCapabilities.length > 0}
		<div class="flex flex-wrap items-center gap-1">
			{#each row.effect.requiredCapabilities as capability (capability)}
				<Badge variant="outline" class="text-[10px]">{effectCapabilityLabel(capability)}</Badge>
			{/each}
		</div>
	{:else}
		<span class="text-sm text-muted-foreground">—</span>
	{/if}
{/snippet}

{#snippet createdByCell(row: EffectTableRow)}
	<CreatedByCell user={row.kind === "timeline" ? row.effect.createdBy : null} />
{/snippet}

{#snippet actionsHead()}<ActionsHead />{/snippet}

{#snippet actionsCell(row: EffectTableRow)}
	<RowActionsCell
		editHref={row.kind === "timeline" ? `/effects/${row.effect.id}` : undefined}
		ondelete={row.kind === "timeline" ? () => ondelete(row.effect) : undefined}
		editLabel="Edit effect"
		deleteLabel="Delete effect"
	>
		{#snippet leading()}
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => row.kind === "timeline" ? onrun(row.effect) : onrunnative(row.option)}
				aria-label="Run effect"
			>
				<Play class="size-4" />
			</Button>
		{/snippet}
	</RowActionsCell>
{/snippet}

<HiveDataTable
	{tableState}
	columns={COLUMNS}
	rows={displayRows}
	rowId={(row) => row.id}
	rowAttrs={(row) => rowAttrsForSelection(selection, row.id)}
/>
