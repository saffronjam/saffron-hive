<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { onMount, onDestroy } from "svelte";
	import { fly } from "svelte/transition";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import SceneEditorComponent from "$lib/components/scene-editor.svelte";
	import ScenePreview from "$lib/components/scene-preview.svelte";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import { ArrowLeft, Plus, X, Zap, Group, Clapperboard } from "@lucide/svelte";
	import { deviceIcon } from "$lib/utils";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { ErrorBanner } from "$lib/stores/error-banner.svelte";
	import type { Device, DeviceState } from "$lib/stores/devices";
	import {
		parsePayload,
		buildTargetInfo,
		sceneToEditable,
		type SceneAction,
		type SceneData,
		type GroupData,
		type ActionPayload,
		type TargetInfo,
		type EditableAction,
	} from "$lib/scene-editable";

	const sceneId = $derived($page.params.id);

	interface PickerGroup {
		id: string;
		name: string;
		members: { id: string; memberType: string; memberId: string }[];
	}

	const SCENE_QUERY = graphql(`
		query Scene($id: ID!) {
			scene(id: $id) {
				id
				name
				icon
				actions {
					id
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
					payload
				}
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
					id
					targetType
					targetId
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
		updateScene: { id: string; name: string; actions: { id: string; targetType: string; targetId: string; payload: string }[] };
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

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Scenes", href: "/scenes" }, { label: "Scene" }];
	});
	onDestroy(() => pageHeader.reset());

	$effect(() => {
		if (scene) {
			pageHeader.breadcrumbs = [{ label: "Scenes", href: "/scenes" }, { label: scene.name }];
		}
	});

	$effect(() => {
		pageHeader.actions = [
			{ label: "Cancel", variant: "outline" as const, onclick: handleCancel },
			{ label: "Save", saving, onclick: handleSave, disabled: saving || !sceneName.trim() || !isDirty },
		];
	});
	let allDevices = $state<Device[]>([]);
	let allGroups = $state<GroupData[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	const errors = new ErrorBanner();
	let unsubscribers: (() => void)[] = [];

	let sceneName = $state("");
	let sceneIcon = $state<string | null>(null);
	let editableActions = $state<EditableAction[]>([]);
	let liveEditing = $state(false);
	let pickerOpen = $state(false);
	let savedSceneName = $state("");
	let savedSceneIcon = $state<string | null>(null);
	let savedActionsJson = $state("");
	const isDirty = $derived(
		sceneName !== savedSceneName ||
		sceneIcon !== savedSceneIcon ||
		JSON.stringify(editableActions) !== savedActionsJson
	);

	let liveEditTimers = $state<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	const effectiveDevices = $derived.by(() => {
		const deviceMap = new Map<string, Device>();
		for (const d of allDevices) {
			deviceMap.set(d.id, d);
		}

		const seen = new Set<string>();
		const result: Device[] = [];

		for (const action of editableActions) {
			if (action.targetType === "device") {
				if (!seen.has(action.targetId)) {
					const dev = deviceMap.get(action.targetId);
					if (dev) {
						result.push(dev);
						seen.add(action.targetId);
					}
				}
			} else if (action.targetType === "group") {
				const group = allGroups.find((g) => g.id === action.targetId);
				if (group) {
					for (const dev of group.resolvedDevices) {
						if (!seen.has(dev.id)) {
							result.push(deviceMap.get(dev.id) ?? dev);
							seen.add(dev.id);
						}
					}
				}
			}
		}

		return result;
	});

	const existingTargetIds = $derived(new Set(editableActions.map((a) => a.targetId)));

	const availableDevices = $derived(allDevices.filter((d) => !existingTargetIds.has(d.id)));

	const availableGroups = $derived(
		allGroups.filter((g) => !existingTargetIds.has(g.id))
	);

	const pickerDrawerGroups = $derived.by((): DrawerGroup<"device" | "group">[] => {
		const result: DrawerGroup<"device" | "group">[] = [];
		if (availableDevices.length > 0) {
			result.push({ heading: "Devices", items: availableDevices.map((d) => ({
				type: "device" as const, id: d.id, name: d.name,
				icon: deviceIcon(d.type), searchValue: `${d.name} ${d.type}`,
			}))});
		}
		if (availableGroups.length > 0) {
			result.push({ heading: "Groups", items: availableGroups.map((g) => ({
				type: "group" as const, id: g.id, name: g.name, icon: Group,
				badge: `${g.members.length} member${g.members.length === 1 ? "" : "s"}`,
			}))});
		}
		return result;
	});

	function sendLiveCommand(action: EditableAction) {
		if (!clientRef || !liveEditing) return;

		if (action.targetType === "device") {
			sendDeviceCommand(action.targetId, action.payload);
		} else if (action.targetType === "group") {
			const group = allGroups.find((g) => g.id === action.targetId);
			if (group) {
				for (const dev of group.resolvedDevices) {
					if (dev.type === "light" || dev.type === "plug") {
						sendDeviceCommand(dev.id, action.payload);
					}
				}
			}
		}
	}

	function sendDeviceCommand(deviceId: string, payload: ActionPayload) {
		if (!clientRef) return;

		const timerKey = deviceId;
		const existing = liveEditTimers.get(timerKey);
		if (existing) clearTimeout(existing);

		const timer = setTimeout(() => {
			liveEditTimers.delete(timerKey);
			clientRef?.mutation<SetDeviceStateResult>(SET_DEVICE_STATE, {
				deviceId,
				state: payload,
			}).toPromise();
		}, 300);

		liveEditTimers.set(timerKey, timer);
	}

	function handleActionUpdate(index: number, payload: ActionPayload) {
		editableActions = editableActions.map((a, i) =>
			i === index ? { ...a, payload } : a
		);
		if (liveEditing) {
			sendLiveCommand(editableActions[index]);
		}
	}

	function handleActionRemove(index: number) {
		editableActions = editableActions.filter((_, i) => i !== index);
	}

	function handleAddTarget(memberType: "device" | "group", memberId: string) {
		let target: TargetInfo;

		if (memberType === "device") {
			const device = allDevices.find((d) => d.id === memberId);
			if (!device) return;
			target = {
				id: device.id,
				name: device.name,
				type: "device",
				deviceType: device.type,
			};
		} else {
			const group = allGroups.find((g) => g.id === memberId);
			if (!group) return;
			target = {
				id: group.id,
				name: group.name,
				type: "group",
			};
		}

		editableActions = [
			...editableActions,
			{
				targetType: memberType,
				targetId: memberId,
				target,
				payload: { on: true, brightness: 127, colorTemp: 250 },
			},
		];
		pickerOpen = false;
	}

	async function handleSave() {
		if (!clientRef || !scene) return;
		saving = true;
		errors.clear();

		const actions = editableActions.map((a) => ({
			targetType: a.targetType,
			targetId: a.targetId,
			payload: JSON.stringify(a.payload),
		}));

		const result = await clientRef
			.mutation<UpdateSceneResult>(UPDATE_SCENE, {
				id: scene.id,
				input: {
					name: sceneName.trim() || scene.name,
					icon: sceneIcon,
					actions,
				},
			})
			.toPromise();

		saving = false;

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		savedSceneName = sceneName;
		savedSceneIcon = sceneIcon;
		savedActionsJson = JSON.stringify(editableActions);
	}

	function handleCancel() {
		goto("/scenes");
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
					editableActions = sceneToEditable(result.data.scene);
					savedSceneName = sceneName;
					savedSceneIcon = sceneIcon;
					savedActionsJson = JSON.stringify(editableActions);
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
		for (const timer of liveEditTimers.values()) {
			clearTimeout(timer);
		}
	});
</script>

<UnsavedGuard dirty={isDirty} />

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

	{#if loading}
		<div class="space-y-4">
			<div class="h-16 animate-pulse rounded-xl shadow-card bg-card"></div>
			<div class="h-64 animate-pulse rounded-xl shadow-card bg-card"></div>
		</div>
	{:else if scene}
		<div class="space-y-6" in:fly={{ y: -4, duration: 150 }}>
			<div class="rounded-lg shadow-card bg-card p-4">
				<label class="mb-2 block text-sm font-medium text-foreground" for="scene-name">
					Scene Name
				</label>
				<div class="flex items-center gap-3">
					<IconPicker value={sceneIcon} onselect={(icon) => (sceneIcon = icon)}>
						<button type="button" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted cursor-pointer hover:bg-muted/80 transition-colors" aria-label="Change icon">
							<AnimatedIcon icon={sceneIcon} class="size-5 text-muted-foreground">
								{#snippet fallback()}<Clapperboard class="size-5 text-muted-foreground" />{/snippet}
							</AnimatedIcon>
						</button>
					</IconPicker>
					<Input
						id="scene-name"
						bind:value={sceneName}
						placeholder="Scene name"
					/>
				</div>
			</div>

			<div class="rounded-lg shadow-card bg-card p-4">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="text-sm font-medium text-foreground">
						Targets ({editableActions.length})
					</h2>
					<Button variant="outline" size="sm" onclick={() => (pickerOpen = true)}>
						<Plus class="size-4" />
						<span>Add target</span>
					</Button>
				</div>

				<SceneEditorComponent
					actions={editableActions}
					onupdate={handleActionUpdate}
					onremove={handleActionRemove}
				/>
			</div>

			<Separator />

			<div class="rounded-lg shadow-card bg-muted/30 p-4">
				<div class="mb-3 flex items-center justify-between">
					<div>
						<h2 class="text-sm font-medium text-foreground">Live Preview</h2>
						<p class="text-xs text-muted-foreground">
							Effective devices affected by this scene ({effectiveDevices.length})
						</p>
					</div>
					<div class="flex items-center gap-2">
						<div class="flex items-center gap-1.5">
							{#if liveEditing}
								<Zap class="size-3.5 text-yellow-500" />
							{/if}
							<span class="text-xs text-muted-foreground">Live editing</span>
						</div>
						<Switch
							checked={liveEditing}
							onCheckedChange={(checked) => (liveEditing = checked)}
							size="sm"
						/>
					</div>
				</div>

				{#if liveEditing}
					<div class="mb-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2">
						<p class="text-xs text-yellow-600 dark:text-yellow-400">
							Changes are being applied to real devices in real-time.
						</p>
					</div>
				{/if}

				<ScenePreview devices={effectiveDevices} />
			</div>

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
		title="Add Target"
		description="Search for devices or groups to add to this scene."
		groups={pickerDrawerGroups}
		onselect={handleAddTarget}
	/>
</div>
