<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { fly } from "svelte/transition";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { alarmsStore, type Alarm } from "$lib/stores/alarms.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig, SearchState } from "$lib/components/hive-searchbar";
	import AlarmTable from "$lib/components/alarm-table.svelte";
	import AlarmSeverityBadge from "$lib/components/alarm-severity-badge.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import TableSelectionToolbar from "$lib/components/table-selection-toolbar.svelte";
	import { createTableSelection } from "$lib/utils/table-selection.svelte";
	import type { AlarmSeverity } from "$lib/gql/graphql";

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
	let searchState = $state<SearchState>({ chips: [], freeText: "" });
	let activeSeverities = $state(new Set<SeverityKey>(["HIGH", "MEDIUM", "LOW"]));
	let deleteTarget = $state<Alarm | null>(null);
	let deleteLoading = $state(false);

	const selection = createTableSelection();
	let batchDeleteConfirm = $state(false);
	let batchDeleteLoading = $state(false);

	const SINCE_OPTIONS = [
		{ value: "5m", label: "Last 5 minutes" },
		{ value: "1h", label: "Last hour" },
		{ value: "6h", label: "Last 6 hours" },
		{ value: "24h", label: "Last 24 hours" },
		{ value: "7d", label: "Last 7 days" },
	];

	const KIND_OPTIONS = [
		{ value: "AUTO", label: "Auto" },
		{ value: "ONE_SHOT", label: "One-shot" },
	];

	const SEVERITY_OPTIONS: { value: SeverityKey; label: string }[] = [
		{ value: "HIGH", label: "High" },
		{ value: "MEDIUM", label: "Medium" },
		{ value: "LOW", label: "Low" },
	];

	function filterOptions<T extends { value: string; label: string }>(input: string, options: T[]): T[] {
		const q = input.toLowerCase();
		if (!q) return options;
		return options.filter(
			(o) => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q),
		);
	}

	const searchChipConfigs = $derived<ChipConfig[]>([
		{
			keyword: "severity",
			label: "Severity",
			variant: "secondary",
			options: (input) => filterOptions(input, SEVERITY_OPTIONS),
			resolveLabel: (value) =>
				SEVERITY_OPTIONS.find((o) => o.value === value)?.label ?? null,
		},
		{
			keyword: "kind",
			label: "Kind",
			variant: "secondary",
			options: (input) => filterOptions(input, KIND_OPTIONS),
			resolveLabel: (value) => KIND_OPTIONS.find((o) => o.value === value)?.label ?? null,
		},
		{
			keyword: "source",
			label: "Source",
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
			label: "Since",
			variant: "secondary",
			options: (input) => filterOptions(input, SINCE_OPTIONS),
			resolveLabel: (value) => SINCE_OPTIONS.find((o) => o.value === value)?.label ?? null,
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
			searchState.chips
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
		const nonSevChips = searchState.chips.filter((c) => c.keyword !== "severity");
		let nextChips = nonSevChips;
		if (next.size > 0 && next.size < 3) {
			const sevChips = [...next].map((v) => ({ keyword: "severity", value: v }));
			nextChips = [...nonSevChips, ...sevChips];
		}
		searchState = { ...searchState, chips: nextChips };
	}

	function parseSince(raw: string): Date | null {
		const m = raw.match(/^(\d+)([smhd])$/);
		if (!m) return null;
		const n = parseInt(m[1], 10);
		const unit = m[2];
		const multipliers: Record<string, number> = {
			s: 1000,
			m: 60 * 1000,
			h: 60 * 60 * 1000,
			d: 24 * 60 * 60 * 1000,
		};
		return new Date(Date.now() - n * multipliers[unit]);
	}

	const filtered = $derived.by(() => {
		const kindChips = searchState.chips
			.filter((c) => c.keyword === "kind")
			.map((c) => c.value.toUpperCase());
		const sourceChips = searchState.chips
			.filter((c) => c.keyword === "source")
			.map((c) => c.value);
		const sinceChip = searchState.chips.find((c) => c.keyword === "since");
		const sinceCutoff = sinceChip ? parseSince(sinceChip.value) : null;
		const free = searchState.freeText.toLowerCase();

		return alarmsStore.list.filter((a) => {
			if (!activeSeverities.has(a.severity as SeverityKey)) return false;
			if (kindChips.length > 0 && !kindChips.includes(a.kind)) return false;
			if (sourceChips.length > 0 && !sourceChips.includes(a.source)) return false;
			if (sinceCutoff && new Date(a.lastRaisedAt) < sinceCutoff) return false;
			if (free) {
				const hay = `${a.id} ${a.message} ${a.source}`.toLowerCase();
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
			return "This alarm normally clears itself when the underlying condition resolves. Deleting it manually may hide an ongoing issue.";
		}
		return "Are you sure you want to delete this alarm?";
	});

	function severityButtonClass(sev: SeverityKey): string {
		const base = "border-0 h-7";
		if (!activeSeverities.has(sev)) return `${base} rounded-none`;
		// Active tints match the badge palette.
		switch (sev) {
			case "HIGH":
				return `${base} rounded-none bg-destructive/15 text-destructive hover:bg-destructive/20`;
			case "MEDIUM":
				return `${base} rounded-none bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20`;
			case "LOW":
			default:
				return `${base} rounded-none bg-teal-500/15 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20`;
		}
	}

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Alarms" }];
	});
	onDestroy(() => pageHeader.reset());
</script>

<div class="flex flex-col gap-4" in:fly={{ y: -4, duration: 150 }}>
	<div class="flex items-stretch gap-2">
		<div class="min-w-0 flex-1">
			<HiveSearchbar
				value={searchState}
				onchange={(v) => (searchState = v)}
				chips={searchChipConfigs}
				placeholder="Search alarms..."
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
						Delete
					</Button>
				{/snippet}
			</TableSelectionToolbar>
		</div>
		<div class="flex shrink-0 items-center rounded-md overflow-hidden">
			{#each SEVERITY_OPTIONS as opt (opt.value)}
				<Button
					variant={activeSeverities.has(opt.value) ? "secondary" : "ghost"}
					size="sm"
					class={severityButtonClass(opt.value)}
					onclick={() => toggleSeverity(opt.value)}
					aria-label="{opt.label} severity"
					aria-pressed={activeSeverities.has(opt.value)}
				>
					<AlarmSeverityBadge severity={opt.value as AlarmSeverity} class="border-0 bg-transparent p-0 h-auto" />
				</Button>
			{/each}
		</div>
	</div>

	{#if alarmsStore.activeCount === 0}
		<div class="rounded-lg shadow-card bg-card p-12 text-center">
			<p class="text-foreground">No active alarms &mdash; system looks healthy.</p>
			<p class="mt-2 text-sm text-muted-foreground">
				Alarms raised by the system monitor or your automations will appear here.
			</p>
		</div>
	{:else if filtered.length === 0}
		<div class="rounded-lg shadow-card bg-card p-12 text-center">
			<p class="text-muted-foreground">No alarms match your filters.</p>
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
	title="Delete alarm"
	description={deleteDescription}
	confirmLabel="Delete"
	loading={deleteLoading}
	onconfirm={handleDelete}
	oncancel={() => (deleteTarget = null)}
/>

<ConfirmDialog
	open={batchDeleteConfirm}
	title="Delete {selection.count} alarm{selection.count === 1 ? '' : 's'}?"
	description="This permanently clears the selected alarms. Auto alarms that are still actively being raised will reappear."
	confirmLabel="Delete"
	loading={batchDeleteLoading}
	onconfirm={handleBatchDelete}
	oncancel={() => (batchDeleteConfirm = false)}
/>
