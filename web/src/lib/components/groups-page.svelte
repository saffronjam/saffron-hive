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
	import DeviceCollectionCard from "$lib/components/device-collection-card.svelte";
	import GroupTable from "$lib/components/group-table.svelte";
	import { groupMemberBreakdown } from "$lib/list-helpers";
	import TableSelectionToolbar from "$lib/components/table-selection-toolbar.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import { createTableSelection } from "$lib/utils/table-selection.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig, SearchState } from "$lib/components/hive-searchbar";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import ListView from "$lib/components/list-view.svelte";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import MemberTable from "$lib/components/member-table.svelte";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import IconPickerTrigger from "$lib/components/icon-picker-trigger.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import GroupTagsSelect, { type GroupTag } from "$lib/components/group-tags-select.svelte";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import { profile, type ListView as ListViewMode } from "$lib/stores/profile.svelte";
	import {
		Plus,
		Group as GroupIcon,
		DoorOpen,
		X,
	} from "@lucide/svelte";
	import { deviceIcon, deviceDisplayName } from "$lib/utils";
	import { fly } from "svelte/transition";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { BannerError } from "$lib/stores/banner-error.svelte";
	import { deviceStore, type Device } from "$lib/stores/devices";
	import { groupsStore, type Group, type GroupMember } from "$lib/stores/groups.svelte";
	import { roomsStore } from "$lib/stores/rooms.svelte";
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
	import {
		flattenGroupDevices as flattenGroupDevicesShared,
		commitGroupBrightness as commitGroupBrightnessShared,
		commitGroupToggle as commitGroupToggleShared,
		commitGroupColor as commitGroupColorShared,
		commitGroupTemp as commitGroupTempShared,
	} from "$lib/group-commands";

	const client = getContextClient();

	const groups = $derived(groupsStore.items);
	// Disabled devices leave this page entirely: no member row, no picker
	// entry, no contribution to a group's readings or command fan-out.
	const devices = $derived(Object.values($deviceStore).filter((d) => !d.disabled));
	const disabledDeviceIds = $derived(
		new Set(
			Object.values($deviceStore)
				.filter((d) => d.disabled)
				.map((d) => d.id),
		),
	);
	const allRooms = $derived(roomsStore.items);

	function flattenGroupDevices(group: Group): Device[] {
		return flattenGroupDevicesShared(group, devices, groups, allRooms);
	}

	function memberDeviceName(deviceId: string): string {
		const device = $deviceStore[deviceId];
		return device ? deviceDisplayName(device) : deviceId;
	}

	async function commitGroupBrightness(group: Group, brightness: number) {
		await commitGroupBrightnessShared(client, flattenGroupDevices(group), brightness);
	}

	async function commitGroupToggle(group: Group, on: boolean) {
		await commitGroupToggleShared(client, flattenGroupDevices(group), on);
	}

	async function commitGroupColor(group: Group, color: { r: number; g: number; b: number }) {
		await commitGroupColorShared(client, flattenGroupDevices(group), color);
	}

	async function commitGroupTemp(group: Group, mired: number) {
		await commitGroupTempShared(client, flattenGroupDevices(group), mired);
	}

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
					.filter((d) => !q || deviceDisplayName(d).toLowerCase().includes(q))
					.map((d) => ({ value: deviceDisplayName(d), label: deviceDisplayName(d) }));
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
						(m) =>
							m.memberType === "device" &&
							memberDeviceName(m.memberId).toLowerCase().includes(v),
					),
				)
			)
				return false;
			if (
				roomValues.length > 0 &&
				!roomValues.some((v) =>
					g.members.some(
						(m) =>
							m.memberType === "room" &&
							(roomsStore.byId.get(m.memberId)?.name ?? "").toLowerCase().includes(v),
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

	const filteredIds = $derived(filteredGroups.map((g) => g.id));
	$effect(() => {
		selection.pruneTo(filteredIds);
	});

	let createDialogOpen = $state(false);
	let newGroupName = $state("");
	let createLoading = $state(false);
	let newGroupNameInput = $state<HTMLInputElement | null>(null);

	let view = $state<ListViewMode>(profile.get("view.groups", "card"));


	interface PendingAdd {
		memberType: "device" | "group" | "room";
		memberId: string;
	}

	let editingGroup = $state<Group | null>(null);
	let editName = $state("");
	let editNameDirty = $state(false);
	let editIcon = $state<string | null>(null);
	let editIconDirty = $state(false);
	let editTags = $state<GroupTag[]>([]);
	let editTagsDirty = $state(false);
	let editLoading = $state(false);

	let pendingAdds = $state<PendingAdd[]>([]);
	let pendingRemovals = $state<Set<string>>(new Set());

	let deleteConfirmGroup = $state<Group | null>(null);
	let deleteLoading = $state(false);

	const selection = createTableSelection();
	let batchDeleteConfirm = $state(false);
	let batchDeleteLoading = $state(false);

	let pickerOpen = $state(false);

	let quickAddGroup = $state<Group | null>(null);
	let quickAddOpen = $state(false);

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
					name: deviceDisplayName(d),
					icon: deviceIcon(d.type),
					iconRef: d.icon ?? null,
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
					badge: `${r.resolvedDevices.length} device${r.resolvedDevices.length === 1 ? "" : "s"}`,
				})),
			});
		}
		return result;
	});

	function handleAddToGroup(group: Group) {
		quickAddGroup = group;
		quickAddOpen = true;
	}

	async function handleQuickAddSelect(memberType: "device" | "group" | "room", memberId: string) {
		if (!quickAddGroup) return;
		const groupId = quickAddGroup.id;
		try {
			await groupsStore.addMember(client, groupId, memberType, memberId);
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not add the member."));
		}
	}

	const errors = new BannerError();

	const hasPendingChanges = $derived(
		editNameDirty || editIconDirty || editTagsDirty || pendingAdds.length > 0 || pendingRemovals.size > 0
	);

	const urlEditId = $derived(page.url.searchParams.get("edit"));

	$effect(() => {
		if (!visible) return;
		if (editingGroup) {
			pageHeader.breadcrumbs = [{ label: "Groups", onclick: stopEditing }, { label: editingGroup.name }];
			pageHeader.actions = [
				{ label: "Cancel", icon: X, variant: "outline" as const, onclick: stopEditing, hideLabelOnMobile: true },
				{ label: "Save", saving: editLoading, onclick: handleSaveGroup, disabled: !hasPendingChanges || editLoading, hideLabelOnMobile: true },
			];
			pageHeader.viewToggle = null;
		} else if (urlEditId) {
			pageHeader.breadcrumbs = [{ label: "Groups", onclick: stopEditing }, { label: "…" }];
			pageHeader.actions = [];
			pageHeader.viewToggle = null;
		} else {
			pageHeader.breadcrumbs = [{ label: "Groups" }];
			pageHeader.actions = [{ label: "Create Group", mobileLabel: "Create", icon: Plus, onclick: () => (createDialogOpen = true) }];
			pageHeader.viewToggle = {
				value: view,
				onchange: (v) => {
					view = v;
					profile.set("view.groups", v);
				},
			};
		}
	});

	async function handleCreateGroup(options: { keepOpen?: boolean } = {}) {
		if (!newGroupName.trim()) return;
		createLoading = true;
		errors.clear();

		let created: Group;
		try {
			created = await groupsStore.create(client, newGroupName.trim());
		} catch (e) {
			createLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not create the group."));
			return;
		}

		createLoading = false;
		newGroupName = "";

		if (options.keepOpen) {
			newGroupNameInput?.focus();
			return;
		}

		createDialogOpen = false;
		startEditing(created);
	}

	function startEditing(group: Group) {
		goto(`/groups?edit=${encodeURIComponent(group.id)}`, { keepFocus: true, noScroll: true });
	}

	function stopEditing() {
		goto("/groups", { keepFocus: true, noScroll: true });
	}

	// Sync editing state from URL. When the ?edit=<id> query param changes
	// (or the user clicks the sidebar "Groups" link to clear it), update
	// the local editing state.
	$effect(() => {
		if (!visible) return;
		const id = page.url.searchParams.get("edit");
		if (!id) {
			if (editingGroup !== null) {
				editingGroup = null;
				editNameDirty = false;
				editIconDirty = false;
				editTagsDirty = false;
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
			editTags = [...(match.tags ?? [])];
			editNameDirty = false;
			editIconDirty = false;
			editTagsDirty = false;
			pendingAdds = [];
			pendingRemovals = new Set();
		}
	});

	async function handleSaveGroup() {
		if (!editingGroup) return;
		const groupId = editingGroup.id;
		editLoading = true;
		errors.clear();

		// Each write reports the whole group back, so the last one to run holds
		// the state the editor should show.
		let latest = editingGroup;
		try {
			const nameDirty = editName.trim() && editName.trim() !== editingGroup.name;
			if (nameDirty || editIconDirty || editTagsDirty) {
				const input: { name?: string; icon?: string | null; tags?: GroupTag[] } = {};
				if (nameDirty) input.name = editName.trim();
				if (editIconDirty) input.icon = editIcon;
				if (editTagsDirty) input.tags = editTags;
				latest = await groupsStore.update(client, groupId, input);
			}
			for (const removal of pendingRemovals) {
				latest = await groupsStore.removeMember(client, removal);
			}
			for (const add of pendingAdds) {
				latest = await groupsStore.addMember(client, groupId, add.memberType, add.memberId);
			}
		} catch (e) {
			editLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not save the group."));
			return;
		}

		editingGroup = latest;
		editName = latest.name;
		editIcon = latest.icon ?? null;
		editTags = [...(latest.tags ?? [])];
		editNameDirty = false;
		editIconDirty = false;
		editTagsDirty = false;
		pendingAdds = [];
		pendingRemovals = new Set();
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
			await groupsStore.deleteMany(client, ids);
		} catch (e) {
			batchDeleteLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not delete the groups."));
			return;
		}
		batchDeleteLoading = false;
		if (editingGroup && ids.includes(editingGroup.id)) stopEditing();
		batchDeleteConfirm = false;
		selection.clear();
	}

	async function handleDeleteGroup() {
		if (!deleteConfirmGroup) return;
		deleteLoading = true;
		errors.clear();

		try {
			await groupsStore.delete(client, deleteConfirmGroup.id);
		} catch (e) {
			deleteLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not delete the group."));
			return;
		}

		deleteLoading = false;
		if (editingGroup?.id === deleteConfirmGroup.id) {
			stopEditing();
		}
		deleteConfirmGroup = null;
	}

	function handleAddMember(memberType: "device" | "group" | "room", memberId: string) {
		if (!editingGroup) return;
		pendingAdds = [...pendingAdds, { memberType, memberId }];
	}

	function handleRemoveMember(memberRowId: string) {
		if (memberRowId.startsWith("pending-")) {
			const idx = parseInt(memberRowId.replace("pending-", ""), 10);
			pendingAdds = pendingAdds.filter((_, i) => i !== idx);
		} else {
			pendingRemovals = new Set([...pendingRemovals, memberRowId]);
		}
	}

	async function handleRename(group: Group, newName: string) {
		errors.clear();
		try {
			await groupsStore.update(client, group.id, { name: newName });
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not rename the group."));
		}
	}

	async function handleIconChange(group: Group, icon: string | null) {
		errors.clear();
		try {
			await groupsStore.update(client, group.id, { icon });
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not change the icon."));
		}
	}

	const effectiveMembers = $derived.by((): GroupMember[] => {
		if (!editingGroup) return [];
		const serverMembers = editingGroup.members.filter(
			(m) => !pendingRemovals.has(m.id)
		);
		const pendingAsMember: GroupMember[] = pendingAdds.map((a, i) => ({
			id: `pending-${i}`,
			memberType: a.memberType,
			memberId: a.memberId,
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
				type: "device" as const, id: d.id, name: deviceDisplayName(d),
				icon: deviceIcon(d.type), iconRef: d.icon ?? null,
				searchValue: `${deviceDisplayName(d)} ${d.type}`,
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
				badge: `${r.resolvedDevices.length} device${r.resolvedDevices.length === 1 ? "" : "s"}`,
			}))});
		}
		return result;
	});

	const memberRows = $derived(
		effectiveMembers
			.filter((m) => !(m.memberType === "device" && disabledDeviceIds.has(m.memberId)))
			.map((m) => {
			const device = m.memberType === "device" ? $deviceStore[m.memberId] : undefined;
			const name =
				device !== undefined
					? deviceDisplayName(device)
					: (groupsStore.byId.get(m.memberId)?.name ??
						roomsStore.byId.get(m.memberId)?.name ??
						m.memberId);
			const type = device?.type ?? m.memberType;
			const related = allRooms
				.filter((r) =>
					r.members.some((rm) => rm.memberType === "device" && rm.memberId === m.memberId),
				)
				.map((r) => ({ id: r.id, name: r.name, href: `/rooms?edit=${r.id}` }));
			const href = (() => {
				switch (m.memberType) {
					case "device":
						return `/devices/${m.memberId}`;
					case "group":
						return `/groups?edit=${m.memberId}`;
					case "room":
						return `/rooms?edit=${m.memberId}`;
					default:
						return undefined;
				}
			})();
			return { id: m.id, name, type, related, href };
		})
	);

	const mountTimer = measureMount("groups", { ready: () => groupsStore.hydrated, items: () => filteredGroups.length });
	$effect(() => mountTimer.tick());
