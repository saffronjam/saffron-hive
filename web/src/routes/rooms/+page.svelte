<script lang="ts">
	import { queryStore, getContextClient, gql } from "@urql/svelte";
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
	}

	const client = getContextClient();

	const ROOMS_QUERY = gql`
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
				}
			}
		}
	`;

	const DEVICES_QUERY = gql`
		query Devices {
			devices {
				id
				name
				type
				source
				available
			}
		}
	`;

	interface SimpleGroup {
		id: string;
		name: string;
		members: { memberId: string }[];
	}

	const GROUPS_QUERY = gql`
		query Groups {
			groups {
				id
				name
				members { memberId }
			}
		}
	`;

	const CREATE_ROOM = gql`
		mutation CreateRoom($input: CreateRoomInput!) {
			createRoom(input: $input) {
				id
				name
				devices { id name type source available }
			}
		}
	`;

	const UPDATE_ROOM = gql`
		mutation UpdateRoom($id: ID!, $input: UpdateRoomInput!) {
			updateRoom(id: $id, input: $input) {
				id
				name
				icon
			}
		}
	`;

	const DELETE_ROOM = gql`
		mutation DeleteRoom($id: ID!) {
			deleteRoom(id: $id)
		}
	`;

	const ADD_ROOM_DEVICE = gql`
		mutation AddRoomDevice($input: AddRoomDeviceInput!) {
			addRoomDevice(input: $input) {
				id
				name
				devices { id name type source available }
			}
		}
	`;

	const REMOVE_ROOM_DEVICE = gql`
		mutation RemoveRoomDevice($roomId: ID!, $deviceId: ID!) {
			removeRoomDevice(roomId: $roomId, deviceId: $deviceId) {
				id
				name
				devices { id name type source available }
			}
		}
	`;

	const roomsQuery = queryStore<{ rooms: RoomData[] }>({ client, query: ROOMS_QUERY });
	const devicesQuery = queryStore<{ devices: Device[] }>({ client, query: DEVICES_QUERY });
	const groupsQuery = queryStore<{ groups: SimpleGroup[] }>({ client, query: GROUPS_QUERY });

	const rooms = $derived($roomsQuery.data?.rooms ?? []);
	const devices = $derived($devicesQuery.data?.devices ?? []);
	const allGroups = $derived($groupsQuery.data?.groups ?? []);

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
		<div class="space-y-6">
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
	{:else}
		{#if !$roomsQuery.fetching && rooms.length === 0}
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
		{:else if rooms.length > 0}
			<ListView mode={view}>
				{#snippet card()}
					<AnimatedGrid>
						{#each rooms as room (room.id)}
							<RoomCard
								{room}
								onedit={startEditing}
								ondelete={(r) => (deleteConfirmRoom = r)}
								onrename={handleRename}
								oniconchange={handleIconChange}
							/>
						{/each}
					</AnimatedGrid>
				{/snippet}
				{#snippet table()}
					<RoomTable
						{rooms}
						onedit={startEditing}
						ondelete={(r) => (deleteConfirmRoom = r)}
						onrename={handleRename}
						oniconchange={handleIconChange}
					/>
				{/snippet}
			</ListView>
		{/if}

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
	{/if}
</div>
