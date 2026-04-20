<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { gql } from "@urql/svelte";
	import type { Client } from "@urql/svelte";
	import { createGraphQLClient } from "$lib/graphql/client";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { profile } from "$lib/stores/profile.svelte";
	import { deviceStore } from "$lib/stores/devices";
	import ActivityTable, { type ActivityEvent } from "$lib/components/activity-table.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig, SearchState } from "$lib/components/hive-searchbar";
	import { Switch } from "$lib/components/ui/switch/index.js";

	const ACTIVITY_QUERY = gql`
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
	`;

	const ACTIVITY_STREAM = gql`
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
	`;

	const ROOMS_QUERY = gql`
		query ActivityRooms {
			rooms {
				id
				name
			}
		}
	`;

	interface RoomInfo {
		id: string;
		name: string;
	}

	const PAGE_SIZE = 50;

	let client: Client;
	let events = $state<ActivityEvent[]>([]);
	let recentIds = $state(new Set<string>());
	let rooms = $state<RoomInfo[]>([]);
	let advanced = $state<boolean>(profile.get("activity.advanced", false));
	let searchState = $state<SearchState>({ chips: [], freeText: "" });
	let subUnsub: (() => void) | null = null;
	let hasMore = $state(false);
	let loadingMore = $state(false);

	const BASIC_TYPES = [
		{ value: "device.state_changed", label: "State changed" },
		{ value: "device.availability_changed", label: "Availability" },
		{ value: "device.added", label: "Device added" },
		{ value: "device.removed", label: "Device removed" },
		{ value: "scene.applied", label: "Scene applied" },
		{ value: "automation.triggered", label: "Automation fired" },
	];
	const ADVANCED_TYPES = [
		{ value: "command.requested", label: "Command sent" },
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
				const devices = Object.values($deviceStore).map((d) => ({ value: d.id, label: d.name }));
				return filterOptions(input, devices);
			},
			resolveLabel: (id) => $deviceStore[id]?.name ?? null,
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

	const filteredEvents = $derived.by(() => {
		const typeChips = searchState.chips.filter((c) => c.keyword === "type").map((c) => c.value);
		const deviceChips = searchState.chips.filter((c) => c.keyword === "device").map((c) => c.value);
		const roomChips = searchState.chips.filter((c) => c.keyword === "room").map((c) => c.value);
		const sinceChip = searchState.chips.find((c) => c.keyword === "since");
		const sinceCutoff = sinceChip ? parseSince(sinceChip.value) : null;
		const free = searchState.freeText.toLowerCase();

		return events.filter((e) => {
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

	async function loadInitial() {
		const res = await client
			.query<{ activity: ActivityEvent[] }>(ACTIVITY_QUERY, {
				filter: { advanced, limit: PAGE_SIZE },
			})
			.toPromise();
		if (res.data) {
			events = res.data.activity;
			hasMore = res.data.activity.length === PAGE_SIZE;
		}
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
				})
				.toPromise();
			if (res.data) {
				// Dedupe defensively in case a live event raced us.
				const seen = new Set(events.map((e) => e.id));
				const fresh = res.data.activity.filter((e) => !seen.has(e.id));
				events = [...events, ...fresh];
				hasMore = res.data.activity.length === PAGE_SIZE;
			}
		} finally {
			loadingMore = false;
		}
	}

	async function loadRooms() {
		const res = await client.query<{ rooms: RoomInfo[] }>(ROOMS_QUERY, {}).toPromise();
		if (res.data) rooms = res.data.rooms;
	}

	function startSubscription() {
		if (!client) return;
		if (subUnsub) {
			subUnsub();
			subUnsub = null;
		}
		const sub = client
			.subscription<{ activityStream: ActivityEvent }>(ACTIVITY_STREAM, { advanced })
			.subscribe((result) => {
				if (!result.data) return;
				const evt = result.data.activityStream;
				if (events.some((e) => e.id === evt.id)) return;
				events = [evt, ...events];
				markNew(evt.id);
			});
		subUnsub = sub.unsubscribe;
	}

	function toggleAdvanced(next: boolean) {
		advanced = next;
		profile.set("activity.advanced", next);
		void loadInitial();
		startSubscription();
	}

	onMount(() => {
		client = createGraphQLClient();
		pageHeader.breadcrumbs = [{ label: "Activity" }];
		void loadRooms();
		loadInitial().then(startSubscription);
	});

	onDestroy(() => {
		pageHeader.reset();
		if (subUnsub) {
			subUnsub();
			subUnsub = null;
		}
	});
</script>

<div class="flex h-[calc(100vh-8rem)] flex-col gap-4">
	<div class="flex items-center gap-4">
		<div class="flex-1">
			<HiveSearchbar
				value={searchState}
				onchange={(v) => (searchState = v)}
				chips={searchChipConfigs}
				placeholder="Search activity..."
				debounceMs={500}
				commitOnBlur
			/>
		</div>
		<div class="flex items-center gap-2">
			<Switch id="advanced-toggle" checked={advanced} onCheckedChange={toggleAdvanced} />
			<label for="advanced-toggle" class="text-sm text-foreground cursor-pointer select-none">Advanced</label>
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
			<ActivityTable
				events={filteredEvents}
				{recentIds}
				{hasMore}
				{loadingMore}
				onLoadMore={loadMore}
			/>
		</div>
	{/if}
</div>
