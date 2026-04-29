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
	import DeviceCollectionCard from "$lib/components/device-collection-card.svelte";
	import RoomTable from "$lib/components/room-table.svelte";
	import TableSelectionToolbar from "$lib/components/table-selection-toolbar.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import { createTableSelection } from "$lib/utils/table-selection.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig, SearchState } from "$lib/components/hive-searchbar";
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
	import { onDestroy } from "svelte";
	import { fly } from "svelte/transition";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { deviceStore, type Device } from "$lib/stores/devices";
	import { deviceIcon } from "$lib/utils";
	import { rgbToXy } from "$lib/color";
	import { BannerError } from "$lib/stores/banner-error.svelte";

	interface RoomMemberDevice {
		id: string;
		name: string;
		type: string;
		source: string;
		available: boolean;
	}

	interface RoomMemberGroup {
		id: string;
		name: string;
		icon?: string | null;
		resolvedDevices: { id: string }[];
	}

	interface RoomMemberData {
		id: string;
		memberType: string;
		memberId: string;
		device?: RoomMemberDevice | null;
		group?: RoomMemberGroup | null;
	}

	interface RoomData {
		id: string;
		name: string;
		icon?: string | null;
		members: RoomMemberData[];
		resolvedDevices: { id: string }[];
		createdBy?: { id: string; username: string; name: string } | null;
	}

	const client = getContextClient();

	const ROOMS_QUERY = graphql(`
		query Rooms {
			rooms {
				id
				name
				icon
				members {
					id
					memberType
					memberId
					device {
						id
						name
						type
						source
						available
					}
					group {
						id
						name
						icon
						resolvedDevices { id }
					}
				}
				resolvedDevices { id }
				createdBy {
					id
					username
					name
				}
			}
		}
	`);

	interface SimpleGroup {
		id: string;
		name: string;
		members: { memberType: string; memberId: string }[];
	}

	const GROUPS_QUERY = graphql(`
		query RoomsPageGroups {
			groups {
				id
				name
				members { memberType memberId }
			}
		}
	`);

	const CREATE_ROOM = graphql(`
		mutation CreateRoom($input: CreateRoomInput!) {
			createRoom(input: $input) {
				id
				name
				icon
				members {
					id
					memberType
					memberId
					device {
						id
						name
						type
						source
						available
					}
					group {
						id
						name
						icon
						resolvedDevices { id }
					}
				}
				resolvedDevices { id }
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

	const BATCH_DELETE_ROOMS = graphql(`
		mutation BatchDeleteRooms($ids: [ID!]!) {
			batchDeleteRooms(ids: $ids)
		}
	`);

	const ADD_ROOM_MEMBER = graphql(`
		mutation AddRoomMember($input: AddRoomMemberInput!) {
			addRoomMember(input: $input) {
				id
				memberType
				memberId
			}
		}
	`);

	const REMOVE_ROOM_MEMBER = graphql(`
		mutation RemoveRoomMember($id: ID!) {
			removeRoomMember(id: $id)
		}
	`);

	const SET_DEVICE_STATE = graphql(`
		mutation RoomsPageSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
			setDeviceState(deviceId: $deviceId, state: $state) {
				id
				state {
					on
					brightness
				}
			}
		}
	`);

	const roomsQuery = queryStore<{ rooms: RoomData[] }>({ client, query: ROOMS_QUERY });
	const groupsQuery = queryStore<{ groups: SimpleGroup[] }>({ client, query: GROUPS_QUERY });

	const rooms = $derived($roomsQuery.data?.rooms ?? []);
	const devices = $derived(Object.values($deviceStore));
	const allGroups = $derived($groupsQuery.data?.groups ?? []);
	const deviceById = $derived(new Map(devices.map((d) => [d.id, d])));

	function roomDevices(room: RoomData): Device[] {
		const out: Device[] = [];
		for (const rd of room.resolvedDevices) {
			const d = deviceById.get(rd.id);
			if (d) out.push(d);
		}
		return out;
	}

	async function commitRoomBrightness(room: RoomData, brightness: number) {
		const lights = roomDevices(room).filter((d) => d.type === "light" && d.state?.brightness != null);
		if (lights.length === 0) return;
		await Promise.all(
			lights.map((d) => {
				const input: { on?: true; brightness: number } = { brightness };
				if (!d.state?.on) input.on = true;
				return client.mutation(SET_DEVICE_STATE, { deviceId: d.id, state: input }).toPromise();
			}),
		);
	}

	async function commitRoomToggle(room: RoomData, on: boolean) {
		const targets = roomDevices(room).filter((d) =>
			d.capabilities.some((c) => c.name === "on_off"),
		);
		if (targets.length === 0) return;
		await Promise.all(
			targets.map((d) =>
				client.mutation(SET_DEVICE_STATE, { deviceId: d.id, state: { on } }).toPromise(),
			),
		);
	}

	async function commitRoomColor(room: RoomData, color: { r: number; g: number; b: number }) {
		const targets = roomDevices(room).filter((d) =>
			d.capabilities.some((c) => c.name === "color"),
		);
		if (targets.length === 0) return;
		const xy = rgbToXy(color.r, color.g, color.b);
		await Promise.all(
			targets.map((d) => {
				const input: { on?: true; color: { r: number; g: number; b: number; x: number; y: number } } = {
					color: { ...color, x: xy.x, y: xy.y },
				};
				if (!d.state?.on) input.on = true;
				return client.mutation(SET_DEVICE_STATE, { deviceId: d.id, state: input }).toPromise();
			}),
		);
	}

	async function commitRoomTemp(room: RoomData, mired: number) {
		const targets = roomDevices(room).filter((d) =>
			d.capabilities.some((c) => c.name === "color_temp"),
		);
		if (targets.length === 0) return;
		await Promise.all(
			targets.map((d) => {
				const input: { on?: true; colorTemp: number } = { colorTemp: mired };
				if (!d.state?.on) input.on = true;
				return client.mutation(SET_DEVICE_STATE, { deviceId: d.id, state: input }).toPromise();
			}),
		);
	}

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
			const ds = r.resolvedDevices
				.map((rd) => deviceById.get(rd.id))
				.filter((d): d is Device => !!d);
			if (typeValues.length > 0 && !ds.some((d) => typeValues.includes(d.type))) {
				return false;
			}
			if (
				deviceValues.length > 0 &&
				!deviceValues.some((v) => ds.some((d) => d.name.toLowerCase().includes(v)))
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

	let editingRoom = $state<RoomData | null>(null);
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

	let deleteConfirmRoom = $state<RoomData | null>(null);
	let deleteLoading = $state(false);

	const selection = createTableSelection();
	let batchDeleteConfirm = $state(false);
	let batchDeleteLoading = $state(false);

	let pickerOpen = $state(false);

	let quickAddRoom = $state<RoomData | null>(null);
	let quickAddOpen = $state(false);
	let quickAddPending = 0;

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
					name: d.name,
					icon: deviceIcon(d.type),
					searchValue: `${d.name} ${d.type}`,
				})),
			});
		}
		if (grpAvail.length > 0) {
			result.push({
				heading: "Groups",
				items: grpAvail.map((g) => ({
					type: "group" as const,
					id: g.id,
					name: g.name,
					icon: GroupIcon,
					badge: `${g.members.length} member${g.members.length === 1 ? "" : "s"}`,
				})),
			});
		}
		return result;
	});

	function handleAddToRoom(room: RoomData) {
		quickAddRoom = room;
		quickAddOpen = true;
	}

	async function handleQuickAddSelect(memberType: "device" | "group", memberId: string) {
		if (!quickAddRoom) return;
		const roomId = quickAddRoom.id;
		quickAddPending++;
		try {
			const result = await client
				.mutation(ADD_ROOM_MEMBER, { input: { roomId, memberType, memberId } })
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

	const errors = new BannerError();

	let view = $state<ListViewMode>(profile.get("view.rooms", "card"));

	onDestroy(() => pageHeader.reset());

	const editingRoomFresh = $derived(
		editingRoom ? rooms.find((r) => r.id === editingRoom?.id) ?? editingRoom : null
	);

	type EffectiveMember =
		| { rowKey: string; kind: "device"; deviceId: string; pending: boolean; memberId?: string }
		| { rowKey: string; kind: "group"; groupId: string; pending: boolean; memberId?: string };

	const effectiveMembers = $derived.by((): EffectiveMember[] => {
		if (!editingRoomFresh) return [];
		const out: EffectiveMember[] = [];
		for (const m of editingRoomFresh.members) {
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
		if (editingRoomFresh) {
			pageHeader.breadcrumbs = [{ label: "Rooms", onclick: stopEditing }, { label: editingRoomFresh.name }];
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
					name: d.name,
					icon: deviceIcon(d.type),
					searchValue: `${d.name} ${d.type}`,
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
					badge: `${g.members.length} member${g.members.length === 1 ? "" : "s"}`,
				})),
			});
		}
		return result;
	});

	const memberRows = $derived(
		effectiveMembers.map((m) => {
			if (m.kind === "device") {
				const dev = devices.find((d) => d.id === m.deviceId);
				const related = allGroups
					.filter((g) =>
						g.members.some(
							(gm) => gm.memberType === "device" && gm.memberId === m.deviceId,
						),
					)
					.map((g) => ({ id: g.id, name: g.name, href: `/groups?edit=${g.id}` }));
				return {
					id: m.rowKey,
					name: dev?.name ?? m.deviceId,
					type: dev?.type ?? "device",
					related,
					onclick: () => goto(`/devices/${m.deviceId}`),
				};
			}
			const grp = allGroups.find((g) => g.id === m.groupId);
			return {
				id: m.rowKey,
				name: grp?.name ?? m.groupId,
				type: "group",
				related: [],
				onclick: () => goto(`/groups?edit=${m.groupId}`),
			};
		}),
	);

	async function handleCreateRoom(options: { keepOpen?: boolean } = {}) {
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
		roomsQuery.reexecute({ requestPolicy: "network-only" });

		if (options.keepOpen) {
			newRoomNameInput?.focus();
			return;
		}

		createDialogOpen = false;
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

		for (const memberId of pendingMemberRemovals) {
			const result = await client
				.mutation(REMOVE_ROOM_MEMBER, { id: memberId })
				.toPromise();
			if (result.error) {
				editLoading = false;
				errors.setWithAutoDismiss(result.error.message);
				return;
			}
		}

		for (const add of pendingMemberAdds) {
			const memberType = add.kind;
			const memberId = add.kind === "device" ? add.device.id : add.group.id;
			const result = await client
				.mutation(ADD_ROOM_MEMBER, {
					input: { roomId: editingRoom.id, memberType, memberId },
				})
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
		pendingMemberAdds = [];
		pendingMemberRemovals = new Set();
		roomsQuery.reexecute({ requestPolicy: "network-only" });
	}

	async function handleBatchDelete() {
		const ids = selection.selectedIds();
		if (ids.length === 0) {
			batchDeleteConfirm = false;
			return;
		}
		batchDeleteLoading = true;
		errors.clear();
		const result = await client.mutation(BATCH_DELETE_ROOMS, { ids }).toPromise();
		batchDeleteLoading = false;
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}
		if (editingRoom && ids.includes(editingRoom.id)) stopEditing();
		batchDeleteConfirm = false;
		selection.clear();
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
				{ kind: "group", group: { id: grp.id, name: grp.name } },
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
		<ErrorBanner class="mb-4" message={errors.message} ondismiss={() => errors.clear()} />
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
				<div class="mb-6 flex items-stretch gap-2">
					<div class="min-w-0 flex-1">
						<HiveSearchbar
							value={searchState}
							onchange={(v) => (searchState = v)}
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
										subtitle="{room.resolvedDevices.length} device{room.resolvedDevices.length === 1 ? '' : 's'}"
										onedit={startEditing}
										ondelete={(r) => (deleteConfirmRoom = r)}
										onrename={handleRename}
										oniconchange={handleIconChange}
										onAddTo={handleAddToRoom}
										onbrightness={(v) => commitRoomBrightness(room, v)}
										ontoggle={(on) => commitRoomToggle(room, on)}
										oncolor={(c) => commitRoomColor(room, c)}
										ontemp={(t) => commitRoomTemp(room, t)}
										addLabel="Add to room"
									/>
								{/each}
							</AnimatedGrid>
						{/snippet}
						{#snippet table()}
							<RoomTable
								rooms={filteredRooms}
								{selection}
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
