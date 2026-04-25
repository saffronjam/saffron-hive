<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { onMount, onDestroy } from "svelte";
	import { fly } from "svelte/transition";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
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
	import { deviceIcon } from "$lib/utils";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { BannerError } from "$lib/stores/banner-error.svelte";
	import { isSceneTarget, type Device, type DeviceState } from "$lib/stores/devices";
	import {
		sceneToEditorState,
		defaultScenePayload,
		type SceneData,
		type GroupData,
		type RoomData,
		type ActionPayload,
		type EditableTarget,
		type TargetKind,
		type DevicePayloadMap,
	} from "$lib/scene-editable";
	import { resolveTargetDevices, type GroupLite, type RoomLite } from "$lib/target-resolve";

	const sceneId = $derived($page.params.id);

	const SCENE_QUERY = graphql(`
		query Scene($id: ID!) {
			scene(id: $id) {
				id
				name
				icon
				actions {
					targetType
					targetId
					target {
						... on Device {
							__typename
							id
							name
							type
							capabilities { name type values valueMin valueMax unit access }
							available
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
							name
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
								lastSeen
								capabilities { name type values valueMin valueMax unit access }
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
								lastSeen
								capabilities { name type values valueMin valueMax unit access }
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

	const SCENE_ACTIVE_SUB = graphql(`
		subscription SceneEditSceneActiveChanged {
			sceneActiveChanged {
				sceneId
				activatedAt
			}
		}
	`);

	const DEVICES_QUERY = graphql(`
		query SceneEditDevices {
			devices {
				id
				name
				type
				source
				available
				lastSeen
				capabilities { name type values valueMin valueMax unit access }
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
	`);

	const GROUPS_QUERY = graphql(`
		query SceneEditGroups {
			groups {
				id
				name
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
					lastSeen
					capabilities { name type values valueMin valueMax unit access }
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
	`);

	const ROOMS_QUERY = graphql(`
		query SceneEditRooms {
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
						lastSeen
						capabilities { name type values valueMin valueMax unit access }
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
					group {
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
							group { id name icon }
							room { id name icon }
						}
						resolvedDevices {
							id
							name
							type
							source
							available
							lastSeen
							capabilities { name type values valueMin valueMax unit access }
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
				resolvedDevices {
					id
					name
					type
					source
					available
					lastSeen
					capabilities { name type values valueMin valueMax unit access }
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
	`);

	const UPDATE_SCENE = graphql(`
		mutation SceneEditUpdate($id: ID!, $input: UpdateSceneInput!) {
			updateScene(id: $id, input: $input) {
				id
				name
				icon
				actions {
					targetType
					targetId
				}
				devicePayloads {
					deviceId
					payload
				}
			}
		}
	`);

	const SET_DEVICE_STATE = graphql(`
		mutation SceneEditSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
			setDeviceState(deviceId: $deviceId, state: $state) {
				id
			}
		}
	`);

	const APPLY_SCENE = graphql(`
		mutation SceneEditApply($id: ID!) {
			applyScene(sceneId: $id) {
				id
			}
		}
	`);

	const DEVICE_STATE_CHANGED = graphql(`
		subscription DeviceStateChanged {
			deviceStateChanged {
				deviceId
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
	`);

	interface SceneQueryResult {
		scene: SceneData | null;
	}

	interface DevicesQueryResult {
		devices: Device[];
	}

	interface GroupsQueryResult {
		groups: GroupData[];
	}

	interface UpdateSceneResult {
		updateScene: {
			id: string;
			name: string;
			actions: { id: string; targetType: string; targetId: string; payload: string }[];
			devicePayloads: { deviceId: string; payload: string }[];
		};
	}

	interface RoomsQueryResult {
		rooms: RoomData[];
	}

	interface SetDeviceStateResult {
		setDeviceState: { id: string };
	}

	interface DeviceStateChangedResult {
		deviceStateChanged: {
			deviceId: string;
			state: DeviceState;
		};
	}

	const clientRef = getContextClient();
	let scene = $state<SceneData | null>(null);

	let activeSubHandle: { unsubscribe: () => void } | null = null;

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Scenes", href: "/scenes" }, { label: "Scene" }];
		if (clientRef) {
			activeSubHandle = clientRef.subscription(SCENE_ACTIVE_SUB, {}).subscribe((r) => {
				const ev = r.data?.sceneActiveChanged;
				if (!ev || !scene || ev.sceneId !== scene.id) return;
				scene = { ...scene, activatedAt: ev.activatedAt ?? null } as SceneData;
			});
		}
	});
	onDestroy(() => {
		pageHeader.reset();
		activeSubHandle?.unsubscribe();
	});

	$effect(() => {
		if (scene) {
			pageHeader.breadcrumbs = [{ label: "Scenes", href: "/scenes" }, { label: scene.name }];
		}
	});

	$effect(() => {
		const sceneActive = scene?.activatedAt != null;
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
	let allDevices = $state<Device[]>([]);
	let allGroups = $state<GroupData[]>([]);
	let allRooms = $state<RoomData[]>([]);
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

	const isDirty = $derived(
		sceneName !== savedSceneName ||
		sceneIcon !== savedSceneIcon ||
		JSON.stringify(targets) !== savedTargetsJson ||
		serializePayloads(payloadsByDevice) !== savedPayloadsJson,
	);

	let commandTimers = $state<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	const devicesById = $derived(new Map(allDevices.map((d) => [d.id, d])));
	const groupsLite = $derived<GroupLite[]>(
		allGroups.map((g) => ({
			id: g.id,
			name: g.name,
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
		const existing = commandTimers.get(deviceId);
		if (existing) clearTimeout(existing);
		const timer = setTimeout(() => {
			commandTimers.delete(deviceId);
			clientRef?.mutation<SetDeviceStateResult>(SET_DEVICE_STATE, {
				deviceId,
				state: payload,
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
			const resolved = resolveTargetDevices({ type: t.type, id: t.id }, allDevices, groupsLite, roomsLite);
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

	function handleAddTarget(memberType: TargetKind, memberId: string) {
		if (memberType === "device") {
			const d = allDevices.find((x) => x.id === memberId);
			if (!d) return;
			targets = [
				...targets,
				{ type: "device", id: d.id, name: d.name, deviceType: d.type },
			];
		} else if (memberType === "group") {
			const g = allGroups.find((x) => x.id === memberId);
			if (!g) return;
			targets = [...targets, { type: "group", id: g.id, name: g.name, icon: (g as unknown as { icon?: string | null }).icon ?? null }];
		} else {
			const r = allRooms.find((x) => x.id === memberId);
			if (!r) return;
			targets = [...targets, { type: "room", id: r.id, name: r.name, icon: r.icon ?? null }];
		}
	}

	async function handleSave() {
		if (!clientRef || !scene) return;
		saving = true;
		errors.clear();

		const actions = targets.map((t) => ({
			targetType: t.type,
			targetId: t.id,
		}));
		const devicePayloads = Array.from(payloadsByDevice.entries())
			.filter(([deviceId]) => {
				const d = devicesById.get(deviceId);
				return d != null && isSceneTarget(d);
			})
			.map(([deviceId, payload]) => ({
				deviceId,
				payload: JSON.stringify(payload),
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

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		const prunedPayloads = new Map<string, ActionPayload>();
		for (const [did, p] of payloadsByDevice) {
			const d = devicesById.get(did);
			if (d != null && isSceneTarget(d)) prunedPayloads.set(did, p);
		}
		payloadsByDevice = prunedPayloads;

		savedSceneName = sceneName;
		savedSceneIcon = sceneIcon;
		savedTargetsJson = JSON.stringify(targets);
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
		const result = await clientRef.mutation(APPLY_SCENE, { id: scene.id }).toPromise();
		activating = false;
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
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
					savedTargetsJson = JSON.stringify(targets);
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
			.query<DevicesQueryResult>(DEVICES_QUERY, {})
			.toPromise()
			.then((result) => {
				if (result.data) {
					allDevices = result.data.devices;
				}
			});

		client
			.query<GroupsQueryResult>(GROUPS_QUERY, {})
			.toPromise()
			.then((result) => {
				if (result.data) {
					allGroups = result.data.groups;
				}
			});

		client
			.query<RoomsQueryResult>(ROOMS_QUERY, {})
			.toPromise()
			.then((result) => {
				if (result.data) {
					allRooms = result.data.rooms;
				}
			});

		const { unsubscribe: unsubState } = client
			.subscription<DeviceStateChangedResult>(DEVICE_STATE_CHANGED, {})
			.subscribe((result) => {
				if (result.data) {
					const { deviceId, state } = result.data.deviceStateChanged;
					allDevices = allDevices.map((d) =>
						d.id === deviceId ? { ...d, state } : d
					);
				}
			});
		unsubscribers.push(unsubState);
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
				onupdatedevicepayload={handleDevicePayloadUpdate}
				onsendcommand={sendDeviceCommand}
				onremovetarget={handleTargetRemove}
				onaddtarget={() => (pickerOpen = true)}
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
