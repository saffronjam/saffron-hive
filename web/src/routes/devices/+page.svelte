<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { createGraphQLClient } from "$lib/graphql/client";
	import {
		deviceStore,
		type Device,
		type LightState,
		type SensorState,
		type SwitchState,
	} from "$lib/stores/devices";
	import DeviceCard from "$lib/components/device-card.svelte";
	import DeviceFilters from "$lib/components/device-filters.svelte";
	import { gql } from "@urql/svelte";

	type DeviceState = LightState | SensorState | SwitchState;

	let search = $state("");
	let typeFilter = $state("all");
	let availabilityFilter = $state("all");

	const allDevices = $derived(Object.values($deviceStore));

	const filteredDevices = $derived.by(() => {
		let result = allDevices;

		if (search.length > 0) {
			const query = search.toLowerCase();
			result = result.filter(
				(d) =>
					d.name.toLowerCase().includes(query) ||
					d.type.toLowerCase().includes(query) ||
					d.source.toLowerCase().includes(query)
			);
		}

		if (typeFilter !== "all") {
			result = result.filter((d) => d.type === typeFilter);
		}

		if (availabilityFilter === "online") {
			result = result.filter((d) => d.available);
		} else if (availabilityFilter === "offline") {
			result = result.filter((d) => !d.available);
		}

		return result;
	});

	const DEVICES_QUERY = gql`
		query Devices {
			devices {
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

	const DEVICE_STATE_CHANGED = gql`
		subscription DeviceStateChanged {
			deviceStateChanged {
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

	const DEVICE_ADDED = gql`
		subscription DeviceAdded {
			deviceAdded {
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

	const DEVICE_REMOVED = gql`
		subscription DeviceRemoved {
			deviceRemoved
		}
	`;

	interface DevicesQueryResult {
		devices: Device[];
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

	interface DeviceAddedResult {
		deviceAdded: Device;
	}

	interface DeviceRemovedResult {
		deviceRemoved: string;
	}

	let unsubscribers: (() => void)[] = [];

	onMount(() => {
		const client = createGraphQLClient();

		client
			.query<DevicesQueryResult>(DEVICES_QUERY, {})
			.toPromise()
			.then((result) => {
				if (result.data) {
					deviceStore.hydrate(result.data.devices);
				}
			});

		const { unsubscribe: unsubState } = client
			.subscription<DeviceStateChangedResult>(DEVICE_STATE_CHANGED, {})
			.subscribe((result) => {
				if (result.data) {
					const { deviceId, state } = result.data.deviceStateChanged;
					deviceStore.updateState(deviceId, state);
				}
			});
		unsubscribers.push(unsubState);

		const { unsubscribe: unsubAvail } = client
			.subscription<DeviceAvailabilityChangedResult>(DEVICE_AVAILABILITY_CHANGED, {})
			.subscribe((result) => {
				if (result.data) {
					const { deviceId, available } = result.data.deviceAvailabilityChanged;
					deviceStore.updateAvailability(deviceId, available);
				}
			});
		unsubscribers.push(unsubAvail);

		const { unsubscribe: unsubAdded } = client
			.subscription<DeviceAddedResult>(DEVICE_ADDED, {})
			.subscribe((result) => {
				if (result.data) {
					deviceStore.addDevice(result.data.deviceAdded);
				}
			});
		unsubscribers.push(unsubAdded);

		const { unsubscribe: unsubRemoved } = client
			.subscription<DeviceRemovedResult>(DEVICE_REMOVED, {})
			.subscribe((result) => {
				if (result.data) {
					deviceStore.removeDevice(result.data.deviceRemoved);
				}
			});
		unsubscribers.push(unsubRemoved);
	});

	onDestroy(() => {
		for (const unsub of unsubscribers) {
			unsub();
		}
	});
</script>

<div>
	<h1 class="mb-6 text-2xl font-semibold">Devices</h1>

	<div class="mb-6">
		<DeviceFilters
			{search}
			{typeFilter}
			{availabilityFilter}
			onsearchchange={(v) => (search = v)}
			ontypechange={(v) => (typeFilter = v)}
			onavailabilitychange={(v) => (availabilityFilter = v)}
		/>
	</div>

	{#if allDevices.length === 0}
		<div class="rounded-lg border border-border bg-card p-12 text-center">
			<p class="text-muted-foreground">No devices discovered yet.</p>
			<p class="mt-2 text-sm text-muted-foreground">
				Devices will appear here once the backend connects to your MQTT broker.
			</p>
		</div>
	{:else if filteredDevices.length === 0}
		<div class="rounded-lg border border-border bg-card p-12 text-center">
			<p class="text-muted-foreground">No devices match your filters.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredDevices as device (device.id)}
				<DeviceCard {device} />
			{/each}
		</div>
	{/if}
</div>
