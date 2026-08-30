<script lang="ts">
	import { onMount, onDestroy, untrack } from "svelte";
	import { page } from "$app/state";
	import { deviceDisplayName } from "$lib/utils";
	import { fly } from "svelte/transition";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { onGraphQLRecovered } from "$lib/graphql/app-recovery";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { profile } from "$lib/stores/profile.svelte";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { deviceStore, isHiveVisibleDevice } from "$lib/stores/devices";
	import ActivityNavigationTable, {
		type ActivityEvent,
	} from "$lib/components/activity-navigation-table.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig } from "$lib/components/hive-searchbar";
	import { createUrlSearchState } from "$lib/search-state.svelte";
	import {
		boundSessionSnapshotList,
		loadSessionSnapshot,
		saveSessionSnapshot,
	} from "$lib/session-cache";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import TableSelectionToolbar from "$lib/components/table-selection-toolbar.svelte";
	import { createTableSelection } from "$lib/utils/table-selection.svelte";
	import { parseSince } from "$lib/time-format";
	import { Copy } from "@lucide/svelte";

	const ACTIVITY_QUERY = graphql(`
		query Activity($filter: ActivityFilter) {
			activity(filter: $filter) {
				id
				type
				timestamp
				message
				payload
				source {
					kind
					id
					name
					type
					roomId
					roomName
				}
			}
		}
	`);

	const ACTIVITY_STREAM = graphql(`
		subscription ActivityStream($advanced: Boolean) {
			activityStream(advanced: $advanced) {
				id
				type
				timestamp
				message
				payload
				source {
					kind
					id
					name
					type
					roomId
					roomName
				}
			}
		}
	`);


	const PAGE_SIZE = 50;
	const ACTIVITY_CACHE_VERSION = 1;
	const MAX_CACHED_EVENTS = 500;
	const MAX_ACTIVITY_CACHE_BYTES = 2 * 1024 * 1024;

	function activityCacheName(advancedMode: boolean): string {
		return advancedMode ? "activity-advanced" : "activity-basic";
	}

	function activityStorage(): Storage | null {
		return typeof window === "undefined" ? null : window.sessionStorage;
	}

	function loadActivitySnapshot(advancedMode: boolean): ActivityEvent[] | null {
		return loadSessionSnapshot<ActivityEvent[]>(
			activityStorage(),
			activityCacheName(advancedMode),
			ACTIVITY_CACHE_VERSION,
		);
	}

	function boundActivityEvents(next: ActivityEvent[]): ActivityEvent[] {
		const newestFirst = next.slice().sort((a, b) =>
			a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0,
		);
		return boundSessionSnapshotList(
			ACTIVITY_CACHE_VERSION,
			newestFirst,
			MAX_CACHED_EVENTS,
			MAX_ACTIVITY_CACHE_BYTES,
		);
	}

	function persistActivitySnapshot(advancedMode: boolean, next: ActivityEvent[]): void {
		saveSessionSnapshot(
			activityStorage(),
			activityCacheName(advancedMode),
			ACTIVITY_CACHE_VERSION,
			next,
			MAX_ACTIVITY_CACHE_BYTES,
		);
	}

	const client = getContextClient();
	let recentIds = $state(new Set<string>());
	const rooms = $derived(roomsStore.items);
	const initialAdvanced = profile.get("activity.advanced", false);
	let advanced = $state<boolean>(initialAdvanced);
	const restoredEvents = loadActivitySnapshot(initialAdvanced);
	let events = $state<ActivityEvent[]>(restoredEvents ?? []);
	const searchController = createUrlSearchState({
		active: () => page.url.pathname === "/activity",
	});
	let subUnsub: (() => void) | null = null;
	let hasMore = $state(false);
	let loadingMore = $state(false);
	let ready = $state(restoredEvents !== null);

	const BASIC_TYPES = [
		{ value: "device.state_changed", label: "State changed" },
		{ value: "device.availability_changed", label: "Availability" },
		{ value: "device.added", label: "Device added" },
		{ value: "device.removed", label: "Device removed" },
		{ value: "scene.applied", label: "Scene applied" },
		{ value: "automation.triggered", label: "Automation fired" },
		{ value: "webhook.received", label: "Webhook received" },
	];
	const ADVANCED_TYPES = [
		{ value: "command.dispatched", label: "Command sent" },
		{ value: "automation.node_activated", label: "Node activated" },
	];

	const SINCE_OPTIONS = [
		{ value: "5m", label: "Last 5 minutes" },
		{ value: "1h", label: "Last hour" },
		{ value: "6h", label: "Last 6 hours" },
		{ value: "24h", label: "Last 24 hours" },
		{ value: "7d", label: "Last 7 days" },
		{ value: "30d", label: "Last 30 days" },
	];

	function filterOptions<T extends { value: string; label: string }>(input: string, options: T[]): T[] {
		const q = input.toLowerCase();
		if (!q) return options;
		return options.filter(
			(o) => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)
		);
	}

	const searchChipConfigs = $derived<ChipConfig[]>([
		{
			keyword: "type",
			label: "Type",
			variant: "secondary",
			options: (input) => {
				const types = advanced ? [...BASIC_TYPES, ...ADVANCED_TYPES] : BASIC_TYPES;
				return filterOptions(input, types);
			},
			resolveLabel: (value) => {
				const all = [...BASIC_TYPES, ...ADVANCED_TYPES];
				return all.find((t) => t.value === value)?.label ?? null;
			},
		},
		{
			keyword: "device",
			label: "Device",
			variant: "secondary",
			options: (input) => {
				const devices = Object.values($deviceStore)
					.filter(isHiveVisibleDevice)
					.map((d) => ({
						value: d.id,
						label: deviceDisplayName(d),
					}));
				return filterOptions(input, devices);
			},
			resolveLabel: (id) => {
				const d = $deviceStore[id];
				return d && isHiveVisibleDevice(d) ? deviceDisplayName(d) : null;
			},
		},
		{
			keyword: "room",
			label: "Room",
			variant: "secondary",
			options: (input) => filterOptions(input, rooms.map((r) => ({ value: r.id, label: r.name }))),
			resolveLabel: (id) => rooms.find((r) => r.id === id)?.name ?? null,
		},
		{
			keyword: "since",
			label: "Since",
			variant: "secondary",
			options: (input) => filterOptions(input, SINCE_OPTIONS),
			resolveLabel: (value) => SINCE_OPTIONS.find((o) => o.value === value)?.label ?? null,
		},
	]);

	const selection = createTableSelection();

	function safeParsePayload(raw: string): unknown {
		try {
			return JSON.parse(raw);
		} catch {
			return raw;
		}
	}

	async function copySelectedAsJson() {
		const ids = new Set(selection.selectedIds());
		if (ids.size === 0) return;
		const items = events
			.filter((e) => ids.has(e.id))
			.map((e) => ({
				id: e.id,
				type: e.type,
				timestamp: e.timestamp,
				message: e.message,
				source: e.source,
				payload: safeParsePayload(e.payload),
			}));
		await navigator.clipboard.writeText(JSON.stringify(items, null, 2));
	}

	const filteredEvents = $derived.by(() => {
		const typeChips = searchController.value.chips.filter((c) => c.keyword === "type").map((c) => c.value);
		const deviceChips = searchController.value.chips.filter((c) => c.keyword === "device").map((c) => c.value);
		const roomChips = searchController.value.chips.filter((c) => c.keyword === "room").map((c) => c.value);
		const sinceChip = searchController.value.chips.find((c) => c.keyword === "since");
		const sinceCutoff = sinceChip ? parseSince(sinceChip.value) : null;
		const free = searchController.value.freeText.toLowerCase();

		return events.filter((e) => {
			const sourceDevice = e.source.id ? $deviceStore[e.source.id] : undefined;
			if (sourceDevice && !isHiveVisibleDevice(sourceDevice)) return false;
			if (typeChips.length > 0 && !typeChips.includes(e.type)) return false;
			if (deviceChips.length > 0 && (!e.source.id || !deviceChips.includes(e.source.id))) return false;
			if (roomChips.length > 0 && (!e.source.roomId || !roomChips.includes(e.source.roomId))) return false;
			if (sinceCutoff && new Date(e.timestamp) < sinceCutoff) return false;
			if (free) {
				const hay = `${e.message} ${e.type} ${e.source.name ?? ""} ${e.source.roomName ?? ""} ${e.payload}`.toLowerCase();
				if (!hay.includes(free)) return false;
			}
			return true;
		});
	});

	const filterSignature = $derived(
		JSON.stringify(
			searchController.value.chips
				.map((c) => `${c.keyword}:${c.value}`)
				.sort()
				.concat([`q:${searchController.value.freeText}`]),
		),
	);

	$effect(() => {
		void filterSignature;
		untrack(() => {
			selection.pruneTo(filteredEvents.map((e) => e.id));
		});
	});

	function markNew(id: string) {
		const next = new Set(recentIds);
		next.add(id);
		recentIds = next;
		setTimeout(() => {
			const cleared = new Set(recentIds);
			cleared.delete(id);
			recentIds = cleared;
		}, 1800);
	}

	async function loadInitial(advancedMode = advanced, mergeCurrent = false) {
		const res = await client
			.query<{ activity: ActivityEvent[] }>(ACTIVITY_QUERY, {
				filter: { advanced: advancedMode, limit: PAGE_SIZE },
			}, { requestPolicy: "network-only" })
			.toPromise();
		if (res.data) {
			const queried = res.data.activity;
			const combined = mergeCurrent && advanced === advancedMode
				? [...new Map([...queried, ...events].map((event) => [event.id, event])).values()]
				: queried;
			const next = boundActivityEvents(combined);
			persistActivitySnapshot(advancedMode, next);
			if (advanced !== advancedMode) return;
			events = next;
			hasMore =
				next.length < MAX_CACHED_EVENTS &&
				queried.length === PAGE_SIZE;
		}
		if (advanced === advancedMode) ready = true;
	}

	async function loadMore() {
		if (loadingMore || !hasMore) return;
		const oldest = events[events.length - 1];
		if (!oldest) return;
		loadingMore = true;
		try {
			const res = await client
				.query<{ activity: ActivityEvent[] }>(ACTIVITY_QUERY, {
					filter: { advanced, limit: PAGE_SIZE, before: oldest.id },
				}, { requestPolicy: "network-only" })
				.toPromise();
			if (res.data) {
				// Dedupe defensively in case a live event raced us.
				const seen = new Set(events.map((e) => e.id));
				const fresh = res.data.activity.filter((e) => !seen.has(e.id));
				const combined = [...events, ...fresh];
				events = boundActivityEvents(combined);
				persistActivitySnapshot(advanced, events);
				hasMore =
					events.length === combined.length &&
					events.length < MAX_CACHED_EVENTS &&
					res.data.activity.length === PAGE_SIZE;
			}
		} finally {
			loadingMore = false;
		}
	}

	function startSubscription() {
		if (!client) return;
		if (subUnsub) {
			subUnsub();
			subUnsub = null;
		}
		const subscriptionMode = advanced;
		const sub = client
			.subscription<{ activityStream: ActivityEvent }>(ACTIVITY_STREAM, { advanced: subscriptionMode })
			.subscribe((result) => {
				if (advanced !== subscriptionMode) return;
				if (!result.data) return;
				const evt = result.data.activityStream;
				if (events.some((e) => e.id === evt.id)) return;
				const next = [evt, ...events];
				events = boundActivityEvents(next);
				if (events.length !== next.length) hasMore = false;
				persistActivitySnapshot(subscriptionMode, events);
				markNew(evt.id);
			});
		subUnsub = sub.unsubscribe;
	}

	function toggleAdvanced(next: boolean) {
		advanced = next;
		profile.set("activity.advanced", next);
		const restored = loadActivitySnapshot(next);
		events = restored ?? [];
		ready = restored !== null;
		void loadInitial(next);
		startSubscription();
	}

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Activity" }];
		const mountedMode = advanced;
		void loadInitial(mountedMode).then(() => {
			if (advanced === mountedMode) startSubscription();
		});
	});

	onGraphQLRecovered(() => {
		void loadInitial(advanced, true);
	});

	onDestroy(() => {
		if (subUnsub) {
			subUnsub();
			subUnsub = null;
		}
	});
