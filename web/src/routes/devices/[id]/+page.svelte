<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { onMount, onDestroy } from "svelte";
	import { fly } from "svelte/transition";
	import type { Device, DeviceState } from "$lib/stores/devices";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import HiveChip from "$lib/components/hive-chip.svelte";
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
	import ButtonDisplay from "$lib/components/button-display.svelte";
	import StateHistoryChart from "$lib/components/state-history-chart.svelte";
	import DateRangePicker from "$lib/components/date-range-picker.svelte";
	import PlugDisplay from "$lib/components/plug-display.svelte";
	import MemberTable from "$lib/components/member-table.svelte";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import { membershipRowsForDevice } from "$lib/memberships";
	import { ArrowLeft, Copy, Check, DoorOpen, Group as GroupIcon } from "@lucide/svelte";

	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	const deviceId = $derived($page.params.id ?? "");

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

	interface RoomInfo {
		id: string;
		name: string;
		devices: { id: string }[];
	}

	let groups = $state<GroupInfo[]>([]);
	let rooms = $state<RoomInfo[]>([]);
	let pickerOpen = $state(false);

	const DEVICE_QUERY = graphql(`
		query Device($id: ID!) {
			device(id: $id) {
				id
				name
				source
				type
				capabilities { name type values valueMin valueMax unit access }
				available
				lastSeen
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

	const GROUPS_QUERY = graphql(`
		query DeviceDetailGroups {
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
	`);

	const ROOMS_QUERY = graphql(`
		query DeviceDetailRooms {
			rooms {
				id
				name
				devices { id }
			}
		}
	`);

	const ADD_ROOM_DEVICE = graphql(`
		mutation DeviceDetailAddRoomDevice($input: AddRoomDeviceInput!) {
			addRoomDevice(input: $input) { id }
		}
	`);

	const REMOVE_ROOM_DEVICE = graphql(`
		mutation DeviceDetailRemoveRoomDevice($roomId: ID!, $deviceId: ID!) {
			removeRoomDevice(roomId: $roomId, deviceId: $deviceId) { id }
		}
	`);

	const ADD_GROUP_MEMBER = graphql(`
		mutation DeviceDetailAddGroupMember($input: AddGroupMemberInput!) {
			addGroupMember(input: $input) { id }
		}
	`);

	const REMOVE_GROUP_MEMBER = graphql(`
		mutation DeviceDetailRemoveGroupMember($id: ID!) {
			removeGroupMember(id: $id)
		}
	`);

	const SET_DEVICE_STATE = graphql(`
		mutation SetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
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

	const DEVICE_STATE_CHANGED = graphql(`
		subscription DeviceDetailDeviceStateChanged($deviceId: ID) {
			deviceStateChanged(deviceId: $deviceId) {
				deviceId
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

	const DEVICE_AVAILABILITY_CHANGED = graphql(`
		subscription DeviceAvailabilityChanged {
			deviceAvailabilityChanged {
				deviceId
				available
			}
		}
	`);

	interface DeviceQueryResult {
		device: Device | null;
	}

	interface GroupsQueryResult {
		groups: GroupInfo[];
	}

	interface RoomsQueryResult {
		rooms: RoomInfo[];
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
	const clientRef = getContextClient();

	const light = $derived(device?.type === "light" ? device.state : null);
	const plug = $derived(device?.type === "plug" ? device.state : null);
	const sensor = $derived(device?.type === "sensor" ? device.state : null);
	const isButton = $derived(device?.type === "button");

	const membershipData = $derived(membershipRowsForDevice(deviceId, rooms, groups));

	const membershipRows = $derived(
		membershipData.map((row) => ({
			id: row.id,
			name: row.name,
			type: row.kind,
			related: [] as [],
			onclick:
				row.kind === "room"
					? () => goto(`/rooms?edit=${row.roomId}`)
					: () => goto(`/groups?edit=${row.groupId}`),
		}))
	);

	const pickerDrawerGroups = $derived.by((): DrawerGroup<"room" | "group">[] => {
		const availableRooms = rooms.filter((r) => !r.devices.some((d) => d.id === deviceId));
		const availableGroups = groups.filter(
			(g) => !g.members.some((m) => m.memberType === "device" && m.memberId === deviceId)
		);
		const result: DrawerGroup<"room" | "group">[] = [];
		if (availableRooms.length > 0) {
			result.push({
				heading: "Rooms",
				items: availableRooms.map((r) => ({
					type: "room" as const,
					id: r.id,
					name: r.name,
					icon: DoorOpen,
				})),
			});
		}
		if (availableGroups.length > 0) {
			result.push({
				heading: "Groups",
				items: availableGroups.map((g) => ({
					type: "group" as const,
					id: g.id,
					name: g.name,
					icon: GroupIcon,
				})),
			});
		}
		return result;
	});

	async function refreshMemberships() {
		if (!clientRef) return;
		const [r, g] = await Promise.all([
			clientRef.query<RoomsQueryResult>(ROOMS_QUERY, {}, { requestPolicy: "network-only" }).toPromise(),
			clientRef.query<GroupsQueryResult>(GROUPS_QUERY, {}, { requestPolicy: "network-only" }).toPromise(),
		]);
		if (r.data) rooms = r.data.rooms;
		if (g.data) groups = g.data.groups;
	}

	let pendingPicks = 0;

	async function handlePickerSelect(type: "room" | "group", id: string) {
		if (!clientRef) return;
		pendingPicks++;
		try {
			if (type === "room") {
				await clientRef
					.mutation(ADD_ROOM_DEVICE, { input: { roomId: id, deviceId } })
					.toPromise();
			} else {
				await clientRef
					.mutation(ADD_GROUP_MEMBER, {
						input: { groupId: id, memberType: "device", memberId: deviceId },
					})
					.toPromise();
			}
		} finally {
			pendingPicks--;
			if (pendingPicks === 0) {
				await refreshMemberships();
			}
		}
	}

	async function handleRemoveMembership(rowId: string) {
		if (!clientRef) return;
		const row = membershipData.find((r) => r.id === rowId);
		if (!row) return;
		if (row.kind === "room") {
			await clientRef
				.mutation(REMOVE_ROOM_DEVICE, { roomId: row.roomId, deviceId })
				.toPromise();
		} else {
			await clientRef
				.mutation(REMOVE_GROUP_MEMBER, { id: row.groupMemberId })
				.toPromise();
		}
		await refreshMemberships();
	}

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

	interface CommandInput {
		on?: boolean;
		brightness?: number;
		colorTemp?: number;
		color?: { r: number; g: number; b: number; x: number; y: number };
		transition?: number;
	}

	async function handleDeviceCommand(input: CommandInput) {
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
		const client = clientRef;

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

		client
			.query<RoomsQueryResult>(ROOMS_QUERY, {})
			.toPromise()
			.then((result) => {
				if (result.data) {
					rooms = result.data.rooms;
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

	let historyFrom = $state<Date>(new Date(Date.now() - 24 * 60 * 60 * 1000));
	let historyTo = $state<Date>(new Date());
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
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]" in:fly={{ y: -4, duration: 150 }}>
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
									<HiveChip type={device.type} />
								</dd>
							</div>

							<div class="flex items-center justify-between">
								<dt class="text-sm text-muted-foreground">Source</dt>
								<dd>
									<Badge variant="outline">{device.source.charAt(0).toUpperCase() + device.source.slice(1)}</Badge>
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

				<Card>
					<CardHeader>
						<CardTitle>Rooms & Groups</CardTitle>
					</CardHeader>
					<CardContent>
						<MemberTable
							rows={membershipRows}
							emptyMessage="Not in any room or group yet."
							addLabel="Add to"
							onadd={() => (pickerOpen = true)}
							onremove={handleRemoveMembership}
						/>
					</CardContent>
				</Card>
			</div>

			<div class="flex flex-col gap-4">
				{#if light}
					<LightControls lightState={light} oncommand={handleDeviceCommand} {sending} />
				{:else if plug}
					<PlugDisplay state={plug} oncommand={handleDeviceCommand} {sending} />
				{:else if sensor}
					<SensorDisplay state={sensor} />
				{:else if isButton}
					<ButtonDisplay lastSeen={device.lastSeen} />
				{:else}
					<Card>
						<CardContent class="py-8 text-center">
							<p class="text-muted-foreground">No state information available for this device.</p>
						</CardContent>
					</Card>
				{/if}

				{#if !isButton}
					<Card>
						<CardHeader>
							<div class="flex items-center justify-between gap-2">
								<CardTitle>History</CardTitle>
								<DateRangePicker bind:from={historyFrom} bind:to={historyTo} compact />
							</div>
						</CardHeader>
						<CardContent>
							<StateHistoryChart
								deviceIds={[device.id]}
								from={historyFrom}
								to={historyTo}
							/>
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

	<HiveDrawer
		bind:open={pickerOpen}
		title="Add to rooms or groups"
		description="Pick one or more rooms and groups for this device."
		multiple
		groups={pickerDrawerGroups}
		onselect={handlePickerSelect}
	/>
</div>
