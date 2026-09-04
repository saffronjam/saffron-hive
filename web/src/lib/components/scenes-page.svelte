<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { delayedLoading } from "$lib/delayed-loading.svelte";
	import { measureMount } from "$lib/perf";
	import { fly } from "svelte/transition";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import EntityCard from "$lib/components/entity-card.svelte";
	import SceneTable from "$lib/components/scene-table.svelte";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import { sceneRoomLabel } from "$lib/list-helpers";
	import { scenePreviewColors } from "$lib/device-tint";
	import TableSelectionToolbar from "$lib/components/table-selection-toolbar.svelte";
	import { createTableSelection } from "$lib/utils/table-selection.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig } from "$lib/components/hive-searchbar";
	import { createUrlSearchState } from "$lib/search-state.svelte";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import ListView from "$lib/components/list-view.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import { deviceStore, isRuntimeEnabledDevice, type Device } from "$lib/stores/devices";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { scenesStore, type Scene as SceneData } from "$lib/stores/scenes.svelte";
	import { vibeCatalog } from "$lib/stores/vibe-catalog.svelte";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import { groupsStore } from "$lib/stores/groups.svelte";
	import { deviceIcon, deviceDisplayName, entityDisplayName, groupDisplayName } from "$lib/utils";
	import { localizedNamesStore } from "$lib/stores/localized-names.svelte";
	import { Plus, Clapperboard, Play, Square, Group as GroupIcon, DoorOpen } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { profile, type ListView as ListViewMode } from "$lib/stores/profile.svelte";
	import { BannerError } from "$lib/stores/banner-error.svelte";
	import {
		SceneLightOverrideKind,
		SceneTargetType,
		type DesiredSceneStateInput,
		type SceneDefinitionInput,
	} from "$lib/gql/graphql";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		/**
		 * Whether this is the page the user is on. The component outlives
		 * navigation — the layout keeps it mounted after the first visit — so
		 * shared surfaces (the page header) and timers gate on this.
		 */
		visible: boolean;
	}

	let { visible }: Props = $props();

	type SceneTargetKind = "device" | "group" | "room";

	function isScenePickerTarget(d: Device): boolean {
		const has = (n: string) =>
			d.capabilities.some((c) => c.name === n && c.canSet);
		return has("on_off") || has("state") || has("brightness") || has("color") || has("color_temp");
	}

	const clientRef = getContextClient();
	const loader = delayedLoading(() => !scenesStore.hydrated && scenesStore.error === null);
	const scenes = $derived(scenesStore.items);
	const devicesRef = $derived(Object.values($deviceStore).filter(isRuntimeEnabledDevice));
	const groupsRef = $derived(groupsStore.items);
	const roomsRef = $derived(roomsStore.items);
	let applyingId = $state<string | null>(null);
	let quickAddScene = $state<SceneData | null>(null);
	let quickAddOpen = $state(false);
	let pendingQuickAdds: { targetType: SceneTargetKind; targetId: string }[] = [];
	let quickAddFlushTimer: ReturnType<typeof setTimeout> | null = null;

	const quickAddDrawerGroups = $derived.by((): DrawerGroup<SceneTargetKind>[] => {
		void locale.currentLanguage;
		if (!quickAddScene) return [];
		const existing = new Set(quickAddScene.targets.map((a) => `${a.targetType}:${a.targetId}`));
		const result: DrawerGroup<SceneTargetKind>[] = [];

		const devs = devicesRef.filter(
			(d) => isScenePickerTarget(d) && !existing.has(`device:${d.id}`),
		);
		if (devs.length > 0) {
			result.push({
				heading: m.scenes_devices({}, locale.messageOptions()),
				items: devs.map((d) => ({
					type: "device" as const,
					id: d.id,
					name: deviceDisplayName(d),
					icon: deviceIcon(d.type, d.roles.contact),
					iconRef: d.icon ?? null,
					searchValue: `${localizedNamesStore.searchValues("device", d.id, d.name, d.friendlyName).join(" ")} ${d.type}`,
				})),
			});
		}

		const grps = groupsRef.filter((g) => !existing.has(`group:${g.id}`));
		if (grps.length > 0) {
			result.push({
				heading: m.scenes_groups({}, locale.messageOptions()),
				items: grps.map((g) => ({
					type: "group" as const,
					id: g.id,
					name: groupDisplayName(g),
					icon: GroupIcon,
					searchValue: localizedNamesStore.searchValues("group", g.id, g.name, g.friendlyName).join(" "),
					badge: m.scenes_member_count({ count: g.members.length }, locale.messageOptions()),
				})),
			});
		}

		const rms = roomsRef.filter((r) => !existing.has(`room:${r.id}`));
		if (rms.length > 0) {
			result.push({
				heading: m.scenes_rooms({}, locale.messageOptions()),
				items: rms.map((r) => ({
					type: "room" as const,
					id: r.id,
					name: entityDisplayName("room", r),
					icon: DoorOpen,
					searchValue: localizedNamesStore.searchValues("room", r.id, r.name).join(" "),
					badge: m.scenes_device_count({ count: r.resolvedDevices.length }, locale.messageOptions()),
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
		const newTargets = [
			...scene.targets.map((a) => ({ targetType: a.targetType as SceneTargetType, targetId: a.targetId })),
			...picks.map((pick) => ({ ...pick, targetType: pick.targetType as SceneTargetType })),
		];
		try {
			const overrides = scene.lighting.overrides.map((override) => ({
				deviceId: override.deviceId,
				kind: override.kind as SceneLightOverrideKind,
				state: override.state as DesiredSceneStateInput | null | undefined,
				effectId: override.effectId,
				nativeEffectName: override.nativeEffectName,
			}));
			const definition: SceneDefinitionInput = {
				targets: newTargets,
				lighting: {
					dynamicSource: scene.lighting.dynamicSource ? {
						seed: scene.lighting.dynamicSource.seed,
						brightness: scene.lighting.dynamicSource.brightness,
						movement: scene.lighting.dynamicSource.movement,
						cycleSeconds: scene.lighting.dynamicSource.cycleSeconds,
					} : undefined,
					overrides,
				},
				supportingStates: scene.supportingStates.map((supporting) => ({
					deviceId: supporting.deviceId,
					state: supporting.state as DesiredSceneStateInput,
				})),
			};
			await scenesStore.update(clientRef, scene.id, { definition });
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, m.scenes_error_update({}, locale.messageOptions())));
		}
	}

	let view = $state<ListViewMode>(profile.get("view.scenes", "card"));

	$effect(() => {
		if (!visible) return;
		void locale.currentLanguage;
		void vibeCatalog.load(clientRef);
		pageHeader.breadcrumbs = [{ label: m.scenes_title({}, locale.messageOptions()) }];
		pageHeader.actions = [{ label: m.scenes_create({}, locale.messageOptions()), mobileLabel: m.scenes_create_short({}, locale.messageOptions()), icon: Plus, onclick: () => goto("/scenes/new") }];
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

	async function handleRename(scene: SceneData, newName: string) {
		if (!clientRef) return;
		errors.clear();
		try {
			await scenesStore.update(clientRef, scene.id, { name: newName });
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, m.scenes_error_rename({}, locale.messageOptions())));
		}
	}

	async function handleIconChange(scene: SceneData, icon: string | null) {
		if (!clientRef) return;
		errors.clear();
		try {
			await scenesStore.update(clientRef, scene.id, { icon });
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, m.scenes_error_icon({}, locale.messageOptions())));
		}
	}

	async function handleApply(scene: SceneData) {
		if (!clientRef) return;
		applyingId = scene.id;
		errors.clear();
		try {
			await scenesStore.apply(clientRef, scene.id);
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, m.scenes_error_apply({}, locale.messageOptions())));
		} finally {
			applyingId = null;
		}
	}

	async function handleStop(scene: SceneData) {
		if (!clientRef) return;
		applyingId = scene.id;
		errors.clear();
		try {
			await scenesStore.deactivate(clientRef, scene.id);
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, m.scenes_error_stop({}, locale.messageOptions())));
		} finally {
			applyingId = null;
		}
	}

	async function handleDelete() {
		if (!clientRef || !deleteConfirmScene) return;
		deleteLoading = true;
		errors.clear();

		try {
			await scenesStore.delete(clientRef, deleteConfirmScene.id);
		} catch (e) {
			deleteLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, m.scenes_error_delete({}, locale.messageOptions())));
			return;
		}

		deleteLoading = false;
		deleteConfirmScene = null;
	}

	const searchController = createUrlSearchState({
		active: () => visible && page.url.pathname === "/scenes",
	});

	const targetOptions = $derived.by(() => {
		const options = locale.messageOptions();
		return [
			{ value: "device", label: m.scenes_filter_device({}, options) },
			{ value: "group", label: m.scenes_filter_group({}, options) },
			{ value: "room", label: m.scenes_filter_room({}, options) },
		];
	});

	const emptyOptions = $derived.by(() => {
		const options = locale.messageOptions();
		return [
			{ value: "yes", label: m.common_yes({}, options) },
			{ value: "no", label: m.common_no({}, options) },
		];
	});

	const searchChipConfigs: ChipConfig[] = $derived.by(() => {
		const options = locale.messageOptions();
		return [
		{
			keyword: "target",
			label: m.scenes_filter_target({}, options),
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
			label: m.scenes_filter_device({}, options),
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return devicesRef
					.filter(
						(d) =>
							!q ||
							localizedNamesStore.matches("device", d.id, q, d.name, d.friendlyName),
					)
					.map((d) => ({ value: d.id, label: deviceDisplayName(d) }));
			},
			resolveLabel: (id: string) => {
				const device = devicesRef.find((item) => item.id === id);
				return device ? deviceDisplayName(device) : null;
			},
		},
		{
			keyword: "room",
			label: m.scenes_filter_room({}, options),
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return roomsRef
					.filter((r) => localizedNamesStore.matches("room", r.id, q, r.name))
					.map((r) => ({ value: r.id, label: entityDisplayName("room", r) }));
			},
			resolveLabel: (value: string) => {
				const room = roomsRef.find((item) => item.id === value);
				return room ? entityDisplayName("room", room) : null;
			},
		},
		{
			keyword: "empty",
			label: m.scenes_filter_empty({}, options),
			variant: "secondary",
			options: () => emptyOptions,
		},
		];
	});

	const filteredScenes = $derived.by(() => {
		const targetValues = searchController.value.chips.filter((c) => c.keyword === "target").map((c) => c.value);
		const deviceValues = searchController.value.chips
			.filter((c) => c.keyword === "device")
			.map((c) => c.value);
		const emptyValues = searchController.value.chips.filter((c) => c.keyword === "empty").map((c) => c.value);
		const roomValues = searchController.value.chips.filter((c) => c.keyword === "room").map((c) => c.value);
		const query = searchController.value.freeText.toLowerCase();

		return scenes.filter((s) => {
			if (targetValues.length > 0 && !s.targets.some((a) => targetValues.includes(a.targetType)))
				return false;
			if (deviceValues.length > 0) {
				const matches = deviceValues.some((id) =>
					s.targets.some((target) => target.targetType === "device" && target.targetId === id),
				);
				if (!matches) return false;
			}
			if (emptyValues.length > 0) {
				const isEmpty = s.targets.length === 0 && s.supportingStates.length === 0;
				const wants = emptyValues.some((v) => (v === "yes" ? isEmpty : !isEmpty));
				if (!wants) return false;
			}
			if (roomValues.length > 0 && !s.rooms.some((r) => roomValues.includes(r.id)))
				return false;
			if (query && !localizedNamesStore.matches("scene", s.id, query, s.name)) return false;
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
		try {
			await scenesStore.deleteMany(clientRef, ids);
		} catch (e) {
			batchDeleteLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, m.scenes_error_delete_many({}, locale.messageOptions())));
			return;
		}
		batchDeleteLoading = false;
		batchDeleteConfirm = false;
		selection.clear();
	}


	const mountTimer = measureMount("scenes", { ready: () => scenesStore.hydrated, items: () => filteredScenes.length });
	$effect(() => mountTimer.tick());
</script>

<div>
	{#if errors.message}
		<ErrorBanner class="mb-4" message={errors.message} ondismiss={() => errors.clear()} />
	{/if}

	{#if scenesStore.error}
		<ErrorBanner class="mb-4" message={scenesStore.error} />
	{/if}

	{#if !scenesStore.hydrated}
		{#if loader.visible}
			<p class="text-sm text-muted-foreground">{m.scenes_loading({}, locale.messageOptions())}</p>
		{/if}
	{:else}
		<div in:fly={{ y: -4, duration: 150 }}>
			{#if scenes.length === 0}
				<div class="rounded-lg shadow-card bg-card p-12 text-center">
					<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<Clapperboard class="size-6 text-muted-foreground" />
					</div>
					<p class="text-muted-foreground">{m.scenes_empty({}, locale.messageOptions())}</p>
					<p class="mt-2 text-sm text-muted-foreground">
						{m.scenes_empty_help({}, locale.messageOptions())}
					</p>
					<Button class="mt-4" onclick={() => goto("/scenes/new")}>
						<Plus class="size-4" />
						<span>{m.scenes_create_first({}, locale.messageOptions())}</span>
					</Button>
				</div>
			{:else}
				<div class="mb-6 flex items-stretch gap-2">
					<div class="min-w-0 flex-1">
						<HiveSearchbar
							controller={searchController}
							chips={searchChipConfigs}
							placeholder={m.scenes_search({}, locale.messageOptions())}
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

				{#if filteredScenes.length === 0}
					<div class="rounded-lg shadow-card bg-card p-12 text-center">
						<p class="text-muted-foreground">{m.scenes_no_match({}, locale.messageOptions())}</p>
					</div>
				{:else}
					<ListView mode={view}>
						{#snippet card()}
							<AnimatedGrid>
								{#each filteredScenes as scene (scene.id)}
									{@const noTargets = scene.targets.length === 0 && scene.supportingStates.length === 0}
									{@const applying = applyingId === scene.id}
									{@const active = scene.activatedAt != null}
									{@const tintColors = scenePreviewColors(scene.preview)}
									<EntityCard
										entity={scene}
										entityType="scene"
										fallbackIcon={Clapperboard}
									subtitle={m.scenes_target_count({ count: scene.targets.length + scene.supportingStates.length }, locale.messageOptions())}
										tintColors={tintColors.length > 0 ? tintColors : null}
										tintInactive={tintColors.length > 0 ? !active : null}
										onrename={handleRename}
										oniconchange={handleIconChange}
										editHref={`/scenes/${scene.id}`}
										ondelete={(s) => (deleteConfirmScene = s)}
										onAddTo={handleAddToScene}
									addLabel={m.scenes_add_target({}, locale.messageOptions())}
									>
										{#snippet subtitleTrailing()}
											{@const roomLabel = sceneRoomLabel(scene.rooms)}
											{#if roomLabel}
												<span class="text-muted-foreground/70">· {roomLabel}</span>
											{/if}
										{/snippet}
										{#snippet leadingActions()}
											{#if active}
												<Button
													variant="ghost"
													size="icon-sm"
													haptic="execute"
													onclick={() => handleStop(scene)}
													disabled={applying}
													class="transition-opacity duration-200"
											aria-label={m.scenes_stop({}, locale.messageOptions())}
												>
													<Square class="size-4" />
												</Button>
											{:else}
												<Button
													variant="ghost"
													size="icon-sm"
													haptic="execute"
													onclick={() => handleApply(scene)}
													disabled={applying || noTargets}
													class="transition-opacity duration-200"
											aria-label={m.scenes_apply({}, locale.messageOptions())}
												>
													<Play class="size-4" />
												</Button>
											{/if}
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
								onstop={handleStop}
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

	<ConfirmDialog
		bind:open={() => deleteConfirmScene !== null, (v) => { if (!v) deleteConfirmScene = null; }}
		title={m.scenes_delete_title({}, locale.messageOptions())}
		description={m.scenes_delete_description({ name: deleteConfirmScene ? entityDisplayName("scene", deleteConfirmScene) : "" }, locale.messageOptions())}
		confirmLabel={m.common_delete({}, locale.messageOptions())}
		loading={deleteLoading}
		onconfirm={handleDelete}
		oncancel={() => (deleteConfirmScene = null)}
	/>

	<ConfirmDialog
		open={batchDeleteConfirm}
		title={m.scenes_delete_many_title({ count: selection.count }, locale.messageOptions())}
		description={m.scenes_delete_many_description({}, locale.messageOptions())}
		confirmLabel={m.common_delete({}, locale.messageOptions())}
		loading={batchDeleteLoading}
		onconfirm={handleBatchDelete}
		oncancel={() => (batchDeleteConfirm = false)}
	/>

	<HiveDrawer
		bind:open={quickAddOpen}
		title={quickAddScene ? m.scenes_add_targets_to({ name: quickAddScene.name }, locale.messageOptions()) : m.scenes_add_targets({}, locale.messageOptions())}
		description={m.scenes_add_targets_description({}, locale.messageOptions())}
		multiple
		groups={quickAddDrawerGroups}
		onselect={handleQuickAddSelect}
	/>
</div>
