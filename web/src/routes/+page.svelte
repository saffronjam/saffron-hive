<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { deviceStore, devicesHydrated, type Device } from "$lib/stores/devices";
	import DashboardDeviceCard from "$lib/components/dashboard-device-card.svelte";
	import SceneQuickBar from "$lib/components/scene-quick-bar.svelte";
	import ActivityFeed from "$lib/components/activity-feed.svelte";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import { ChevronDown, Thermometer, Droplets } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Dashboard" }];
	});
	onDestroy(() => pageHeader.reset());

	interface SceneData {
		id: string;
		name: string;
	}

	interface GroupData {
		id: string;
		name: string;
		resolvedDevices: { id: string }[];
	}

	interface AutomationInfo {
		id: string;
		name: string;
	}

	interface ActivityEntry {
		automationId: string;
		nodeId: string;
		active: boolean;
		timestamp: Date;
	}

	interface CommandInput {
		on?: boolean;
		brightness?: number;
		colorTemp?: number;
		color?: { r: number; g: number; b: number; x: number; y: number };
		transition?: number;
	}

	interface ScenesQueryResult {
		scenes: SceneData[];
	}

	interface GroupsQueryResult {
		groups: GroupData[];
	}

	interface AutomationsQueryResult {
		automations: AutomationInfo[];
	}

	interface ApplySceneResult {
		applyScene: SceneData;
	}

	interface SetDeviceStateResult {
		setDeviceState: Device;
	}

	interface AutomationNodeActivatedResult {
		automationNodeActivated: {
			automationId: string;
			nodeId: string;
			active: boolean;
		};
	}

	const SCENES_QUERY = graphql(`
		query DashboardScenes {
			scenes {
				id
				name
			}
		}
	`);

	const GROUPS_QUERY = graphql(`
		query DashboardGroups {
			groups {
				id
				name
				resolvedDevices {
					id
				}
			}
		}
	`);

	const AUTOMATIONS_QUERY = graphql(`
		query DashboardAutomations {
			automations {
				id
				name
			}
		}
	`);

	const APPLY_SCENE = graphql(`
		mutation ApplyScene($sceneId: ID!) {
			applyScene(sceneId: $sceneId) {
				id
				name
			}
		}
	`);

	const SET_DEVICE_STATE = graphql(`
		mutation DashboardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
			setDeviceState(deviceId: $deviceId, state: $state) {
				id
				state {
					on
					brightness
					colorTemp
					color { r g b x y }
					transition
					temperature
					humidity
					pressure
					illuminance
					battery
					power
					voltage
					current
					energy
				}
			}
		}
	`);

	const AUTOMATION_NODE_ACTIVATED = graphql(`
		subscription DashboardAutomationNodeActivated {
			automationNodeActivated {
				automationId
				nodeId
				active
			}
		}
	`);

	const MAX_ACTIVITY_ENTRIES = 20;

	const clientRef = getContextClient();
	let unsubscribers: (() => void)[] = [];

	let scenes = $state<SceneData[]>([]);
	let groups = $state<GroupData[]>([]);
	let automations = $state<AutomationInfo[]>([]);
	let activityEntries = $state<ActivityEntry[]>([]);
	let applyingSceneId = $state<string | null>(null);
	let sendingDeviceId = $state<string | null>(null);
	let collapsedGroups = $state<Set<string>>(new Set());
	let activityExpanded = $state(false);

	const devices = $derived(Object.values($deviceStore));

	const deviceGroupMap = $derived.by(() => {
		const map = new Map<string, string>();
		for (const group of groups) {
			for (const rd of group.resolvedDevices) {
				if (!map.has(rd.id)) {
					map.set(rd.id, group.id);
				}
			}
		}
		return map;
	});

	interface DeviceGroup {
		id: string;
		name: string;
		devices: Device[];
	}

	const groupedDevices = $derived.by(() => {
		const groupMap = new Map<string, Device[]>();
		const ungrouped: Device[] = [];

		for (const device of devices) {
			const groupId = deviceGroupMap.get(device.id);
			if (groupId) {
				const existing = groupMap.get(groupId);
				if (existing) {
					existing.push(device);
				} else {
					groupMap.set(groupId, [device]);
				}
			} else {
				ungrouped.push(device);
			}
		}

		const result: DeviceGroup[] = [];
		for (const group of groups) {
			const devs = groupMap.get(group.id);
			if (devs && devs.length > 0) {
				result.push({ id: group.id, name: group.name, devices: devs });
			}
		}
		if (ungrouped.length > 0) {
			result.push({ id: "__other__", name: "Other", devices: ungrouped });
		}
		return result;
	});

	const sensorDevices = $derived(devices.filter((d) => d.type === "sensor"));

	const sensorSummary = $derived.by(() => {
		const temps: number[] = [];
		const humids: number[] = [];
		for (const d of sensorDevices) {
			if (d.state?.temperature != null) temps.push(d.state.temperature);
			if (d.state?.humidity != null) humids.push(d.state.humidity);
		}
		return {
			avgTemp: temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : null,
			avgHumidity: humids.length > 0 ? humids.reduce((a, b) => a + b, 0) / humids.length : null,
			sensorCount: sensorDevices.length,
		};
	});

	function isGroupCollapsed(groupId: string): boolean {
		return collapsedGroups.has(groupId);
	}

	function toggleGroup(groupId: string) {
		const next = new Set(collapsedGroups);
		if (next.has(groupId)) {
			next.delete(groupId);
		} else {
			next.add(groupId);
		}
		collapsedGroups = next;
	}

	async function handleApplyScene(scene: SceneData) {
		if (!clientRef) return;
		applyingSceneId = scene.id;

		const result = await clientRef
			.mutation<ApplySceneResult>(APPLY_SCENE, { sceneId: scene.id })
			.toPromise();

		applyingSceneId = null;

		if (result.error) {
			console.error("Failed to apply scene:", result.error.message);
		}
	}

	async function handleDeviceCommand(deviceId: string, input: CommandInput) {
		if (!clientRef) return;
		sendingDeviceId = deviceId;

		const result = await clientRef
			.mutation<SetDeviceStateResult>(SET_DEVICE_STATE, {
				deviceId,
				state: input,
			})
			.toPromise();

		sendingDeviceId = null;

		if (result.data) {
			const updated = result.data.setDeviceState;
			if (updated.state) {
				deviceStore.updateState(deviceId, updated.state);
			}
		}
	}

	onMount(() => {
		const client = clientRef;

		client
			.query<ScenesQueryResult>(SCENES_QUERY, {})
			.toPromise()
			.then((result) => {
				if (result.data) {
					scenes = result.data.scenes;
				}
			});

		client
			.query<GroupsQueryResult>(GROUPS_QUERY, {})
			.toPromise()
			.then((result) => {
				if (result.data) {
					groups = result.data.groups;
				}
			});

		client
			.query<AutomationsQueryResult>(AUTOMATIONS_QUERY, {})
			.toPromise()
			.then((result) => {
				if (result.data) {
					automations = result.data.automations;
				}
			});

		const { unsubscribe: unsubActivity } = client
			.subscription<AutomationNodeActivatedResult>(AUTOMATION_NODE_ACTIVATED, {})
			.subscribe((result) => {
				if (result.data) {
					const event = result.data.automationNodeActivated;
					const entry: ActivityEntry = {
						automationId: event.automationId,
						nodeId: event.nodeId,
						active: event.active,
						timestamp: new Date(),
					};
					activityEntries = [entry, ...activityEntries].slice(0, MAX_ACTIVITY_ENTRIES);
				}
			});
		unsubscribers.push(unsubActivity);
	});

	onDestroy(() => {
		for (const unsub of unsubscribers) {
			unsub();
		}
	});
