<script lang="ts">
	import { fly } from "svelte/transition";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { alarmsStore, type Alarm } from "$lib/stores/alarms.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig } from "$lib/components/hive-searchbar";
	import { createUrlSearchState } from "$lib/search-state.svelte";
	import { page } from "$app/state";
	import AlarmTable from "$lib/components/alarm-table.svelte";
	import AlarmSeverityBadge from "$lib/components/alarm-severity-badge.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import TableSelectionToolbar from "$lib/components/table-selection-toolbar.svelte";
	import { createTableSelection } from "$lib/utils/table-selection.svelte";
	import { parseSince } from "$lib/time-format";
	import type { AlarmSeverity } from "$lib/gql/graphql";
	import { alarmMessage } from "$lib/i18n/alarm";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		/** Whether this is the page the user is on; header writes gate on it. */
		visible: boolean;
	}

	let { visible }: Props = $props();


	type SeverityKey = "HIGH" | "MEDIUM" | "LOW";

	const DELETE_ALARM = graphql(`
		mutation DeleteAlarm($alarmId: ID!) {
			deleteAlarm(alarmId: $alarmId)
		}
	`);

	const BATCH_DELETE_ALARMS = graphql(`
		mutation BatchDeleteAlarms($alarmIds: [ID!]!) {
			batchDeleteAlarms(alarmIds: $alarmIds)
		}
	`);

	const client = getContextClient();
	const messageOptions = $derived(locale.messageOptions());
	const searchController = createUrlSearchState({
		active: () => visible && page.url.pathname === "/alarms",
	});
	let activeSeverities = $state(new Set<SeverityKey>(["HIGH", "MEDIUM", "LOW"]));
	let deleteTarget = $state<Alarm | null>(null);
	let deleteLoading = $state(false);

	const selection = createTableSelection();
	let batchDeleteConfirm = $state(false);
	let batchDeleteLoading = $state(false);

	const sinceOptions = $derived.by(() => [
		{ value: "5m", label: m.activity_since_minutes({ count: 5 }, messageOptions) },
		{ value: "1h", label: m.activity_since_hour({}, messageOptions) },
		{ value: "6h", label: m.activity_since_hours({ count: 6 }, messageOptions) },
		{ value: "24h", label: m.activity_since_hours({ count: 24 }, messageOptions) },
		{ value: "7d", label: m.activity_since_days({ count: 7 }, messageOptions) },
	]);

	const kindOptions = $derived.by(() => [
		{ value: "AUTO", label: m.alarms_kind_auto({}, messageOptions) },
		{ value: "ONE_SHOT", label: m.alarms_kind_one_shot({}, messageOptions) },
	]);

	const severityOptions = $derived.by<{ value: SeverityKey; label: string }[]>(() => [
		{ value: "HIGH", label: m.alarms_severity_high({}, messageOptions) },
		{ value: "MEDIUM", label: m.alarms_severity_medium({}, messageOptions) },
		{ value: "LOW", label: m.alarms_severity_low({}, messageOptions) },
	]);

	function filterOptions<T extends { value: string; label: string }>(input: string, options: T[]): T[] {
		const q = input.toLowerCase();
		if (!q) return options;
		return options.filter(
			(o) => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q),
		);
	}

	const searchChipConfigs = $derived.by<ChipConfig[]>(() => [
		{
			keyword: "severity",
			label: m.alarms_filter_severity({}, messageOptions),
			variant: "secondary",
			options: (input) => filterOptions(input, severityOptions),
			resolveLabel: (value) =>
				severityOptions.find((o) => o.value === value)?.label ?? null,
		},
		{
			keyword: "kind",
			label: m.alarms_filter_kind({}, messageOptions),
			variant: "secondary",
			options: (input) => filterOptions(input, kindOptions),
			resolveLabel: (value) => kindOptions.find((o) => o.value === value)?.label ?? null,
		},
		{
			keyword: "source",
			label: m.alarms_filter_source({}, messageOptions),
			variant: "secondary",
			options: (input) => {
				const uniqueSources = Array.from(new Set(alarmsStore.list.map((a) => a.source))).map((s) => ({
					value: s,
					label: s,
				}));
				return filterOptions(input, uniqueSources);
			},
		},
		{
			keyword: "since",
			label: m.alarms_filter_since({}, messageOptions),
			variant: "secondary",
			options: (input) => filterOptions(input, sinceOptions),
			resolveLabel: (value) => sinceOptions.find((o) => o.value === value)?.label ?? null,
		},
	]);

	function severitiesEqual(a: Set<SeverityKey>, b: Set<SeverityKey>): boolean {
		if (a.size !== b.size) return false;
		for (const v of a) if (!b.has(v)) return false;
		return true;
	}

	// Mirror chips -> activeSeverities, guarded so chip→set updates don't
	// fight the button toggles.
	$effect(() => {
		const chipSeverities = new Set<SeverityKey>(
			searchController.value.chips
				.filter((c) => c.keyword === "severity")
				.map((c) => c.value.toUpperCase() as SeverityKey)
				.filter((v) => v === "HIGH" || v === "MEDIUM" || v === "LOW"),
		);
		// If there are no severity chips in the searchbar, treat as "all active"
		// so the default state matches the (all three ticked) buttons.
		const target = chipSeverities.size === 0 ? new Set<SeverityKey>(["HIGH", "MEDIUM", "LOW"]) : chipSeverities;
		if (!severitiesEqual(target, activeSeverities)) {
			activeSeverities = target;
		}
	});

	function toggleSeverity(sev: SeverityKey) {
		const next = new Set(activeSeverities);
		if (next.has(sev)) next.delete(sev);
		else next.add(sev);
		activeSeverities = next;
		// Mirror button state back into chips, but only when it's a strict
		// subset — "all three active" is represented by no chip so the
		// searchbar stays clean.
		const nonSevChips = searchController.value.chips.filter((c) => c.keyword !== "severity");
		let nextChips = nonSevChips;
		if (next.size > 0 && next.size < 3) {
			const sevChips = [...next].map((v) => ({ keyword: "severity", value: v }));
			nextChips = [...nonSevChips, ...sevChips];
		}
		searchController.set({ ...searchController.value, chips: nextChips });
	}

	const filtered = $derived.by(() => {
		const kindChips = searchController.value.chips
			.filter((c) => c.keyword === "kind")
			.map((c) => c.value.toUpperCase());
		const sourceChips = searchController.value.chips
			.filter((c) => c.keyword === "source")
			.map((c) => c.value);
		const sinceChip = searchController.value.chips.find((c) => c.keyword === "since");
		const sinceCutoff = sinceChip ? parseSince(sinceChip.value) : null;
		const free = searchController.value.freeText.toLowerCase();

		return alarmsStore.list.filter((a) => {
			if (!activeSeverities.has(a.severity as SeverityKey)) return false;
			if (kindChips.length > 0 && !kindChips.includes(a.kind)) return false;
			if (sourceChips.length > 0 && !sourceChips.includes(a.source)) return false;
			if (sinceCutoff && new Date(a.lastRaisedAt) < sinceCutoff) return false;
			if (free) {
				const hay = `${a.id} ${alarmMessage(a)} ${a.source}`.toLowerCase();
				if (!hay.includes(free)) return false;
			}
			return true;
		});
	});

	async function handleDelete() {
		if (!deleteTarget) return;
		deleteLoading = true;
		await client.mutation(DELETE_ALARM, { alarmId: deleteTarget.id }).toPromise();
		deleteLoading = false;
		deleteTarget = null;
	}

	const filteredIds = $derived(filtered.map((a) => a.id));
	$effect(() => {
		selection.pruneTo(filteredIds);
	});

	async function handleBatchDelete() {
		const alarmIds = selection.selectedIds();
		if (alarmIds.length === 0) {
			batchDeleteConfirm = false;
			return;
		}
		batchDeleteLoading = true;
		await client.mutation(BATCH_DELETE_ALARMS, { alarmIds }).toPromise();
		batchDeleteLoading = false;
		batchDeleteConfirm = false;
		selection.clear();
	}

	const deleteDescription = $derived.by(() => {
		if (!deleteTarget) return "";
		if (deleteTarget.kind === "AUTO") {
			return m.alarms_delete_auto_description({}, messageOptions);
		}
		return m.alarms_delete_description({}, messageOptions);
	});

	function severityButtonClass(sev: SeverityKey): string {
		const base = "h-7 rounded-none border-0 first:rounded-s-lg last:rounded-e-lg";
		if (!activeSeverities.has(sev)) return base;
		// Active tints match the badge palette.
		switch (sev) {
			case "HIGH":
				return `${base} bg-destructive/15 text-destructive hover:bg-destructive/20`;
			case "MEDIUM":
				return `${base} bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20`;
			case "LOW":
			default:
				return `${base} bg-teal-500/15 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20`;
		}
	}

	$effect(() => {
		if (!visible) return;
		pageHeader.breadcrumbs = [{ label: m.alarms_title({}, messageOptions) }];
	});
