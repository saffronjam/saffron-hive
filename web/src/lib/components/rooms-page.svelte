<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import { measureMount } from "$lib/perf";
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
	import DeviceCollectionCard from "$lib/components/device-collection-card.svelte";
	import RoomTable from "$lib/components/room-table.svelte";
	import TableSelectionToolbar from "$lib/components/table-selection-toolbar.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import { createTableSelection } from "$lib/utils/table-selection.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig } from "$lib/components/hive-searchbar";
	import { createUrlSearchState } from "$lib/search-state.svelte";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import ListView from "$lib/components/list-view.svelte";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import IconPickerTrigger from "$lib/components/icon-picker-trigger.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import { profile, type ListView as ListViewMode } from "$lib/stores/profile.svelte";
	import {
		Plus,
		DoorOpen,
		X,
		Group as GroupIcon,
	} from "@lucide/svelte";
	import { fly } from "svelte/transition";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { deviceStore, isLightControlDevice, isRuntimeEnabledDevice, type Device } from "$lib/stores/devices";
	import { roomsStore, type Room } from "$lib/stores/rooms.svelte";
	import { groupsStore } from "$lib/stores/groups.svelte";
	import { deviceIcon, deviceDisplayName, groupDisplayName } from "$lib/utils";
	import { rgbToXy } from "$lib/color";
	import { BannerError } from "$lib/stores/banner-error.svelte";
	import { graphqlErrorMessage } from "$lib/graphql-error";

	interface Props {
		/**
		 * Whether this is the page the user is on. The component outlives
		 * navigation — the layout keeps it mounted after the first visit — so
		 * shared surfaces (the page header) and timers gate on this.
		 */
		visible: boolean;
	}

	let { visible }: Props = $props();

	const client = getContextClient();

	const SET_DEVICE_STATE = graphql(`
		mutation RoomsPageSetDeviceState($targetId: ID!, $state: DeviceStateInput!) {
			setTargetState(target: { type: ROOM, id: $targetId }, state: $state)
		}
	`);

	const rooms = $derived(roomsStore.items);
	// Runtime-disabled devices leave this page entirely: no member row, no picker
	// entry, no contribution to a room's readings or command fan-out.
	const devices = $derived(Object.values($deviceStore).filter(isRuntimeEnabledDevice));
	const disabledDeviceIds = $derived(
		new Set(
			Object.values($deviceStore)
				.filter((d) => !isRuntimeEnabledDevice(d))
				.map((d) => d.id),
		),
	);
	const allGroups = $derived(groupsStore.items);
	const deviceById = $derived(new Map(devices.map((d) => [d.id, d])));

	function roomDevices(room: Room): Device[] {
		const out: Device[] = [];
		for (const rd of room.resolvedDevices) {
			const d = deviceById.get(rd.id);
			if (d) out.push(d);
		}
		return out;
	}

	async function commitRoomBrightness(room: Room, brightness: number) {
		const lights = roomDevices(room).filter((d) => d.type === "light" && d.state?.brightness != null);
		if (lights.length === 0) return;
		const input: { on?: true; brightness: number } = { brightness };
		if (lights.some((d) => !d.state?.on)) input.on = true;
		await client.mutation(SET_DEVICE_STATE, { targetId: room.id, state: input }).toPromise();
	}

	async function commitRoomToggle(room: Room, on: boolean) {
		const targets = roomDevices(room).filter(isLightControlDevice);
		if (targets.length === 0) return;
		await client.mutation(SET_DEVICE_STATE, { targetId: room.id, state: { on } }).toPromise();
	}

	async function commitRoomColor(room: Room, color: { r: number; g: number; b: number }) {
		const targets = roomDevices(room).filter((d) =>
			d.capabilities.some((c) => c.name === "color"),
		);
		if (targets.length === 0) return;
		const xy = rgbToXy(color.r, color.g, color.b);
		const input: { on?: true; color: { r: number; g: number; b: number; x: number; y: number } } = {
			color: { ...color, x: xy.x, y: xy.y },
		};
		if (targets.some((d) => !d.state?.on)) input.on = true;
		await client.mutation(SET_DEVICE_STATE, { targetId: room.id, state: input }).toPromise();
	}

	async function commitRoomTemp(room: Room, mired: number) {
		const targets = roomDevices(room).filter((d) =>
			d.capabilities.some((c) => c.name === "color_temp"),
		);
		if (targets.length === 0) return;
		const input: { on?: true; colorTemp: number } = { colorTemp: mired };
		if (targets.some((d) => !d.state?.on)) input.on = true;
		await client.mutation(SET_DEVICE_STATE, { targetId: room.id, state: input }).toPromise();
	}

	const searchController = createUrlSearchState({
		active: () => visible && page.url.pathname === "/rooms",
	});

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
					.filter((d) => !q || deviceDisplayName(d).toLowerCase().includes(q))
					.map((d) => ({ value: deviceDisplayName(d), label: deviceDisplayName(d) }));
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
		const typeValues = searchController.value.chips.filter((c) => c.keyword === "type").map((c) => c.value);
		const deviceValues = searchController.value.chips
			.filter((c) => c.keyword === "device")
			.map((c) => c.value.toLowerCase());
		const emptyValues = searchController.value.chips.filter((c) => c.keyword === "empty").map((c) => c.value);
		const query = searchController.value.freeText.toLowerCase();

		return rooms.filter((r) => {
			const ds = r.resolvedDevices
				.map((rd) => deviceById.get(rd.id))
				.filter((d): d is Device => !!d);
			if (typeValues.length > 0 && !ds.some((d) => typeValues.includes(d.type))) {
				return false;
			}
			if (
				deviceValues.length > 0 &&
				!deviceValues.some((v) => ds.some((d) => deviceDisplayName(d).toLowerCase().includes(v)))
			)
				return false;
			if (emptyValues.length > 0) {
				const isEmpty = r.resolvedDevices.length === 0;
				const wants = emptyValues.some((v) => (v === "yes" ? isEmpty : !isEmpty));
				if (!wants) return false;
			}
			if (query && !r.name.toLowerCase().includes(query)) return false;
			return true;
		});
	});

	const filteredIds = $derived(filteredRooms.map((r) => r.id));
	$effect(() => {
		selection.pruneTo(filteredIds);
	});

	let createDialogOpen = $state(false);
	let newRoomName = $state("");
	let createLoading = $state(false);
	let newRoomNameInput = $state<HTMLInputElement | null>(null);

	let editingRoom = $state<Room | null>(null);
	let editName = $state("");
	let editNameDirty = $state(false);
	let editIcon = $state<string | null>(null);
	let editIconDirty = $state(false);
	let editLoading = $state(false);

	type PendingMember =
		| { kind: "device"; device: Device }
		| { kind: "group"; group: { id: string; name: string; icon?: string | null } };

	let pendingMemberAdds = $state<PendingMember[]>([]);
	// Set of membership IDs (server-side `RoomMember.id`) marked for removal
	// during the current edit session.
	let pendingMemberRemovals = $state<Set<string>>(new Set());

	let deleteConfirmRoom = $state<Room | null>(null);
	let deleteLoading = $state(false);

	const selection = createTableSelection();
	let batchDeleteConfirm = $state(false);
	let batchDeleteLoading = $state(false);

	let pickerOpen = $state(false);

	let quickAddRoom = $state<Room | null>(null);
	let quickAddOpen = $state(false);

	const quickAddDrawerGroups = $derived.by((): DrawerGroup<"device" | "group">[] => {
		if (!quickAddRoom) return [];
		const memberIds = new Set(quickAddRoom.members.map((m) => m.memberId));
		const devAvail = devices.filter((d) => !memberIds.has(d.id));
		const grpAvail = allGroups.filter((g) => !memberIds.has(g.id));
		const result: DrawerGroup<"device" | "group">[] = [];
		if (devAvail.length > 0) {
			result.push({
				heading: "Devices",
				items: devAvail.map((d) => ({
					type: "device" as const,
					id: d.id,
					name: deviceDisplayName(d),
					icon: deviceIcon(d.type, d.roles.contact),
					iconRef: d.icon ?? null,
					searchValue: `${deviceDisplayName(d)} ${d.type}`,
				})),
			});
		}
		if (grpAvail.length > 0) {
			result.push({
				heading: "Groups",
				items: grpAvail.map((g) => ({
					type: "group" as const,
					id: g.id,
					name: groupDisplayName(g),
					icon: GroupIcon,
					badge: `${g.members.length} member${g.members.length === 1 ? "" : "s"}`,
				})),
			});
		}
		return result;
	});

	function handleAddToRoom(room: Room) {
		quickAddRoom = room;
		quickAddOpen = true;
	}

	async function handleQuickAddSelect(memberType: "device" | "group", memberId: string) {
		if (!quickAddRoom) return;
		const roomId = quickAddRoom.id;
		try {
			await roomsStore.addMember(client, roomId, memberType, memberId);
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not add the member."));
		}
	}

	const errors = new BannerError();

	let view = $state<ListViewMode>(profile.get("view.rooms", "card"));


	type EffectiveMember =
		| { rowKey: string; kind: "device"; deviceId: string; pending: boolean; memberId?: string }
		| { rowKey: string; kind: "group"; groupId: string; pending: boolean; memberId?: string };

	const effectiveMembers = $derived.by((): EffectiveMember[] => {
		if (!editingRoom) return [];
		const out: EffectiveMember[] = [];
		for (const m of editingRoom.members) {
			if (pendingMemberRemovals.has(m.id)) continue;
			if (m.memberType === "device") {
				out.push({
					rowKey: `member:${m.id}`,
					kind: "device",
					deviceId: m.memberId,
					memberId: m.id,
					pending: false,
				});
			} else if (m.memberType === "group") {
				out.push({
					rowKey: `member:${m.id}`,
					kind: "group",
					groupId: m.memberId,
					memberId: m.id,
					pending: false,
				});
			}
		}
		for (let i = 0; i < pendingMemberAdds.length; i++) {
			const a = pendingMemberAdds[i];
			if (a.kind === "device") {
				out.push({
					rowKey: `pending:${i}:${a.device.id}`,
					kind: "device",
					deviceId: a.device.id,
					pending: true,
				});
			} else {
				out.push({
					rowKey: `pending:${i}:${a.group.id}`,
					kind: "group",
					groupId: a.group.id,
					pending: true,
				});
			}
		}
		return out;
	});

	const hasPendingChanges = $derived(
		editNameDirty || editIconDirty || pendingMemberAdds.length > 0 || pendingMemberRemovals.size > 0
	);

	const urlEditId = $derived(page.url.searchParams.get("edit"));

	$effect(() => {
		if (!visible) return;
		if (editingRoom) {
			pageHeader.breadcrumbs = [{ label: "Rooms", onclick: stopEditing }, { label: editingRoom.name }];
			pageHeader.actions = [
				{ label: "Cancel", icon: X, variant: "outline" as const, onclick: stopEditing, hideLabelOnMobile: true },
				{ label: "Save", saving: editLoading, onclick: handleSaveRoom, disabled: !hasPendingChanges || editLoading, hideLabelOnMobile: true },
			];
			pageHeader.viewToggle = null;
		} else if (urlEditId) {
			pageHeader.breadcrumbs = [{ label: "Rooms", onclick: stopEditing }, { label: "…" }];
			pageHeader.actions = [];
			pageHeader.viewToggle = null;
		} else {
			pageHeader.breadcrumbs = [{ label: "Rooms" }];
			pageHeader.actions = [{ label: "Create Room", mobileLabel: "Create", icon: Plus, onclick: () => (createDialogOpen = true) }];
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
		new Set(
			effectiveMembers
				.filter((m): m is Extract<EffectiveMember, { kind: "device" }> => m.kind === "device")
				.map((m) => m.deviceId),
		),
	);
	const effectiveGroupIds = $derived(
		new Set(
			effectiveMembers
				.filter((m): m is Extract<EffectiveMember, { kind: "group" }> => m.kind === "group")
				.map((m) => m.groupId),
		),
	);

	const availableDevices = $derived(devices.filter((d) => !effectiveDeviceIds.has(d.id)));
	const availableGroups = $derived(allGroups.filter((g) => !effectiveGroupIds.has(g.id)));

	const pickerDrawerGroups = $derived.by((): DrawerGroup<"device" | "group">[] => {
		const result: DrawerGroup<"device" | "group">[] = [];
		if (availableDevices.length > 0) {
			result.push({
				heading: "Devices",
				items: availableDevices.map((d) => ({
					type: "device" as const,
					id: d.id,
					name: deviceDisplayName(d),
					icon: deviceIcon(d.type, d.roles.contact),
					iconRef: d.icon ?? null,
					searchValue: `${deviceDisplayName(d)} ${d.type}`,
				})),
			});
		}
		if (availableGroups.length > 0) {
			result.push({
				heading: "Groups",
				items: availableGroups.map((g) => ({
					type: "group" as const,
					id: g.id,
					name: groupDisplayName(g),
					icon: GroupIcon,
					badge: `${g.members.length} member${g.members.length === 1 ? "" : "s"}`,
				})),
			});
		}
		return result;
	});

	const memberRows = $derived(
		effectiveMembers
			.filter((m) => !(m.kind === "device" && disabledDeviceIds.has(m.deviceId)))
			.map((m) => {
			if (m.kind === "device") {
				const dev = devices.find((d) => d.id === m.deviceId);
				const related = allGroups
					.filter((g) =>
						g.members.some(
							(gm) => gm.memberType === "device" && gm.memberId === m.deviceId,
						),
					)
					.map((g) => ({ id: g.id, name: groupDisplayName(g), href: `/groups?edit=${g.id}` }));
				return {
					id: m.rowKey,
					name: dev ? deviceDisplayName(dev) : m.deviceId,
					type: dev?.type ?? "device",
					related,
					href: `/devices/${m.deviceId}`,
				};
			}
			const grp = allGroups.find((g) => g.id === m.groupId);
			return {
				id: m.rowKey,
				name: grp ? groupDisplayName(grp) : m.groupId,
				type: "group",
				related: [],
				href: `/groups?edit=${m.groupId}`,
			};
		}),
	);

	async function handleCreateRoom(options: { keepOpen?: boolean } = {}) {
		if (!newRoomName.trim()) return;
		createLoading = true;
		errors.clear();

		let created: Room;
		try {
			created = await roomsStore.create(client, newRoomName.trim());
		} catch (e) {
			createLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not create the room."));
			return;
		}

		createLoading = false;
		newRoomName = "";

		if (options.keepOpen) {
			newRoomNameInput?.focus();
			return;
		}

		createDialogOpen = false;
		startEditing(created);
	}

	function startEditing(room: Room) {
		goto(editRoomHref(room.id), { keepFocus: true, noScroll: true });
	}

	function editRoomHref(id: string): string {
		const url = new URL(page.url);
		url.searchParams.set("edit", id);
		return `${url.pathname}${url.search}${url.hash}`;
	}

	function stopEditing() {
		const url = new URL(page.url);
		url.searchParams.delete("edit");
		goto(url, { keepFocus: true, noScroll: true });
	}

	// Sync editing state from URL. When the ?edit=<id> query param changes
	// (or the user clicks the sidebar "Rooms" link to clear it), update
	// the local editing state.
	$effect(() => {
		if (!visible) return;
		const id = page.url.searchParams.get("edit");
		if (!id) {
			if (editingRoom !== null) {
				editingRoom = null;
				editNameDirty = false;
				editIconDirty = false;
				pendingMemberAdds = [];
				pendingMemberRemovals = new Set();
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
			pendingMemberAdds = [];
			pendingMemberRemovals = new Set();
		}
	});

	async function handleSaveRoom() {
		if (!editingRoom) return;
		const roomId = editingRoom.id;
		editLoading = true;
		errors.clear();

		// Each write reports the whole room back, so the last one to run holds
		// the state the editor should show.
		let latest = editingRoom;
		try {
			const nameDirty = editName.trim() && editName.trim() !== editingRoom.name;
			if (nameDirty || editIconDirty) {
				const input: { name?: string; icon?: string | null } = {};
				if (nameDirty) input.name = editName.trim();
				if (editIconDirty) input.icon = editIcon;
				latest = await roomsStore.update(client, roomId, input);
			}
			for (const memberId of pendingMemberRemovals) {
				latest = await roomsStore.removeMember(client, memberId);
			}
			for (const add of pendingMemberAdds) {
				const memberId = add.kind === "device" ? add.device.id : add.group.id;
				latest = await roomsStore.addMember(client, roomId, add.kind, memberId);
			}
		} catch (e) {
			editLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not save the room."));
			return;
		}

		editingRoom = latest;
		editName = latest.name;
		editIcon = latest.icon ?? null;
		editNameDirty = false;
		editIconDirty = false;
		pendingMemberAdds = [];
		pendingMemberRemovals = new Set();
		editLoading = false;
	}

	async function handleBatchDelete() {
		const ids = selection.selectedIds();
		if (ids.length === 0) {
			batchDeleteConfirm = false;
			return;
		}
		batchDeleteLoading = true;
		errors.clear();
		try {
			await roomsStore.deleteMany(client, ids);
		} catch (e) {
			batchDeleteLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not delete the rooms."));
			return;
		}
		batchDeleteLoading = false;
		if (editingRoom && ids.includes(editingRoom.id)) stopEditing();
		batchDeleteConfirm = false;
		selection.clear();
	}

	async function handleDeleteRoom() {
		if (!deleteConfirmRoom) return;
		deleteLoading = true;
		errors.clear();

		try {
			await roomsStore.delete(client, deleteConfirmRoom.id);
		} catch (e) {
			deleteLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not delete the room."));
			return;
		}

		deleteLoading = false;
		if (editingRoom?.id === deleteConfirmRoom.id) {
			stopEditing();
		}
		deleteConfirmRoom = null;
	}

	function handlePickerSelect(memberType: "device" | "group", memberId: string) {
		if (memberType === "device") {
			const dev = devices.find((d) => d.id === memberId);
			if (!dev) return;
			pendingMemberAdds = [...pendingMemberAdds, { kind: "device", device: dev }];
		} else {
			const grp = allGroups.find((g) => g.id === memberId);
			if (!grp) return;
			pendingMemberAdds = [
				...pendingMemberAdds,
				{ kind: "group", group: { id: grp.id, name: groupDisplayName(grp) } },
			];
		}
		pickerOpen = false;
	}

	function handleRemoveMember(rowKey: string) {
		const target = effectiveMembers.find((m) => m.rowKey === rowKey);
		if (!target) return;
		if (target.pending) {
			// rowKey looks like `pending:<index>:<id>` — drop by deriving the
			// index from the prefix to remove this exact pending entry.
			const idx = Number(rowKey.split(":")[1]);
			if (Number.isFinite(idx)) {
				pendingMemberAdds = pendingMemberAdds.filter((_, i) => i !== idx);
			}
		} else if (target.memberId) {
			pendingMemberRemovals = new Set([...pendingMemberRemovals, target.memberId]);
		}
	}

	async function handleRename(room: Room, newName: string) {
		errors.clear();
		try {
			await roomsStore.update(client, room.id, { name: newName });
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not rename the room."));
		}
	}

	async function handleIconChange(room: Room, icon: string | null) {
		errors.clear();
		try {
			await roomsStore.update(client, room.id, { icon });
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not change the icon."));
		}
	}


	const mountTimer = measureMount("rooms", { ready: () => roomsStore.hydrated, items: () => filteredRooms.length });
	$effect(() => mountTimer.tick());
</script>

<UnsavedGuard dirty={hasPendingChanges} />

<div>
	{#if errors.message}
		<ErrorBanner class="mb-4" message={errors.message} ondismiss={() => errors.clear()} />
	{/if}

	{#if editingRoom}
		<div class="mx-auto max-w-6xl space-y-6" in:fly={{ y: -4, duration: 150 }}>
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
						<IconPickerTrigger size="lg" ariaLabel="Change icon">
							<AnimatedIcon icon={editIcon} class="size-5 text-muted-foreground">
								{#snippet fallback()}<DoorOpen class="size-5 text-muted-foreground" />{/snippet}
							</AnimatedIcon>
						</IconPickerTrigger>
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
					rows={memberRows}
					relatedLabel="Groups"
					emptyMessage="No members yet. Add devices or groups to this room."
					addLabel="Add device or group"
					onadd={() => (pickerOpen = true)}
					onremove={handleRemoveMember}
					disabled={editLoading}
				/>
			</div>
		</div>

		<HiveDrawer
			bind:open={pickerOpen}
			title="Add to room"
			description="Search for devices or groups to add to this room."
			multiple
			groups={pickerDrawerGroups}
			onselect={handlePickerSelect}
		/>
	{:else if roomsStore.hydrated}
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
				<div class="mb-6 flex items-stretch gap-2">
					<div class="min-w-0 flex-1">
						<HiveSearchbar
							controller={searchController}
							chips={searchChipConfigs}
							placeholder="Search rooms..."
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
									variant="destructive"
									size="sm"
									onclick={() => (batchDeleteConfirm = true)}
								>
									Delete
								</Button>
							{/snippet}
						</TableSelectionToolbar>
					</div>
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
									<DeviceCollectionCard
										entity={room}
										devices={roomDevices(room)}
										fallbackIcon={DoorOpen}
										stateSummary
										editHref={editRoomHref(room.id)}
										ondelete={(r) => (deleteConfirmRoom = r)}
										onrename={handleRename}
										oniconchange={handleIconChange}
										onAddTo={handleAddToRoom}
										onbrightness={(v) => commitRoomBrightness(room, v)}
										ontoggle={(on) => commitRoomToggle(room, on)}
										oncolor={(c) => commitRoomColor(room, c)}
										ontemp={(t) => commitRoomTemp(room, t)}
										addLabel="Add to room"
										aggregateTarget={{ kind: "room", id: room.id }}
									/>
								{/each}
							</AnimatedGrid>
						{/snippet}
						{#snippet table()}
							<RoomTable
								rooms={filteredRooms}
								{selection}
								editHref={(room) => editRoomHref(room.id)}
								ondelete={(r) => (deleteConfirmRoom = r)}
								onrename={handleRename}
								oniconchange={handleIconChange}
								onAddTo={handleAddToRoom}
								getDevices={roomDevices}
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
					<Input bind:ref={newRoomNameInput} bind:value={newRoomName} placeholder="Room name" autofocus />
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
						<Button
							variant="secondary"
							type="button"
							disabled={!newRoomName.trim() || createLoading}
							onclick={() => handleCreateRoom({ keepOpen: true })}
						>
							Create more
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

		<ConfirmDialog
			open={batchDeleteConfirm}
			title="Delete {selection.count} room{selection.count === 1 ? '' : 's'}?"
			description="This permanently deletes the selected rooms and removes their device assignments. This cannot be undone."
			confirmLabel="Delete"
			loading={batchDeleteLoading}
			onconfirm={handleBatchDelete}
			oncancel={() => (batchDeleteConfirm = false)}
		/>

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