</script>

<div class="flex flex-col gap-6 lg:flex-row">
	<div class="min-w-0 flex-1">

		<div class="mb-6 lg:hidden">
			{#if sensorSummary.sensorCount > 0}
				<div class="mb-4 flex gap-3">
					{#if sensorSummary.avgTemp != null}
						<div class="flex items-center gap-2 rounded-lg shadow-card bg-card px-3 py-2">
							<Thermometer class="size-4 text-muted-foreground" />
							<span class="text-sm font-medium text-foreground">{sensorSummary.avgTemp.toFixed(1)}&deg;C</span>
							<span class="text-xs text-muted-foreground">avg</span>
						</div>
					{/if}
					{#if sensorSummary.avgHumidity != null}
						<div class="flex items-center gap-2 rounded-lg shadow-card bg-card px-3 py-2">
							<Droplets class="size-4 text-muted-foreground" />
							<span class="text-sm font-medium text-foreground">{sensorSummary.avgHumidity.toFixed(0)}%</span>
							<span class="text-xs text-muted-foreground">avg</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="mb-6">
			<SceneQuickBar
				{scenes}
				applyingId={applyingSceneId}
				onapply={handleApplyScene}
			/>
		</div>

		{#if $devicesHydrated && devices.length === 0}
			<div class="rounded-lg shadow-card bg-card p-12 text-center">
				<p class="text-muted-foreground">No devices discovered yet.</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Devices will appear here once the backend connects to your MQTT broker.
				</p>
			</div>
		{:else if $devicesHydrated}
			<div class="space-y-6">
				{#each groupedDevices as group (group.id)}
					<div>
						<button
							type="button"
							class="mb-3 flex w-full items-center gap-2 text-left"
							onclick={() => toggleGroup(group.id)}
						>
							<ChevronDown
								class="size-4 text-muted-foreground transition-transform {isGroupCollapsed(group.id) ? '-rotate-90' : ''}"
							/>
							<h2 class="text-sm font-medium text-muted-foreground">{group.name}</h2>
							<span class="text-xs text-muted-foreground">({group.devices.length})</span>
						</button>

						{#if !isGroupCollapsed(group.id)}
							<AnimatedGrid class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
								{#each group.devices as device (device.id)}
									<DashboardDeviceCard
										{device}
										oncommand={handleDeviceCommand}
										sending={sendingDeviceId === device.id}
									/>
								{/each}
							</AnimatedGrid>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<div class="mt-6 lg:hidden">
			<button
				type="button"
				class="flex w-full items-center justify-between rounded-lg shadow-card bg-card px-4 py-3 text-left"
				onclick={() => (activityExpanded = !activityExpanded)}
			>
				<span class="text-sm font-medium text-foreground">Recent Activity</span>
				<ChevronDown
					class="size-4 text-muted-foreground transition-transform {activityExpanded ? 'rotate-180' : ''}"
				/>
			</button>
			{#if activityExpanded}
				<div class="mt-2">
					<ActivityFeed entries={activityEntries} {automations} />
				</div>
			{/if}
		</div>
	</div>

	<aside class="hidden w-72 shrink-0 lg:block">
		{#if sensorSummary.sensorCount > 0}
			<div class="mb-6 rounded-lg shadow-card bg-card p-4">
				<h3 class="mb-3 text-sm font-medium text-foreground">Sensors</h3>
				<div class="space-y-3">
					{#if sensorSummary.avgTemp != null}
						<div class="flex items-center gap-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
								<Thermometer class="size-4 text-muted-foreground" />
							</div>
							<div>
								<p class="text-sm font-medium text-foreground">{sensorSummary.avgTemp.toFixed(1)}&deg;C</p>
								<p class="text-xs text-muted-foreground">Average temperature</p>
							</div>
						</div>
					{/if}
					{#if sensorSummary.avgHumidity != null}
						<div class="flex items-center gap-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
								<Droplets class="size-4 text-muted-foreground" />
							</div>
							<div>
								<p class="text-sm font-medium text-foreground">{sensorSummary.avgHumidity.toFixed(0)}%</p>
								<p class="text-xs text-muted-foreground">Average humidity</p>
							</div>
						</div>
					{/if}
					{#each sensorDevices as sDevice (sDevice.id)}
						{#if sDevice.state}
							<div class="flex items-center justify-between border-t border-border pt-2 text-xs">
								<span class="truncate text-muted-foreground">{sDevice.name}</span>
								<span class="shrink-0 text-foreground">
									{#if sDevice.state.temperature != null}
										{sDevice.state.temperature.toFixed(1)}&deg;C
									{/if}
									{#if sDevice.state.temperature != null && sDevice.state.humidity != null}
										/
									{/if}
									{#if sDevice.state.humidity != null}
										{sDevice.state.humidity.toFixed(0)}%
									{/if}
								</span>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}

		<ActivityFeed entries={activityEntries} {automations} />
	</aside>
</div>
