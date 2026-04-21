<script lang="ts">
	import { queryStore, getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import MemberTable from "$lib/components/member-table.svelte";
	import RoomCard from "$lib/components/room-card.svelte";
	import RoomTable from "$lib/components/room-table.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig, SearchState } from "$lib/components/hive-searchbar";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import ListView from "$lib/components/list-view.svelte";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import { profile, type ListView as ListViewMode } from "$lib/stores/profile.svelte";
	import {
		Plus,
		X,
		DoorOpen,
	} from "@lucide/svelte";
	import { onDestroy } from "svelte";
	import { fly } from "svelte/transition";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import type { Device } from "$lib/stores/devices";
	import { deviceIcon } from "$lib/utils";
	import { ErrorBanner } from "$lib/stores/error-banner.svelte";

	interface RoomData {
		id: string;
		name: string;
		icon?: string | null;
		devices: Device[];
		createdBy?: { id: string; username: string; name: string } | null;
	}

	const client = getContextClient();

	const ROOMS_QUERY = graphql(`
		query Rooms {
			rooms {
				id
				name
				icon
				devices {
					id
					name
					type
					source
					available
					lastSeen
					capabilities { name type values valueMin valueMax unit access }
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
				createdBy {
					id
					username
					name
				}
			}
		}
	`);

	const DEVICES_QUERY = graphql(`
		query RoomsPageDevices {
			devices {
				id
				name
				type
				source
				available
			}
		}
	`);

	interface SimpleGroup {
		id: string;
		name: string;
		members: { memberId: string }[];
	}

	const GROUPS_QUERY = graphql(`
		query RoomsPageGroups {
			groups {
				id
				name
				members { memberId }
			}
		}
	`);

	const CREATE_ROOM = graphql(`
		mutation CreateRoom($input: CreateRoomInput!) {
			createRoom(input: $input) {
				id
				name
				devices {
					id
					name
					type
					source
					available
					lastSeen
					capabilities { name type values valueMin valueMax unit access }
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
				createdBy {
					id
					username
					name
				}
			}
		}
	`);

	const UPDATE_ROOM = graphql(`
		mutation UpdateRoom($id: ID!, $input: UpdateRoomInput!) {
			updateRoom(id: $id, input: $input) {
				id
				name
				icon
			}
		}
	`);

	const DELETE_ROOM = graphql(`
		mutation DeleteRoom($id: ID!) {
			deleteRoom(id: $id)
		}
	`);

	const ADD_ROOM_DEVICE = graphql(`
		mutation AddRoomDevice($input: AddRoomDeviceInput!) {
			addRoomDevice(input: $input) {
				id
				name
				devices { id name type source available }
			}
		}
	`);

	const REMOVE_ROOM_DEVICE = graphql(`
		mutation RemoveRoomDevice($roomId: ID!, $deviceId: ID!) {
			removeRoomDevice(roomId: $roomId, deviceId: $deviceId) {
				id
				name
				devices { id name type source available }
			}
		}
	`);

	const roomsQuery = queryStore<{ rooms: RoomData[] }>({ client, query: ROOMS_QUERY });
	const devicesQuery = queryStore<{ devices: Device[] }>({ client, query: DEVICES_QUERY });
	const groupsQuery = queryStore<{ groups: SimpleGroup[] }>({ client, query: GROUPS_QUERY });

	const rooms = $derived($roomsQuery.data?.rooms ?? []);
	const devices = $derived($devicesQuery.data?.devices ?? []);
	const allGroups = $derived($groupsQuery.data?.groups ?? []);

	let hasLoadedOnce = $state(false);
	$effect(() => {
		if (!$roomsQuery.fetching && !hasLoadedOnce) {
			hasLoadedOnce = true;
		}
	});

	let searchState = $state<SearchState>({ chips: [], freeText: "" });

	const deviceTypeOptions = [
		{ value: "light", label: "Light" },
		{ value: "sensor", label: "Sensor" },
		{ value: "switch", label: "Switch" },
	];

	const emptyOptions = [
		{ value: "yes", label: "Yes" },
		{ value: "no", label: "No" },
	];

	const searchChipConfigs: ChipConfig[] = $derived([
		{
			keyword: "type",
			label: "Type",
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return q
					? deviceTypeOptions.filter(
							(o) => o.value.includes(q) || o.label.toLowerCase().includes(q),
						)
					: deviceTypeOptions;
			},
		},
		{
			keyword: "device",
			label: "Device",
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return devices
					.filter((d) => !q || d.name.toLowerCase().includes(q))
					.map((d) => ({ value: d.name, label: d.name }));
			},
		},
		{
			keyword: "empty",
			label: "Empty",
			variant: "secondary",
			options: () => emptyOptions,
		},
	]);

	const filteredRooms = $derived.by(() => {
		const typeValues = searchState.chips.filter((c) => c.keyword === "type").map((c) => c.value);
		const deviceValues = searchState.chips
			.filter((c) => c.keyword === "device")
			.map((c) => c.value.toLowerCase());
		const emptyValues = searchState.chips.filter((c) => c.keyword === "empty").map((c) => c.value);
		const query = searchState.freeText.toLowerCase();

		return rooms.filter((r) => {
			if (typeValues.length > 0 && !r.devices.some((d) => typeValues.includes(d.type))) return false;
			if (
				deviceValues.length > 0 &&
				!deviceValues.some((v) => r.devices.some((d) => d.name.toLowerCase().includes(v)))
			)
				return false;
			if (emptyValues.length > 0) {
				const isEmpty = r.devices.length === 0;
				const wants = emptyValues.some((v) => (v === "yes" ? isEmpty : !isEmpty));
				if (!wants) return false;
			}
			if (query && !r.name.toLowerCase().includes(query)) return false;
			return true;
		});
	});

	let createDialogOpen = $state(false);
	let newRoomName = $state("");
	let createLoading = $state(false);

	let editingRoom = $state<RoomData | null>(null);
	let editName = $state("");
	let editNameDirty = $state(false);
	let editIcon = $state<string | null>(null);
	let editIconDirty = $state(false);
	let editLoading = $state(false);

	let pendingDeviceAdds = $state<Device[]>([]);
	let pendingDeviceRemovals = $state<Set<string>>(new Set());

	let deleteConfirmRoom = $state<RoomData | null>(null);
	let deleteLoading = $state(false);

	let pickerOpen = $state(false);

	let quickAddRoom = $state<RoomData | null>(null);
	let quickAddOpen = $state(false);
	let quickAddPending = 0;

	const quickAddDrawerGroups = $derived.by((): DrawerGroup<"device">[] => {
		if (!quickAddRoom) return [];
		const roomDeviceIds = new Set(quickAddRoom.devices.map((d) => d.id));
		const available = devices.filter((d) => !roomDeviceIds.has(d.id));
		if (available.length === 0) return [];
		return [
			{
				heading: "Devices",
				items: available.map((d) => ({
					type: "device" as const,
					id: d.id,
					name: d.name,
					icon: deviceIcon(d.type),
					searchValue: `${d.name} ${d.type}`,
				})),
			},
		];
	});

	function handleAddToRoom(room: RoomData) {
		quickAddRoom = room;
		quickAddOpen = true;
	}

	async function handleQuickAddSelect(_type: "device", deviceId: string) {
		if (!quickAddRoom) return;
		const roomId = quickAddRoom.id;
		quickAddPending++;
		try {
			const result = await client
				.mutation(ADD_ROOM_DEVICE, { input: { roomId, deviceId } })
				.toPromise();
			if (result.error) {
				errors.setWithAutoDismiss(result.error.message);
			}
		} finally {
			quickAddPending--;
			if (quickAddPending === 0) {
				roomsQuery.reexecute({ requestPolicy: "network-only" });
			}
		}
	}

	const errors = new ErrorBanner();

	let view = $state<ListViewMode>(profile.get("view.rooms", "card"));

	onDestroy(() => pageHeader.reset());

	const editingRoomFresh = $derived(
		editingRoom ? rooms.find((r) => r.id === editingRoom?.id) ?? editingRoom : null
	);

	const effectiveDevices = $derived.by((): Device[] => {
		if (!editingRoomFresh) return [];
		const serverDevices = editingRoomFresh.devices.filter(
			(d) => !pendingDeviceRemovals.has(d.id)
		);
		return [...serverDevices, ...pendingDeviceAdds];
	});

	const hasPendingChanges = $derived(
		editNameDirty || editIconDirty || pendingDeviceAdds.length > 0 || pendingDeviceRemovals.size > 0
	);

	const urlEditId = $derived(page.url.searchParams.get("edit"));

	$effect(() => {
		if (editingRoomFresh) {
			pageHeader.breadcrumbs = [{ label: "Rooms", onclick: stopEditing }, { label: editingRoomFresh.name }];
			pageHeader.actions = [
				{ label: "Cancel", variant: "outline" as const, onclick: stopEditing },
				{ label: "Save", saving: editLoading, onclick: handleSaveRoom, disabled: !hasPendingChanges || editLoading },
			];
			pageHeader.viewToggle = null;
		} else if (urlEditId) {
			pageHeader.breadcrumbs = [{ label: "Rooms", onclick: stopEditing }, { label: "…" }];
			pageHeader.actions = [];
			pageHeader.viewToggle = null;
		} else {
			pageHeader.breadcrumbs = [{ label: "Rooms" }];
			pageHeader.actions = [{ label: "Create Room", icon: Plus, onclick: () => (createDialogOpen = true) }];
			pageHeader.viewToggle = {
				value: view,
				onchange: (v) => {
					view = v;
					profile.set("view.rooms", v);
				},
			};
		}
	});

	const effectiveDeviceIds = $derived(
		new Set(effectiveDevices.map((d) => d.id))
	);

	const availableDevices = $derived(devices.filter((d) => !effectiveDeviceIds.has(d.id)));

	const pickerDrawerGroups = $derived.by((): DrawerGroup<"device">[] => {
		if (availableDevices.length === 0) return [];
		return [{ heading: "Devices", items: availableDevices.map((d) => ({
			type: "device" as const, id: d.id, name: d.name,
			icon: deviceIcon(d.type), searchValue: `${d.name} ${d.type}`,
		}))}];
	});

	const deviceRows = $derived(
		effectiveDevices.map((d) => {
			const related = allGroups
				.filter((g) => g.members.some((m) => m.memberId === d.id))
				.map((g) => ({ id: g.id, name: g.name, href: `/groups?edit=${g.id}` }));
			return {
				id: d.id,
				name: d.name,
				type: d.type,
				related,
				onclick: () => goto(`/devices/${d.id}`),
			};
		})
	);

	async function handleCreateRoom() {
		if (!newRoomName.trim()) return;
		createLoading = true;
		errors.clear();

		const result = await client
			.mutation(CREATE_ROOM, { input: { name: newRoomName.trim() } })
			.toPromise();

		createLoading = false;
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		const created = result.data?.createRoom;
		newRoomName = "";
		createDialogOpen = false;
		roomsQuery.reexecute({ requestPolicy: "network-only" });
		if (created) {
			startEditing(created);
		}
	}

	function startEditing(room: RoomData) {
		goto(`/rooms?edit=${encodeURIComponent(room.id)}`, { keepFocus: true, noScroll: true });
	}

	function stopEditing() {
		goto("/rooms", { keepFocus: true, noScroll: true });
	}

	// Sync editing state from URL. When the ?edit=<id> query param changes
	// (or the user clicks the sidebar "Rooms" link to clear it), update
	// the local editing state.
	$effect(() => {
		const id = page.url.searchParams.get("edit");
		if (!id) {
			if (editingRoom !== null) {
				editingRoom = null;
				editNameDirty = false;
				editIconDirty = false;
				pendingDeviceAdds = [];
				pendingDeviceRemovals = new Set();
			}
			return;
		}
		if (editingRoom?.id === id) return;
		const match = rooms.find((r) => r.id === id);
		if (match) {
			editingRoom = match;
			editName = match.name;
			editIcon = match.icon ?? null;
			editNameDirty = false;
			editIconDirty = false;
			pendingDeviceAdds = [];
			pendingDeviceRemovals = new Set();
		}
	});

	async function handleSaveRoom() {
		if (!editingRoom) return;
		editLoading = true;
		errors.clear();

		const nameDirty = editName.trim() && editName.trim() !== editingRoom.name;
		if (nameDirty || editIconDirty) {
			const input: { name?: string; icon?: string | null } = {};
			if (nameDirty) input.name = editName.trim();
			if (editIconDirty) input.icon = editIcon;
			const result = await client
				.mutation(UPDATE_ROOM, { id: editingRoom.id, input })
				.toPromise();
			if (result.error) {
				editLoading = false;
				errors.setWithAutoDismiss(result.error.message);
				return;
			}
		}

		for (const deviceId of pendingDeviceRemovals) {
			const result = await client
				.mutation(REMOVE_ROOM_DEVICE, { roomId: editingRoom.id, deviceId })
				.toPromise();
			if (result.error) {
				editLoading = false;
				errors.setWithAutoDismiss(result.error.message);
				return;
			}
		}

		for (const dev of pendingDeviceAdds) {
			const result = await client
				.mutation(ADD_ROOM_DEVICE, { input: { roomId: editingRoom.id, deviceId: dev.id } })
				.toPromise();
			if (result.error) {
				editLoading = false;
				errors.setWithAutoDismiss(result.error.message);
				return;
			}
		}

		editLoading = false;
		editNameDirty = false;
		editIconDirty = false;
		pendingDeviceAdds = [];
		pendingDeviceRemovals = new Set();
		roomsQuery.reexecute({ requestPolicy: "network-only" });
	}

	async function handleDeleteRoom() {
		if (!deleteConfirmRoom) return;
		deleteLoading = true;
		errors.clear();

		const result = await client
			.mutation(DELETE_ROOM, { id: deleteConfirmRoom.id })
			.toPromise();

		deleteLoading = false;
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		if (editingRoom?.id === deleteConfirmRoom.id) {
			stopEditing();
		}
		deleteConfirmRoom = null;
		roomsQuery.reexecute({ requestPolicy: "network-only" });
	}

	function handleAddDevice(deviceId: string) {
		const dev = devices.find((d) => d.id === deviceId);
		if (!dev) return;
		pendingDeviceAdds = [...pendingDeviceAdds, dev];
		pickerOpen = false;
	}

	function handleRemoveDevice(deviceId: string) {
		const pendingIdx = pendingDeviceAdds.findIndex((d) => d.id === deviceId);
		if (pendingIdx >= 0) {
			pendingDeviceAdds = pendingDeviceAdds.filter((_, i) => i !== pendingIdx);
		} else {
			pendingDeviceRemovals = new Set([...pendingDeviceRemovals, deviceId]);
		}
	}

	async function handleRename(room: RoomData, newName: string) {
		errors.clear();

		const result = await client
			.mutation(UPDATE_ROOM, { id: room.id, input: { name: newName } })
			.toPromise();

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		roomsQuery.reexecute({ requestPolicy: "network-only" });
	}

	async function handleIconChange(room: RoomData, icon: string | null) {
		errors.clear();
		const result = await client
			.mutation(UPDATE_ROOM, { id: room.id, input: { icon } })
			.toPromise();
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}
		roomsQuery.reexecute({ requestPolicy: "network-only" });
	}

