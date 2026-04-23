<script lang="ts">
	import { getContextClient, queryStore } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { ChartContainer, type ChartConfig } from "$lib/components/ui/chart/index.js";
	import { Chart, Svg, Axis, Spline } from "layerchart";

	interface Props {
		deviceIds: string[];
		fields?: string[];
		from: Date;
		to: Date;
		bucketSeconds?: number;
		height?: string;
	}

	let {
		deviceIds,
		fields,
		from,
		to,
		bucketSeconds,
		height = "h-64",
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
	const series = queryStore({
		client,
		query: STATE_HISTORY_QUERY,
		get variables() {
			return {
				filter: {
					deviceIds,
					fields: fields ?? null,
					from: from.toISOString(),
					to: to.toISOString(),
					bucketSeconds: bucketSeconds ?? null,
				},
			};
		},
	});

	interface PlotPoint {
		at: Date;
		value: number;
	}

	interface SeriesInfo {
		key: string;
		deviceId: string;
		field: string;
		color: string;
		label: string;
		data: PlotPoint[];
	}

	const PALETTE = [
		"hsl(var(--chart-1))",
		"hsl(var(--chart-2))",
		"hsl(var(--chart-3))",
		"hsl(var(--chart-4))",
		"hsl(var(--chart-5))",
	];

	const seriesList = $derived.by<SeriesInfo[]>(() => {
		const items = $series.data?.stateHistory ?? [];
		return items.map((s, i) => ({
			key: `${s.deviceId}__${s.field}`,
			deviceId: s.deviceId,
			field: s.field,
			color: PALETTE[i % PALETTE.length],
			label: `${s.deviceId.slice(0, 8)} · ${s.field}`,
			data: s.points.map((p) => ({ at: new Date(p.at), value: p.value })),
		}));
	});

	const chartConfig = $derived.by<ChartConfig>(() => {
		const cfg: ChartConfig = {};
		for (const s of seriesList) {
			cfg[s.key] = { label: s.label, color: s.color };
		}
		return cfg;
	});

	const allPoints = $derived(seriesList.flatMap((s) => s.data));
</script>

<ChartContainer config={chartConfig} class="w-full {height}">
	{#if $series.fetching && seriesList.length === 0}
		<div class="flex h-full items-center justify-center text-sm text-muted-foreground">
			Loading…
		</div>
	{:else if $series.error}
		<div class="flex h-full items-center justify-center text-sm text-destructive">
			{$series.error.message}
		</div>
	{:else if allPoints.length === 0}
		<div class="flex h-full items-center justify-center text-sm text-muted-foreground">
			No samples in the selected range.
		</div>
	{:else}
		<Chart
			data={allPoints}
			x={(d: PlotPoint) => d.at}
			y={(d: PlotPoint) => d.value}
			yDomain={undefined}
			yNice
			padding={{ left: 40, bottom: 32, right: 8, top: 8 }}
		>
			<Svg>
				<Axis placement="left" grid rule />
				<Axis placement="bottom" rule />
				{#each seriesList as s (s.key)}
					<Spline
						data={s.data}
						x={(d: PlotPoint) => d.at}
						y={(d: PlotPoint) => d.value}
						stroke={s.color}
						class="stroke-2"
					/>
				{/each}
			</Svg>
		</Chart>
	{/if}
</ChartContainer>

<div class="mt-2 flex flex-wrap gap-2 text-xs">
	{#each seriesList as s (s.key)}
		<span class="flex items-center gap-1">
			<span class="size-2 rounded-full" style="background: {s.color}"></span>
			<span class="text-muted-foreground">{s.label}</span>
		</span>
	{/each}
</div>
