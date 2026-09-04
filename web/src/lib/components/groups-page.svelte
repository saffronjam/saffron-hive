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
	import type { ChipConfig } from "$lib/components/hive-searchbar";
	import { createUrlSearchState } from "$lib/search-state.svelte";
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
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import { profile, type ListView as ListViewMode } from "$lib/stores/profile.svelte";
	import {
		Plus,
		Group as GroupIcon,
		DoorOpen,
		Info,
		X,
	} from "@lucide/svelte";
	import { deviceIcon, deviceDisplayName, entityDisplayName, groupDisplayName } from "$lib/utils";
	import { fly } from "svelte/transition";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { BannerError } from "$lib/stores/banner-error.svelte";
	import { deviceStore, isRuntimeEnabledDevice, type Device } from "$lib/stores/devices";
	import { groupsStore, type Group, type GroupMember } from "$lib/stores/groups.svelte";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { CommandTargetType } from "$lib/gql/graphql";
	import { m } from "$lib/paraglide/messages.js";
	import { locale } from "$lib/i18n/locale.svelte";
	import { localizedNamesStore } from "$lib/stores/localized-names.svelte";

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
	// Runtime-disabled devices leave this page entirely: no member row, no picker
	// entry, no contribution to a group's readings or command fan-out.
	const devices = $derived(Object.values($deviceStore).filter(isRuntimeEnabledDevice));
	const disabledDeviceIds = $derived(
		new Set(
			Object.values($deviceStore)
				.filter((d) => !isRuntimeEnabledDevice(d))
				.map((d) => d.id),
		),
	);
	const allRooms = $derived(roomsStore.items);

	function flattenGroupDevices(group: Group): Device[] {
		return flattenGroupDevicesShared(group, devices, groups, allRooms);
	}

	async function commitGroupBrightness(group: Group, brightness: number) {
		await commitGroupBrightnessShared(client, flattenGroupDevices(group), brightness, { targetType: CommandTargetType.Group, targetId: group.id });
	}

	async function commitGroupToggle(group: Group, on: boolean) {
		await commitGroupToggleShared(client, flattenGroupDevices(group), on, { targetType: CommandTargetType.Group, targetId: group.id });
	}

	async function commitGroupColor(group: Group, color: { r: number; g: number; b: number }) {
		await commitGroupColorShared(client, flattenGroupDevices(group), color, { targetType: CommandTargetType.Group, targetId: group.id });
	}

	async function commitGroupTemp(group: Group, mired: number) {
		await commitGroupTempShared(client, flattenGroupDevices(group), mired, { targetType: CommandTargetType.Group, targetId: group.id });
	}

	const searchController = createUrlSearchState({
		active: () => visible && page.url.pathname === "/groups",
	});

	const emptyOptions = $derived([
		{ value: "yes", label: m.common_yes({}, locale.messageOptions()) },
		{ value: "no", label: m.common_no({}, locale.messageOptions()) },
	]);
	const sourceOptions = $derived([
		{ value: "hive", label: "Hive" },
		{ value: "zigbee2mqtt", label: "Zigbee" },
	]);

	const searchChipConfigs: ChipConfig[] = $derived([
		{
			keyword: "device",
			label: m.field_device({}, locale.messageOptions()),
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return devices
					.filter(
						(d) =>
							!q ||
							localizedNamesStore.matches("device", d.id, q, d.name, d.friendlyName),
					)
					.map((d) => ({ value: d.id, label: deviceDisplayName(d) }));
			},
			resolveLabel: (id: string) => {
				const device = devices.find((item) => item.id === id);
				return device ? deviceDisplayName(device) : null;
			},
		},
		{
			keyword: "room",
			label: m.room_generic({}, locale.messageOptions()),
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return allRooms
					.filter((r) => !q || localizedNamesStore.matches("room", r.id, q, r.name))
					.map((r) => ({ value: r.id, label: entityDisplayName("room", r) }));
			},
			resolveLabel: (id: string) => {
				const room = allRooms.find((item) => item.id === id);
				return room ? entityDisplayName("room", room) : null;
			},
		},
		{
			keyword: "source",
			label: m.field_source({}, locale.messageOptions()),
			variant: "secondary",
			options: () => sourceOptions,
			resolveLabel: (value: string) => sourceOptions.find((option) => option.value === value)?.label ?? null,
		},
		{
			keyword: "empty",
			label: m.field_empty({}, locale.messageOptions()),
			variant: "secondary",
			options: () => emptyOptions,
		},
	]);

	const filteredGroups = $derived.by(() => {
		const deviceValues = searchController.value.chips
			.filter((c) => c.keyword === "device")
			.map((c) => c.value.toLowerCase());
		const roomValues = searchController.value.chips
			.filter((c) => c.keyword === "room")
			.map((c) => c.value.toLowerCase());
		const emptyValues = searchController.value.chips.filter((c) => c.keyword === "empty").map((c) => c.value);
		const sourceValues = searchController.value.chips.filter((c) => c.keyword === "source").map((c) => c.value);
		const query = searchController.value.freeText.toLowerCase();

		return groups.filter((g) => {
			if (sourceValues.length > 0 && !sourceValues.includes(g.source)) return false;
			if (
				deviceValues.length > 0 &&
				!deviceValues.some((v) =>
					g.members.some(
						(m) =>
							m.memberType === "device" &&
							m.memberId === v,
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
							m.memberId === v,
					),
				)
			)
				return false;
			if (emptyValues.length > 0) {
				const isEmpty = g.members.length === 0;
				const wants = emptyValues.some((v) => (v === "yes" ? isEmpty : !isEmpty));
				if (!wants) return false;
			}
			if (query && !localizedNamesStore.matches("group", g.id, query, g.name, g.friendlyName)) return false;
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
	$effect(() => selection.setDisabled(groups.filter((group) => group.source !== "hive").map((group) => group.id)));
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
				heading: m.nav_devices({}, locale.messageOptions()),
				items: devAvail.map((d) => ({
					type: "device" as const,
					id: d.id,
					name: deviceDisplayName(d),
					icon: deviceIcon(d.type, d.roles.contact),
					iconRef: d.icon ?? null,
					searchValue: `${localizedNamesStore.searchValues("device", d.id, d.name, d.friendlyName).join(" ")} ${d.type}`,
				})),
			});
		}
		if (grpAvail.length > 0) {
			result.push({
				heading: m.nav_groups({}, locale.messageOptions()),
				items: grpAvail.map((g) => ({
					type: "group" as const,
					id: g.id,
					name: groupDisplayName(g),
					icon: GroupIcon,
					badge: m.shared_member_count({ count: g.members.length }, locale.messageOptions()),
				})),
			});
		}
		if (roomAvail.length > 0) {
			result.push({
				heading: m.nav_rooms({}, locale.messageOptions()),
				items: roomAvail.map((r) => ({
					type: "room" as const,
					id: r.id,
					name: entityDisplayName("room", r),
					icon: DoorOpen,
					badge: m.shared_device_count({ count: r.resolvedDevices.length }, locale.messageOptions()),
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
			console.error(e);
			errors.setWithAutoDismiss(m.member_add_failed({}, locale.messageOptions()));
		}
	}

	const errors = new BannerError();

	const hasPendingChanges = $derived(
		editNameDirty || editIconDirty || editTagsDirty || pendingAdds.length > 0 || pendingRemovals.size > 0
	);
	const providerManaged = $derived(editingGroup?.source === "zigbee2mqtt");

	const urlEditId = $derived(page.url.searchParams.get("edit"));

	$effect(() => {
		if (!visible) return;
		if (editingGroup) {
			pageHeader.breadcrumbs = [{ label: m.nav_groups({}, locale.messageOptions()), onclick: stopEditing }, { label: groupDisplayName(editingGroup) }];
			pageHeader.actions = [
				{ label: m.common_cancel({}, locale.messageOptions()), icon: X, variant: "outline" as const, onclick: stopEditing, hideLabelOnMobile: true },
				{ label: m.common_save({}, locale.messageOptions()), saving: editLoading, onclick: handleSaveGroup, disabled: !hasPendingChanges || editLoading || (editingGroup.source === "hive" && !editName.trim()), hideLabelOnMobile: true },
			];
			pageHeader.viewToggle = null;
		} else if (urlEditId) {
			pageHeader.breadcrumbs = [{ label: m.nav_groups({}, locale.messageOptions()), onclick: stopEditing }, { label: "…" }];
			pageHeader.actions = [];
			pageHeader.viewToggle = null;
		} else {
			pageHeader.breadcrumbs = [{ label: m.nav_groups({}, locale.messageOptions()) }];
			pageHeader.actions = [{ label: m.group_create({}, locale.messageOptions()), mobileLabel: m.group_create({}, locale.messageOptions()), icon: Plus, onclick: () => (createDialogOpen = true) }];
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
			console.error(e);
			errors.setWithAutoDismiss(m.group_create_failed({}, locale.messageOptions()));
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
		goto(editGroupHref(group.id), { keepFocus: true, noScroll: true });
	}

	function editGroupHref(id: string): string {
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
			editName = match.name ?? "";
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
			const nameDirty = editNameDirty;
			if (nameDirty || editIconDirty || editTagsDirty) {
				const input: { name?: string | null; icon?: string | null; tags?: GroupTag[] } = {};
				if (nameDirty) input.name = editName.trim() || null;
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
			console.error(e);
			errors.setWithAutoDismiss(m.group_save_failed({}, locale.messageOptions()));
			return;
		}

		editingGroup = latest;
		editName = latest.name ?? "";
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
			console.error(e);
			errors.setWithAutoDismiss(m.group_delete_many_failed({}, locale.messageOptions()));
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
			console.error(e);
			errors.setWithAutoDismiss(m.group_delete_failed({}, locale.messageOptions()));
			return;
		}

		deleteLoading = false;
		if (editingGroup?.id === deleteConfirmGroup.id) {
			stopEditing();
		}
		deleteConfirmGroup = null;
	}

	function handleAddMember(memberType: "device" | "group" | "room", memberId: string) {
		if (!editingGroup || providerManaged) return;
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
			console.error(e);
			errors.setWithAutoDismiss(m.group_rename_failed({}, locale.messageOptions()));
		}
	}

	async function handleIconChange(group: Group, icon: string | null) {
		errors.clear();
		try {
			await groupsStore.update(client, group.id, { icon });
		} catch (e) {
			console.error(e);
			errors.setWithAutoDismiss(m.icon_change_failed({}, locale.messageOptions()));
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
			result.push({ heading: m.nav_devices({}, locale.messageOptions()), items: availableDevices.map((d) => ({
				type: "device" as const, id: d.id, name: deviceDisplayName(d),
				icon: deviceIcon(d.type, d.roles.contact), iconRef: d.icon ?? null,
				searchValue: `${localizedNamesStore.searchValues("device", d.id, d.name, d.friendlyName).join(" ")} ${d.type}`,
			}))});
		}
		if (availableGroups.length > 0) {
			result.push({ heading: m.nav_groups({}, locale.messageOptions()), items: availableGroups.map((g) => ({
				type: "group" as const, id: g.id, name: groupDisplayName(g), icon: GroupIcon,
				searchValue: localizedNamesStore.searchValues("group", g.id, g.name, g.friendlyName).join(" "),
				badge: m.shared_member_count({ count: g.members.length }, locale.messageOptions()),
			}))});
		}
		if (availableRooms.length > 0) {
			result.push({ heading: m.nav_rooms({}, locale.messageOptions()), items: availableRooms.map((r) => ({
				type: "room" as const, id: r.id, name: entityDisplayName("room", r), icon: DoorOpen,
				searchValue: localizedNamesStore.searchValues("room", r.id, r.name).join(" "),
				badge: m.shared_device_count({ count: r.resolvedDevices.length }, locale.messageOptions()),
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
					: (() => {
							const group = groupsStore.byId.get(m.memberId);
							return group
								? groupDisplayName(group)
								: (() => {
									const room = roomsStore.byId.get(m.memberId);
									return room ? entityDisplayName("room", room) : m.memberId;
								})();
						})();
			const type = device?.type ?? m.memberType;
			const related = allRooms
				.filter((r) =>
					r.members.some((rm) => rm.memberType === "device" && rm.memberId === m.memberId),
				)
				.map((r) => ({ id: r.id, name: entityDisplayName("room", r), href: `/rooms?edit=${r.id}` }));
			const href = (() => {
				switch (m.memberType) {
					case "device":
						return `/devices/${m.memberId}`;
					case "group":
						return editGroupHref(m.memberId);
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

<UnsavedGuard dirty={hasPendingChanges} />

<div>
	{#if errors.message}
		<ErrorBanner class="mb-4" message={errors.message} ondismiss={() => errors.clear()} />
	{/if}

	{#if editingGroup}
		<div class="mx-auto max-w-6xl" in:fly={{ y: -4, duration: 150 }}>

			<div class="space-y-6">
				<div class="rounded-lg shadow-card bg-card p-4">
					<div class="mb-2 flex items-center gap-2">
						<label class="block text-sm font-medium text-foreground" for="group-name">{m.group_name({}, locale.messageOptions())}</label>
						{#if providerManaged}<HiveChip type="hub" label={m.group_managed_zigbee({}, locale.messageOptions())} />{/if}
					</div>
					<div class="flex items-center gap-3">
						<IconPicker
							value={editIcon}
							onselect={(icon) => {
								editIcon = icon;
								editIconDirty = true;
							}}
						>
							<IconPickerTrigger size="lg" ariaLabel={m.icon_change({}, locale.messageOptions())}>
								<AnimatedIcon icon={editIcon} class="size-5 text-muted-foreground">
									{#snippet fallback()}<GroupIcon class="size-5 text-muted-foreground" />{/snippet}
								</AnimatedIcon>
							</IconPickerTrigger>
						</IconPicker>
						<Input
							id="group-name"
							bind:value={editName}
							oninput={() => (editNameDirty = editName !== (editingGroup?.name ?? ""))}
							placeholder={editingGroup.friendlyName || m.group_name({}, locale.messageOptions())}
						/>
					</div>
					<div class="mt-4">
						<div class="mb-2 flex items-center gap-1.5">
							<p class="text-sm font-medium text-foreground">{m.group_tags({}, locale.messageOptions())}</p>
							<Tooltip>
								<TooltipTrigger class="text-muted-foreground" aria-label={m.group_tags_about({}, locale.messageOptions())}>
									<Info class="size-3.5" />
								</TooltipTrigger>
								<TooltipContent>{m.group_tags_help({}, locale.messageOptions())}</TooltipContent>
							</Tooltip>
						</div>
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
						relatedLabel={m.nav_rooms({}, locale.messageOptions())}
						emptyMessage={providerManaged ? m.group_members_none({}, locale.messageOptions()) : m.group_members_empty({}, locale.messageOptions())}
						addLabel={m.group_member_add({}, locale.messageOptions())}
						onadd={providerManaged ? undefined : () => (pickerOpen = true)}
						onremove={providerManaged ? undefined : handleRemoveMember}
						disabled={editLoading}
					/>
				</div>
			</div>
		</div>

		{#if !providerManaged}
			<HiveDrawer
				bind:open={pickerOpen}
				title={m.group_member_add({}, locale.messageOptions())}
				description={m.group_add_search_description({}, locale.messageOptions())}
				multiple
				groups={pickerDrawerGroups}
				onselect={handleAddMember}
			/>
		{/if}
	{:else if groupsStore.hydrated}
		<div in:fly={{ y: -4, duration: 150 }}>
			{#if groups.length === 0}
				<div class="rounded-lg shadow-card bg-card p-12 text-center">
					<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<GroupIcon class="size-6 text-muted-foreground" />
					</div>
					<p class="text-muted-foreground">{m.group_none({}, locale.messageOptions())}</p>
					<p class="mt-2 text-sm text-muted-foreground">
						{m.group_none_help({}, locale.messageOptions())}
					</p>
					<Button class="mt-4" onclick={() => (createDialogOpen = true)}>
						<Plus class="size-4" />
						<span>{m.group_create_first({}, locale.messageOptions())}</span>
					</Button>
				</div>
			{:else}
				<div class="mb-6 flex items-stretch gap-2">
					<div class="min-w-0 flex-1">
						<HiveSearchbar
							controller={searchController}
							chips={searchChipConfigs}
							placeholder={m.group_search({}, locale.messageOptions())}
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
									{m.common_delete({}, locale.messageOptions())}
								</Button>
							{/snippet}
						</TableSelectionToolbar>
					</div>
				</div>

				{#if filteredGroups.length === 0}
					<div class="rounded-lg shadow-card bg-card p-12 text-center">
						<p class="text-muted-foreground">{m.group_no_match({}, locale.messageOptions())}</p>
					</div>
				{:else}
					<ListView mode={view}>
						{#snippet card()}
							<AnimatedGrid>
								{#each filteredGroups as group (group.id)}
									<DeviceCollectionCard
										entity={group}
										entityType="group"
										devices={flattenGroupDevices(group)}
										fallbackIcon={GroupIcon}
										source={group.source}
										stateSummary
										editHref={editGroupHref(group.id)}
										ondelete={group.source === "hive" ? (g) => (deleteConfirmGroup = g) : undefined}
						onrename={handleRename}
										oniconchange={handleIconChange}
										onAddTo={group.source === "hive" ? handleAddToGroup : undefined}
										onbrightness={(v) => commitGroupBrightness(group, v)}
										ontoggle={(on) => commitGroupToggle(group, on)}
										oncolor={(c) => commitGroupColor(group, c)}
										ontemp={(t) => commitGroupTemp(group, t)}
										addLabel={m.group_member_add({}, locale.messageOptions())}
										aggregateTarget={{ kind: "group", id: group.id }}
									/>
								{/each}
							</AnimatedGrid>
						{/snippet}
						{#snippet table()}
							<GroupTable
								groups={filteredGroups}
								{selection}
								editHref={(group) => editGroupHref(group.id)}
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
					<DialogTitle>{m.group_create({}, locale.messageOptions())}</DialogTitle>
					<DialogDescription>{m.group_create_description({}, locale.messageOptions())}</DialogDescription>
				</DialogHeader>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleCreateGroup();
					}}
				>
					<Input bind:ref={newGroupNameInput} bind:value={newGroupName} placeholder={m.group_name({}, locale.messageOptions())} autofocus />
					<DialogFooter class="mt-4">
						<Button
							variant="outline"
							type="button"
							onclick={() => {
								createDialogOpen = false;
								newGroupName = "";
							}}
						>
							{m.common_cancel({}, locale.messageOptions())}
						</Button>
						<Button
							variant="secondary"
							type="button"
							disabled={!newGroupName.trim() || createLoading}
							onclick={() => handleCreateGroup({ keepOpen: true })}
						>
							{m.group_create_more({}, locale.messageOptions())}
						</Button>
						<Button type="submit" disabled={!newGroupName.trim() || createLoading}>
							{createLoading ? m.group_creating({}, locale.messageOptions()) : m.group_create({}, locale.messageOptions())}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>

		<Dialog bind:open={() => deleteConfirmGroup !== null, (v) => { if (!v) deleteConfirmGroup = null; }}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{m.group_delete({}, locale.messageOptions())}</DialogTitle>
					<DialogDescription>
						{m.group_delete_named({ name: deleteConfirmGroup ? groupDisplayName(deleteConfirmGroup) : "" }, locale.messageOptions())} {m.group_delete_description({}, locale.messageOptions())}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onclick={() => (deleteConfirmGroup = null)}>
						{m.common_cancel({}, locale.messageOptions())}
					</Button>
					<Button variant="destructive" onclick={handleDeleteGroup} disabled={deleteLoading}>
						{deleteLoading ? m.common_loading({}, locale.messageOptions()) : m.common_delete({}, locale.messageOptions())}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<ConfirmDialog
			open={batchDeleteConfirm}
			title={m.group_delete_many_title({ count: selection.count }, locale.messageOptions())}
			description={m.group_delete_many_description({}, locale.messageOptions())}
			confirmLabel={m.common_delete({}, locale.messageOptions())}
			loading={batchDeleteLoading}
			onconfirm={handleBatchDelete}
			oncancel={() => (batchDeleteConfirm = false)}
		/>

		<HiveDrawer
			bind:open={quickAddOpen}
			title={quickAddGroup ? m.group_add_named({ name: groupDisplayName(quickAddGroup) }, locale.messageOptions()) : m.group_add_generic({}, locale.messageOptions())}
			description={m.group_add_description({}, locale.messageOptions())}
			multiple
			groups={quickAddDrawerGroups}
			onselect={handleQuickAddSelect}
		/>
	{/if}
</div>