</script>

<div class="flex flex-col gap-4" in:fly={{ y: -4, duration: 150 }}>
	<div class="flex items-stretch gap-2">
		<div class="min-w-0 flex-1">
			<HiveSearchbar
				controller={searchController}
				chips={searchChipConfigs}
				placeholder={m.alarms_search({}, messageOptions)}
				debounceMs={300}
				commitOnBlur
			/>
		</div>
		<div
			class="flex shrink-0 items-stretch overflow-hidden transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
			style:max-width={selection.count > 0 ? "32rem" : "0px"}
			style:opacity={selection.count > 0 ? "1" : "0"}
			aria-hidden={!(selection.count > 0)}
		>
			<TableSelectionToolbar count={selection.count} onclear={() => selection.clear()}>
				{#snippet actions()}
					<Button
						variant="destructive"
						size="sm"
						onclick={() => (batchDeleteConfirm = true)}
					>
						{m.common_delete({}, messageOptions)}
					</Button>
				{/snippet}
			</TableSelectionToolbar>
		</div>
		<div class="flex shrink-0 items-center overflow-hidden rounded-lg">
			{#each severityOptions as opt (opt.value)}
				<Button
					variant={activeSeverities.has(opt.value) ? "secondary" : "ghost"}
					size="sm"
					class={severityButtonClass(opt.value)}
					onclick={() => toggleSeverity(opt.value)}
					aria-label={m.alarms_severity_aria({ severity: opt.label }, messageOptions)}
					aria-pressed={activeSeverities.has(opt.value)}
				>
					<AlarmSeverityBadge severity={opt.value as AlarmSeverity} class="border-0 bg-transparent p-0 h-auto" hideLabelOnMobile />
				</Button>
			{/each}
		</div>
	</div>

	{#if alarmsStore.activeCount === 0}
		<div class="rounded-lg shadow-card bg-card p-12 text-center">
			<p class="text-foreground">{m.alarms_empty({}, messageOptions)}</p>
			<p class="mt-2 text-sm text-muted-foreground">
				{m.alarms_empty_help({}, messageOptions)}
			</p>
		</div>
	{:else if filtered.length === 0}
		<div class="rounded-lg shadow-card bg-card p-12 text-center">
			<p class="text-muted-foreground">{m.alarms_no_match({}, messageOptions)}</p>
		</div>
	{:else}
		<AlarmTable
			alarms={filtered}
			{selection}
			ondelete={(a) => (deleteTarget = a)}
		/>
	{/if}
</div>

<ConfirmDialog
	open={deleteTarget !== null}
	title={m.alarms_delete_title({}, messageOptions)}
	description={deleteDescription}
	confirmLabel={m.common_delete({}, messageOptions)}
	loading={deleteLoading}
	onconfirm={handleDelete}
	oncancel={() => (deleteTarget = null)}
/>

<ConfirmDialog
	open={batchDeleteConfirm}
	title={m.alarms_delete_many_title({ count: selection.count }, messageOptions)}
	description={m.alarms_delete_many_description({}, messageOptions)}
	confirmLabel={m.common_delete({}, messageOptions)}
	loading={batchDeleteLoading}
	onconfirm={handleBatchDelete}
	oncancel={() => (batchDeleteConfirm = false)}
/>
