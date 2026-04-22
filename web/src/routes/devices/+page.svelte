<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { fly } from "svelte/transition";
	import { getContextClient, queryStore, subscriptionStore } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { deviceStore, type Device } from "$lib/stores/devices";
	import DeviceCard from "$lib/components/device-card.svelte";
	import DeviceTable from "$lib/components/device-table.svelte";
	import TableSelectionToolbar from "$lib/components/table-selection-toolbar.svelte";
	import DeviceBatchAddDialog from "$lib/components/device-batch-add-dialog.svelte";
	import { createTableSelection } from "$lib/utils/table-selection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig, SearchState } from "$lib/components/hive-searchbar";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import ListView from "$lib/components/list-view.svelte";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import { chipsByDevice } from "$lib/memberships";
	import { compareDevicesByName } from "$lib/list-helpers";
	import { DoorOpen, Group as GroupIcon } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { profile, type ListView as ListViewMode } from "$lib/stores/profile.svelte";

	let view = $state<ListViewMode>(profile.get("view.devices", "card"));

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Devices" }];
	});
	onDestroy(() => pageHeader.reset());

	$effect(() => {
		pageHeader.viewToggle = {
			value: view,
			onchange: (v) => {
				view = v;
				profile.set("view.devices", v);
			},
		};
	});

	let searchState = $state<SearchState>({ chips: [], freeText: "" });

	const deviceTypeOptions = [
		{ value: "light", label: "Light" },
		{ value: "sensor", label: "Sensor" },
		{ value: "switch", label: "Switch" },
	];

	const searchChipConfigs: ChipConfig[] = [
		{
			keyword: "type",
			label: "Type",
			variant: "secondary",
			options: (input) => {
				const q = input.toLowerCase();
				if (!q) return deviceTypeOptions;
				return deviceTypeOptions.filter(
					(o) => o.value.includes(q) || o.label.toLowerCase().includes(q)
				);
			},
		},
	];

	const allDevices = $derived(
		Object.values($deviceStore).sort(compareDevicesByName)
	);

	const filteredDevices = $derived.by(() => {
		const typeValues = searchState.chips
			.filter((c) => c.keyword === "type")
			.map((c) => c.value);
		const query = searchState.freeText.toLowerCase();

		return allDevices.filter((d) => {
			if (typeValues.length > 0 && !typeValues.includes(d.type)) return false;
			if (query) {
				const matches =
					d.name.toLowerCase().includes(query) ||
					d.type.toLowerCase().includes(query) ||
					d.source.toLowerCase().includes(query);
				if (!matches) return false;
			}
			return true;
		});
	});

	const selection = createTableSelection();
	let batchAddOpen = $state(false);
	const filteredIds = $derived(filteredDevices.map((d) => d.id));
	$effect(() => {
		selection.pruneTo(filteredIds);
	});

	const DEVICES_QUERY = graphql(`
		query Devices {
			devices {
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

	const DEVICE_STATE_CHANGED = graphql(`
		subscription DeviceStateChanged {
			deviceStateChanged {
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

	const DEVICE_ADDED = graphql(`
		subscription DeviceAdded {
			deviceAdded {
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

	const DEVICE_REMOVED = graphql(`
		subscription DeviceRemoved {
			deviceRemoved
		}
	`);

	const UPDATE_DEVICE = graphql(`
		mutation UpdateDevice($id: ID!, $input: UpdateDeviceInput!) {
			updateDevice(id: $id, input: $input) {
				id
				name
			}
		}
	`);

	const ROOMS_QUERY = graphql(`
		query DeviceListRooms {
			rooms {
				id
				name
				icon
				devices { id }
			}
		}
	`);

	const GROUPS_QUERY = graphql(`
		query DeviceListGroups {
			groups {
				id
				name
				icon
				members { memberType memberId }
			}
		}
	`);

	const ADD_ROOM_DEVICE = graphql(`
		mutation DeviceListAddRoomDevice($input: AddRoomDeviceInput!) {
			addRoomDevice(input: $input) {
				id
			}
		}
	`);

	const ADD_GROUP_MEMBER = graphql(`
		mutation DeviceListAddGroupMember($input: AddGroupMemberInput!) {
			addGroupMember(input: $input) {
				id
			}
		}
	`);

	type RoomInfo = { id: string; name: string; devices: { id: string }[] };
	type GroupInfo = { id: string; name: string; members: { memberType: string; memberId: string }[] };

	const client = getContextClient();
	let ready = $state(false);

	let rooms = $state<RoomInfo[]>([]);
	let groups = $state<GroupInfo[]>([]);

	let addToPickerOpen = $state(false);
	let pickerDevice = $state<Device | null>(null);

	const devicesQuery = queryStore({ client, query: DEVICES_QUERY });
	const stateChanged = subscriptionStore({ client, query: DEVICE_STATE_CHANGED });
	const availabilityChanged = subscriptionStore({ client, query: DEVICE_AVAILABILITY_CHANGED });
	const deviceAdded = subscriptionStore({ client, query: DEVICE_ADDED });
	const deviceRemoved = subscriptionStore({ client, query: DEVICE_REMOVED });

	$effect(() => {
		if ($devicesQuery.data) {
			deviceStore.hydrate($devicesQuery.data.devices);
		}
	});

	$effect(() => {
		if ($stateChanged.data) {
			const { deviceId, state } = $stateChanged.data.deviceStateChanged;
			deviceStore.updateState(deviceId, state);
		}
	});

	$effect(() => {
		if ($availabilityChanged.data) {
			const { deviceId, available } = $availabilityChanged.data.deviceAvailabilityChanged;
			deviceStore.updateAvailability(deviceId, available);
		}
	});

	$effect(() => {
		if ($deviceAdded.data) {
			deviceStore.addDevice($deviceAdded.data.deviceAdded);
		}
	});

	$effect(() => {
		if ($deviceRemoved.data) {
			deviceStore.removeDevice($deviceRemoved.data.deviceRemoved);
		}
	});

	const chipsIndex = $derived(chipsByDevice(rooms, groups));

	function chipsFor(deviceId: string) {
		return chipsIndex.get(deviceId) ?? { roomChips: [], groupChips: [] };
	}

	const pickerDrawerGroups = $derived.by((): DrawerGroup<"room" | "group">[] => {
		if (!pickerDevice) return [];
		const availableRooms = rooms.filter((r) => !r.devices.some((d) => d.id === pickerDevice!.id));
		const availableGroups = groups.filter(
			(g) => !g.members.some((m) => m.memberType === "device" && m.memberId === pickerDevice!.id)
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
		const [r, g] = await Promise.all([
			client.query(ROOMS_QUERY, {}, { requestPolicy: "network-only" }).toPromise(),
			client.query(GROUPS_QUERY, {}, { requestPolicy: "network-only" }).toPromise(),
		]);
		if (r.data) rooms = r.data.rooms;
		if (g.data) groups = g.data.groups;
	}

	function handleAddTo(device: Device) {
		pickerDevice = device;
		addToPickerOpen = true;
	}

	let pendingPicks = 0;

	async function handlePickerSelect(type: "room" | "group", id: string) {
		if (!pickerDevice) return;
		const deviceId = pickerDevice.id;
		pendingPicks++;
		try {
			if (type === "room") {
				await client
					.mutation(ADD_ROOM_DEVICE, { input: { roomId: id, deviceId } })
					.toPromise();
			} else {
				await client
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

	async function handleRename(id: string, newName: string) {
		const result = await client
			.mutation(UPDATE_DEVICE, { id, input: { name: newName } })
			.toPromise();
		if (result.data) {
			deviceStore.updateName(id, result.data.updateDevice.name);
		}
	}

	onMount(() => {
		void refreshMemberships();
	});

	$effect(() => {
		if (!$devicesQuery.fetching) ready = true;
	});
</script>

{#if ready}
	<div in:fly={{ y: -4, duration: 150 }}>

		<div class="mb-6 flex items-stretch gap-2">
			<div class="min-w-0 flex-1">
				<HiveSearchbar
					value={searchState}
					onchange={(v) => (searchState = v)}
					chips={searchChipConfigs}
					placeholder="Search devices..."
				/>
			</div>
			<div
				class="flex shrink-0 items-stretch overflow-hidden transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
				style:max-width={view === "table" && selection.count > 0 ? "32rem" : "0px"}
				style:opacity={view === "table" && selection.count > 0 ? "1" : "0"}
				aria-hidden={!(view === "table" && selection.count > 0)}
			>
				<TableSelectionToolbar count={selection.count} onclear={() => selection.clear()}>
					{#snippet actions()}
						<Button
							variant="secondary"
							size="sm"
							onclick={() => (batchAddOpen = true)}
						>
							Add to…
						</Button>
					{/snippet}
				</TableSelectionToolbar>
			</div>
		</div>

		{#if allDevices.length === 0}
			<div class="rounded-lg shadow-card bg-card p-12 text-center">
				<p class="text-muted-foreground">No devices discovered yet.</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Devices will appear here once the backend connects to your MQTT broker.
				</p>
			</div>
		{:else if filteredDevices.length === 0}
			<div class="rounded-lg shadow-card bg-card p-12 text-center">
				<p class="text-muted-foreground">No devices match your filters.</p>
			</div>
		{:else}
			<ListView mode={view}>
				{#snippet card()}
					<AnimatedGrid>
						{#each filteredDevices as device (device.id)}
							{@const chips = chipsFor(device.id)}
							<DeviceCard
								{device}
								roomChips={chips.roomChips}
								groupChips={chips.groupChips}
								onrename={handleRename}
								onAddTo={handleAddTo}
							/>
						{/each}
					</AnimatedGrid>
				{/snippet}
				{#snippet table()}
					<DeviceTable
						rows={filteredDevices.map((device) => {
							const chips = chipsFor(device.id);
							return { device, roomChips: chips.roomChips, groupChips: chips.groupChips };
						})}
						orderedIds={filteredIds}
						{selection}
						onrename={handleRename}
						onAddTo={handleAddTo}
					/>
				{/snippet}
			</ListView>
		{/if}

		<HiveDrawer
			bind:open={addToPickerOpen}
			title={pickerDevice ? `Add ${pickerDevice.name} to rooms or groups` : "Add to rooms or groups"}
			description="Pick one or more rooms and groups for this device."
			multiple
			groups={pickerDrawerGroups}
			onselect={handlePickerSelect}
		/>

		<DeviceBatchAddDialog
			bind:open={batchAddOpen}
			deviceIds={selection.selectedIds()}
			onadded={() => {
				selection.clear();
			}}
		/>
	</div>
{/if}
