<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { onMount, onDestroy } from "svelte";
	import { fly } from "svelte/transition";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { SCENE_DETAIL_QUERY as SCENE_QUERY } from "$lib/graphql/details";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import SceneEditorComponent from "$lib/components/scene-editor.svelte";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import IconPickerTrigger from "$lib/components/icon-picker-trigger.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import { ArrowLeft, Group, DoorOpen, Clapperboard, Play, X } from "@lucide/svelte";
	import { deviceIcon, deviceDisplayName, groupDisplayName } from "$lib/utils";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { BannerError } from "$lib/stores/banner-error.svelte";
	import { deviceStore, isSceneTarget, type Device } from "$lib/stores/devices";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { groupsStore } from "$lib/stores/groups.svelte";
	import { scenesStore } from "$lib/stores/scenes.svelte";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import {
		sceneToEditorState,
		stringifyPayload,
		staticFieldsOf,
		type SceneData,
		type ActionPayload,
		type EditableTarget,
		type TargetKind,
		type DevicePayloadMap,
		newTargetUid,
	} from "$lib/scene-editable";
	import { effectSummary, nativeOptionLabel, type EffectSummary } from "$lib/effect-editable";
	import { EffectKind } from "$lib/gql/graphql";
	import {
		resolveTargetDevices,
		evaluateExpression,
		type Clause,
		type GroupLite,
		type RoomLite,
	} from "$lib/target-resolve";

	const sceneId = $derived($page.params.id);

	const UPDATE_SCENE = graphql(`
		mutation SceneEditUpdate($id: ID!, $input: UpdateSceneInput!) {
			updateScene(id: $id, input: $input) {
				id
				name
				icon
				actions {
					targetType
					targetId
					name
					expression {
						connector
						subject
						op
						values
					}
					target {
						... on Device {
							__typename
							id
							# Aliased because Group.name and Room.name in the sibling arms are
							# non-null, and GraphQL will not merge fields of differing nullability.
							deviceName: name
							type
							capabilities { name type values valueMin valueMax unit canSet reportsValue canGet category label description }
							available
							disabled
							friendlyName
							seen
							lastSeen
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
						... on Group {
							__typename
							id
							groupName: name
							friendlyName
							source
							removed
							icon
							members {
								id
								memberType
								memberId
							}
							resolvedDevices {
								id
								name
								type
								source
								available
								disabled
								friendlyName
								seen
								lastSeen
								capabilities { name type values valueMin valueMax unit canSet reportsValue canGet category label description }
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
						}
						... on Room {
							__typename
							id
							name
							icon
							resolvedDevices {
								id
								name
								type
								source
								available
								disabled
								friendlyName
								seen
								lastSeen
								capabilities { name type values valueMin valueMax unit canSet reportsValue canGet category label description }
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
						}
					}
				}
				devicePayloads {
					deviceId
					payload
				}
				activatedAt
			}
		}
	`);

	const SET_DEVICE_STATE = graphql(`
		mutation SceneEditSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
			setTargetState(targetType: DEVICE, targetId: $deviceId, state: $state)
		}
	`);

	const EFFECTS_QUERY = graphql(`
		query SceneEditEffects {
			effects {
				id
				name
				icon
				kind
				nativeName
				loop
				requiredCapabilities
			}
			nativeEffectOptions {
				name
				displayName
				supportedDeviceCount
			}
		}
	`);

	interface SceneQueryResult {
		scene: SceneData | null;
	}

	interface UpdateSceneResult {
		updateScene: SceneData;
	}

	interface SetDeviceStateResult {
		setTargetState: boolean;
	}

	const clientRef = getContextClient();
	let scene = $state<SceneData | null>(null);

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Scenes", href: "/scenes" }, { label: "Scene" }];
	});

	$effect(() => {
		if (scene) {
			pageHeader.breadcrumbs = [{ label: "Scenes", href: "/scenes" }, { label: scene.name }];
		}
	});

	$effect(() => {
		const sceneActive = scene !== null && scenesStore.byId.get(scene.id)?.activatedAt != null;
		pageHeader.actions = [
			{
				label: "Activate",
				icon: Play,
				variant: "outline" as const,
				onclick: handleActivate,
				disabled: activating || !scene || isDirty || sceneActive,
				hideLabelOnMobile: true,
			},
			{ label: "Cancel", icon: X, variant: "outline" as const, onclick: handleCancel, hideLabelOnMobile: true },
			{ label: "Save", saving, onclick: handleSave, disabled: saving || !sceneName.trim() || !isDirty, hideLabelOnMobile: true },
		];
	});
	// Dropped at the source so the whole page follows: the target tree, its
	// reachable counts, the Add drawer and every resolution.
	const allDevices = $derived(Object.values($deviceStore).filter((d) => !d.disabled));
	const allGroups = $derived(groupsStore.items);
	const allRooms = $derived(roomsStore.items);
	let allEffects = $state<EffectSummary[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	const errors = new BannerError();
	let unsubscribers: (() => void)[] = [];

	let sceneName = $state("");
	let sceneIcon = $state<string | null>(null);
	let targets = $state<EditableTarget[]>([]);
	let payloadsByDevice = $state<DevicePayloadMap>(new Map());
	let pickerOpen = $state(false);
	let savedSceneName = $state("");
	let savedSceneIcon = $state<string | null>(null);
	let savedTargetsJson = $state("");
	let savedPayloadsJson = $state("");

	function serializePayloads(map: DevicePayloadMap): string {
		return JSON.stringify(
			Array.from(map.entries())
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([k, v]) => [k, v]),
		);
	}

	// Dirty tracking compares target content, not client-only identity, so
	// removing and re-adding the same target does not register as a change.
	function serializeTargets(ts: EditableTarget[]): string {
		return JSON.stringify(ts, (k, v) => (k === "uid" ? undefined : v));
	}

	const isDirty = $derived(
		sceneName !== savedSceneName ||
		sceneIcon !== savedSceneIcon ||
		serializeTargets(targets) !== savedTargetsJson ||
		serializePayloads(payloadsByDevice) !== savedPayloadsJson,
	);

	let commandTimers = $state<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	const devicesById = $derived(new Map(allDevices.map((d) => [d.id, d])));
	const groupsLite = $derived<GroupLite[]>(
		allGroups.map((g) => ({
			id: g.id,
			name: groupDisplayName(g),
			friendlyName: g.friendlyName,
			icon: g.icon,
			members: g.members.map((m) => ({ memberType: m.memberType, memberId: m.memberId })),
		})),
	);
	const roomsLite = $derived<RoomLite[]>(
		allRooms.map((r) => ({
			id: r.id,
			name: r.name,
			icon: r.icon,
			members: r.members.map((m) => ({ memberType: m.memberType, memberId: m.memberId })),
		})),
	);

	const existingTargetKeys = $derived(new Set(targets.map((t) => `${t.type}:${t.id}`)));
	const availableDevices = $derived(
		allDevices.filter((d) => isSceneTarget(d) && !existingTargetKeys.has(`device:${d.id}`)),
	);
	const availableGroups = $derived(allGroups.filter((g) => !existingTargetKeys.has(`group:${g.id}`)));
	const availableRooms = $derived(allRooms.filter((r) => !existingTargetKeys.has(`room:${r.id}`)));

	const pickerDrawerGroups = $derived.by((): DrawerGroup<TargetKind>[] => {
		const result: DrawerGroup<TargetKind>[] = [];
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
					icon: Group,
					badge: `${g.members.length} member${g.members.length === 1 ? "" : "s"}`,
				})),
			});
		}
		if (availableRooms.length > 0) {
			result.push({
				heading: "Rooms",
				items: availableRooms.map((r) => ({
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

	function sendDeviceCommand(deviceId: string, payload: ActionPayload) {
		if (!clientRef) return;
		if (payload.kind !== "static") return;
		const existing = commandTimers.get(deviceId);
		if (existing) clearTimeout(existing);
		const timer = setTimeout(() => {
			commandTimers.delete(deviceId);
			clientRef?.mutation<SetDeviceStateResult>(SET_DEVICE_STATE, {
				deviceId,
				state: staticFieldsOf(payload),
			}).toPromise();
		}, 300);
		commandTimers.set(deviceId, timer);
	}

	function handleDevicePayloadUpdate(deviceId: string, payload: ActionPayload) {
		const next = new Map(payloadsByDevice);
		next.set(deviceId, payload);
		payloadsByDevice = next;
	}

	function reachableDeviceIds(): Set<string> {
		const ids = new Set<string>();
		for (const t of targets) {
			const resolved =
				t.type === "expression"
					? evaluateExpression(t.expression ?? [], allDevices, groupsLite, roomsLite)
					: resolveTargetDevices({ type: t.type, id: t.id }, allDevices, groupsLite, roomsLite);
			for (const d of resolved) {
				if (isSceneTarget(d)) ids.add(d.id);
			}
		}
		return ids;
	}

	function handleTargetRemove(index: number) {
		targets = targets.filter((_, i) => i !== index);
		const stillReachable = reachableDeviceIds();
		const next = new Map<string, ActionPayload>();
		for (const [did, p] of payloadsByDevice) {
			if (stillReachable.has(did)) next.set(did, p);
		}
		payloadsByDevice = next;
	}

	function handleAddExpression() {
		targets = [
			...targets,
			{ uid: newTargetUid(), type: "expression", id: "", name: "Selector", expression: [] },
		];
	}

	function handleTargetExpressionChange(index: number, expression: Clause[]) {
		targets = targets.map((t, i) => (i === index ? { ...t, expression } : t));
	}

	function handleTargetNameChange(index: number, name: string) {
		targets = targets.map((t, i) => (i === index ? { ...t, name: name || "Selector" } : t));
	}

	function handleAddTarget(memberType: TargetKind, memberId: string) {
		if (memberType === "device") {
			const d = allDevices.find((x) => x.id === memberId);
			if (!d) return;
			targets = [
				...targets,
				{ uid: newTargetUid(), type: "device", id: d.id, name: deviceDisplayName(d), deviceType: d.type },
			];
		} else if (memberType === "group") {
			const g = allGroups.find((x) => x.id === memberId);
			if (!g) return;
			targets = [
				...targets,
				{
					uid: newTargetUid(),
					type: "group",
					id: g.id,
					name: groupDisplayName(g),
					icon: (g as unknown as { icon?: string | null }).icon ?? null,
				},
			];
		} else {
			const r = allRooms.find((x) => x.id === memberId);
			if (!r) return;
			targets = [
				...targets,
				{ uid: newTargetUid(), type: "room", id: r.id, name: r.name, icon: r.icon ?? null },
			];
		}
	}

	async function handleSave() {
		if (!clientRef || !scene) return;
		saving = true;
		errors.clear();

		const actions = targets.map((t) =>
			t.type === "expression"
				? {
						targetType: "expression",
						targetId: "",
						expression: t.expression ?? [],
						name: t.name && t.name !== "Selector" ? t.name : "",
					}
				: { targetType: t.type, targetId: t.id },
		);
		const devicePayloads = Array.from(payloadsByDevice.entries())
			.filter(([deviceId]) => {
				const d = devicesById.get(deviceId);
				return d != null && isSceneTarget(d);
			})
			.map(([deviceId, payload]) => ({
				deviceId,
				payload: stringifyPayload(payload),
			}));

		const result = await clientRef
			.mutation<UpdateSceneResult>(UPDATE_SCENE, {
				id: scene.id,
				input: {
					name: sceneName.trim() || scene.name,
					icon: sceneIcon,
					actions,
					devicePayloads,
				},
			})
			.toPromise();

		saving = false;

		if (result.error || !result.data?.updateScene) {
			errors.setWithAutoDismiss(result.error?.message ?? "Failed to save scene");
			return;
		}

		const updated = result.data.updateScene;
		scene = updated;
		sceneName = updated.name;
		sceneIcon = updated.icon ?? null;

		savedSceneName = sceneName;
		savedSceneIcon = sceneIcon;
		savedTargetsJson = serializeTargets(targets);
		savedPayloadsJson = serializePayloads(payloadsByDevice);
	}

	function handleCancel() {
		goto("/scenes");
	}

	let activating = $state(false);

	async function handleActivate() {
		if (!clientRef || !scene) return;
		activating = true;
		errors.clear();
		try {
			await scenesStore.apply(clientRef, scene.id);
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not apply the scene."));
		} finally {
			activating = false;
		}
	}

	onMount(() => {
		const client = clientRef;

		client
			.query<SceneQueryResult>(SCENE_QUERY, { id: sceneId })
			.toPromise()
			.then((result) => {
				loading = false;
				if (result.data?.scene) {
					scene = result.data.scene;
					sceneName = result.data.scene.name;
					sceneIcon = result.data.scene.icon ?? null;
					const state = sceneToEditorState(result.data.scene);
					targets = state.targets;
					payloadsByDevice = state.payloads;
					savedSceneName = sceneName;
					savedSceneIcon = sceneIcon;
					savedTargetsJson = serializeTargets(targets);
					savedPayloadsJson = serializePayloads(payloadsByDevice);
				} else {
					errors.message = "Scene not found";
				}
			})
			.catch(() => {
				loading = false;
				errors.message = "Failed to load scene";
			});

		client
			.query(EFFECTS_QUERY, {})
			.toPromise()
			.then((result) => {
				if (!result.data) return;
				const timelineEffects: EffectSummary[] = result.data.effects.map(effectSummary);
				const nativeEffects: EffectSummary[] = result.data.nativeEffectOptions.map((opt) => ({
					id: `native:${opt.name}`,
					name: nativeOptionLabel(opt.name, opt.displayName),
					icon: null,
					kind: EffectKind.Native,
					nativeName: opt.name,
					loop: false,
					requiredCapabilities: [],
				}));
				allEffects = [...timelineEffects, ...nativeEffects];
			});

	});

	onDestroy(() => {
		for (const unsub of unsubscribers) {
			unsub();
		}
		for (const timer of commandTimers.values()) {
			clearTimeout(timer);
		}
	});
</script>

<UnsavedGuard dirty={isDirty} />

<div>

	{#if errors.message}
		<ErrorBanner class="mb-4" message={errors.message} ondismiss={() => errors.clear()} />
	{/if}

	{#if loading}
		<div class="space-y-4">
			<div class="h-16 animate-pulse rounded-xl shadow-card bg-card"></div>
			<div class="h-64 animate-pulse rounded-xl shadow-card bg-card"></div>
		</div>
	{:else if scene}
		<div class="flex flex-col gap-4" in:fly={{ y: -4, duration: 150 }}>
			<div class="rounded-lg shadow-card bg-card p-4">
				<label class="mb-2 block text-sm font-medium text-foreground" for="scene-name">
					Scene Name
				</label>
				<div class="flex items-center gap-3">
					<IconPicker value={sceneIcon} onselect={(icon) => (sceneIcon = icon)}>
						<IconPickerTrigger size="lg" ariaLabel="Change icon">
							<AnimatedIcon icon={sceneIcon} class="size-5 text-muted-foreground">
								{#snippet fallback()}<Clapperboard class="size-5 text-muted-foreground" />{/snippet}
							</AnimatedIcon>
						</IconPickerTrigger>
					</IconPicker>
					<Input
						id="scene-name"
						bind:value={sceneName}
						placeholder="Scene name"
					/>
				</div>
			</div>

			<SceneEditorComponent
				{targets}
				{payloadsByDevice}
				{devicesById}
				{groupsLite}
				{roomsLite}
				effects={allEffects}
				onupdatedevicepayload={handleDevicePayloadUpdate}
				onsendcommand={sendDeviceCommand}
				onremovetarget={handleTargetRemove}
				onaddtarget={() => (pickerOpen = true)}
				onaddexpression={handleAddExpression}
				onupdatetargetexpression={handleTargetExpressionChange}
				onupdatetargetname={handleTargetNameChange}
			/>
		</div>
	{:else}
		<div class="rounded-lg shadow-card bg-card p-12 text-center">
			<p class="text-lg font-medium text-foreground">Scene not found</p>
			<p class="mt-2 text-sm text-muted-foreground">
				The scene you're looking for doesn't exist or has been removed.
			</p>
			<Button variant="outline" class="mt-4" href="/scenes">
				<ArrowLeft class="size-4" />
				Back to Scenes
			</Button>
		</div>
	{/if}

	<HiveDrawer
		bind:open={pickerOpen}
		title="Add Targets"
		description="Pick devices, groups, or rooms to include in this scene."
		groups={pickerDrawerGroups}
		multiple
		onselect={handleAddTarget}
	/>
</div>
