<script lang="ts" module>
	export interface SeriesInfo {
		key: string;
		deviceId: string;
		field: string;
		color: string;
		label: string;
	}

	export function fieldLabel(field: string): string {
		const spaced = field.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
		return spaced.charAt(0).toUpperCase() + spaced.slice(1);
	}

	export const FIELD_COLOR: Record<string, string> = {
		temperature: "oklch(0.72 0.22 25)",
		humidity: "oklch(0.7 0.19 250)",
		pressure: "oklch(0.65 0.03 250)",
		illuminance: "oklch(0.78 0.17 70)",
		battery: "oklch(0.72 0.2 145)",
		on: "oklch(0.82 0.18 95)",
		brightness: "oklch(0.82 0.18 95)",
		colorTemp: "oklch(0.72 0.15 195)",
		power: "oklch(0.7 0.18 155)",
		voltage: "oklch(0.7 0.22 330)",
		current: "oklch(0.68 0.2 265)",
		energy: "oklch(0.65 0.22 300)",
	};
	export const FALLBACK_COLOR = "oklch(0.7 0.15 280)";
	export const DEFAULT_OFF_FIELDS = new Set(["battery"]);
</script>

<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import type { ResultOf } from "@graphql-typed-document-node/core";
	import type { CombinedError } from "@urql/core";
	import { ChartContainer, type ChartConfig } from "$lib/components/ui/chart/index.js";
	import { LineChart, Spline, ChartClipPath } from "layerchart";
	import { SvelteSet } from "svelte/reactivity";
	import { curveMonotoneX } from "d3-shape";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import { formatTooltip } from "$lib/time-format";

	interface Props {
		deviceIds: string[];
		fields?: string[];
		from: Date;
		to: Date;
		bucketSeconds?: number;
		height?: string;
		showChips?: boolean;
		disabledKeys?: SvelteSet<string>;
		onSeriesChange?: (series: SeriesInfo[]) => void;
	}

	let {
		deviceIds,
		fields,
		from,
		to,
		bucketSeconds,
		height = "h-64",
		showChips = true,
		disabledKeys: externalDisabled,
		onSeriesChange,
	}: Props = $props();

	const STATE_HISTORY_QUERY = graphql(`
		query StateHistory($filter: StateHistoryFilter!) {
			stateHistory(filter: $filter) {
				deviceId
				field
				points {
					at
					value
				}
			}
		}
	`);

	const client = getContextClient();

	let historyData = $state<ResultOf<typeof STATE_HISTORY_QUERY> | undefined>();
	let historyFetching = $state(true);
	let historyError = $state<CombinedError | undefined>();

	$effect(() => {
		const variables = {
			filter: {
				deviceIds,
				fields: fields ?? null,
				from: from.toISOString(),
				to: to.toISOString(),
				bucketSeconds: bucketSeconds ?? null,
			},
		};
		historyFetching = true;
		let cancelled = false;
		client
			.query(STATE_HISTORY_QUERY, variables)
			.toPromise()
			.then((result) => {
				if (cancelled) return;
				historyData = result.data;
				historyError = result.error;
				historyFetching = false;
			});
		return () => {
			cancelled = true;
		};
	});

	interface Row {
		at: Date;
		[seriesKey: string]: Date | number | null;
	}

	const allSeries = $derived.by<SeriesInfo[]>(() => {
		const items = historyData?.stateHistory ?? [];
		return items.map((s) => ({
			key: `${s.deviceId}__${s.field}`,
			deviceId: s.deviceId,
			field: s.field,
			color: FIELD_COLOR[s.field] ?? FALLBACK_COLOR,
			label: fieldLabel(s.field),
		}));
	});

	const seenKeys = new SvelteSet<string>();
	const internalDisabled = new SvelteSet<string>();
	const disabledKeys = $derived(externalDisabled ?? internalDisabled);

	$effect(() => {
		for (const s of allSeries) {
			if (!seenKeys.has(s.key)) {
				seenKeys.add(s.key);
				if (DEFAULT_OFF_FIELDS.has(s.field)) disabledKeys.add(s.key);
			}
		}
	});

	$effect(() => {
		onSeriesChange?.(allSeries);
	});

	const activeSeries = $derived(allSeries.filter((s) => !disabledKeys.has(s.key)));

	function toggle(key: string) {
		if (disabledKeys.has(key)) disabledKeys.delete(key);
		else disabledKeys.add(key);
	}

	const rows = $derived.by<Row[]>(() => {
		const items = historyData?.stateHistory ?? [];
		const byTs = new Map<number, Row>();
		for (const s of items) {
			const key = `${s.deviceId}__${s.field}`;
			for (const p of s.points) {
				const at = new Date(p.at);
				const ts = at.getTime();
				let row = byTs.get(ts);
				if (!row) {
					row = { at };
					byTs.set(ts, row);
				}
				row[key] = p.value;
			}
		}
		const sorted = Array.from(byTs.values()).sort(
			(a, b) => a.at.getTime() - b.at.getTime(),
		);
		const last: Record<string, number> = {};
		for (const row of sorted) {
			for (const s of allSeries) {
				const v = row[s.key];
				if (typeof v === "number") {
					last[s.key] = v;
				} else if (s.key in last) {
					row[s.key] = last[s.key];
				}
			}
		}
		return sorted;
	});

	const lineSeries = $derived(
		activeSeries.map((s) => ({
			key: s.key,
			label: s.label,
			value: (d: Row) => (d[s.key] as number | undefined) ?? null,
			color: s.color,
		})),
	);

	const chartConfig = $derived.by<ChartConfig>(() => {
		const cfg: ChartConfig = {};
		for (const s of allSeries) {
			cfg[s.key] = { label: s.label, color: s.color };
		}
		return cfg;
	});

	let chartWidth = $state(0);
	const xTickCount = $derived(
		Math.max(2, Math.min(12, Math.floor(chartWidth / 110))),
	);
