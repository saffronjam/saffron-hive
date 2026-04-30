<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Card, CardContent } from "$lib/components/ui/card/index.js";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import DateRangePicker from "$lib/components/date-range-picker.svelte";
	import StateHistoryChart, {
		type SeriesInfo,
	} from "$lib/components/state-history-chart.svelte";
	import BucketResolutionSelect from "$lib/components/bucket-resolution-select.svelte";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import { deviceStore } from "$lib/stores/devices";
	import { deviceIcon, sentenceCase } from "$lib/utils";
	import { Layers, Plus, Trash2 } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { onMount, onDestroy } from "svelte";
	import { page } from "$app/state";
	import { SvelteSet } from "svelte/reactivity";

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Data viewer" }];
	});
	onDestroy(() => {
		pageHeader.reset();
	});

	const initialSources = (page.url.searchParams.get("sources") ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);

	const initialFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	initialFrom.setHours(0, 0, 0, 0);
	const initialTo = new Date();
	initialTo.setHours(23, 59, 59, 999);

	let from = $state<Date>(initialFrom);
	let to = $state<Date>(initialTo);
	let bucketSeconds = $state<number>(0);
	let sourceIds = $state<string[]>(initialSources);
	let drawerOpen = $state(false);

	const disabledKeys = new SvelteSet<string>();
	let allSeries = $state<SeriesInfo[]>([]);

	const devices = $derived(Object.values($deviceStore));

	const GROUP_ORDER = ["sensor", "light", "plug", "speaker", "button"];

	const drawerGroups = $derived.by<DrawerGroup<"device">[]>(() => {
		const available = devices.filter((d) => !sourceIds.includes(d.id));
		const byType = new Map<string, typeof available>();
		for (const d of available) {
			const key = d.type || "other";
			if (!byType.has(key)) byType.set(key, []);
			byType.get(key)!.push(d);
		}
		const seen = new Set<string>();
		const groups: DrawerGroup<"device">[] = [];
		for (const type of [...GROUP_ORDER, ...byType.keys()]) {
			if (seen.has(type) || !byType.has(type)) continue;
			seen.add(type);
			const list = byType.get(type)!.slice().sort((a, b) => a.name.localeCompare(b.name));
			groups.push({
				heading: `${sentenceCase(type)}s`,
				items: list.map((d) => ({
					type: "device" as const,
					id: d.id,
					name: d.name,
					icon: deviceIcon(d.type),
					iconRef: d.icon ?? null,
					searchValue: `${d.name} ${d.type}`,
				})),
			});
		}
		return groups;
	});

	interface SourceGroup {
		deviceId: string;
		name: string;
		type: string;
		series: SeriesInfo[];
	}

	const sourceGroups = $derived.by<SourceGroup[]>(() => {
		const byDevice = new Map<string, SeriesInfo[]>();
		for (const s of allSeries) {
			const list = byDevice.get(s.deviceId) ?? [];
			list.push(s);
			byDevice.set(s.deviceId, list);
		}
		return sourceIds
			.map((id) => {
				const dev = $deviceStore[id];
				return {
					deviceId: id,
					name: dev?.name ?? id,
					type: dev?.type ?? "device",
					series: byDevice.get(id) ?? [],
				};
			})
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	function handleAdd(_: "device", id: string) {
		if (!sourceIds.includes(id)) {
			sourceIds = [...sourceIds, id];
		}
	}

	function removeSource(id: string) {
		sourceIds = sourceIds.filter((x) => x !== id);
		for (const key of disabledKeys) {
			if (key.startsWith(`${id}__`)) disabledKeys.delete(key);
		}
	}

	function toggleFieldKey(key: string) {
		if (disabledKeys.has(key)) disabledKeys.delete(key);
		else disabledKeys.add(key);
	}

	function toggleGroup(group: SourceGroup) {
		const allActive = group.series.every((s) => !disabledKeys.has(s.key));
		if (allActive) {
			for (const s of group.series) disabledKeys.add(s.key);
		} else {
			for (const s of group.series) disabledKeys.delete(s.key);
		}
	}

	function groupActive(group: SourceGroup): boolean {
		return group.series.length > 0 && group.series.some((s) => !disabledKeys.has(s.key));
	}

</script>

<div class="flex flex-col gap-4">
	<div
		class="flex flex-wrap items-center gap-2 rounded-lg bg-card/90 shadow-card px-3 py-2 backdrop-blur-sm"
	>
		<DateRangePicker bind:from bind:to compact />

		<BucketResolutionSelect bind:value={bucketSeconds} />

		<div class="ml-auto flex items-center gap-2">
			<Popover>
				<PopoverTrigger>
					{#snippet child({ props })}
						<Button size="sm" variant="outline" class="gap-1" {...props} disabled={sourceIds.length === 0}>
							<Layers class="size-4" />
							Sources
							{#if sourceIds.length > 0}
								<span class="ml-1 text-muted-foreground">({sourceIds.length})</span>
							{/if}
						</Button>
					{/snippet}
				</PopoverTrigger>
				<PopoverContent class="w-80 p-0" align="end">
					<div class="max-h-96 overflow-y-auto">
						{#each sourceGroups as g (g.deviceId)}
							{@const active = groupActive(g)}
							{@const GroupIcon = deviceIcon(g.type)}
							<div class="px-3 py-2 border-b border-border/40 last:border-b-0">
								<div class="flex items-center justify-between gap-2">
									<button
										type="button"
										onclick={() => toggleGroup(g)}
										class="flex items-center gap-1.5 text-sm font-medium transition-opacity"
										class:opacity-60={!active}
										aria-pressed={active}
									>
										<GroupIcon class="size-4 text-muted-foreground" />
										<span class="truncate">{g.name}</span>
									</button>
									<Button
										variant="ghost"
										size="icon-sm"
										class="size-6"
										aria-label={`Remove ${g.name}`}
										onclick={() => removeSource(g.deviceId)}
									>
										<Trash2 class="size-3.5" />
									</Button>
								</div>
								{#if g.series.length > 0}
									<div class="mt-1.5 flex flex-wrap gap-1">
										{#each g.series as s (s.key)}
											<HiveChip
												type={s.field}
												label={s.label}
												active={!disabledKeys.has(s.key)}
												onclick={() => toggleFieldKey(s.key)}
											/>
										{/each}
									</div>
								{:else}
									<div class="mt-1 text-xs text-muted-foreground">No samples recorded.</div>
								{/if}
							</div>
						{/each}
					</div>
				</PopoverContent>
			</Popover>

			<Button size="sm" variant="outline" class="gap-1" onclick={() => (drawerOpen = true)}>
				<Plus class="size-4" />
				Add
			</Button>
		</div>
	</div>

	<Card class="overflow-visible">
		<CardContent class="p-4">
			<div class="h-[60vh]">
				{#if sourceIds.length === 0}
					<div class="flex h-full items-center justify-center text-sm text-muted-foreground">
						Add a source to get started.
					</div>
				{:else}
					<StateHistoryChart
						deviceIds={sourceIds}
						{from}
						{to}
						bucketSeconds={bucketSeconds > 0 ? bucketSeconds : undefined}
						height="h-full"
						showChips={false}
						{disabledKeys}
						onSeriesChange={(s) => (allSeries = s)}
					/>
				{/if}
			</div>
		</CardContent>
	</Card>
</div>

<HiveDrawer
	bind:open={drawerOpen}
	title="Add source"
	description="Pick one or more devices to plot."
	multiple
	groups={drawerGroups}
	onselect={handleAdd}
/>