</script>

<UnsavedGuard dirty={editNameDirty || editIconDirty} />

<div>
	{#if errors.message}
		<div
			class="mb-4 flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		>
			<span>{errors.message}</span>
			<button type="button" onclick={() => errors.clear()} class="ml-2 shrink-0">
				<X class="size-4" />
			</button>
		</div>
	{/if}

	{#if editingRoomFresh}
		<div class="space-y-6" in:fly={{ y: -4, duration: 150 }}>
			<div class="rounded-lg shadow-card bg-card p-4">
				<label class="mb-2 block text-sm font-medium text-foreground" for="room-name">
					Room Name
				</label>
				<div class="flex items-center gap-3">
					<IconPicker
						value={editIcon}
						onselect={(icon) => {
							editIcon = icon;
							editIconDirty = true;
						}}
					>
						<button type="button" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted cursor-pointer hover:bg-muted/80 transition-colors" aria-label="Change icon">
							<AnimatedIcon icon={editIcon} class="size-5 text-muted-foreground">
								{#snippet fallback()}<DoorOpen class="size-5 text-muted-foreground" />{/snippet}
							</AnimatedIcon>
						</button>
					</IconPicker>
					<Input
						id="room-name"
						bind:value={editName}
						oninput={() => (editNameDirty = true)}
						placeholder="Room name"
					/>
				</div>
			</div>

			<div class="rounded-lg shadow-card bg-card p-4">
				<MemberTable
					rows={deviceRows}
					relatedLabel="Groups"
					emptyMessage="No devices yet. Add devices to this room."
					addLabel="Add device"
					onadd={() => (pickerOpen = true)}
					onremove={handleRemoveDevice}
					disabled={editLoading}
				/>
			</div>
		</div>

		<HiveDrawer
			bind:open={pickerOpen}
			title="Add Device"
			description="Search for devices to add to this room."
			multiple
			groups={pickerDrawerGroups}
			onselect={(_type, id) => handleAddDevice(id)}
		/>
	{:else if hasLoadedOnce}
		<div in:fly={{ y: -4, duration: 150 }}>
			{#if rooms.length === 0}
				<div class="rounded-lg shadow-card bg-card p-12 text-center">
					<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<DoorOpen class="size-6 text-muted-foreground" />
					</div>
					<p class="text-muted-foreground">No rooms yet.</p>
					<p class="mt-2 text-sm text-muted-foreground">
						Create a room to organize your devices by location.
					</p>
					<Button class="mt-4" onclick={() => (createDialogOpen = true)}>
						<Plus class="size-4" />
						<span>Create your first room</span>
					</Button>
				</div>
			{:else}
				<div class="mb-6">
					<HiveSearchbar
						value={searchState}
						onchange={(v) => (searchState = v)}
						chips={searchChipConfigs}
						placeholder="Search rooms..."
					/>
				</div>

				{#if filteredRooms.length === 0}
					<div class="rounded-lg shadow-card bg-card p-12 text-center">
						<p class="text-muted-foreground">No rooms match your filters.</p>
					</div>
				{:else}
					<ListView mode={view}>
						{#snippet card()}
							<AnimatedGrid>
								{#each filteredRooms as room (room.id)}
									<RoomCard
										{room}
										onedit={startEditing}
										ondelete={(r) => (deleteConfirmRoom = r)}
										onrename={handleRename}
										oniconchange={handleIconChange}
										onAddTo={handleAddToRoom}
									/>
								{/each}
							</AnimatedGrid>
						{/snippet}
						{#snippet table()}
							<RoomTable
								rooms={filteredRooms}
								onedit={startEditing}
								ondelete={(r) => (deleteConfirmRoom = r)}
								onrename={handleRename}
								oniconchange={handleIconChange}
								onAddTo={handleAddToRoom}
							/>
						{/snippet}
					</ListView>
				{/if}
			{/if}
		</div>

		<Dialog bind:open={createDialogOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Room</DialogTitle>
					<DialogDescription>Give your new room a name. You can add devices after.</DialogDescription>
				</DialogHeader>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleCreateRoom();
					}}
				>
					<Input bind:value={newRoomName} placeholder="Room name" autofocus />
					<DialogFooter class="mt-4">
						<Button
							variant="outline"
							type="button"
							onclick={() => {
								createDialogOpen = false;
								newRoomName = "";
							}}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!newRoomName.trim() || createLoading}>
							{createLoading ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>

		<Dialog bind:open={() => deleteConfirmRoom !== null, (v) => { if (!v) deleteConfirmRoom = null; }}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Room</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete "{deleteConfirmRoom?.name}"? This action cannot be
						undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onclick={() => (deleteConfirmRoom = null)}>
						Cancel
					</Button>
					<Button variant="destructive" onclick={handleDeleteRoom} disabled={deleteLoading}>
						{deleteLoading ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<HiveDrawer
			bind:open={quickAddOpen}
			title={quickAddRoom ? `Add devices to ${quickAddRoom.name}` : "Add devices"}
			description="Pick one or more devices to add to this room."
			multiple
			groups={quickAddDrawerGroups}
			onselect={handleQuickAddSelect}
		/>
	{/if}
</div>