</script>

{#if ready}
	<div class="flex h-[calc(100vh-8rem)] flex-col gap-4" in:fly={{ y: -4, duration: 150 }}>
		<div class="flex items-center gap-4">
			<div class="min-w-0 flex-1">
				<HiveSearchbar
					controller={searchController}
					chips={searchChipConfigs}
					placeholder="Search activity..."
					debounceMs={500}
					commitOnBlur
				/>
			</div>
			<div
				class="flex shrink-0 items-stretch overflow-hidden transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
				style:max-width={selection.count > 0 ? "24rem" : "0px"}
				style:opacity={selection.count > 0 ? "1" : "0"}
				aria-hidden={selection.count === 0}
			>
				<TableSelectionToolbar
					count={selection.count}
					onclear={() => selection.clear()}
				>
					{#snippet actions()}
						<Button
							variant="secondary"
							size="sm"
							onclick={copySelectedAsJson}
						>
							<Copy class="mr-1 size-3.5" />
							Copy
						</Button>
					{/snippet}
				</TableSelectionToolbar>
			</div>
			<div class="flex items-center gap-2">
				<Switch id="advanced-toggle" checked={advanced} onCheckedChange={toggleAdvanced} />
				<label for="advanced-toggle" class="text-sm text-foreground select-none">Advanced</label>
			</div>
		</div>

		{#if events.length === 0}
			<div class="rounded-lg shadow-card bg-card p-12 text-center">
				<p class="text-muted-foreground">No activity yet.</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Device state changes, scene activations and automation runs will appear here as they happen.
				</p>
			</div>
		{:else if filteredEvents.length === 0}
			<div class="rounded-lg shadow-card bg-card p-12 text-center">
				<p class="text-muted-foreground">No activity matches your filters.</p>
			</div>
		{:else}
			<div class="flex-1 min-h-0">
				<ActivityNavigationTable
					events={filteredEvents}
					{recentIds}
					{hasMore}
					{loadingMore}
					{selection}
					onLoadMore={loadMore}
				/>
			</div>
		{/if}
	</div>
{/if}
