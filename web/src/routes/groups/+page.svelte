<script lang="ts">
	import { queryStore, getContextClient, gql } from "@urql/svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetDescription,
	} from "$lib/components/ui/sheet/index.js";
	import GroupCard from "$lib/components/group-card.svelte";
	import MemberPicker from "$lib/components/member-picker.svelte";
	import {
		Plus,
		X,
		Lightbulb,
		Thermometer,
		ToggleLeft,
		Group,
		Package,
		ArrowLeft,
	} from "@lucide/svelte";
	import type { Device } from "$lib/stores/devices";

	interface GroupMember {
		id: string;
		memberType: string;
		memberId: string;
		device: Device | null;
		group: GroupData | null;
	}

	interface GroupData {
		id: string;
		name: string;
		members: GroupMember[];
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
			}
		}
	`;

	const UPDATE_GROUP = gql`
		mutation UpdateGroup($id: ID!, $input: UpdateGroupInput!) {
			updateGroup(id: $id, input: $input) {
				id
				name
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

	const groups = $derived($groupsQuery.data?.groups ?? []);
	const devices = $derived($devicesQuery.data?.devices ?? []);

	let createDialogOpen = $state(false);
	let newGroupName = $state("");
	let createLoading = $state(false);

	let editingGroup = $state<GroupData | null>(null);
	let editName = $state("");
	let editNameDirty = $state(false);
	let editLoading = $state(false);

	let deleteConfirmGroup = $state<GroupData | null>(null);
	let deleteLoading = $state(false);

	let pickerOpen = $state(false);
	let memberActionLoading = $state(false);

	let errorMessage = $state<string | null>(null);

	function clearError() {
		errorMessage = null;
	}

	function dismissErrorAfterDelay() {
		setTimeout(clearError, 5000);
	}

	async function handleCreateGroup() {
		if (!newGroupName.trim()) return;
		createLoading = true;
		clearError();

		const result = await client
			.mutation<CreateGroupResult>(CREATE_GROUP, { input: { name: newGroupName.trim() } })
			.toPromise();

		createLoading = false;

		if (result.error) {
			errorMessage = result.error.message;
			dismissErrorAfterDelay();
			return;
		}

		newGroupName = "";
		createDialogOpen = false;
		groupsQuery.reexecute({ requestPolicy: "network-only" });
	}

	function startEditing(group: GroupData) {
		editingGroup = group;
		editName = group.name;
		editNameDirty = false;
	}

	function stopEditing() {
		editingGroup = null;
		editNameDirty = false;
	}

	async function handleUpdateName() {
		if (!editingGroup || !editName.trim() || editName.trim() === editingGroup.name) return;
		editLoading = true;
		clearError();

		const result = await client
			.mutation<UpdateGroupResult>(UPDATE_GROUP, { id: editingGroup.id, input: { name: editName.trim() } })
			.toPromise();

		editLoading = false;

		if (result.error) {
			errorMessage = result.error.message;
			dismissErrorAfterDelay();
			return;
		}

		editNameDirty = false;
		groupsQuery.reexecute({ requestPolicy: "network-only" });
	}

	async function handleDeleteGroup() {
		if (!deleteConfirmGroup) return;
		deleteLoading = true;
		clearError();

		const result = await client
			.mutation<DeleteGroupResult>(DELETE_GROUP, { id: deleteConfirmGroup.id })
			.toPromise();

		deleteLoading = false;

		if (result.error) {
			errorMessage = result.error.message;
			dismissErrorAfterDelay();
			return;
		}

		if (editingGroup?.id === deleteConfirmGroup.id) {
			stopEditing();
		}
		deleteConfirmGroup = null;
		groupsQuery.reexecute({ requestPolicy: "network-only" });
	}

	async function handleAddMember(memberType: "device" | "group", memberId: string) {
		if (!editingGroup) return;
		memberActionLoading = true;
		clearError();

		const result = await client
			.mutation<AddGroupMemberResult>(ADD_GROUP_MEMBER, {
				input: {
					groupId: editingGroup.id,
					memberType,
					memberId,
				},
			})
			.toPromise();

		memberActionLoading = false;

		if (result.error) {
			errorMessage = result.error.message;
			dismissErrorAfterDelay();
			return;
		}

		pickerOpen = false;
		groupsQuery.reexecute({ requestPolicy: "network-only" });
	}

	async function handleRemoveMember(memberId: string) {
		memberActionLoading = true;
		clearError();

		const result = await client
			.mutation<RemoveGroupMemberResult>(REMOVE_GROUP_MEMBER, { id: memberId })
			.toPromise();

		memberActionLoading = false;

		if (result.error) {
			errorMessage = result.error.message;
			dismissErrorAfterDelay();
			return;
		}

		groupsQuery.reexecute({ requestPolicy: "network-only" });
	}

	const editingGroupFresh = $derived(
		editingGroup ? groups.find((g) => g.id === editingGroup?.id) ?? editingGroup : null
	);

	const existingMemberIds = $derived(
		new Set(editingGroupFresh?.members.map((m) => m.memberId) ?? [])
	);

	const availableDevices = $derived(devices.filter((d) => !existingMemberIds.has(d.id)));

	const availableGroups = $derived(groups.filter((g) => !existingMemberIds.has(g.id)));

	function deviceIcon(type: string): typeof Lightbulb {
		switch (type) {
			case "light":
				return Lightbulb;
			case "sensor":
				return Thermometer;
			case "switch":
				return ToggleLeft;
			default:
				return Package;
		}
	}
</script>

<div>
	{#if errorMessage}
		<div
			class="mb-4 flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		>
			<span>{errorMessage}</span>
			<button type="button" onclick={clearError} class="ml-2 shrink-0">
				<X class="size-4" />
			</button>
		</div>
	{/if}

	{#if editingGroupFresh}
		<div>
			<div class="mb-6 flex items-center gap-3">
				<Button variant="ghost" size="icon-sm" onclick={stopEditing} aria-label="Back to groups">
					<ArrowLeft class="size-4" />
				</Button>
				<h1 class="text-2xl font-semibold">Edit Group</h1>
			</div>

			<div class="space-y-6">
				<div class="rounded-lg border border-border bg-card p-4">
					<label class="mb-2 block text-sm font-medium text-foreground" for="group-name">
						Group Name
					</label>
					<div class="flex gap-2">
						<Input
							id="group-name"
							bind:value={editName}
							oninput={() => (editNameDirty = true)}
							placeholder="Group name"
						/>
						{#if editNameDirty && editName.trim() && editName.trim() !== editingGroupFresh.name}
							<Button onclick={handleUpdateName} disabled={editLoading}>
								{editLoading ? "Saving..." : "Save"}
							</Button>
						{/if}
					</div>
				</div>

				<div class="rounded-lg border border-border bg-card p-4">
					<div class="mb-3 flex items-center justify-between">
						<h2 class="text-sm font-medium text-foreground">
							Members ({editingGroupFresh.members.length})
						</h2>
						<Button variant="outline" size="sm" onclick={() => (pickerOpen = true)}>
							<Plus class="size-4" />
							<span>Add member</span>
						</Button>
					</div>

					{#if editingGroupFresh.members.length === 0}
						<p class="py-6 text-center text-sm text-muted-foreground">
							No members yet. Add devices or groups to this group.
						</p>
					{:else}
						<div class="space-y-1">
							{#each editingGroupFresh.members as member (member.id)}
								<div
									class="flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-muted"
								>
									{#if member.memberType === "device" && member.device}
										{@const Icon = deviceIcon(member.device.type)}
										<Icon class="size-4 text-muted-foreground" />
										<span class="flex-1 truncate text-sm text-foreground">
											{member.device.name}
										</span>
										<Badge variant="secondary" class="text-xs">{member.device.type}</Badge>
									{:else if member.memberType === "group" && member.group}
										<Group class="size-4 text-muted-foreground" />
										<span class="flex-1 truncate text-sm text-foreground">
											{member.group.name}
										</span>
										<Badge variant="outline" class="text-xs">group</Badge>
									{:else}
										<Package class="size-4 text-muted-foreground" />
										<span class="flex-1 truncate text-sm text-muted-foreground">
											Unknown ({member.memberId})
										</span>
									{/if}
									<Button
										variant="ghost"
										size="icon-sm"
										onclick={() => handleRemoveMember(member.id)}
										disabled={memberActionLoading}
										aria-label="Remove member"
									>
										<X class="size-4" />
									</Button>
								</div>

								{#if member.memberType === "group" && member.group && member.group.members.length > 0}
									<div class="ml-8 space-y-0.5 border-l border-border pl-3">
										{#each member.group.members as nested (nested.id)}
											{#if nested.memberType === "device" && nested.device}
												{@const NestedIcon = deviceIcon(nested.device.type)}
												<div
													class="flex items-center gap-2 py-1 text-xs text-muted-foreground"
												>
													<NestedIcon class="size-3" />
													<span class="truncate">{nested.device.name}</span>
												</div>
											{:else if nested.memberType === "group" && nested.group}
												<div
													class="flex items-center gap-2 py-1 text-xs text-muted-foreground"
												>
													<Group class="size-3" />
													<span class="truncate">{nested.group.name}</span>
												</div>
											{/if}
										{/each}
									</div>
								{/if}
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<Sheet bind:open={pickerOpen}>
			<SheetContent side="right" class="w-full sm:max-w-md">
				<SheetHeader>
					<SheetTitle>Add Member</SheetTitle>
					<SheetDescription>Search for devices or groups to add.</SheetDescription>
				</SheetHeader>
				<div class="mt-4">
					<MemberPicker
						devices={availableDevices}
						groups={availableGroups}
						excludeGroupId={editingGroupFresh.id}
						onselect={handleAddMember}
					/>
				</div>
			</SheetContent>
		</Sheet>
	{:else}
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-2xl font-semibold">Groups</h1>
			<Button onclick={() => (createDialogOpen = true)}>
				<Plus class="size-4" />
				<span>Create Group</span>
			</Button>
		</div>

		{#if $groupsQuery.fetching}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each [1, 2, 3] as _ (_.toString())}
					<div class="h-24 animate-pulse rounded-lg border border-border bg-card"></div>
				{/each}
			</div>
		{:else if groups.length === 0}
			<div class="rounded-lg border border-border bg-card p-12 text-center">
				<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
					<Group class="size-6 text-muted-foreground" />
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
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each groups as group (group.id)}
					<GroupCard
						{group}
						onedit={startEditing}
						ondelete={(g) => (deleteConfirmGroup = g)}
					/>
				{/each}
			</div>
		{/if}

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
	{/if}
</div>
