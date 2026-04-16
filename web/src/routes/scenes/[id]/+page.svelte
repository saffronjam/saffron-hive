<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { onMount, onDestroy } from "svelte";
	import { createGraphQLClient } from "$lib/graphql/client";
	import { gql } from "@urql/svelte";
	import type { Client } from "@urql/svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetDescription,
	} from "$lib/components/ui/sheet/index.js";
	import SceneEditorComponent from "$lib/components/scene-editor.svelte";
	import ScenePreview from "$lib/components/scene-preview.svelte";
	import MemberPicker from "$lib/components/member-picker.svelte";
	import { ArrowLeft, Plus, X, Zap } from "@lucide/svelte";
	import type { Device, LightState, SensorState, SwitchState } from "$lib/stores/devices";

	type DeviceState = LightState | SensorState | SwitchState;

	const sceneId = $derived($page.params.id);

	interface SceneAction {
		id: string;
		targetType: string;
		targetId: string;
		target: SceneTargetData;
		payload: string;
	}

	interface SceneTargetData {
		__typename: string;
		id: string;
		name: string;
		type?: string;
		members?: GroupMemberData[];
		resolvedDevices?: Device[];
	}

	interface GroupMemberData {
		id: string;
		memberType: string;
		memberId: string;
	}

	interface SceneData {
		id: string;
		name: string;
		actions: SceneAction[];
	}

	interface GroupData {
		id: string;
		name: string;
		members: GroupMemberData[];
		resolvedDevices: Device[];
	}

	interface ActionPayload {
		on?: boolean;
		brightness?: number;
		colorTemp?: number;
		color?: { r: number; g: number; b: number; x: number; y: number };
	}

	interface TargetInfo {
		id: string;
		name: string;
		type: "device" | "group";
		deviceType?: string;
	}

	interface EditableAction {
		targetType: string;
		targetId: string;
		target: TargetInfo;
		payload: ActionPayload;
	}

	interface PickerGroup {
		id: string;
		name: string;
		members: { id: string; memberType: string; memberId: string }[];
	}

	const SCENE_QUERY = gql`
		query Scene($id: ID!) {
			scene(id: $id) {
				id
				name
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
							available
							lastSeen
							state {
								... on LightState {
									__typename
									on
									brightness
									colorTemp
									color { r g b x y }
									transition
								}
								... on SensorState {
									__typename
									temperature
									humidity
									battery
									pressure
									illuminance
								}
								... on SwitchState {
									__typename
									action
								}
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
									... on LightState {
										__typename
										on
										brightness
										colorTemp
										color { r g b x y }
										transition
									}
									... on SensorState {
										__typename
										temperature
										humidity
										battery
										pressure
										illuminance
									}
									... on SwitchState {
										__typename
										action
									}
								}
							}
						}
					}
					payload
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
						__typename
						on
						brightness
						colorTemp
						color { r g b x y }
						transition
					}
					... on SensorState {
						__typename
						temperature
						humidity
						battery
						pressure
						illuminance
					}
					... on SwitchState {
						__typename
						action
					}
				}
			}
		}
	`;

	const GROUPS_QUERY = gql`
		query Groups {
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
						... on LightState {
							__typename
							on
							brightness
							colorTemp
							color { r g b x y }
							transition
						}
						... on SensorState {
							__typename
							temperature
							humidity
							battery
							pressure
							illuminance
						}
						... on SwitchState {
							__typename
							action
						}
					}
				}
			}
		}
	`;

	const UPDATE_SCENE = gql`
		mutation UpdateScene($id: ID!, $input: UpdateSceneInput!) {
			updateScene(id: $id, input: $input) {
				id
				name
				actions {
					id
					targetType
					targetId
					payload
				}
			}
		}
	`;

	const SET_DEVICE_STATE = gql`
		mutation SetDeviceState($deviceId: ID!, $state: LightStateInput!) {
			setDeviceState(deviceId: $deviceId, state: $state) {
				id
			}
		}
	`;

	const DEVICE_STATE_CHANGED = gql`
		subscription DeviceStateChanged {
			deviceStateChanged {
				deviceId
				state {
					... on LightState {
						__typename
						on
						brightness
						colorTemp
						color { r g b x y }
						transition
					}
					... on SensorState {
						__typename
						temperature
						humidity
						battery
						pressure
						illuminance
					}
					... on SwitchState {
						__typename
						action
					}
				}
			}
		}
	`;

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

	let clientRef: Client | null = null;
	let scene = $state<SceneData | null>(null);
	let allDevices = $state<Device[]>([]);
	let allGroups = $state<GroupData[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let errorMessage = $state<string | null>(null);
	let unsubscribers: (() => void)[] = [];

	let sceneName = $state("");
	let editableActions = $state<EditableAction[]>([]);
	let liveEditing = $state(false);
	let pickerOpen = $state(false);

	let liveEditTimers = $state<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	function clearError() {
		errorMessage = null;
	}

	function dismissErrorAfterDelay() {
		setTimeout(clearError, 5000);
	}

	function parsePayload(raw: string): ActionPayload {
		try {
			return JSON.parse(raw) as ActionPayload;
		} catch {
			return { on: true, brightness: 127 };
		}
	}

	function buildTargetInfo(action: SceneAction): TargetInfo {
		if (action.target.__typename === "Group") {
			return {
				id: action.target.id,
				name: action.target.name,
				type: "group",
			};
		}
		return {
			id: action.target.id,
			name: action.target.name,
			type: "device",
			deviceType: action.target.type,
		};
	}

	function sceneToEditable(s: SceneData): EditableAction[] {
		return s.actions.map((a) => ({
			targetType: a.targetType,
			targetId: a.targetId,
			target: buildTargetInfo(a),
			payload: parsePayload(a.payload),
		}));
	}

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

	const availableGroups = $derived<PickerGroup[]>(
		allGroups
			.filter((g) => !existingTargetIds.has(g.id))
			.map((g) => ({
				id: g.id,
				name: g.name,
				members: g.members,
			}))
	);

	function sendLiveCommand(action: EditableAction) {
		if (!clientRef || !liveEditing) return;

		if (action.targetType === "device") {
			sendDeviceCommand(action.targetId, action.payload);
		} else if (action.targetType === "group") {
			const group = allGroups.find((g) => g.id === action.targetId);
			if (group) {
				for (const dev of group.resolvedDevices) {
					if (dev.type === "light") {
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
		clearError();

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
					actions,
				},
			})
			.toPromise();

		saving = false;

		if (result.error) {
			errorMessage = result.error.message;
			dismissErrorAfterDelay();
			return;
		}

		goto("/scenes");
	}

	function handleCancel() {
		goto("/scenes");
	}

	onMount(() => {
		const client = createGraphQLClient();
		clientRef = client;

		client
			.query<SceneQueryResult>(SCENE_QUERY, { id: sceneId })
			.toPromise()
			.then((result) => {
				loading = false;
				if (result.data?.scene) {
					scene = result.data.scene;
					sceneName = result.data.scene.name;
					editableActions = sceneToEditable(result.data.scene);
				} else {
					errorMessage = "Scene not found";
				}
			})
			.catch(() => {
				loading = false;
				errorMessage = "Failed to load scene";
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

<div>
	<div class="mb-6 flex items-center gap-3">
		<Button variant="ghost" size="icon-sm" href="/scenes" aria-label="Back to scenes">
			<ArrowLeft class="size-4" />
		</Button>
		<h1 class="text-2xl font-semibold">
			{#if loading}
				Scene
			{:else if scene}
				Edit Scene
			{:else}
				Scene Not Found
			{/if}
		</h1>
	</div>

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

	{#if loading}
		<div class="space-y-4">
			<div class="h-16 animate-pulse rounded-xl border border-border bg-card"></div>
			<div class="h-64 animate-pulse rounded-xl border border-border bg-card"></div>
		</div>
	{:else if scene}
		<div class="space-y-6">
			<div class="rounded-lg border border-border bg-card p-4">
				<label class="mb-2 block text-sm font-medium text-foreground" for="scene-name">
					Scene Name
				</label>
				<Input
					id="scene-name"
					bind:value={sceneName}
					placeholder="Scene name"
				/>
			</div>

			<div class="rounded-lg border border-border bg-card p-4">
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

			<div class="rounded-lg border border-border bg-muted/30 p-4">
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

			<div class="flex items-center justify-end gap-3">
				<Button variant="outline" onclick={handleCancel}>
					Cancel
				</Button>
				<Button onclick={handleSave} disabled={saving || !sceneName.trim()}>
					{saving ? "Saving..." : "Save"}
				</Button>
			</div>
		</div>
	{:else}
		<div class="rounded-lg border border-border bg-card p-12 text-center">
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

	<Sheet bind:open={pickerOpen}>
		<SheetContent side="right" class="w-full sm:max-w-md">
			<SheetHeader>
				<SheetTitle>Add Target</SheetTitle>
				<SheetDescription>Search for devices or groups to add to this scene.</SheetDescription>
			</SheetHeader>
			<div class="mt-4">
				<MemberPicker
					devices={availableDevices}
					groups={availableGroups}
					onselect={handleAddTarget}
				/>
			</div>
		</SheetContent>
	</Sheet>
</div>