</script>

<div class="w-full {height}" bind:clientWidth={chartWidth}>
<ChartContainer config={chartConfig} class="w-full h-full">
	{#if historyFetching && allSeries.length === 0}
		<div class="flex h-full items-center justify-center text-sm text-muted-foreground">
			Loading…
		</div>
	{:else if historyError}
		<div class="flex h-full items-center justify-center text-sm text-destructive">
			{historyError.message}
		</div>
	{:else if rows.length === 0}
		<div class="flex h-full items-center justify-center text-sm text-muted-foreground">
			No samples in the selected range.
		</div>
	{:else if lineSeries.length === 0}
		<div class="flex h-full items-center justify-center text-sm text-muted-foreground">
			All series hidden — enable at least one below.
		</div>
	{:else}
		<LineChart
			data={rows}
			x={(d: Row) => d.at}
			xDomain={[from, to]}
			yNice
			series={lineSeries}
			padding={{ left: 40, bottom: 32, right: 8, top: 8 }}
			props={{
				spline: { opacity: 1 },
				highlight: { opacity: 1 },
				xAxis: { ticks: xTickCount },
				tooltip: {
					hideTotal: true,
					header: { format: (d: Date) => formatTooltip(d) },
				},
			}}
		>
			{#snippet marks({ context })}
				<ChartClipPath>
					{#each context.series.visibleSeries as s (s.key)}
						<Spline seriesKey={s.key} opacity={1} curve={curveMonotoneX} />
					{/each}
				</ChartClipPath>
			{/snippet}
		</LineChart>
	{/if}
</ChartContainer>
</div>

<style>
	:global(
		.lc-tooltip-item-root[data-highlighted="false"] > .lc-tooltip-item-label,
		.lc-tooltip-item-root[data-highlighted="false"] > .lc-tooltip-item-value
	) {
		opacity: 1;
	}
</style>

{#if showChips}
	<div class="mt-2 flex flex-wrap gap-1.5">
		{#each allSeries as s (s.key)}
			<HiveChip
				type={s.field}
				label={s.label}
				active={!disabledKeys.has(s.key)}
				onclick={() => toggle(s.key)}
			/>
		{/each}
	</div>
{/if}
