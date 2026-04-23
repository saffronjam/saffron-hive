<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Card, CardContent } from "$lib/components/ui/card/index.js";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import DateRangePicker from "$lib/components/date-range-picker.svelte";
	import StateHistoryChart from "$lib/components/state-history-chart.svelte";
	import { deviceStore } from "$lib/stores/devices";
	import { deviceIcon } from "$lib/utils";
	import { Plus, X } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { onMount, onDestroy } from "svelte";
	import { page } from "$app/state";

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

	const devices = $derived(Object.values($deviceStore));

	const sourceDevices = $derived(
		sourceIds.map((id) => $deviceStore[id]).filter((d) => d != null)
	);

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
				heading: `${type.charAt(0).toUpperCase()}${type.slice(1)}s`,
				items: list.map((d) => ({
					type: "device" as const,
					id: d.id,
					name: d.name,
					icon: deviceIcon(d.type),
					searchValue: `${d.name} ${d.type}`,
				})),
			});
		}
		return groups;
	});

	function handleAdd(_: "device", id: string) {
		if (!sourceIds.includes(id)) {
			sourceIds = [...sourceIds, id];
		}
	}

	function removeSource(id: string) {
		sourceIds = sourceIds.filter((x) => x !== id);
	}

	const resolutionLabels: Record<string, string> = {
		"0": "Auto",
		"60": "1 minute",
		"300": "5 minutes",
		"3600": "1 hour",
		"86400": "1 day",
	};
</script>

<div class="flex flex-col gap-4">
	<div
		class="flex flex-wrap items-center gap-2 rounded-lg bg-card/90 shadow-card px-3 py-2 backdrop-blur-sm"
	>
		<DateRangePicker bind:from bind:to compact />

		<Select
			type="single"
			value={String(bucketSeconds)}
			onValueChange={(v) => { if (v) bucketSeconds = Number(v); }}
		>
			<SelectTrigger class="h-8 w-[120px]">
				{resolutionLabels[String(bucketSeconds)] ?? "Resolution"}
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="0">Auto</SelectItem>
				<SelectItem value="60">1 minute</SelectItem>
				<SelectItem value="300">5 minutes</SelectItem>
				<SelectItem value="3600">1 hour</SelectItem>
				<SelectItem value="86400">1 day</SelectItem>
			</SelectContent>
		</Select>

		<div class="flex flex-wrap items-center gap-1">
			{#each sourceDevices as d (d.id)}
				{@const Icon = deviceIcon(d.type)}
				<span
					class="flex items-center gap-1 rounded-md border border-border bg-background pl-2 pr-1 py-0.5 text-xs"
				>
					<Icon class="size-3 text-muted-foreground" />
					<span class="max-w-[140px] truncate">{d.name}</span>
					<Button
						variant="ghost"
						size="icon-sm"
						class="size-4"
						aria-label={`Remove ${d.name}`}
						onclick={() => removeSource(d.id)}
					>
						<X class="size-3" />
					</Button>
				</span>
			{/each}
		</div>

		<Button size="sm" variant="outline" class="ml-auto gap-1" onclick={() => (drawerOpen = true)}>
			<Plus class="size-4" />
			Add
		</Button>
	</div>

	<Card>
		<CardContent class="p-4">
			{#if sourceIds.length === 0}
				<div class="flex h-64 items-center justify-center text-sm text-muted-foreground">
					Add a source to get started.
				</div>
			{:else}
				<StateHistoryChart
					deviceIds={sourceIds}
					{from}
					{to}
					bucketSeconds={bucketSeconds > 0 ? bucketSeconds : undefined}
					height="h-[60vh]"
				/>
			{/if}
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
