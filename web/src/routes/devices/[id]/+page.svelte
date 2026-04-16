<script lang="ts">
	import { page } from "$app/stores";
	import { onMount, onDestroy } from "svelte";
	import { createGraphQLClient } from "$lib/graphql/client";
	import {
		isLightState,
		isSensorState,
		isSwitchState,
		type Device,
		type LightState,
		type SensorState,
		type SwitchState,
	} from "$lib/stores/devices";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import {
		Tooltip,
		TooltipContent,
		TooltipTrigger,
		TooltipProvider,
	} from "$lib/components/ui/tooltip/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import LightControls from "$lib/components/light-controls.svelte";
	import SensorDisplay from "$lib/components/sensor-display.svelte";
	import SwitchDisplay from "$lib/components/switch-display.svelte";
	import { ArrowLeft, Copy, Check, ExternalLink } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { gql } from "@urql/svelte";
	import type { Client } from "@urql/svelte";

	type DeviceState = LightState | SensorState | SwitchState;

	const deviceId = $derived($page.params.id);

	let device = $state<Device | null>(null);
	let loading = $state(true);

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Devices", href: "/devices" }, { label: "Device" }];
	});
	onDestroy(() => pageHeader.reset());

	$effect(() => {
		if (device) {
			pageHeader.breadcrumbs = [{ label: "Devices", href: "/devices" }, { label: device.name }];
		}
	});
	let error = $state<string | null>(null);
	let sending = $state(false);
	let copied = $state(false);

	interface GroupMember {
		id: string;
		memberType: string;
		memberId: string;
	}

	interface GroupInfo {
		id: string;
		name: string;
		members: GroupMember[];
	}

	let groups = $state<GroupInfo[]>([]);

	const DEVICE_QUERY = gql`
		query Device($id: ID!) {
			device(id: $id) {
				id
				name
				source
				type
				available
				lastSeen
				state {
					... on LightState {
						__typename
						on
						brightness
						colorTemp
						color { r g b x y }
						transition
					}
					... on SensorState {
						__typename
						temperature
						humidity
						battery
						pressure
						illuminance
					}
					... on SwitchState {
						__typename
						action
					}
				}
			}
		}
	`;

	const GROUPS_QUERY = gql`
		query Groups {
			groups {
				id
				name
				members {
					id
					memberType
					memberId
				}
			}
		}
	`;

	const SET_DEVICE_STATE = gql`
		mutation SetDeviceState($deviceId: ID!, $state: LightStateInput!) {
			setDeviceState(deviceId: $deviceId, state: $state) {
				id
				state {
					... on LightState {
						__typename
						on
						brightness
						colorTemp
						color { r g b x y }
						transition
					}
				}
			}
		}
	`;

	const DEVICE_STATE_CHANGED = gql`
		subscription DeviceStateChanged($deviceId: ID) {
			deviceStateChanged(deviceId: $deviceId) {
				deviceId
				state {
					... on LightState {
						__typename
						on
						brightness
						colorTemp
						color { r g b x y }
						transition
					}
					... on SensorState {
						__typename
						temperature
						humidity
						battery
						pressure
						illuminance
					}
					... on SwitchState {
						__typename
						action
					}
				}
			}
		}
	`;

	const DEVICE_AVAILABILITY_CHANGED = gql`
		subscription DeviceAvailabilityChanged {
			deviceAvailabilityChanged {
				deviceId
				available
			}
		}
	`;

	interface DeviceQueryResult {
		device: Device | null;
	}

	interface GroupsQueryResult {
		groups: GroupInfo[];
	}

	interface SetDeviceStateResult {
		setDeviceState: Device;
	}

	interface DeviceStateChangedResult {
		deviceStateChanged: {
			deviceId: string;
			state: DeviceState;
		};
	}

	interface DeviceAvailabilityChangedResult {
		deviceAvailabilityChanged: {
			deviceId: string;
			available: boolean;
		};
	}

	let unsubscribers: (() => void)[] = [];
	let clientRef: Client | null = null;

	const light = $derived(device && isLightState(device.state) ? device.state : null);
	const sensor = $derived(device && isSensorState(device.state) ? device.state : null);
	const sw = $derived(device && isSwitchState(device.state) ? device.state : null);

	const deviceGroups = $derived(
		groups.filter((g) => g.members.some((m) => m.memberType === "device" && m.memberId === deviceId))
	);

	const formattedLastSeen = $derived.by(() => {
		if (!device) return "";
		const date = new Date(device.lastSeen);
		if (isNaN(date.getTime())) return "Unknown";
		return date.toLocaleString();
	});

	async function copyDeviceId() {
		if (!device) return;
		try {
			await navigator.clipboard.writeText(device.id);
			copied = true;
			setTimeout(() => { copied = false; }, 2000);
		} catch {
			// Clipboard API may not be available
		}
	}

	interface LightStateInput {
		on?: boolean;
		brightness?: number;
		colorTemp?: number;
		color?: { r: number; g: number; b: number; x: number; y: number };
		transition?: number;
	}

	async function handleLightCommand(input: LightStateInput) {
		if (!clientRef || !device) return;
		sending = true;

		const result = await clientRef
			.mutation<SetDeviceStateResult>(SET_DEVICE_STATE, {
				deviceId: device.id,
				state: input,
			})
			.toPromise();

		sending = false;

		if (result.data) {
			device = result.data.setDeviceState;
		}
		if (result.error) {
			error = result.error.message;
			setTimeout(() => { error = null; }, 5000);
		}
	}

	onMount(() => {
		const client = createGraphQLClient();
		clientRef = client;

		client
			.query<DeviceQueryResult>(DEVICE_QUERY, { id: deviceId })
			.toPromise()
			.then((result) => {
				loading = false;
				if (result.data?.device) {
					device = result.data.device;
				} else {
					error = "Device not found";
				}
			})
			.catch(() => {
				loading = false;
				error = "Failed to load device";
			});

		client
			.query<GroupsQueryResult>(GROUPS_QUERY, {})
			.toPromise()
			.then((result) => {
				if (result.data) {
					groups = result.data.groups;
				}
			});

		const { unsubscribe: unsubState } = client
			.subscription<DeviceStateChangedResult>(DEVICE_STATE_CHANGED, { deviceId })
			.subscribe((result) => {
				if (result.data && result.data.deviceStateChanged.deviceId === deviceId) {
					if (device) {
						device = { ...device, state: result.data.deviceStateChanged.state };
					}
				}
			});
		unsubscribers.push(unsubState);

		const { unsubscribe: unsubAvail } = client
			.subscription<DeviceAvailabilityChangedResult>(DEVICE_AVAILABILITY_CHANGED, {})
			.subscribe((result) => {
				if (result.data && result.data.deviceAvailabilityChanged.deviceId === deviceId) {
					if (device) {
						device = { ...device, available: result.data.deviceAvailabilityChanged.available };
					}
				}
			});
		unsubscribers.push(unsubAvail);
	});

	onDestroy(() => {
		for (const unsub of unsubscribers) {
			unsub();
		}
	});
