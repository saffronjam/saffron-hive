<script lang="ts" module>
	export interface SeriesInfo {
		key: string;
		sourceKey: string;
		sourceName: string;
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
	export const PRIMARY_SENSOR_FIELDS = new Set([
		"temperature",
		"humidity",
		"pressure",
		"illuminance",
	]);
	export const DEVICE_DEFAULT_OFF_FIELDS = new Set(["battery"]);
</script>

<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { AggregatedHistoryTargetType } from "$lib/gql/graphql";
	import type { CombinedError } from "@urql/core";
	import { ChartContainer, type ChartConfig } from "$lib/components/ui/chart/index.js";
	import { LineChart, Spline, ChartClipPath, Tooltip } from "layerchart";
	import type { ComponentProps } from "svelte";
	import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
	import { SvelteSet } from "svelte/reactivity";
	import { SvelteMap } from "svelte/reactivity";
	import { curveMonotoneX } from "d3-shape";
	import { fly } from "svelte/transition";
	import { X } from "@lucide/svelte";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import { formatTooltip } from "$lib/time-format";
	import { deviceStore } from "$lib/stores/devices";
	import { me } from "$lib/stores/me.svelte";
	import { temperatureValue, temperatureUnitLabel } from "$lib/sensor-format";

	import { sourceKey, type StateHistorySource } from "$lib/state-history-source";
	export type { StateHistorySource } from "$lib/state-history-source";

	function shouldDefaultOff(source: StateHistorySource, field: string): boolean {
		if (source.kind === "device") return DEVICE_DEFAULT_OFF_FIELDS.has(field);
		return !PRIMARY_SENSOR_FIELDS.has(field);
	}

	interface Props {
		sources: StateHistorySource[];
		fields?: string[];
		from: Date;
		to: Date;
		bucketSeconds?: number;
		height?: string;
		showChips?: boolean;
		disabledKeys?: SvelteSet<string>;
		onSeriesChange?: (series: SeriesInfo[]) => void;
		/**
		 * On narrow screens, pin the readout to the bottom of the viewport instead
		 * of floating it at the pointer — a finger-driven tooltip otherwise sits
		 * under the finger that summoned it. Opt-in, because a viewport-pinned
		 * panel makes no sense for a chart already inside a popover.
		 */
		pinnedInspector?: boolean;
	}

	let {
		sources,
		fields,
		from,
		to,
		bucketSeconds,
		height = "h-64",
		showChips = true,
		disabledKeys: externalDisabled,
		onSeriesChange,
		pinnedInspector = false,
	}: Props = $props();

	const isMobile = new IsMobile();
	const usePinned = $derived(pinnedInspector && isMobile.current);

	interface RawSeries {
		field: string;
		points: { at: string; value: number }[];
	}

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

	const AGGREGATED_STATE_HISTORY_QUERY = graphql(`
		query AggregatedStateHistory($filter: AggregatedStateHistoryFilter!) {
			aggregatedStateHistory(filter: $filter) {
				field
				points {
					at
					value
				}
			}
		}
	`);

	const client = getContextClient();

	const rawSeriesBySource = new SvelteMap<string, RawSeries[]>();
	let historyFetching = $state(true);
	let historyError = $state<CombinedError | undefined>();

	$effect(() => {
		const currentSources = sources;
		const fieldsArg = fields ?? null;
		const fromIso = from.toISOString();
		const toIso = to.toISOString();
		const bucketArg = bucketSeconds ?? null;

		historyFetching = true;
		let cancelled = false;

		const queries = currentSources.map((s) => {
			if (s.kind === "device") {
				return client
					.query(STATE_HISTORY_QUERY, {
						filter: {
							deviceIds: [s.id],
							fields: fieldsArg,
							from: fromIso,
							to: toIso,
							bucketSeconds: bucketArg,
						},
					})
					.toPromise()
					.then((result) => ({
						source: s,
						series: (result.data?.stateHistory ?? []).map((row) => ({
							field: row.field,
							points: row.points.map((p) => ({ at: p.at as string, value: p.value })),
						})) as RawSeries[],
						error: result.error,
					}));
			}
			const target =
				s.kind === "apartment"
					? { type: AggregatedHistoryTargetType.Apartment }
					: {
							type:
								s.kind === "room"
									? AggregatedHistoryTargetType.Room
									: AggregatedHistoryTargetType.Group,
							id: s.id,
						};
			return client
				.query(AGGREGATED_STATE_HISTORY_QUERY, {
					filter: {
						target,
						fields: fieldsArg,
						from: fromIso,
						to: toIso,
						bucketSeconds: bucketArg,
					},
				})
				.toPromise()
				.then((result) => ({
					source: s,
					series: (result.data?.aggregatedStateHistory ?? []).map((row) => ({
						field: row.field,
						points: row.points.map((p) => ({ at: p.at as string, value: p.value })),
					})) as RawSeries[],
					error: result.error,
				}));
		});

		void Promise.all(queries).then((results) => {
			if (cancelled) return;
			const validKeys = new Set(currentSources.map(sourceKey));
			const stale: string[] = [];
			for (const k of rawSeriesBySource.keys()) {
				if (!validKeys.has(k)) stale.push(k);
			}
			for (const k of stale) rawSeriesBySource.delete(k);
			let firstError: CombinedError | undefined;
			for (const r of results) {
				const sk = sourceKey(r.source);
				rawSeriesBySource.set(sk, r.series);
				for (const s of r.series) {
					const seriesKey = `${sk}__${s.field}`;
					if (!seenKeys.has(seriesKey)) {
						seenKeys.add(seriesKey);
						if (shouldDefaultOff(r.source, s.field)) disabledKeys.add(seriesKey);
					}
				}
				if (!firstError && r.error) firstError = r.error;
			}
			historyError = firstError;
			historyFetching = false;
		});

		return () => {
			cancelled = true;
		};
	});

	function sourceName(s: StateHistorySource): string {
		switch (s.kind) {
			case "device":
				return $deviceStore[s.id]?.name ?? s.id;
			case "room":
			case "group":
				return s.name;
			case "apartment":
				return "Apartment";
		}
	}

	interface Row {
		at: Date;
		[seriesKey: string]: Date | number | null;
	}

	const allSeries = $derived.by<SeriesInfo[]>(() => {
		const result: SeriesInfo[] = [];
		for (const source of sources) {
			const sk = sourceKey(source);
			const raw = rawSeriesBySource.get(sk) ?? [];
			const sName = sourceName(source);
			for (const s of raw) {
				result.push({
					key: `${sk}__${s.field}`,
					sourceKey: sk,
					sourceName: sName,
					field: s.field,
					color: FIELD_COLOR[s.field] ?? FALLBACK_COLOR,
					label: fieldLabel(s.field),
				});
			}
		}
		return result;
	});

	const seriesByKey = $derived(new Map(allSeries.map((s) => [s.key, s])));

	interface TooltipSeriesItem {
		key: string;
		label: string;
		value: unknown;
		color?: string;
		visible: boolean;
	}

	interface TooltipGroup {
		sourceKey: string;
		sourceName: string;
		items: { key: string; label: string; value: unknown; color?: string }[];
	}

	function formatTooltipValue(value: unknown, seriesKey?: string): string {
		if (typeof value !== "number" || !Number.isFinite(value)) return String(value ?? "");
		const numStr = Number.isInteger(value)
			? value.toString()
			: (Math.round(value * 10) / 10).toString();
		const info = seriesKey ? seriesByKey.get(seriesKey) : undefined;
		if (info?.field === "temperature") {
			return `${numStr}${temperatureUnitLabel(me.user?.temperatureUnit ?? "celsius")}`;
		}
		return numStr;
	}

	function groupTooltipSeries(
		visible: { key: string; label: string; value: unknown; color?: string }[],
	): TooltipGroup[] {
		const order: string[] = [];
		const bySource = new Map<string, TooltipGroup>();
		for (const item of visible) {
			const info = seriesByKey.get(item.key);
			const sk = info?.sourceKey ?? "";
			let group = bySource.get(sk);
			if (!group) {
				group = {
					sourceKey: sk,
					sourceName: info?.sourceName ?? "",
					items: [],
				};
				bySource.set(sk, group);
				order.push(sk);
			}
			group.items.push(item);
		}
		return order.map((id) => bySource.get(id)!);
	}

	const seenKeys = new Set<string>();
	const internalDisabled = new SvelteSet<string>();
	const disabledKeys = $derived(externalDisabled ?? internalDisabled);

	$effect(() => {
		onSeriesChange?.(allSeries);
	});

	const activeSeries = $derived(allSeries.filter((s) => !disabledKeys.has(s.key)));

	function toggle(key: string) {
		if (disabledKeys.has(key)) disabledKeys.delete(key);
		else disabledKeys.add(key);
	}

	const rows = $derived.by<Row[]>(() => {
		const byTs = new Map<number, Row>();
		for (const source of sources) {
			const sk = sourceKey(source);
			const raw = rawSeriesBySource.get(sk) ?? [];
			for (const s of raw) {
				const seriesKey = `${sk}__${s.field}`;
				for (const p of s.points) {
					const at = new Date(p.at);
					const ts = at.getTime();
					let row = byTs.get(ts);
					if (!row) {
						row = { at };
						byTs.set(ts, row);
					}
					row[seriesKey] = p.value;
				}
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

	const tempUnit = $derived(me.user?.temperatureUnit ?? "celsius");

	const lineSeries = $derived(
		activeSeries.map((s) => {
			const isTemp = s.field === "temperature";
			const unit = tempUnit;
			return {
				key: s.key,
				label: s.label,
				value: (d: Row) => {
					const raw = d[s.key];
					if (typeof raw !== "number") return null;
					return isTemp ? temperatureValue(raw, unit) : raw;
				},
				color: s.color,
			};
		}),
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

	function formatXTick(d: Date): string {
		const mode = me.user?.timeFormat ?? "24h";
		const h = d.getHours();
		const m = d.getMinutes();
		const s = d.getSeconds();
		const pad = (n: number) => String(n).padStart(2, "0");
		if (h === 0 && m === 0 && s === 0) {
			return `${d.getMonth() + 1}/${d.getDate()}`;
		}
		if (mode === "12h") {
			const suffix = h >= 12 ? "PM" : "AM";
			const h12 = ((h + 11) % 12) + 1;
			return m === 0 ? `${h12} ${suffix}` : `${h12}:${pad(m)} ${suffix}`;
		}
		return m === 0 ? `${pad(h)}:00` : `${pad(h)}:${pad(m)}`;
	}

	// layerchart does not export its chart state type through the package export
	// map, so it is recovered from the shape the marks snippet is handed.
	type ChartCtx = Parameters<NonNullable<ComponentProps<typeof LineChart>["marks"]>>[0]["context"];

	interface PinnedReading {
		at: Date;
		groups: TooltipGroup[];
	}

	// Pixel radius handed to the chart's quadtree-x lookup in pinned mode. It is
	// horizontal distance only, so a tap left or right of where samples exist
	// finds nothing and counts as a dismiss. Deliberately not 2D quadtree:
	// that mode matches only the single nearest series, which would drop every
	// other line from the readout.
	const PINNED_HIT_RADIUS = 48;

	let chartContext = $state<ChartCtx | undefined>();
	let chartEl = $state<HTMLElement | null>(null);
	let panelEl = $state<HTMLElement | null>(null);

	// The reading is latched rather than read straight off the tooltip: with no
	// hide delay the chart drops its data the moment the finger lifts, and the
	// panel has to survive that. Only an explicit dismiss clears it.
	let reading = $state<PinnedReading | null>(null);
	let gestureHadData = false;
	// Guards against a dismissed panel reappearing: the effect also re-runs when
	// unrelated dependencies change, and the chart still holds the last hovered
	// point. Only a genuinely new point re-latches.
	let latchedData: unknown = null;

	$effect(() => {
		if (!usePinned) {
			reading = null;
			latchedData = null;
			return;
		}
		const ctx = chartContext;
		const data = ctx?.tooltip?.data;
		if (!data || !ctx || data === latchedData) return;
		latchedData = data;
		const series = ctx.tooltip.series as unknown as TooltipSeriesItem[];
		gestureHadData = true;
		reading = {
			at: ctx.x(data) as Date,
			groups: groupTooltipSeries(series.filter((sr) => sr.visible)),
		};
	});

	function insideChart(e: PointerEvent): boolean {
		const target = e.target as Node | null;
		return !!target && !!chartEl?.contains(target);
	}

	function onWindowPointerDown(e: PointerEvent) {
		if (!usePinned) return;
		if (insideChart(e)) {
			gestureHadData = false;
			return;
		}
		const target = e.target as Node | null;
		if (target && panelEl?.contains(target)) return;
		reading = null;
	}

	function onWindowPointerUp(e: PointerEvent) {
		if (!usePinned || !insideChart(e)) return;
		// Nothing was read during this gesture, so the tap landed further than
		// PINNED_HIT_RADIUS from every sample. That is the in-chart dismiss.
		if (!gestureHadData) reading = null;
	}
</script>

<svelte:window onpointerdown={onWindowPointerDown} onpointerup={onWindowPointerUp} />

<div class="w-full {height}" bind:clientWidth={chartWidth} bind:this={chartEl}>
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
			bind:context={chartContext}
			data={rows}
			x={(d: Row) => d.at}
			xDomain={[from, to]}
			yNice
			series={lineSeries}
			padding={{ left: 40, bottom: 32, right: 8, top: 8 }}
			props={{
				spline: { opacity: 1 },
				highlight: { opacity: 1 },
				xAxis: { ticks: xTickCount, format: formatXTick },
				// A finite radius is what makes a tap away from the samples read as
				// "nothing here" rather than snapping to the nearest column.
				tooltip: { context: { radius: usePinned ? PINNED_HIT_RADIUS : Infinity } },
			}}
		>
			{#snippet marks({ context })}
				<ChartClipPath>
					{#each context.series.visibleSeries as s (s.key)}
						<Spline seriesKey={s.key} opacity={1} curve={curveMonotoneX} />
					{/each}
				</ChartClipPath>
			{/snippet}
			{#snippet tooltip({ context })}
				{#if !usePinned}
					<Tooltip.Root {context}>
						{#snippet children({ data })}
							{@const visible = context.tooltip.series.filter((s) => s.visible)}
							{@const groups = groupTooltipSeries(visible)}
							<Tooltip.Header
								value={context.x(data)}
								format={(d: Date) => formatTooltip(d, me.user?.timeFormat ?? "24h")}
							/>
							{#each groups as g, gi (g.sourceKey)}
								{#if g.sourceName && groups.length > 1}
									<div class="text-xs font-medium text-muted-foreground" class:mt-2={gi > 0}>
										{g.sourceName}
									</div>
								{/if}
								<Tooltip.List>
									{#each g.items as s (s.key)}
										<Tooltip.Item
											label={s.label}
											value={formatTooltipValue(s.value, s.key)}
											color={s.color}
											valueAlign="right"
										/>
									{/each}
								</Tooltip.List>
							{/each}
						{/snippet}
					</Tooltip.Root>
				{/if}
			{/snippet}
		</LineChart>
	{/if}
</ChartContainer>
</div>

{#if usePinned && reading}
	<!--
		Rendered here rather than inside the tooltip snippet so its lifetime is
		ours: that is what lets it survive the finger lifting, transition out
		instead of snapping, and be dismissed on our terms. It is viewport-fixed,
		so it never lands under the finger doing the scrubbing.
	-->
	<div
		bind:this={panelEl}
		class="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-popover/95 px-4 pt-3 pb-24 text-popover-foreground shadow-lg backdrop-blur-sm"
		role="status"
		aria-live="polite"
		transition:fly={{ y: 24, duration: 200 }}
	>
		<div class="flex items-start justify-between gap-2">
			<p class="text-xs font-medium text-muted-foreground">
				{formatTooltip(reading.at, me.user?.timeFormat ?? "24h")}
			</p>
			<button
				type="button"
				class="-mt-1 -mr-1 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
				aria-label="Dismiss reading"
				onclick={() => (reading = null)}
			>
				<X class="size-4" />
			</button>
		</div>
		{#each reading.groups as g, gi (g.sourceKey)}
			{#if g.sourceName && reading.groups.length > 1}
				<p class="text-xs font-medium text-muted-foreground" class:mt-2={gi > 0}>
					{g.sourceName}
				</p>
			{/if}
			<!-- One column: at phone width a label + value pair already fills the row. -->
			<ul class="mt-1 flex flex-col gap-1">
				{#each g.items as sr (sr.key)}
					<li class="flex items-center gap-2 text-sm">
						<span
							class="size-2 shrink-0 rounded-full"
							style="background: {sr.color}"
							aria-hidden="true"
						></span>
						<span class="min-w-0 flex-1 truncate text-muted-foreground">{sr.label}</span>
						<span class="shrink-0 font-medium tabular-nums"
							>{formatTooltipValue(sr.value, sr.key)}</span
						>
					</li>
				{/each}
			</ul>
		{/each}
	</div>
{/if}

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
