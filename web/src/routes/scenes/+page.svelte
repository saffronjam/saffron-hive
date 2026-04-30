<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount, onDestroy } from "svelte";
	import { fly } from "svelte/transition";
	import { getContextClient } from "@urql/svelte";
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
	import EntityCard from "$lib/components/entity-card.svelte";
	import SceneTable from "$lib/components/scene-table.svelte";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import { sceneTargetBreakdown } from "$lib/list-helpers";
	import { sceneTintColors } from "$lib/device-tint";
	import { parsePayload } from "$lib/scene-editable";
	import TableSelectionToolbar from "$lib/components/table-selection-toolbar.svelte";
	import { createTableSelection } from "$lib/utils/table-selection.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig, SearchState } from "$lib/components/hive-searchbar";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import ListView from "$lib/components/list-view.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import { deviceIcon } from "$lib/utils";
	import { Plus, Clapperboard, Play, Group as GroupIcon, DoorOpen } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { profile, type ListView as ListViewMode } from "$lib/stores/profile.svelte";
	import { BannerError } from "$lib/stores/banner-error.svelte";

	interface SceneAction {
		targetType: string;
		targetId: string;
	}

	interface SceneDevicePayload {
		deviceId: string;
		payload: string;
	}

	interface SceneRoomRef {
		id: string;
		name: string;
		icon?: string | null;
	}

	interface SceneData {
		id: string;
		name: string;
		icon?: string | null;
		rooms: SceneRoomRef[];
		actions: SceneAction[];
		devicePayloads: SceneDevicePayload[];
		effectivePayloads: SceneDevicePayload[];
		createdBy?: { id: string; username: string; name: string } | null;
		activatedAt?: string | null;
	}

	interface ScenesQueryResult {
		scenes: SceneData[];
	}

	interface CreateSceneResult {
		createScene: SceneData;
	}

	interface ApplySceneResult {
		applyScene: SceneData;
	}

	interface DeleteSceneResult {
		deleteScene: boolean;
	}

	const SCENES_QUERY = graphql(`
		query Scenes {
			scenes {
				id
				name
				icon
				rooms {
					id
					name
					icon
				}
				actions {
					targetType
					targetId
				}
				devicePayloads {
					deviceId
					payload
				}
				effectivePayloads {
					deviceId
					payload
				}
				createdBy {
					id
					username
					name
				}
				activatedAt
			}
		}
	`);

	const CREATE_SCENE = graphql(`
		mutation CreateScene($input: CreateSceneInput!) {
			createScene(input: $input) {
				id
				name
				actions {
					targetType
					targetId
				}
				devicePayloads {
					deviceId
					payload
				}
				effectivePayloads {
					deviceId
					payload
				}
				createdBy {
					id
					username
					name
				}
				activatedAt
			}
		}
	`);

	const SCENE_ACTIVE_SUB = graphql(`
		subscription ScenesSceneActiveChanged {
			sceneActiveChanged {
				sceneId
				activatedAt
			}
		}
	`);

	const APPLY_SCENE = graphql(`
		mutation ApplyScene($sceneId: ID!) {
			applyScene(sceneId: $sceneId) {
				id
				name
			}
		}
	`);

	const DELETE_SCENE = graphql(`
		mutation DeleteScene($id: ID!) {
			deleteScene(id: $id)
		}
	`);

	const BATCH_DELETE_SCENES = graphql(`
		mutation BatchDeleteScenes($ids: [ID!]!) {
			batchDeleteScenes(ids: $ids)
		}
	`);

	const UPDATE_SCENE_NAME = graphql(`
		mutation SceneListUpdate($id: ID!, $input: UpdateSceneInput!) {
			updateScene(id: $id, input: $input) {
				id
				name
				icon
			}
		}
	`);

	const DEVICES_QUERY = graphql(`
		query ScenesPageDevices {
			devices {
				id
				name
				icon
				type
				capabilities {
					name
					access
				}
			}
		}
	`);

	const GROUPS_QUERY = graphql(`
		query ScenesPageGroups {
			groups {
				id
				name
				icon
				members {
					memberType
					memberId
				}
			}
		}
	`);

	const ROOMS_QUERY = graphql(`
		query ScenesPageRooms {
			rooms {
				id
				name
				icon
				resolvedDevices {
					id
				}
			}
		}
	`);

	interface DeviceRef {
		id: string;
		name: string;
		icon?: string | null;
		type: string;
		capabilities: { name: string; access: number }[];
	}

	interface GroupRef {
		id: string;
		name: string;
		icon?: string | null;
		members: { memberType: string; memberId: string }[];
	}

	interface RoomRef {
		id: string;
		name: string;
		icon?: string | null;
		resolvedDevices: { id: string }[];
	}

	interface DevicesQueryResult {
		devices: DeviceRef[];
	}

	interface GroupsQueryResult {
		groups: GroupRef[];
	}

	interface RoomsQueryResult {
		rooms: RoomRef[];
	}

	type SceneTargetKind = "device" | "group" | "room";

	function isScenePickerTarget(d: DeviceRef): boolean {
		const has = (n: string) =>
			d.capabilities.some((c) => c.name === n && (c.access & 2) !== 0);
		return has("on_off") || has("state") || has("brightness") || has("color") || has("color_temp");
	}

	const clientRef = getContextClient();
	let scenes = $state<SceneData[]>([]);
	let devicesRef = $state<DeviceRef[]>([]);
	let groupsRef = $state<GroupRef[]>([]);
	let roomsRef = $state<RoomRef[]>([]);
	let loading = $state(true);
	let applyingId = $state<string | null>(null);
	let createDialogOpen = $state(false);
	let newSceneName = $state("");
	let createLoading = $state(false);
	let newSceneNameInput = $state<HTMLInputElement | null>(null);

	let quickAddScene = $state<SceneData | null>(null);
	let quickAddOpen = $state(false);
	let pendingQuickAdds: { targetType: SceneTargetKind; targetId: string }[] = [];
	let quickAddFlushTimer: ReturnType<typeof setTimeout> | null = null;

	const quickAddDrawerGroups = $derived.by((): DrawerGroup<SceneTargetKind>[] => {
		if (!quickAddScene) return [];
		const existing = new Set(quickAddScene.actions.map((a) => `${a.targetType}:${a.targetId}`));
		const result: DrawerGroup<SceneTargetKind>[] = [];

		const devs = devicesRef.filter(
			(d) => isScenePickerTarget(d) && !existing.has(`device:${d.id}`),
		);
		if (devs.length > 0) {
			result.push({
				heading: "Devices",
				items: devs.map((d) => ({
					type: "device" as const,
					id: d.id,
					name: d.name,
					icon: deviceIcon(d.type),
					iconRef: d.icon ?? null,
					searchValue: `${d.name} ${d.type}`,
				})),
			});
		}

		const grps = groupsRef.filter((g) => !existing.has(`group:${g.id}`));
		if (grps.length > 0) {
			result.push({
				heading: "Groups",
				items: grps.map((g) => ({
					type: "group" as const,
					id: g.id,
					name: g.name,
					icon: GroupIcon,
					badge: `${g.members.length} member${g.members.length === 1 ? "" : "s"}`,
				})),
			});
		}

		const rms = roomsRef.filter((r) => !existing.has(`room:${r.id}`));
		if (rms.length > 0) {
			result.push({
				heading: "Rooms",
				items: rms.map((r) => ({
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

	function handleAddToScene(scene: SceneData) {
		quickAddScene = scene;
		quickAddOpen = true;
	}

	function handleQuickAddSelect(targetType: SceneTargetKind, targetId: string) {
		if (!quickAddScene) return;
		pendingQuickAdds.push({ targetType, targetId });
		if (quickAddFlushTimer == null) {
			quickAddFlushTimer = setTimeout(() => {
				quickAddFlushTimer = null;
				void flushQuickAdds();
			}, 0);
		}
	}

	async function flushQuickAdds() {
		if (!clientRef || !quickAddScene || pendingQuickAdds.length === 0) return;
		const scene = quickAddScene;
		const picks = pendingQuickAdds;
		pendingQuickAdds = [];
		const newActions = [
			...scene.actions.map((a) => ({ targetType: a.targetType, targetId: a.targetId })),
			...picks,
		];
		const result = await clientRef
			.mutation(UPDATE_SCENE_NAME, { id: scene.id, input: { actions: newActions } })
			.toPromise();
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
		}
		fetchScenes();
	}

	let view = $state<ListViewMode>(profile.get("view.scenes", "card"));

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Scenes" }];
		pageHeader.actions = [{ label: "Create Scene", icon: Plus, onclick: () => (createDialogOpen = true) }];
	});
	onDestroy(() => pageHeader.reset());

	$effect(() => {
		pageHeader.viewToggle = {
			value: view,
			onchange: (v) => {
				view = v;
				profile.set("view.scenes", v);
			},
		};
	});
	let deleteConfirmScene = $state<SceneData | null>(null);
	let deleteLoading = $state(false);
	const errors = new BannerError();

	const selection = createTableSelection();
	let batchDeleteConfirm = $state(false);
	let batchDeleteLoading = $state(false);

	// Process each subscription event in its own callback — using
	// subscriptionStore + $effect can coalesce rapid events (activate one
	// scene, deactivate another within a few ms) into a single effect run
	// that only sees the latest event, silently losing the other.
	let activeSubHandle: { unsubscribe: () => void } | null = null;
	onMount(() => {
		if (!clientRef) return;
		activeSubHandle = clientRef.subscription(SCENE_ACTIVE_SUB, {}).subscribe((r) => {
			const ev = r.data?.sceneActiveChanged;
			if (!ev) return;
			scenes = scenes.map((s) =>
				s.id === ev.sceneId ? { ...s, activatedAt: ev.activatedAt ?? null } : s,
			);
		});
	});
	onDestroy(() => {
		activeSubHandle?.unsubscribe();
	});

	async function fetchScenes() {
		if (!clientRef) return;
		const result = await clientRef
			.query<ScenesQueryResult>(SCENES_QUERY, {})
			.toPromise();

		loading = false;

		if (result.data) {
			scenes = result.data.scenes;
		}
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
		}
	}

	async function handleCreateScene(options: { keepOpen?: boolean } = {}) {
		if (!clientRef || !newSceneName.trim()) return;
		createLoading = true;
		errors.clear();

		const result = await clientRef
			.mutation<CreateSceneResult>(CREATE_SCENE, {
				input: {
					name: newSceneName.trim(),
					actions: [],
				},
			})
			.toPromise();

		createLoading = false;

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		newSceneName = "";

		if (options.keepOpen) {
			void fetchScenes();
			newSceneNameInput?.focus();
			return;
		}

		createDialogOpen = false;

		if (result.data) {
			goto(`/scenes/${result.data.createScene.id}`);
		}
	}

	async function handleRename(scene: SceneData, newName: string) {
		if (!clientRef) return;
		errors.clear();

		const result = await clientRef
			.mutation(UPDATE_SCENE_NAME, { id: scene.id, input: { name: newName } })
			.toPromise();

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		scenes = scenes.map((s) => (s.id === scene.id ? { ...s, name: newName } : s));
	}

	async function handleIconChange(scene: SceneData, icon: string | null) {
		if (!clientRef) return;
		errors.clear();

		const result = await clientRef
			.mutation(UPDATE_SCENE_NAME, { id: scene.id, input: { icon } })
			.toPromise();

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		scenes = scenes.map((s) => (s.id === scene.id ? { ...s, icon } : s));
	}

	async function handleApply(scene: SceneData) {
		if (!clientRef) return;
		applyingId = scene.id;
		errors.clear();

		// Optimistic flip: the card transitions to active immediately instead of
		// waiting for the sceneActiveChanged subscription event to round-trip.
		// The subscription stays authoritative and will correct the local value
		// on failure or if another client invalidates.
		const previousActivatedAt = scene.activatedAt ?? null;
		const optimisticAt = new Date().toISOString();
		scenes = scenes.map((s) => (s.id === scene.id ? { ...s, activatedAt: optimisticAt } : s));

		try {
			const result = await clientRef
				.mutation<ApplySceneResult>(APPLY_SCENE, { sceneId: scene.id })
				.toPromise();
			if (result.error) {
				scenes = scenes.map((s) =>
					s.id === scene.id ? { ...s, activatedAt: previousActivatedAt } : s,
				);
				errors.setWithAutoDismiss(result.error.message);
			}
		} finally {
			applyingId = null;
		}
	}

	async function handleDelete() {
		if (!clientRef || !deleteConfirmScene) return;
		deleteLoading = true;
		errors.clear();

		const result = await clientRef
			.mutation<DeleteSceneResult>(DELETE_SCENE, { id: deleteConfirmScene.id })
			.toPromise();

		deleteLoading = false;

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		deleteConfirmScene = null;
		fetchScenes();
	}

	function handleEdit(scene: SceneData) {
		goto(`/scenes/${scene.id}`);
	}

	async function fetchDevices() {
		if (!clientRef) return;
		const result = await clientRef.query<DevicesQueryResult>(DEVICES_QUERY, {}).toPromise();
		if (result.data) devicesRef = result.data.devices;
	}

	async function fetchGroups() {
		if (!clientRef) return;
		const result = await clientRef.query<GroupsQueryResult>(GROUPS_QUERY, {}).toPromise();
		if (result.data) groupsRef = result.data.groups;
	}

	async function fetchRooms() {
		if (!clientRef) return;
		const result = await clientRef.query<RoomsQueryResult>(ROOMS_QUERY, {}).toPromise();
		if (result.data) roomsRef = result.data.rooms;
	}

	let searchState = $state<SearchState>({ chips: [], freeText: "" });

	const targetOptions = [
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
			keyword: "target",
			label: "Target",
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return q
					? targetOptions.filter((o) => o.value.includes(q) || o.label.toLowerCase().includes(q))
					: targetOptions;
			},
		},
		{
			keyword: "device",
			label: "Device",
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return devicesRef
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

	const filteredScenes = $derived.by(() => {
		const targetValues = searchState.chips.filter((c) => c.keyword === "target").map((c) => c.value);
		const deviceValues = searchState.chips
			.filter((c) => c.keyword === "device")
			.map((c) => c.value.toLowerCase());
		const emptyValues = searchState.chips.filter((c) => c.keyword === "empty").map((c) => c.value);
		const query = searchState.freeText.toLowerCase();

		const deviceIdByNameLower = new Map<string, string>();
		for (const d of devicesRef) deviceIdByNameLower.set(d.name.toLowerCase(), d.id);

		return scenes.filter((s) => {
			if (targetValues.length > 0 && !s.actions.some((a) => targetValues.includes(a.targetType)))
				return false;
			if (deviceValues.length > 0) {
				const matches = deviceValues.some((v) =>
					s.actions.some((a) => {
						if (a.targetType !== "device") return false;
						const device = devicesRef.find((d) => d.id === a.targetId);
						return device ? device.name.toLowerCase().includes(v) : false;
					}),
				);
				if (!matches) return false;
			}
			if (emptyValues.length > 0) {
				const isEmpty = s.actions.length === 0;
				const wants = emptyValues.some((v) => (v === "yes" ? isEmpty : !isEmpty));
				if (!wants) return false;
			}
			if (query && !s.name.toLowerCase().includes(query)) return false;
			return true;
		});
	});

	const filteredIds = $derived(filteredScenes.map((s) => s.id));
	$effect(() => {
		selection.pruneTo(filteredIds);
	});

	async function handleBatchDelete() {
		if (!clientRef) return;
		const ids = selection.selectedIds();
		if (ids.length === 0) {
			batchDeleteConfirm = false;
			return;
		}
		batchDeleteLoading = true;
		errors.clear();
		const result = await clientRef.mutation(BATCH_DELETE_SCENES, { ids }).toPromise();
		batchDeleteLoading = false;
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}
		batchDeleteConfirm = false;
		selection.clear();
		fetchScenes();
	}

	onMount(() => {
		fetchScenes();
		fetchDevices();
		fetchGroups();
		fetchRooms();
	});
</script>

<div>
	{#if errors.message}
		<ErrorBanner class="mb-4" message={errors.message} ondismiss={() => errors.clear()} />
	{/if}


	{#if !loading}
		<div in:fly={{ y: -4, duration: 150 }}>
			{#if scenes.length === 0}
				<div class="rounded-lg shadow-card bg-card p-12 text-center">
					<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<Clapperboard class="size-6 text-muted-foreground" />
					</div>
					<p class="text-muted-foreground">No scenes yet.</p>
					<p class="mt-2 text-sm text-muted-foreground">
						Create a scene to save device state presets and apply them with a single action.
					</p>
					<Button class="mt-4" onclick={() => (createDialogOpen = true)}>
						<Plus class="size-4" />
						<span>Create your first scene</span>
					</Button>
				</div>
			{:else}
				<div class="mb-6 flex items-stretch gap-2">
					<div class="min-w-0 flex-1">
						<HiveSearchbar
							value={searchState}
							onchange={(v) => (searchState = v)}
							chips={searchChipConfigs}
							placeholder="Search scenes..."
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

				{#if filteredScenes.length === 0}
					<div class="rounded-lg shadow-card bg-card p-12 text-center">
						<p class="text-muted-foreground">No scenes match your filters.</p>
					</div>
				{:else}
					<ListView mode={view}>
						{#snippet card()}
							<AnimatedGrid>
								{#each filteredScenes as scene (scene.id)}
									{@const noTargets = scene.actions.length === 0}
									{@const applying = applyingId === scene.id}
									{@const active = scene.activatedAt != null}
									{@const tintColors = sceneTintColors(scene.effectivePayloads.map((p) => parsePayload(p.payload)))}
									<EntityCard
										entity={scene}
										fallbackIcon={Clapperboard}
										subtitle="{scene.actions.length} target{scene.actions.length === 1 ? '' : 's'}{scene.actions.length > 0 ? ' · ' + sceneTargetBreakdown(scene.actions) : ''}"
										tintColors={tintColors.length > 0 ? tintColors : null}
										tintInactive={tintColors.length > 0 ? !active : null}
										onrename={handleRename}
										oniconchange={handleIconChange}
										onedit={handleEdit}
										ondelete={(s) => (deleteConfirmScene = s)}
										onAddTo={handleAddToScene}
										addLabel="Add target"
									>
										{#snippet subtitleTrailing()}
											{#if scene.rooms.length > 0}
												<span class="text-muted-foreground/70">
													· {scene.rooms.map((r) => r.name).join(", ")}
												</span>
											{/if}
										{/snippet}
										{#snippet leadingActions()}
											<Button
												variant="ghost"
												size="icon-sm"
												onclick={() => handleApply(scene)}
												disabled={applying || noTargets || active}
												class="transition-opacity duration-200"
												aria-label="Apply scene"
											>
												<Play class="size-4" />
											</Button>
										{/snippet}
									</EntityCard>
								{/each}
							</AnimatedGrid>
						{/snippet}
						{#snippet table()}
							<SceneTable
								scenes={filteredScenes}
								{selection}
								{applyingId}
								onapply={handleApply}
								onedit={handleEdit}
								ondelete={(s) => (deleteConfirmScene = s)}
								onrename={handleRename}
								oniconchange={handleIconChange}
								onAddTo={handleAddToScene}
							/>
						{/snippet}
					</ListView>
				{/if}
			{/if}
		</div>
	{/if}

	<Dialog bind:open={createDialogOpen}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Create Scene</DialogTitle>
				<DialogDescription>
					Give your new scene a name. You can add targets and configure states in the editor.
				</DialogDescription>
			</DialogHeader>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleCreateScene();
				}}
			>
				<Input bind:ref={newSceneNameInput} bind:value={newSceneName} placeholder="Scene name" autofocus />
				<DialogFooter class="mt-4">
					<Button
						variant="outline"
						type="button"
						onclick={() => {
							createDialogOpen = false;
							newSceneName = "";
						}}
					>
						Cancel
					</Button>
					<Button
						variant="secondary"
						type="button"
						disabled={!newSceneName.trim() || createLoading}
						onclick={() => handleCreateScene({ keepOpen: true })}
					>
						Create more
					</Button>
					<Button type="submit" disabled={!newSceneName.trim() || createLoading}>
						{createLoading ? "Creating..." : "Create"}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>

	<ConfirmDialog
		bind:open={() => deleteConfirmScene !== null, (v) => { if (!v) deleteConfirmScene = null; }}
		title="Delete Scene"
		description='Are you sure you want to delete "{deleteConfirmScene?.name ?? ""}"? This action cannot be undone.'
		confirmLabel="Delete"
		loading={deleteLoading}
		onconfirm={handleDelete}
		oncancel={() => (deleteConfirmScene = null)}
	/>

	<ConfirmDialog
		open={batchDeleteConfirm}
		title="Delete {selection.count} scene{selection.count === 1 ? '' : 's'}?"
		description="This permanently deletes the selected scenes and all their actions. This cannot be undone."
		confirmLabel="Delete"
		loading={batchDeleteLoading}
		onconfirm={handleBatchDelete}
		oncancel={() => (batchDeleteConfirm = false)}
	/>

	<HiveDrawer
		bind:open={quickAddOpen}
		title={quickAddScene ? `Add targets to ${quickAddScene.name}` : "Add targets"}
		description="Pick devices, groups, or rooms to include in this scene."
		multiple
		groups={quickAddDrawerGroups}
		onselect={handleQuickAddSelect}
	/>
</div>