</script>

<div>

	{#if error}
		<div
			class="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		>
			{error}
		</div>
	{/if}

	{#if loading}
		<div class="space-y-4">
			<div class="h-48 animate-pulse rounded-xl shadow-card bg-card"></div>
			<div class="h-64 animate-pulse rounded-xl shadow-card bg-card"></div>
		</div>
	{:else if device}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
			<div class="space-y-6">
				<Card>
					<CardHeader>
						<div class="flex items-center justify-between">
							<CardTitle>Device Info</CardTitle>
							<span
								class="inline-flex items-center gap-1.5 text-sm {device.available ? 'text-green-500' : 'text-destructive'}"
							>
								<span class="h-2 w-2 rounded-full {device.available ? 'bg-green-500' : 'bg-destructive'}"></span>
								{device.available ? "Online" : "Offline"}
							</span>
						</div>
					</CardHeader>
					<CardContent>
						<dl class="space-y-3">
							<div class="flex items-center justify-between">
								<dt class="text-sm text-muted-foreground">Device ID</dt>
								<dd class="flex items-center gap-1.5">
									<code class="max-w-48 truncate rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{device.id}</code>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger>
												{#snippet child({ props })}
													<button
														{...props}
														type="button"
														onclick={copyDeviceId}
														class="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
													>
														{#if copied}
															<Check class="size-3.5" />
														{:else}
															<Copy class="size-3.5" />
														{/if}
													</button>
												{/snippet}
											</TooltipTrigger>
											<TooltipContent>
												{copied ? "Copied!" : "Copy ID"}
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</dd>
							</div>

							<Separator />

							<div class="flex items-center justify-between">
								<dt class="text-sm text-muted-foreground">Type</dt>
								<dd>
									<Badge variant="secondary">{device.type}</Badge>
								</dd>
							</div>

							<div class="flex items-center justify-between">
								<dt class="text-sm text-muted-foreground">Source</dt>
								<dd>
									<Badge variant="outline">{device.source}</Badge>
								</dd>
							</div>

							{#if device.source === "zigbee"}
								<Separator />
								<div class="flex items-center justify-between">
									<dt class="text-sm text-muted-foreground">IEEE Address</dt>
									<dd>
										<code class="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{device.id}</code>
									</dd>
								</div>
							{/if}

							<Separator />

							<div class="flex items-center justify-between">
								<dt class="text-sm text-muted-foreground">Last Seen</dt>
								<dd class="text-sm">{formattedLastSeen}</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				{#if deviceGroups.length > 0}
					<Card>
						<CardHeader>
							<CardTitle>Groups</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="space-y-2">
								{#each deviceGroups as group (group.id)}
									<a
										href="/groups"
										class="flex items-center justify-between rounded-lg shadow-card px-3 py-2 transition-colors hover:bg-accent"
									>
										<span class="text-sm font-medium">{group.name}</span>
										<ExternalLink class="size-3.5 text-muted-foreground" />
									</a>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}
			</div>

			<div>
				{#if light}
					<LightControls lightState={light} oncommand={handleLightCommand} {sending} />
				{:else if sensor}
					<SensorDisplay state={sensor} />
				{:else if sw}
					<SwitchDisplay state={sw} lastSeen={device.lastSeen} />
				{:else}
					<Card>
						<CardContent class="py-8 text-center">
							<p class="text-muted-foreground">No state information available for this device.</p>
						</CardContent>
					</Card>
				{/if}
			</div>
		</div>
	{:else}
		<Card>
			<CardContent class="py-12 text-center">
				<p class="text-lg font-medium text-foreground">Device not found</p>
				<p class="mt-2 text-sm text-muted-foreground">
					The device you're looking for doesn't exist or has been removed.
				</p>
				<Button variant="outline" class="mt-4" href="/devices">
					<ArrowLeft class="size-4" />
					Back to Devices
				</Button>
			</CardContent>
		</Card>
	{/if}
</div>
