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
	import { sourceKey, type StateHistorySource } from "$lib/state-history-source";
	import BucketResolutionSelect from "$lib/components/bucket-resolution-select.svelte";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import { deviceStore } from "$lib/stores/devices";
	import { graphql } from "$lib/gql";
	import { queryStore, getContextClient } from "@urql/svelte";
	import { deviceIcon, sentenceCase } from "$lib/utils";
	import { DoorOpen, Group as GroupIcon, House, Layers, Plus, Trash2 } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { onMount, onDestroy, type Component } from "svelte";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { SvelteSet } from "svelte/reactivity";

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Data viewer" }];
	});
	onDestroy(() => {
		pageHeader.reset();
	});

	const ALLOWED_BUCKETS = new Set([0, 60, 300, 3600, 86400]);

	function parseDateParam(raw: string | null): Date | null {
		if (!raw) return null;
		const t = Date.parse(raw);
		return Number.isFinite(t) ? new Date(t) : null;
	}

	function parseBucketParam(raw: string | null): number | null {
		if (!raw) return null;
		const n = Number.parseInt(raw, 10);
		return Number.isFinite(n) && ALLOWED_BUCKETS.has(n) ? n : null;
	}

	type SourceItemType = "device" | "room" | "group" | "apartment";

	function parseSourceToken(token: string): { kind: SourceItemType; id?: string } | null {
		const t = token.trim();
		if (!t) return null;
		if (t === "apt" || t === "apartment") return { kind: "apartment" };
		const colon = t.indexOf(":");
		if (colon < 0) return { kind: "device", id: t };
		const prefix = t.slice(0, colon);
		const id = t.slice(colon + 1);
		if (!id) return null;
		if (prefix === "dev" || prefix === "device") return { kind: "device", id };
		if (prefix === "room") return { kind: "room", id };
		if (prefix === "group") return { kind: "group", id };
		return null;
	}

	function serializeSource(s: StateHistorySource): string {
		switch (s.kind) {
			case "device":
				return `dev:${s.id}`;
			case "room":
				return `room:${s.id}`;
			case "group":
				return `group:${s.id}`;
			case "apartment":
				return "apt";
		}
	}

	const defaultFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	defaultFrom.setHours(0, 0, 0, 0);
	const defaultTo = new Date();
	defaultTo.setHours(23, 59, 59, 999);

	const params = page.url.searchParams;
	const rawSourceTokens = (params.get("sources") ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	const initialFrom = parseDateParam(params.get("from")) ?? defaultFrom;
	const initialTo = parseDateParam(params.get("to")) ?? defaultTo;
	const initialBucket = parseBucketParam(params.get("window")) ?? 0;

	const client = getContextClient();

	const ROOMS_QUERY = graphql(`
		query DataViewerRooms {
			rooms {
				id
				name
				icon
			}
		}
	`);

	const GROUPS_QUERY = graphql(`
		query DataViewerGroups {
			groups {
				id
				name
				icon
			}
		}
	`);

	const roomsQuery = queryStore({ client, query: ROOMS_QUERY });
	const groupsQuery = queryStore({ client, query: GROUPS_QUERY });

	type RoomLite = { id: string; name: string; icon?: string | null };
	type GroupLite = { id: string; name: string; icon?: string | null };

	const rooms = $derived<RoomLite[]>($roomsQuery.data?.rooms ?? []);
	const groups = $derived<GroupLite[]>($groupsQuery.data?.groups ?? []);

	const roomsById = $derived(new Map(rooms.map((r) => [r.id, r])));
	const groupsById = $derived(new Map(groups.map((g) => [g.id, g])));

	let from = $state<Date>(initialFrom);
	let to = $state<Date>(initialTo);
	let bucketSeconds = $state<number>(initialBucket);
	let sources = $state<StateHistorySource[]>([]);
	let drawerOpen = $state(false);

	let initialApplied = $state(false);
	$effect(() => {
		if (initialApplied) return;
		if ($roomsQuery.fetching || $groupsQuery.fetching) return;
		const initial: StateHistorySource[] = [];
		const seen = new Set<string>();
		for (const tok of rawSourceTokens) {
			const parsed = parseSourceToken(tok);
			if (!parsed) continue;
			if (parsed.kind === "apartment") {
				if (seen.has("apt")) continue;
				seen.add("apt");
				initial.push({ kind: "apartment" });
			} else if (parsed.kind === "device") {
				const k = `dev:${parsed.id!}`;
				if (seen.has(k)) continue;
				seen.add(k);
				initial.push({ kind: "device", id: parsed.id! });
			} else if (parsed.kind === "room") {
				const k = `room:${parsed.id!}`;
				if (seen.has(k)) continue;
				seen.add(k);
				const r = roomsById.get(parsed.id!);
				if (!r) continue;
				initial.push({ kind: "room", id: r.id, name: r.name });
			} else if (parsed.kind === "group") {
				const k = `group:${parsed.id!}`;
				if (seen.has(k)) continue;
				seen.add(k);
				const g = groupsById.get(parsed.id!);
				if (!g) continue;
				initial.push({ kind: "group", id: g.id, name: g.name });
			}
		}
		sources = initial;
		initialApplied = true;
	});

	$effect(() => {
		if (!initialApplied) return;
		const next = new URLSearchParams();
		if (sources.length > 0) {
			next.set("sources", sources.map(serializeSource).join(","));
		}
		if (from.getTime() !== defaultFrom.getTime()) next.set("from", from.toISOString());
		if (to.getTime() !== defaultTo.getTime()) next.set("to", to.toISOString());
		if (bucketSeconds !== 0) next.set("window", String(bucketSeconds));
		const qs = next.toString();
		const target = qs ? `?${qs}` : page.url.pathname;
		const current = page.url.search.startsWith("?") ? page.url.search.slice(1) : page.url.search;
		if (qs === current) return;
		void goto(target, { replaceState: true, keepFocus: true, noScroll: true });
	});

	const disabledKeys = new SvelteSet<string>();
	let allSeries = $state<SeriesInfo[]>([]);

	const devices = $derived(Object.values($deviceStore));

	const DEVICE_GROUP_ORDER = ["sensor", "light", "plug", "speaker", "button"];

	const drawerGroups = $derived.by<DrawerGroup<SourceItemType>[]>(() => {
		const result: DrawerGroup<SourceItemType>[] = [];

		const apartmentTaken = sources.some((s) => s.kind === "apartment");
		if (!apartmentTaken) {
			result.push({
				heading: "Apartment",
				items: [
					{
						type: "apartment",
						id: "apartment",
						name: "Apartment (all devices)",
						icon: House,
						searchValue: "apartment all",
					},
				],
			});
		}

		const roomTaken = new Set(
			sources.filter((s) => s.kind === "room").map((s) => (s as { id: string }).id),
		);
		const availableRooms = rooms
			.filter((r) => !roomTaken.has(r.id))
			.slice()
			.sort((a, b) => a.name.localeCompare(b.name));
		if (availableRooms.length > 0) {
			result.push({
				heading: "Rooms",
				items: availableRooms.map((r) => ({
					type: "room" as const,
					id: r.id,
					name: r.name,
					icon: DoorOpen,
					iconRef: r.icon ?? null,
					searchValue: `${r.name} room`,
				})),
			});
		}

		const groupTaken = new Set(
			sources.filter((s) => s.kind === "group").map((s) => (s as { id: string }).id),
		);
		const availableGroups = groups
			.filter((g) => !groupTaken.has(g.id))
			.slice()
			.sort((a, b) => a.name.localeCompare(b.name));
		if (availableGroups.length > 0) {
			result.push({
				heading: "Groups",
				items: availableGroups.map((g) => ({
					type: "group" as const,
					id: g.id,
					name: g.name,
					icon: GroupIcon,
					iconRef: g.icon ?? null,
					searchValue: `${g.name} group`,
				})),
			});
		}

		const deviceTaken = new Set(
			sources.filter((s) => s.kind === "device").map((s) => (s as { id: string }).id),
		);
		const availableDevices = devices.filter((d) => !deviceTaken.has(d.id));
		const byType = new Map<string, typeof availableDevices>();
		for (const d of availableDevices) {
			const k = d.type || "other";
			if (!byType.has(k)) byType.set(k, []);
			byType.get(k)!.push(d);
		}
		const seenType = new Set<string>();
		for (const t of [...DEVICE_GROUP_ORDER, ...byType.keys()]) {
			if (seenType.has(t) || !byType.has(t)) continue;
			seenType.add(t);
			const list = byType.get(t)!.slice().sort((a, b) => a.name.localeCompare(b.name));
			result.push({
				heading: `${sentenceCase(t)}s`,
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
		return result;
	});

	interface SourcePanelGroup {
		source: StateHistorySource;
		key: string;
		name: string;
		icon: Component;
		iconRef?: string | null;
		series: SeriesInfo[];
	}

	const sourcePanelGroups = $derived.by<SourcePanelGroup[]>(() => {
		const seriesByKey = new Map<string, SeriesInfo[]>();
		for (const s of allSeries) {
			const list = seriesByKey.get(s.sourceKey) ?? [];
			list.push(s);
			seriesByKey.set(s.sourceKey, list);
		}
		return sources
			.map((src): SourcePanelGroup => {
				const k = sourceKey(src);
				if (src.kind === "device") {
					const dev = $deviceStore[src.id];
					return {
						source: src,
						key: k,
						name: dev?.name ?? src.id,
						icon: deviceIcon(dev?.type ?? "device"),
						iconRef: dev?.icon ?? null,
						series: seriesByKey.get(k) ?? [],
					};
				}
				if (src.kind === "room") {
					const r = roomsById.get(src.id);
					return {
						source: src,
						key: k,
						name: r?.name ?? src.name,
						icon: DoorOpen,
						iconRef: r?.icon ?? null,
						series: seriesByKey.get(k) ?? [],
					};
				}
				if (src.kind === "group") {
					const g = groupsById.get(src.id);
					return {
						source: src,
						key: k,
						name: g?.name ?? src.name,
						icon: GroupIcon,
						iconRef: g?.icon ?? null,
						series: seriesByKey.get(k) ?? [],
					};
				}
				return {
					source: src,
					key: k,
					name: "Apartment",
					icon: House,
					series: seriesByKey.get(k) ?? [],
				};
			})
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	function handleAdd(type: SourceItemType, id: string) {
		if (type === "apartment") {
			if (sources.some((s) => s.kind === "apartment")) return;
			sources = [...sources, { kind: "apartment" }];
			return;
		}
		if (type === "device") {
			if (sources.some((s) => s.kind === "device" && s.id === id)) return;
			sources = [...sources, { kind: "device", id }];
			return;
		}
		if (type === "room") {
			if (sources.some((s) => s.kind === "room" && s.id === id)) return;
			const r = roomsById.get(id);
			if (!r) return;
			sources = [...sources, { kind: "room", id, name: r.name }];
			return;
		}
		if (type === "group") {
			if (sources.some((s) => s.kind === "group" && s.id === id)) return;
			const g = groupsById.get(id);
			if (!g) return;
			sources = [...sources, { kind: "group", id, name: g.name }];
		}
	}

	function removeSource(g: SourcePanelGroup) {
		sources = sources.filter((s) => sourceKey(s) !== g.key);
		const prefix = `${g.key}__`;
		for (const k of disabledKeys) {
			if (k.startsWith(prefix)) disabledKeys.delete(k);
		}
	}

	function toggleFieldKey(key: string) {
		if (disabledKeys.has(key)) disabledKeys.delete(key);
		else disabledKeys.add(key);
	}

	function togglePanelGroup(g: SourcePanelGroup) {
		const allActive = g.series.every((s) => !disabledKeys.has(s.key));
		if (allActive) {
			for (const s of g.series) disabledKeys.add(s.key);
		} else {
			for (const s of g.series) disabledKeys.delete(s.key);
		}
	}

	function panelGroupActive(g: SourcePanelGroup): boolean {
		return g.series.length > 0 && g.series.some((s) => !disabledKeys.has(s.key));
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
						<Button size="sm" variant="outline" class="gap-1" {...props} disabled={sources.length === 0}>
							<Layers class="size-4" />
							Sources
							{#if sources.length > 0}
								<span class="ml-1 text-muted-foreground">({sources.length})</span>
							{/if}
						</Button>
					{/snippet}
				</PopoverTrigger>
				<PopoverContent class="w-80 p-0" align="end">
					<div class="max-h-96 overflow-y-auto">
						{#each sourcePanelGroups as g (g.key)}
							{@const active = panelGroupActive(g)}
							{@const Icon = g.icon}
							<div class="px-3 py-2 border-b border-border/40 last:border-b-0">
								<div class="flex items-center justify-between gap-2">
									<button
										type="button"
										onclick={() => togglePanelGroup(g)}
										class="flex items-center gap-1.5 text-sm font-medium transition-opacity"
										class:opacity-60={!active}
										aria-pressed={active}
									>
										<Icon class="size-4 text-muted-foreground" />
										<span class="truncate">{g.name}</span>
									</button>
									<Button
										variant="ghost"
										size="icon-sm"
										class="size-6"
										aria-label={`Remove ${g.name}`}
										onclick={() => removeSource(g)}
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
				{#if sources.length === 0}
					<div class="flex h-full items-center justify-center text-sm text-muted-foreground">
						Add a source to get started.
					</div>
				{:else}
					<StateHistoryChart
						{sources}
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
	description="Pick devices, rooms, groups, or the apartment to plot."
	multiple
	groups={drawerGroups}
	onselect={handleAdd}
/>