</script>

<UnsavedGuard dirty={editNameDirty || editIconDirty || editTagsDirty} />

<div>
	{#if errors.message}
		<ErrorBanner class="mb-4" message={errors.message} ondismiss={() => errors.clear()} />
	{/if}

	{#if editingGroup}
		<div in:fly={{ y: -4, duration: 150 }}>

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
							<IconPickerTrigger size="lg" ariaLabel="Change icon">
								<AnimatedIcon icon={editIcon} class="size-5 text-muted-foreground">
									{#snippet fallback()}<GroupIcon class="size-5 text-muted-foreground" />{/snippet}
								</AnimatedIcon>
							</IconPickerTrigger>
						</IconPicker>
						<Input
							id="group-name"
							bind:value={editName}
							oninput={() => (editNameDirty = true)}
							placeholder="Group name"
						/>
					</div>
					<div class="mt-4">
						<p class="mb-2 text-sm font-medium text-foreground">Tags</p>
						<p class="mb-3 text-xs text-muted-foreground">
							Tags determine how the dashboard auto-generates this group. Tag a group
							<span class="font-medium">Light</span> to render its members as a single virtual light.
						</p>
						<GroupTagsSelect
							value={editTags}
							onchange={(next) => {
								editTags = next;
								editTagsDirty = true;
							}}
							disabled={editLoading}
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
	{:else if groupsStore.hydrated}
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
				<div class="mb-6 flex items-stretch gap-2">
					<div class="min-w-0 flex-1">
						<HiveSearchbar
							value={searchState}
							onchange={(v) => (searchState = v)}
							chips={searchChipConfigs}
							placeholder="Search groups..."
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

				{#if filteredGroups.length === 0}
					<div class="rounded-lg shadow-card bg-card p-12 text-center">
						<p class="text-muted-foreground">No groups match your filters.</p>
					</div>
				{:else}
					<ListView mode={view}>
						{#snippet card()}
							<AnimatedGrid>
								{#each filteredGroups as group (group.id)}
									<DeviceCollectionCard
										entity={group}
										devices={flattenGroupDevices(group)}
										fallbackIcon={GroupIcon}
										subtitle="{group.members.length} member{group.members.length === 1 ? '' : 's'}{group.members.length > 0 ? ' · ' + groupMemberBreakdown(group.members) : ''}"
										editHref={`/groups?edit=${encodeURIComponent(group.id)}`}
										ondelete={(g) => (deleteConfirmGroup = g)}
										onrename={handleRename}
										oniconchange={handleIconChange}
										onAddTo={handleAddToGroup}
										onbrightness={(v) => commitGroupBrightness(group, v)}
										ontoggle={(on) => commitGroupToggle(group, on)}
										oncolor={(c) => commitGroupColor(group, c)}
										ontemp={(t) => commitGroupTemp(group, t)}
										addLabel="Add member"
										aggregateTarget={{ kind: "group", id: group.id }}
									/>
								{/each}
							</AnimatedGrid>
						{/snippet}
						{#snippet table()}
							<GroupTable
								groups={filteredGroups}
								{selection}
								ondelete={(g) => (deleteConfirmGroup = g)}
								onrename={handleRename}
								oniconchange={handleIconChange}
								onAddTo={handleAddToGroup}
								getDevices={flattenGroupDevices}
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
					<Input bind:ref={newGroupNameInput} bind:value={newGroupName} placeholder="Group name" autofocus />
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
						<Button
							variant="secondary"
							type="button"
							disabled={!newGroupName.trim() || createLoading}
							onclick={() => handleCreateGroup({ keepOpen: true })}
						>
							Create more
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

		<ConfirmDialog
			open={batchDeleteConfirm}
			title="Delete {selection.count} group{selection.count === 1 ? '' : 's'}?"
			description="This permanently deletes the selected groups and removes their memberships. This cannot be undone."
			confirmLabel="Delete"
			loading={batchDeleteLoading}
			onconfirm={handleBatchDelete}
			oncancel={() => (batchDeleteConfirm = false)}
		/>

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
