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
	import GroupCard from "$lib/components/group-card.svelte";
	import GroupTable from "$lib/components/group-table.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig, SearchState } from "$lib/components/hive-searchbar";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import ListView from "$lib/components/list-view.svelte";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import MemberTable from "$lib/components/member-table.svelte";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import { profile, type ListView as ListViewMode } from "$lib/stores/profile.svelte";
	import {
		Plus,
		X,
		Group as GroupIcon,
		DoorOpen,
	} from "@lucide/svelte";
	import { deviceIcon } from "$lib/utils";
	import { onDestroy } from "svelte";
	import { fly } from "svelte/transition";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { ErrorBanner } from "$lib/stores/error-banner.svelte";
	import type { Device } from "$lib/stores/devices";

	interface RoomData {
		id: string;
		name: string;
		devices: { id: string; name: string }[];
	}

	interface GroupMember {
		id: string;
		memberType: string;
		memberId: string;
		device: Device | null;
		group: GroupData | null;
		room: RoomData | null;
	}

	interface GroupData {
		id: string;
		name: string;
		icon?: string | null;
		members: GroupMember[];
		createdBy?: { id: string; username: string; name: string } | null;
	}

	interface DevicesQueryResult {
		devices: Device[];
	}

	interface GroupsQueryResult {
		groups: GroupData[];
	}

	interface CreateGroupResult {
		createGroup: GroupData;
	}

	interface UpdateGroupResult {
		updateGroup: GroupData;
	}

	interface DeleteGroupResult {
		deleteGroup: boolean;
	}

	interface AddGroupMemberResult {
		addGroupMember: GroupMember;
	}

	interface RemoveGroupMemberResult {
		removeGroupMember: boolean;
	}

	const client = getContextClient();

	const GROUPS_QUERY = gql`
		query Groups {
			groups {
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
						capabilities { name type values valueMin valueMax unit access }
						source
						available
						lastSeen
						state {
							... on LightState {
								on
								brightness
								colorTemp
								transition
							}
							... on SensorState {
								temperature
								humidity
								battery
								pressure
								illuminance
							}
							... on SwitchState {
								action
							}
						}
					}
					group {
						id
						name
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
								lastSeen
								state {
									... on LightState {
										on
										brightness
										colorTemp
										transition
									}
									... on SensorState {
										temperature
										humidity
										battery
										pressure
										illuminance
									}
									... on SwitchState {
										action
									}
								}
							}
							group {
								id
								name
								members {
									id
									memberType
									memberId
								}
							}
						}
					}
					room {
						id
						name
						devices { id name }
					}
				}
				createdBy {
					id
					username
					name
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
				capabilities { name type values valueMin valueMax unit access }
				source
				available
				lastSeen
				state {
					... on LightState {
						on
						brightness
						colorTemp
						transition
					}
					... on SensorState {
						temperature
						humidity
						battery
						pressure
						illuminance
					}
					... on SwitchState {
						action
					}
				}
			}
		}
	`;

	const ROOMS_QUERY = gql`
		query Rooms {
			rooms {
				id
				name
				devices { id name }
			}
		}
	`;

	const CREATE_GROUP = gql`
		mutation CreateGroup($input: CreateGroupInput!) {
			createGroup(input: $input) {
				id
				name
				members {
					id
					memberType
					memberId
				}
				createdBy {
					id
					username
					name
				}
			}
		}
	`;

	const UPDATE_GROUP = gql`
		mutation UpdateGroup($id: ID!, $input: UpdateGroupInput!) {
			updateGroup(id: $id, input: $input) {
				id
				name
				icon
			}
		}
	`;

	const DELETE_GROUP = gql`
		mutation DeleteGroup($id: ID!) {
			deleteGroup(id: $id)
		}
	`;

	const ADD_GROUP_MEMBER = gql`
		mutation AddGroupMember($input: AddGroupMemberInput!) {
			addGroupMember(input: $input) {
				id
				memberType
				memberId
			}
		}
	`;

	const REMOVE_GROUP_MEMBER = gql`
		mutation RemoveGroupMember($id: ID!) {
			removeGroupMember(id: $id)
		}
	`;

	const groupsQuery = queryStore<GroupsQueryResult>({ client, query: GROUPS_QUERY });
	const devicesQuery = queryStore<DevicesQueryResult>({ client, query: DEVICES_QUERY });
	const roomsQuery = queryStore<{ rooms: RoomData[] }>({ client, query: ROOMS_QUERY });

	const groups = $derived($groupsQuery.data?.groups ?? []);
	const devices = $derived($devicesQuery.data?.devices ?? []);
	const allRooms = $derived($roomsQuery.data?.rooms ?? []);

	let hasLoadedOnce = $state(false);
	$effect(() => {
		if (!$groupsQuery.fetching && !hasLoadedOnce) {
			hasLoadedOnce = true;
		}
	});

	let searchState = $state<SearchState>({ chips: [], freeText: "" });

	const kindOptions = [
		{ value: "device", label: "Device" },
		{ value: "group", label: "Group" },
		{ value: "room", label: "Room" },
	];

	const emptyOptions = [
		{ value: "yes", label: "Yes" },
		{ value: "no", label: "No" },
	];

	const searchChipConfigs: ChipConfig[] = $derived([
		{
			keyword: "kind",
			label: "Kind",
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return q
					? kindOptions.filter((o) => o.value.includes(q) || o.label.toLowerCase().includes(q))
					: kindOptions;
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
			keyword: "room",
			label: "Room",
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return allRooms
					.filter((r) => !q || r.name.toLowerCase().includes(q))
					.map((r) => ({ value: r.name, label: r.name }));
			},
		},
		{
			keyword: "empty",
			label: "Empty",
			variant: "secondary",
			options: () => emptyOptions,
		},
	]);

	const filteredGroups = $derived.by(() => {
		const kindValues = searchState.chips.filter((c) => c.keyword === "kind").map((c) => c.value);
		const deviceValues = searchState.chips
			.filter((c) => c.keyword === "device")
			.map((c) => c.value.toLowerCase());
		const roomValues = searchState.chips
			.filter((c) => c.keyword === "room")
			.map((c) => c.value.toLowerCase());
		const emptyValues = searchState.chips.filter((c) => c.keyword === "empty").map((c) => c.value);
		const query = searchState.freeText.toLowerCase();

		return groups.filter((g) => {
			if (kindValues.length > 0 && !g.members.some((m) => kindValues.includes(m.memberType)))
				return false;
			if (
				deviceValues.length > 0 &&
				!deviceValues.some((v) =>
					g.members.some(
						(m) => m.memberType === "device" && (m.device?.name ?? "").toLowerCase().includes(v),
					),
				)
			)
				return false;
			if (
				roomValues.length > 0 &&
				!roomValues.some((v) =>
					g.members.some(
						(m) => m.memberType === "room" && (m.room?.name ?? "").toLowerCase().includes(v),
					),
				)
			)
				return false;
			if (emptyValues.length > 0) {
				const isEmpty = g.members.length === 0;
				const wants = emptyValues.some((v) => (v === "yes" ? isEmpty : !isEmpty));
				if (!wants) return false;
			}
			if (query && !g.name.toLowerCase().includes(query)) return false;
			return true;
		});
	});

	let createDialogOpen = $state(false);
	let newGroupName = $state("");
	let createLoading = $state(false);

	let view = $state<ListViewMode>(profile.get("view.groups", "card"));

	onDestroy(() => pageHeader.reset());

	interface PendingAdd {
		memberType: "device" | "group" | "room";
		memberId: string;
		device: Device | null;
		group: GroupData | null;
		room: RoomData | null;
	}

	let editingGroup = $state<GroupData | null>(null);
	let editName = $state("");
	let editNameDirty = $state(false);
	let editIcon = $state<string | null>(null);
	let editIconDirty = $state(false);
	let editLoading = $state(false);

	let pendingAdds = $state<PendingAdd[]>([]);
	let pendingRemovals = $state<Set<string>>(new Set());

	let deleteConfirmGroup = $state<GroupData | null>(null);
	let deleteLoading = $state(false);

	let pickerOpen = $state(false);

	let quickAddGroup = $state<GroupData | null>(null);
	let quickAddOpen = $state(false);
	let quickAddPending = 0;

	const quickAddDrawerGroups = $derived.by((): DrawerGroup<"device" | "group" | "room">[] => {
		if (!quickAddGroup) return [];
		const memberIds = new Set(quickAddGroup.members.map((m) => m.memberId));
		const devAvail = devices.filter((d) => !memberIds.has(d.id));
		const grpAvail = groups.filter((g) => g.id !== quickAddGroup!.id && !memberIds.has(g.id));
		const roomAvail = allRooms.filter((r) => !memberIds.has(r.id));
		const result: DrawerGroup<"device" | "group" | "room">[] = [];
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
		if (roomAvail.length > 0) {
			result.push({
				heading: "Rooms",
				items: roomAvail.map((r) => ({
					type: "room" as const,
					id: r.id,
					name: r.name,
					icon: DoorOpen,
					badge: `${r.devices.length} device${r.devices.length === 1 ? "" : "s"}`,
				})),
			});
		}
		return result;
	});

	function handleAddToGroup(group: GroupData) {
		quickAddGroup = group;
		quickAddOpen = true;
	}

	async function handleQuickAddSelect(memberType: "device" | "group" | "room", memberId: string) {
		if (!quickAddGroup) return;
		const groupId = quickAddGroup.id;
		quickAddPending++;
		try {
			const result = await client
				.mutation<AddGroupMemberResult>(ADD_GROUP_MEMBER, {
					input: { groupId, memberType, memberId },
				})
				.toPromise();
			if (result.error) {
				errors.setWithAutoDismiss(result.error.message);
			}
		} finally {
			quickAddPending--;
			if (quickAddPending === 0) {
				groupsQuery.reexecute({ requestPolicy: "network-only" });
			}
		}
	}

	const errors = new ErrorBanner();

	const hasPendingChanges = $derived(
		editNameDirty || editIconDirty || pendingAdds.length > 0 || pendingRemovals.size > 0
	);

	const urlEditId = $derived(page.url.searchParams.get("edit"));

	$effect(() => {
		if (editingGroupFresh) {
			pageHeader.breadcrumbs = [{ label: "Groups", onclick: stopEditing }, { label: editingGroupFresh.name }];
			pageHeader.actions = [
				{ label: "Cancel", variant: "outline" as const, onclick: stopEditing },
				{ label: "Save", saving: editLoading, onclick: handleSaveGroup, disabled: !hasPendingChanges || editLoading },
			];
			pageHeader.viewToggle = null;
		} else if (urlEditId) {
			pageHeader.breadcrumbs = [{ label: "Groups", onclick: stopEditing }, { label: "…" }];
			pageHeader.actions = [];
			pageHeader.viewToggle = null;
		} else {
			pageHeader.breadcrumbs = [{ label: "Groups" }];
			pageHeader.actions = [{ label: "Create Group", icon: Plus, onclick: () => (createDialogOpen = true) }];
			pageHeader.viewToggle = {
				value: view,
				onchange: (v) => {
					view = v;
					profile.set("view.groups", v);
				},
			};
		}
	});

	async function handleCreateGroup() {
		if (!newGroupName.trim()) return;
		createLoading = true;
		errors.clear();

		const result = await client
			.mutation<CreateGroupResult>(CREATE_GROUP, { input: { name: newGroupName.trim() } })
			.toPromise();

		createLoading = false;

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		const created = result.data?.createGroup;
		newGroupName = "";
		createDialogOpen = false;
		groupsQuery.reexecute({ requestPolicy: "network-only" });
		if (created) {
			startEditing(created);
		}
	}

	function startEditing(group: GroupData) {
		goto(`/groups?edit=${encodeURIComponent(group.id)}`, { keepFocus: true, noScroll: true });
	}

	function stopEditing() {
		goto("/groups", { keepFocus: true, noScroll: true });
	}

	// Sync editing state from URL. When the ?edit=<id> query param changes
	// (or the user clicks the sidebar "Groups" link to clear it), update
	// the local editing state.
	$effect(() => {
		const id = page.url.searchParams.get("edit");
		if (!id) {
			if (editingGroup !== null) {
				editingGroup = null;
				editNameDirty = false;
				editIconDirty = false;
				pendingAdds = [];
				pendingRemovals = new Set();
			}
			return;
		}
		if (editingGroup?.id === id) return;
		const match = groups.find((g) => g.id === id);
		if (match) {
			editingGroup = match;
			editName = match.name;
			editIcon = match.icon ?? null;
			editNameDirty = false;
			editIconDirty = false;
			pendingAdds = [];
			pendingRemovals = new Set();
		}
	});

	async function handleSaveGroup() {
		if (!editingGroup) return;
		editLoading = true;
		errors.clear();

		const nameDirty = editName.trim() && editName.trim() !== editingGroup.name;
		if (nameDirty || editIconDirty) {
			const input: { name?: string; icon?: string | null } = {};
			if (nameDirty) input.name = editName.trim();
			if (editIconDirty) input.icon = editIcon;
			const result = await client
				.mutation<UpdateGroupResult>(UPDATE_GROUP, { id: editingGroup.id, input })
				.toPromise();
			if (result.error) {
				editLoading = false;
				errors.setWithAutoDismiss(result.error.message);
				return;
			}
		}

		for (const removal of pendingRemovals) {
			const result = await client
				.mutation<RemoveGroupMemberResult>(REMOVE_GROUP_MEMBER, { id: removal })
				.toPromise();
			if (result.error) {
				editLoading = false;
				errors.setWithAutoDismiss(result.error.message);
				return;
			}
		}

		for (const add of pendingAdds) {
			const result = await client
				.mutation<AddGroupMemberResult>(ADD_GROUP_MEMBER, {
					input: {
						groupId: editingGroup.id,
						memberType: add.memberType,
						memberId: add.memberId,
					},
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
		pendingAdds = [];
		pendingRemovals = new Set();
		groupsQuery.reexecute({ requestPolicy: "network-only" });
	}

	async function handleDeleteGroup() {
		if (!deleteConfirmGroup) return;
		deleteLoading = true;
		errors.clear();

		const result = await client
			.mutation<DeleteGroupResult>(DELETE_GROUP, { id: deleteConfirmGroup.id })
			.toPromise();

		deleteLoading = false;

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		if (editingGroup?.id === deleteConfirmGroup.id) {
			stopEditing();
		}
		deleteConfirmGroup = null;
		groupsQuery.reexecute({ requestPolicy: "network-only" });
	}

	function handleAddMember(memberType: "device" | "group" | "room", memberId: string) {
		if (!editingGroup) return;

		let dev: Device | null = null;
		let grp: GroupData | null = null;
		let rm: RoomData | null = null;

		if (memberType === "device") {
			dev = devices.find((d) => d.id === memberId) ?? null;
		} else if (memberType === "group") {
			grp = groups.find((g) => g.id === memberId) ?? null;
		} else if (memberType === "room") {
			rm = allRooms.find((r) => r.id === memberId) ?? null;
		}

		pendingAdds = [...pendingAdds, { memberType, memberId, device: dev, group: grp, room: rm }];
	}

	function handleRemoveMember(memberRowId: string) {
		if (memberRowId.startsWith("pending-")) {
			const idx = parseInt(memberRowId.replace("pending-", ""), 10);
			pendingAdds = pendingAdds.filter((_, i) => i !== idx);
		} else {
			pendingRemovals = new Set([...pendingRemovals, memberRowId]);
		}
	}

	async function handleRename(group: GroupData, newName: string) {
		errors.clear();

		const result = await client
			.mutation<UpdateGroupResult>(UPDATE_GROUP, { id: group.id, input: { name: newName } })
			.toPromise();

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		groupsQuery.reexecute({ requestPolicy: "network-only" });
	}

	async function handleIconChange(group: GroupData, icon: string | null) {
		errors.clear();
		const result = await client
			.mutation<UpdateGroupResult>(UPDATE_GROUP, { id: group.id, input: { icon } })
			.toPromise();
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}
		groupsQuery.reexecute({ requestPolicy: "network-only" });
	}

	const editingGroupFresh = $derived(
		editingGroup ? groups.find((g) => g.id === editingGroup?.id) ?? editingGroup : null
	);

	const effectiveMembers = $derived.by((): GroupMember[] => {
		if (!editingGroupFresh) return [];
		const serverMembers = editingGroupFresh.members.filter(
			(m) => !pendingRemovals.has(m.id)
		);
		const pendingAsMember: GroupMember[] = pendingAdds.map((a, i) => ({
			id: `pending-${i}`,
			memberType: a.memberType,
			memberId: a.memberId,
			device: a.device,
			group: a.group,
			room: a.room,
		}));
		return [...serverMembers, ...pendingAsMember];
	});

	const effectiveMemberIds = $derived(
		new Set(effectiveMembers.map((m) => m.memberId))
	);

	const availableDevices = $derived(devices.filter((d) => !effectiveMemberIds.has(d.id)));

	const availableGroups = $derived(groups.filter((g) => !effectiveMemberIds.has(g.id)));

	const availableRooms = $derived(allRooms.filter((r) => !effectiveMemberIds.has(r.id)));

	const pickerDrawerGroups = $derived.by((): DrawerGroup<"device" | "group" | "room">[] => {
		const result: DrawerGroup<"device" | "group" | "room">[] = [];
		if (availableDevices.length > 0) {
			result.push({ heading: "Devices", items: availableDevices.map((d) => ({
				type: "device" as const, id: d.id, name: d.name,
				icon: deviceIcon(d.type), searchValue: `${d.name} ${d.type}`,
			}))});
		}
		if (availableGroups.length > 0) {
			result.push({ heading: "Groups", items: availableGroups.map((g) => ({
				type: "group" as const, id: g.id, name: g.name, icon: GroupIcon,
				badge: `${g.members.length} member${g.members.length === 1 ? "" : "s"}`,
			}))});
		}
		if (availableRooms.length > 0) {
			result.push({ heading: "Rooms", items: availableRooms.map((r) => ({
				type: "room" as const, id: r.id, name: r.name, icon: DoorOpen,
				badge: `${r.devices.length} device${r.devices.length === 1 ? "" : "s"}`,
			}))});
		}
		return result;
	});

	const memberRows = $derived(
		effectiveMembers.map((m) => {
			const name = m.device?.name ?? m.group?.name ?? m.room?.name ?? m.memberId;
			const type = m.device?.type ?? m.memberType;
			const related = allRooms
				.filter((r) => r.devices.some((d) => d.id === m.memberId))
				.map((r) => ({ id: r.id, name: r.name, href: `/rooms?edit=${r.id}` }));
			const onclick = (() => {
				switch (m.memberType) {
					case "device":
						return () => goto(`/devices/${m.memberId}`);
					case "group":
						return () =>
							goto(`/groups?edit=${m.memberId}`, { keepFocus: true, noScroll: true });
					case "room":
						return () =>
							goto(`/rooms?edit=${m.memberId}`, { keepFocus: true, noScroll: true });
					default:
						return undefined;
				}
			})();
			return { id: m.id, name, type, related, onclick };
		})
	);
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

	{#if editingGroupFresh}
		<div>

			<div class="space-y-6">
				<div class="rounded-lg shadow-card bg-card p-4">
					<label class="mb-2 block text-sm font-medium text-foreground" for="group-name">
						Group Name
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
									{#snippet fallback()}<GroupIcon class="size-5 text-muted-foreground" />{/snippet}
								</AnimatedIcon>
							</button>
						</IconPicker>
						<Input
							id="group-name"
							bind:value={editName}
							oninput={() => (editNameDirty = true)}
							placeholder="Group name"
						/>
					</div>
				</div>

				<div class="rounded-lg shadow-card bg-card p-4">
					<MemberTable
						rows={memberRows}
						relatedLabel="Rooms"
						emptyMessage="No members yet. Add devices or groups to this group."
						addLabel="Add member"
						onadd={() => (pickerOpen = true)}
						onremove={handleRemoveMember}
						disabled={editLoading}
					/>
				</div>
			</div>
		</div>

		<HiveDrawer
			bind:open={pickerOpen}
			title="Add Member"
			description="Search for devices, groups, or rooms to add."
			multiple
			groups={pickerDrawerGroups}
			onselect={handleAddMember}
		/>
	{:else if hasLoadedOnce}
		<div in:fly={{ y: -4, duration: 150 }}>
			{#if groups.length === 0}
				<div class="rounded-lg shadow-card bg-card p-12 text-center">
					<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<GroupIcon class="size-6 text-muted-foreground" />
					</div>
					<p class="text-muted-foreground">No groups yet.</p>
					<p class="mt-2 text-sm text-muted-foreground">
						Create a group to organize your devices and other groups together.
					</p>
					<Button class="mt-4" onclick={() => (createDialogOpen = true)}>
						<Plus class="size-4" />
						<span>Create your first group</span>
					</Button>
				</div>
			{:else}
				<div class="mb-6">
					<HiveSearchbar
						value={searchState}
						onchange={(v) => (searchState = v)}
						chips={searchChipConfigs}
						placeholder="Search groups..."
					/>
				</div>

				{#if filteredGroups.length === 0}
					<div class="rounded-lg shadow-card bg-card p-12 text-center">
						<p class="text-muted-foreground">No groups match your filters.</p>
					</div>
				{:else}
					<ListView mode={view}>
						{#snippet card()}
							<AnimatedGrid>
								{#each filteredGroups as group (group.id)}
									<GroupCard
										{group}
										onedit={startEditing}
										ondelete={(g) => (deleteConfirmGroup = g)}
										onrename={handleRename}
										oniconchange={handleIconChange}
										onAddTo={handleAddToGroup}
									/>
								{/each}
							</AnimatedGrid>
						{/snippet}
						{#snippet table()}
							<GroupTable
								groups={filteredGroups}
								onedit={startEditing}
								ondelete={(g) => (deleteConfirmGroup = g)}
								onrename={handleRename}
								oniconchange={handleIconChange}
								onAddTo={handleAddToGroup}
							/>
						{/snippet}
					</ListView>
				{/if}
			{/if}
		</div>

		<Dialog bind:open={createDialogOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Group</DialogTitle>
					<DialogDescription>Give your new group a name. You can add members after.</DialogDescription>
				</DialogHeader>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleCreateGroup();
					}}
				>
					<Input bind:value={newGroupName} placeholder="Group name" autofocus />
					<DialogFooter class="mt-4">
						<Button
							variant="outline"
							type="button"
							onclick={() => {
								createDialogOpen = false;
								newGroupName = "";
							}}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!newGroupName.trim() || createLoading}>
							{createLoading ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>

		<Dialog bind:open={() => deleteConfirmGroup !== null, (v) => { if (!v) deleteConfirmGroup = null; }}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Group</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete "{deleteConfirmGroup?.name}"? This action cannot be
						undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onclick={() => (deleteConfirmGroup = null)}>
						Cancel
					</Button>
					<Button variant="destructive" onclick={handleDeleteGroup} disabled={deleteLoading}>
						{deleteLoading ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<HiveDrawer
			bind:open={quickAddOpen}
			title={quickAddGroup ? `Add members to ${quickAddGroup.name}` : "Add members"}
			description="Pick one or more devices, groups, or rooms to add."
			multiple
			groups={quickAddDrawerGroups}
			onselect={handleQuickAddSelect}
		/>
	{/if}
</div>
