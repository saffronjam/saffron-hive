<script lang="ts">
	import { measureMount } from "$lib/perf";
	import { deviceDisplayName } from "$lib/utils";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { groupsStore } from "$lib/stores/groups.svelte";
	import { deviceStore, devicesHydrated, type Device } from "$lib/stores/devices";
	import DeviceCard from "$lib/components/device-card.svelte";
	import DeviceTable from "$lib/components/device-table.svelte";
	import TableSelectionToolbar from "$lib/components/table-selection-toolbar.svelte";
	import { createTableSelection } from "$lib/utils/table-selection.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig, SearchState } from "$lib/components/hive-searchbar";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import SectionDivider from "$lib/components/section-divider.svelte";
	import ListView from "$lib/components/list-view.svelte";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import { chipsByDevice } from "$lib/memberships";
	import { compareDevicesByNewThenName } from "$lib/list-helpers";
	import { DoorOpen, Group as GroupIcon } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { profile, type ListView as ListViewMode } from "$lib/stores/profile.svelte";

	interface Props {
		/**
		 * Whether this is the page the user is on. The component outlives
		 * navigation — the layout keeps it mounted after the first visit so a
		 * return costs no rebuild — so anything that talks to shared surfaces
		 * (the page header) or fires one-shot work must gate on this.
		 */
		visible: boolean;
	}

	let { visible }: Props = $props();

	let view = $state<ListViewMode>(profile.get("view.devices", "card"));

	$effect(() => {
		if (!visible) return;
		pageHeader.breadcrumbs = [{ label: "Devices" }];
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
		{ value: "hub", label: "Hub" },
	];

	const enabledOptions = [
		{ value: "yes", label: "Yes" },
		{ value: "no", label: "No" },
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
		{
			keyword: "enabled",
			label: "Enabled",
			variant: "secondary",
			options: (input) => {
				const q = input.toLowerCase();
				if (!q) return enabledOptions;
				return enabledOptions.filter(
					(o) => o.value.includes(q) || o.label.toLowerCase().includes(q)
				);
			},
		},
	];

	// Devices discovered since the last visit are snapshotted once, when the store
	// first hydrates. Both the New chips and the sort order read this rather than
	// `device.seen`, so neither changes under the cursor when the mutation lands.
	let newDeviceIds = $state<ReadonlySet<string>>(new Set());

	const allDevices = $derived(
		Object.values($deviceStore).sort(compareDevicesByNewThenName(newDeviceIds)),
	);

	const filteredDevices = $derived.by(() => {
		const typeValues = searchState.chips
			.filter((c) => c.keyword === "type")
			.map((c) => c.value);
		const enabledValues = searchState.chips
			.filter((c) => c.keyword === "enabled")
			.map((c) => c.value);
		const query = searchState.freeText.toLowerCase();

		return allDevices.filter((d) => {
			if (typeValues.length > 0 && !typeValues.includes(d.type)) return false;
			if (enabledValues.length > 0 && !enabledValues.includes(d.disabled ? "no" : "yes")) {
				return false;
			}
			if (query) {
				const matches =
					deviceDisplayName(d).toLowerCase().includes(query) ||
					d.type.toLowerCase().includes(query) ||
					d.source.toLowerCase().includes(query);
				if (!matches) return false;
			}
			return true;
		});
	});

	const tableRows = $derived(
		filteredDevices.map((device) => {
			const chips = chipsFor(device.id);
			return { device, roomChips: chips.roomChips, groupChips: chips.groupChips };
		}),
	);

	const newDevices = $derived(filteredDevices.filter((d) => newDeviceIds.has(d.id)));
	const existingDevices = $derived(filteredDevices.filter((d) => !newDeviceIds.has(d.id)));

	const selection = createTableSelection();
	const filteredIds = $derived(filteredDevices.map((d) => d.id));
	$effect(() => {
		selection.pruneTo(filteredIds);
	});

	const UPDATE_DEVICE = graphql(`
		mutation UpdateDevice($id: ID!, $input: UpdateDeviceInput!) {
			updateDevice(id: $id, input: $input) {
				id
				name
				icon
				tags
				disabled
				friendlyName
				seen
			}
		}
	`);

	const MARK_DEVICES_SEEN = graphql(`
		mutation MarkDevicesSeen($ids: [ID!]!) {
			markDevicesSeen(ids: $ids)
		}
	`);

	const client = getContextClient();

	const rooms = $derived(roomsStore.items);
	const groups = $derived(groupsStore.items);

	let addToPickerOpen = $state(false);
	let pickerDevice = $state<Device | null>(null);

	const chipsIndex = $derived(chipsByDevice(rooms, groups));

	function chipsFor(deviceId: string) {
		return chipsIndex.get(deviceId) ?? { roomChips: [], groupChips: [] };
	}

	const pickerDrawerGroups = $derived.by((): DrawerGroup<"room" | "group">[] => {
		if (!pickerDevice) return [];
		const availableRooms = rooms.filter(
			(r) =>
				!r.members.some(
					(m) => m.memberType === "device" && m.memberId === pickerDevice!.id,
				),
		);
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

	function handleAddTo(device: Device) {
		pickerDevice = device;
		addToPickerOpen = true;
	}

	async function handlePickerSelect(type: "room" | "group", id: string) {
		if (!pickerDevice) return;
		const deviceId = pickerDevice.id;
		if (type === "room") {
			await roomsStore.addMember(client, id, "device", deviceId);
		} else {
			await groupsStore.addMember(client, id, "device", deviceId);
		}
	}

	async function handleRename(id: string, newName: string) {
		const result = await client
			.mutation(UPDATE_DEVICE, { id, input: { name: newName } })
			.toPromise();
		if (result.data) {
			deviceStore.updateName(id, result.data.updateDevice.name ?? null);
		}
	}

	async function handleIconChange(id: string, icon: string | null) {
		deviceStore.updateIcon(id, icon);
		const result = await client
			.mutation(UPDATE_DEVICE, { id, input: { icon } })
			.toPromise();
		if (result.data) {
			deviceStore.updateIcon(id, result.data.updateDevice.icon ?? null);
		}
	}

	async function handleToggleEnabled(device: Device) {
		const next = !device.disabled;
		deviceStore.updateDisabled(device.id, next);
		const result = await client
			.mutation(UPDATE_DEVICE, { id: device.id, input: { disabled: next } })
			.toPromise();
		if (result.data) {
			deviceStore.updateDisabled(device.id, result.data.updateDevice.disabled);
		} else {
			deviceStore.updateDisabled(device.id, device.disabled);
		}
	}

	let snapshotTaken = false;

	$effect(() => {
		if (!visible || !$devicesHydrated || snapshotTaken) return;
		snapshotTaken = true;
		const unseen = Object.values($deviceStore)
			.filter((d) => !d.seen)
			.map((d) => d.id);
		if (unseen.length === 0) return;
		newDeviceIds = new Set(unseen);
		void markSeen(unseen);
	});

	async function markSeen(ids: string[]) {
		const result = await client.mutation(MARK_DEVICES_SEEN, { ids }).toPromise();
		if (result.data) deviceStore.markSeen(ids);
	}


	const mountTimer = measureMount("devices", { ready: () => $devicesHydrated, items: () => filteredDevices.length });
	$effect(() => mountTimer.tick());
</script>

	{#snippet deviceCard(device: Device)}
		{@const chips = chipsFor(device.id)}
		<DeviceCard
			{device}
			roomChips={chips.roomChips}
			groupChips={chips.groupChips}
			onrename={handleRename}
			oniconchange={handleIconChange}
			onAddTo={handleAddTo}
			ontoggleenabled={handleToggleEnabled}
			isNew={newDeviceIds.has(device.id)}
		/>
	{/snippet}

{#if $devicesHydrated}
	<div>

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
					{#snippet actions()}{/snippet}
				</TableSelectionToolbar>
			</div>
		</div>

		{#if allDevices.length === 0}
			<div class="rounded-lg shadow-card bg-card p-12 text-center">
				<p class="text-muted-foreground">No devices discovered yet.</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Devices appear here once an integration is connected.
				</p>
			</div>
		{:else if filteredDevices.length === 0}
			<div class="rounded-lg shadow-card bg-card p-12 text-center">
				<p class="text-muted-foreground">No devices match your filters.</p>
			</div>
		{:else}
			<ListView mode={view}>
				{#snippet card()}
					<!-- Sections only earn their headings when there is something to divide. -->
					{#if newDevices.length > 0}
						<SectionDivider label="New devices" class="mb-3" />
						<AnimatedGrid>
							{#each newDevices as device (device.id)}
								{@render deviceCard(device)}
							{/each}
						</AnimatedGrid>
						{#if existingDevices.length > 0}
							<SectionDivider class="mt-6 mb-3" />
							<AnimatedGrid>
								{#each existingDevices as device (device.id)}
									{@render deviceCard(device)}
								{/each}
							</AnimatedGrid>
						{/if}
					{:else}
						<AnimatedGrid>
							{#each filteredDevices as device (device.id)}
								{@render deviceCard(device)}
							{/each}
						</AnimatedGrid>
					{/if}
				{/snippet}
				{#snippet table()}
					<DeviceTable
						rows={tableRows}
						{selection}
						onrename={handleRename}
						oniconchange={handleIconChange}
						onAddTo={handleAddTo}
						ontoggleenabled={handleToggleEnabled}
						{newDeviceIds}
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

	</div>
{/if}
