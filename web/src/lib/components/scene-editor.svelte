<script lang="ts">
	import { onMount, tick } from "svelte";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { flip } from "svelte/animate";
	import { cubicIn, cubicOut } from "svelte/easing";
	import { fly, slide } from "svelte/transition";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover/index.js";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import {
		Tabs,
		TabsContent,
		TabsList,
		TabsTrigger,
	} from "$lib/components/ui/tabs/index.js";
	import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "$lib/components/ui/dialog/index.js";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import HiveIcon from "$lib/components/hive-icon.svelte";
	import LightColorPicker from "$lib/components/light-color-picker.svelte";
	import TargetSelectorField from "$lib/components/target-selector-field.svelte";
	import VibePreview from "$lib/components/vibe-preview.svelte";
	import VibeSourcePicker from "$lib/components/vibe-source-picker.svelte";
	import EffectPickerDrawer, { type EffectPickerSelection } from "$lib/components/effect-picker-drawer.svelte";
	import DeviceStateEditor from "$lib/components/graph/device-state-editor.svelte";
	import {
		capturedSceneState,
		defaultDesiredState,
		initialSupportingState,
		newTargetUid,
		resolveSceneTargetLights,
		stateEmpty,
		type DesiredSceneState,
		type DynamicLighting,
		type EditorState,
		type SceneLightOverride,
		type ScenePreview,
	} from "$lib/scene-editable";
	import {
		deviceSceneCapabilities,
		deviceStore,
		isLightControlDevice,
		type Device,
	} from "$lib/stores/devices";
	import {
		evaluateExpression,
		type Clause,
		type GroupLite,
		type RoomLite,
	} from "$lib/target-resolve";
	import { buildTargetTree, type TargetTreeNode } from "$lib/target-tree";
	import type { EffectSummary } from "$lib/effect-editable";
	import { deviceDisplayName, deviceIcon, groupDisplayName } from "$lib/utils";
	import { rgbToXy } from "$lib/color";
	import { miredToRgb } from "$lib/device-tint";
	import { randomVibeSeed } from "$lib/vibe-seed";
	import {
		cycleSecondsToPacePosition,
		formatVibeCycle,
		pacePositionToCycleSeconds,
	} from "$lib/vibe-preview";
	import { vibeCatalog } from "$lib/stores/vibe-catalog.svelte";
	import {
		ChevronDown,
		ChevronRight,
		DoorOpen,
		Eye,
		Filter,
		Group as GroupIcon,
		Lightbulb,
		Palette,
		Pencil,
		Plus,
		Shuffle,
		SlidersHorizontal,
		Sparkles,
		Trash2,
		X,
	} from "@lucide/svelte";

	const SCENE_OUTPUT_RATE_QUERY = graphql(`
		query SceneOutputRate {
			zigbee2MqttConfig {
				continuousCommandsPerSecond
				activeContinuousDeviceIds
			}
		}
	`);

	type DirectTargetKind = "device" | "group" | "room";

	interface Props {
		editor: EditorState;
		preview: ScenePreview;
		devices: Device[];
		groups: GroupLite[];
		rooms: RoomLite[];
		effects?: EffectSummary[];
		onchange: (state: EditorState) => void;
		onpreviewchange?: (preview: ScenePreview) => void;
		vibePickerOpen?: boolean;
		showAddVibeInTargets?: boolean;
	}

	let {
		editor,
		preview,
		devices,
		groups,
		rooms,
		effects = [],
		onchange,
		onpreviewchange,
		vibePickerOpen = $bindable(false),
		showAddVibeInTargets = true,
	}: Props = $props();
	const client = getContextClient();
	let targetDrawerOpen = $state(false);
	let supportingDrawerOpen = $state(false);
	let effectPicker = $state<{ deviceId: string; caps: string[] } | null>(null);
	let targetLiveMode = $state(false);
	let targetActionMode = $state<"edit" | "live">("edit");
	let pendingTargetActionMode = $state<"edit" | "live" | null>(null);
	let targetActionsVisible = $state(true);
	let supportingLiveMode = $state(false);
	let sidePanel = $state("targets");
	let reducedMotion = $state(false);
	let rowTransitionsReady = $state(false);
	let expanded = $state(new Set<string>());
	let selectorEditor = $state<{ uid: string | null; name: string; expression: Clause[] } | null>(null);
	let previewBrightness = $state(1);
	let previewMovement = $state(0);
	let previewCycleSeconds = $state(720);
	let previewPacePosition = $state(cycleSecondsToPacePosition(720));
	let previewSeed = $state("0");
	let continuousCommandsPerSecond = $state(2);
	let activeContinuousDeviceIds = $state<string[]>([]);

	onMount(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		const syncMotion = () => (reducedMotion = media.matches);
		syncMotion();
		media.addEventListener("change", syncMotion);
		requestAnimationFrame(() => (rowTransitionsReady = true));
		const loadOutputRate = () => client
			.query(SCENE_OUTPUT_RATE_QUERY, {}, { requestPolicy: "network-only" })
			.toPromise()
			.then((result) => {
				continuousCommandsPerSecond =
					result.data?.zigbee2MqttConfig?.continuousCommandsPerSecond ?? 2;
				activeContinuousDeviceIds =
					result.data?.zigbee2MqttConfig?.activeContinuousDeviceIds ?? [];
			});
		void loadOutputRate();
		const outputRateTimer = setInterval(() => void loadOutputRate(), 5000);
		return () => {
			media.removeEventListener("change", syncMotion);
			clearInterval(outputRateTimer);
		};
	});

	$effect(() => {
		void vibeCatalog.load(client);
	});

	$effect(() => {
		const dynamic = editor.dynamicSource;
		if (!dynamic) return;
		previewBrightness = dynamic.brightness;
		previewMovement = dynamic.movement;
		previewCycleSeconds = dynamic.cycleSeconds;
		previewPacePosition = cycleSecondsToPacePosition(dynamic.cycleSeconds);
		previewSeed = dynamic.seed;
	});

	const devicesById = $derived(new Map(devices.map((device) => [device.id, device])));
	const resolvedLights = $derived(
		resolveSceneTargetLights(editor.targets, devices, groups, rooms, { includeDisabled: true }),
	);
	const dynamicZigbeeLightIds = $derived.by(() => {
		const excluded = new Set(
			Array.from(editor.overrides.values())
				.map((override) => override.deviceId),
		);
		return resolvedLights.filter(
			(device) =>
				device.source === "zigbee2mqtt" &&
				!device.disabled &&
				!device.deleted &&
				!excluded.has(device.id),
		).map((device) => device.id);
	});
	const dynamicZigbeeLightCount = $derived(dynamicZigbeeLightIds.length);
	const projectedContinuousZigbeeLightCount = $derived(
		new Set([...activeContinuousDeviceIds, ...dynamicZigbeeLightIds]).size,
	);
	const zigbeeRevisitSeconds = $derived(
		projectedContinuousZigbeeLightCount / Math.max(1, continuousCommandsPerSecond),
	);
	const zigbeeUpdatesPerCycle = $derived(
		zigbeeRevisitSeconds > 0 ? previewCycleSeconds / zigbeeRevisitSeconds : 0,
	);
	const zigbeeMotionBands = $derived(
		dynamicZigbeeLightCount === 0 ? 3 : Math.min(3, Math.floor(zigbeeUpdatesPerCycle / 4)),
	);

	function formatRevisit(seconds: number): string {
		if (seconds < 1) return `${Math.round(seconds * 10) / 10}s`;
		return `${Math.round(seconds)}s`;
	}
	const targetDrawerGroups = $derived.by((): DrawerGroup<DirectTargetKind>[] => {
		const existing = new Set(editor.targets.filter((target) => target.type !== "expression").map((target) => `${target.type}:${target.id}`));
		return [
			{
				heading: "Devices",
				items: devices.filter((device) => isLightControlDevice(device) && !existing.has(`device:${device.id}`)).map((device) => ({
					type: "device" as const,
					id: device.id,
					name: deviceDisplayName(device),
					icon: deviceIcon(device.type, device.roles.contact),
					iconRef: device.icon,
				})),
			},
			{
				heading: "Groups",
				items: groups.filter((group) => !group.removed && !existing.has(`group:${group.id}`)).map((group) => ({
					type: "group" as const,
					id: group.id,
					name: groupDisplayName(group),
					icon: GroupIcon,
					iconRef: group.icon,
				})),
			},
			{
				heading: "Rooms",
				items: rooms.filter((room) => !existing.has(`room:${room.id}`)).map((room) => ({
					type: "room" as const,
					id: room.id,
					name: room.name ?? room.id,
					icon: DoorOpen,
					iconRef: room.icon,
				})),
			},
		];
	});

	const supportingGroups = $derived.by((): DrawerGroup<"device">[] => [{
		heading: "Devices",
		items: devices.filter((device) => !isLightControlDevice(device) && initialSupportingState(device) !== null && !editor.supportingStates.has(device.id)).map((device) => ({
			type: "device" as const,
			id: device.id,
			name: deviceDisplayName(device),
			icon: deviceIcon(device.type, device.roles.contact),
			iconRef: device.icon,
			badgeType: device.type,
		})),
	}]);

	function update(next: Partial<EditorState>) {
		onchange({ ...editor, ...next });
	}

	function updateDynamic(values: Partial<DynamicLighting>) {
		if (!editor.dynamicSource) return;
		update({ dynamicSource: { ...editor.dynamicSource, ...values } });
	}

	function shuffleVibe() {
		previewSeed = randomVibeSeed();
		updateDynamic({ seed: previewSeed });
	}

	function addTarget(type: DirectTargetKind, id: string) {
		let name = id;
		let icon: string | null | undefined;
		let deviceType: string | undefined;
		if (type === "device") {
			const device = devices.find((candidate) => candidate.id === id);
			if (!device) return;
			name = deviceDisplayName(device);
			icon = device.icon;
			deviceType = device.type;
		} else if (type === "group") {
			const group = groups.find((candidate) => candidate.id === id);
			if (!group) return;
			name = groupDisplayName(group);
			icon = group.icon;
		} else {
			const room = rooms.find((candidate) => candidate.id === id);
			if (!room) return;
			name = room.name ?? id;
			icon = room.icon;
		}
		update({ targets: [...editor.targets, { uid: newTargetUid(), type, id, name, icon, deviceType }] });
	}

	function addSelector() {
		selectorEditor = { uid: null, name: "", expression: [] };
	}

	function editSelector(uid: string) {
		const target = editor.targets.find((candidate) => candidate.uid === uid);
		if (!target || target.type !== "expression") return;
		selectorEditor = {
			uid,
			name: target.name === "Selector" ? "" : target.name,
			expression: target.expression ?? [],
		};
	}

	function saveSelector() {
		const selection = selectorEditor;
		if (!selection) return;
		const name = selection.name.trim() || "Selector";
		if (selection.uid === null) {
			update({
				targets: [
					...editor.targets,
					{
						uid: newTargetUid(),
						type: "expression",
						id: "",
						name,
						expression: selection.expression,
					},
				],
			});
		} else {
			update({
				targets: editor.targets.map((target) =>
					target.uid === selection.uid
						? { ...target, name, expression: selection.expression }
						: target,
				),
			});
		}
		selectorEditor = null;
	}

	function removeTarget(uid: string) {
		const targets = editor.targets.filter((target) => target.uid !== uid);
		const resolved = new Set(resolveEditorTargets(targets).map((device) => device.id));
		const overrides = new Map(
			Array.from(editor.overrides).filter(([deviceId]) => resolved.has(deviceId)),
		);
		update({ targets, overrides });
	}

	function setOverride(override: SceneLightOverride) {
		const overrides = new Map(editor.overrides);
		overrides.set(override.deviceId, override);
		update({ overrides });
	}

	function clearOverride(deviceId: string) {
		const overrides = new Map(editor.overrides);
		overrides.delete(deviceId);
		update({ overrides });
	}

	function stateOverride(deviceId: string): DesiredSceneState {
		const current = editor.overrides.get(deviceId);
		return current?.kind === "state" ? current.state : {};
	}

	function cleanState(state: DesiredSceneState): DesiredSceneState {
		return Object.fromEntries(
			Object.entries(state).filter(([, value]) => value != null),
		) as DesiredSceneState;
	}

	function updateStateOverride(deviceId: string, patch: Partial<DesiredSceneState>) {
		const state = cleanState({ ...stateOverride(deviceId), ...patch });
		if (stateEmpty(state)) clearOverride(deviceId);
		else setOverride({ kind: "state", deviceId, state });
	}

	function clearStateField(deviceId: string, field: keyof DesiredSceneState) {
		updateStateOverride(deviceId, { [field]: null });
	}

	function useStateOverride(device: Device) {
		const current = editor.overrides.get(device.id);
		if (current?.kind === "state") return;
		if (current) clearOverride(device.id);
	}

	function captureAllTargets() {
		const overrides = new Map(editor.overrides);
		for (const device of resolvedLights) {
			const state = capturedSceneState(device);
			if (state) overrides.set(device.id, { kind: "state", deviceId: device.id, state });
		}
		update({ overrides });
	}

	function setTargetMode(live: boolean) {
		targetLiveMode = live;
		const next = live ? "live" : "edit";
		if (next === targetActionMode) {
			pendingTargetActionMode = null;
			targetActionsVisible = true;
			return;
		}
		pendingTargetActionMode = next;
		targetActionsVisible = false;
	}

	async function finishTargetActionExit(event: Event) {
		if (event.target !== event.currentTarget) return;
		const next = pendingTargetActionMode;
		if (!next) return;
		targetActionMode = next;
		pendingTargetActionMode = null;
		await tick();
		targetActionsVisible = true;
	}

	function resolveEditorTargets(targets: EditorState["targets"]): Device[] {
		return resolveSceneTargetLights(targets, devices, groups, rooms, { includeDisabled: true });
	}

	function openEffect(device: Device) {
		effectPicker = { deviceId: device.id, caps: device.capabilities.filter((capability) => capability.canSet).map((capability) => capability.name) };
	}

	function pickEffect(selection: EffectPickerSelection) {
		const target = effectPicker;
		if (!target) return;
		if (selection.kind === "timeline") setOverride({ kind: "effect", deviceId: target.deviceId, effectId: selection.effectId });
		else setOverride({ kind: "native_effect", deviceId: target.deviceId, nativeEffectName: selection.nativeName });
		effectPicker = null;
	}

	function addSupporting(_type: "device", id: string) {
		const device = devices.find((candidate) => candidate.id === id);
		if (!device) return;
		const state = initialSupportingState(device);
		if (!state) return;
		const supportingStates = new Map(editor.supportingStates);
		supportingStates.set(id, { deviceId: id, state });
		update({ supportingStates });
	}

	function updateSupportingPayload(deviceId: string, payload: string) {
		let state: DesiredSceneState = {};
		try { state = JSON.parse(payload) as DesiredSceneState; } catch { return; }
		const supportingStates = new Map(editor.supportingStates);
		if (Object.keys(state).length === 0) supportingStates.delete(deviceId);
		else supportingStates.set(deviceId, { deviceId, state });
		update({ supportingStates });
	}

	function removeSupporting(id: string) {
		const supportingStates = new Map(editor.supportingStates);
		supportingStates.delete(id);
		update({ supportingStates });
	}

	function captureSupporting(device: Device) {
		const state = capturedSceneState(device);
		if (!state) return;
		const supportingStates = new Map(editor.supportingStates);
		supportingStates.set(device.id, { deviceId: device.id, state });
		update({ supportingStates });
	}

	function chooseVibe() {
		vibePickerOpen = true;
	}

	function setDynamicSource(dynamicSource: DynamicLighting, nextPreview: ScenePreview) {
		update({ dynamicSource });
		onpreviewchange?.(nextPreview);
		vibePickerOpen = false;
	}

	function toggleFolder(key: string) {
		const next = new Set(expanded);
		if (next.has(key)) next.delete(key); else next.add(key);
		expanded = next;
	}

	function targetTree(target: EditorState["targets"][number]): TargetTreeNode | null {
		if (target.type === "expression") return null;
		return buildTargetTree(target.uid, { type: target.type, id: target.id }, devicesById, groups, rooms, { deviceFilter: isLightControlDevice });
	}

	function targetExpressionDevices(target: EditorState["targets"][number]): Device[] {
		return evaluateExpression(target.expression ?? [], devices, groups, rooms).filter(isLightControlDevice);
	}

	function overrideLabel(override: SceneLightOverride): string {
		if (override.kind === "state") return "State";
		if (override.kind === "effect") return effects.find((effect) => effect.id === override.effectId)?.name ?? "Effect";
		return override.nativeEffectName;
	}

	function displayState(device: Device): DesiredSceneState {
		if (targetLiveMode) return capturedSceneState(device) ?? {};
		return stateOverride(device.id);
	}

	function swatchColor(state: DesiredSceneState): string | null {
		if (state.color) return `rgb(${state.color.r}, ${state.color.g}, ${state.color.b})`;
		if (state.colorTemp != null) {
			const color = miredToRgb(state.colorTemp);
			return `rgb(${color.r}, ${color.g}, ${color.b})`;
		}
		return null;
	}

	function setColor(deviceId: string, color: { r: number; g: number; b: number }) {
		const xy = rgbToXy(color.r, color.g, color.b);
		updateStateOverride(deviceId, { color: { ...color, ...xy }, colorTemp: null });
	}

	function setColorTemp(deviceId: string, colorTemp: number) {
		updateStateOverride(deviceId, { colorTemp, color: null });
	}

	function setPower(deviceId: string, on: boolean) {
		updateStateOverride(deviceId, { on });
	}
</script>

{#snippet statePicker(device: Device)}
	{@const capabilities = deviceSceneCapabilities(device)}
	{@const state = stateOverride(device.id)}
	<Popover>
		<PopoverTrigger>
			<Button
				variant={editor.overrides.get(device.id)?.kind === "state" ? "secondary" : "ghost"}
				size="icon-sm"
				class="rounded-r-none border-0"
				onclick={() => useStateOverride(device)}
				aria-label={`Adjust ${deviceDisplayName(device)}`}
			>
				<Palette class="size-3.5" />
			</Button>
		</PopoverTrigger>
		<PopoverContent class="w-72 space-y-3 p-3" align="end">
			<LightColorPicker
				color={state.color ?? null}
				colorTemp={state.colorTemp ?? null}
				brightness={state.brightness ?? null}
				hasColor={capabilities.hasColor}
				hasColorTemp={capabilities.hasColorTemp}
				hasBrightness={capabilities.hasBrightness}
				oncolorchange={(color) => setColor(device.id, color)}
				ontempchange={(colorTemp) => setColorTemp(device.id, colorTemp)}
				onbrightnesschange={(brightness) => updateStateOverride(device.id, { brightness })}
				compact
			/>
			<div class="flex flex-wrap gap-1 border-t border-border pt-3">
				{#if capabilities.hasOnOff}
					<Button
						variant={state.on != null ? "secondary" : "outline"}
						size="xs"
						onclick={() => state.on != null ? clearStateField(device.id, "on") : setPower(device.id, true)}
					>Power</Button>
				{/if}
				{#if capabilities.hasBrightness}
					<Button
						variant={state.brightness != null ? "secondary" : "outline"}
						size="xs"
						onclick={() => state.brightness != null ? clearStateField(device.id, "brightness") : updateStateOverride(device.id, { brightness: defaultDesiredState(device).brightness ?? 200 })}
					>Brightness</Button>
				{/if}
				{#if capabilities.hasColor || capabilities.hasColorTemp}
					<Button
						variant={state.color != null || state.colorTemp != null ? "secondary" : "outline"}
						size="xs"
						onclick={() => {
							if (state.color != null || state.colorTemp != null) {
								updateStateOverride(device.id, { color: null, colorTemp: null });
							} else if (capabilities.hasColorTemp) {
								setColorTemp(device.id, 370);
							} else {
								setColor(device.id, { r: 255, g: 255, b: 255 });
							}
						}}
					>Color</Button>
				{/if}
				{#if !stateEmpty(state)}
					<Button variant="ghost" size="xs" class="ml-auto" onclick={() => clearOverride(device.id)}>Clear</Button>
				{/if}
			</div>
		</PopoverContent>
	</Popover>
{/snippet}

{#snippet rowControls(device: Device)}
	{@const override = editor.overrides.get(device.id)}
	{@const capabilities = deviceSceneCapabilities(device)}
	{@const state = displayState(device)}
	{@const color = swatchColor(state)}
	<div class="flex items-center gap-2" onclick={(event) => event.stopPropagation()} role="presentation">
		{#if targetLiveMode}
			{#if color}<span class="size-4 rounded-full border border-border" style:background-color={color}></span>{/if}
			{#if capabilities.hasOnOff}<Switch checked={state.on ?? false} disabled aria-label={`${deviceDisplayName(device)} live power`} />{/if}
		{:else}
			<div class="flex items-center rounded-md border border-border dark:border-input">
				{@render statePicker(device)}
				<Button
					variant={override?.kind === "effect" || override?.kind === "native_effect" ? "secondary" : "ghost"}
					size="icon-sm"
					class="rounded-l-none border-0"
					onclick={() => openEffect(device)}
					aria-label={`Choose effect for ${deviceDisplayName(device)}`}
				><Sparkles class="size-3.5" /></Button>
			</div>
			{#if override?.kind === "effect" || override?.kind === "native_effect"}
				<Button variant="ghost" size="xs" onclick={() => openEffect(device)}><Sparkles class="size-3.5" />{overrideLabel(override)}</Button>
			{:else}
				<span
					class="size-4 rounded-full border border-border transition-colors duration-200"
					class:bg-muted={color === null}
					style:background-color={color ?? undefined}
				></span>
				{#if capabilities.hasOnOff}
					<Switch
						checked={state.on ?? false}
						class={state.on == null ? "opacity-40" : ""}
						onCheckedChange={(on) => setPower(device.id, on)}
						aria-label={`Set ${deviceDisplayName(device)} power`}
					/>
				{/if}
			{/if}
			{#if override}
				<Button variant="ghost" size="icon-xs" onclick={() => clearOverride(device.id)} aria-label={`Clear override for ${deviceDisplayName(device)}`}><X class="size-3.5" /></Button>
			{/if}
		{/if}
	</div>
{/snippet}

{#snippet deviceRow(device: Device, targetUid: string | null = null)}
	<div class="flex min-h-10 items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-200 hover:bg-muted/60">
		<HiveIcon type={device.type} contactRole={device.roles.contact} iconOverride={device.icon} class="size-4 shrink-0 text-muted-foreground" />
		<span class="min-w-0 flex-1 truncate text-sm">{deviceDisplayName(device)}</span>
		{@render rowControls(device)}
		{#if targetUid}
			<Button variant="ghost" size="icon-sm" onclick={() => removeTarget(targetUid)} aria-label={`Remove ${deviceDisplayName(device)}`}><Trash2 class="size-4" /></Button>
		{/if}
	</div>
{/snippet}

{#snippet folderChildren(node: TargetTreeNode)}
	{#if node.kind !== "device"}
		{#each node.children as child (child.key)}
			{#if child.kind === "device"}
				{@render deviceRow(child.device)}
			{:else}
				{@render folderRow(child)}
			{/if}
		{/each}
		{#if node.children.length === 0}
			<p class="px-2 py-1 text-xs text-muted-foreground">{node.truncated ? "Nesting limit reached." : "Empty."}</p>
		{/if}
	{/if}
{/snippet}

{#snippet folderRow(node: TargetTreeNode)}
	{#if node.kind !== "device"}
		<div class="flex flex-col">
			<div class="flex min-h-9 items-center gap-2 rounded-md px-2 py-1 transition-colors duration-200 outline-none hover:bg-muted/60" role="button" tabindex={-1} onclick={() => toggleFolder(node.key)} onkeydown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleFolder(node.key); } }}>
				{#if expanded.has(node.key)}<ChevronDown class="size-4 shrink-0 text-muted-foreground" />{:else}<ChevronRight class="size-4 shrink-0 text-muted-foreground" />{/if}
				<HiveIcon type={node.kind} iconOverride={node.icon} class="size-4 shrink-0 text-muted-foreground" />
				<span class="truncate text-sm">{node.name}</span><span class="text-xs text-muted-foreground">{node.reachableCount}</span>
			</div>
			<div
				class="grid {expanded.has(node.key) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none"
				aria-hidden={!expanded.has(node.key)}
			>
				<div class="min-h-0 overflow-hidden" inert={!expanded.has(node.key)}>
					<div class="flex flex-col gap-1 pb-1 pl-6">{@render folderChildren(node)}</div>
				</div>
			</div>
		</div>
	{/if}
{/snippet}

{#snippet targetRow(target: EditorState["targets"][number])}
	{#if target.type === "device"}
		{@const device = devicesById.get(target.id)}
		{#if device}{@render deviceRow(device, target.uid)}{/if}
	{:else}
		{@const expressionDevices = target.type === "expression" ? targetExpressionDevices(target) : []}
		{@const tree = target.type === "expression" ? null : targetTree(target)}
		{@const count = target.type === "expression" ? expressionDevices.length : tree?.kind === "device" ? 1 : (tree?.reachableCount ?? 0)}
		<div class="flex flex-col">
			<div class="flex min-h-10 items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-200 outline-none hover:bg-muted/60" role="button" tabindex={-1} onclick={() => toggleFolder(target.uid)} onkeydown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleFolder(target.uid); } }}>
				{#if expanded.has(target.uid)}<ChevronDown class="size-4 shrink-0 text-muted-foreground" />{:else}<ChevronRight class="size-4 shrink-0 text-muted-foreground" />{/if}
				{#if target.type === "expression"}<Filter class="size-4 shrink-0 text-muted-foreground" />{:else}<HiveIcon type={target.type} iconOverride={target.icon} class="size-4 shrink-0 text-muted-foreground" />{/if}
				<span class="truncate text-sm font-medium">{target.name}</span><span class="text-xs text-muted-foreground">{count}</span><span class="flex-1"></span>
				<div class="flex items-center gap-1" onclick={(event) => event.stopPropagation()} role="presentation">
					{#if target.type === "expression"}<Button variant="ghost" size="icon-sm" onclick={() => editSelector(target.uid)} aria-label={`Edit ${target.name}`}><Pencil class="size-4" /></Button>{/if}
					<Button variant="ghost" size="icon-sm" onclick={() => removeTarget(target.uid)} aria-label={`Remove ${target.name}`}><Trash2 class="size-4" /></Button>
				</div>
			</div>
			<div
				class="grid {expanded.has(target.uid) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none"
				aria-hidden={!expanded.has(target.uid)}
			>
				<div class="min-h-0 overflow-hidden" inert={!expanded.has(target.uid)}>
					<div class="flex flex-col gap-1 pb-1 pl-6">
					{#if target.type === "expression"}
						{#each expressionDevices as device (device.id)}{@render deviceRow(device)}{/each}
					{:else if tree && tree.kind !== "device"}
						{@render folderChildren(tree)}
					{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
{/snippet}

{#snippet targetToolbar()}
	<div class="flex min-h-9 w-full flex-wrap items-center justify-between gap-2">
		<div class="flex items-center rounded-md border border-border dark:border-input">
			<Button variant={!targetLiveMode ? "secondary" : "ghost"} size="sm" class="rounded-r-none border-0" onclick={() => setTargetMode(false)} aria-pressed={!targetLiveMode}><Pencil class="size-3.5" /><span class="hidden sm:inline">Edit</span></Button>
			<Button variant={targetLiveMode ? "secondary" : "ghost"} size="sm" class="rounded-l-none border-0" onclick={() => setTargetMode(true)} aria-pressed={targetLiveMode}><Eye class="size-3.5" /><span class="hidden sm:inline">Live</span></Button>
		</div>
		<div class="ml-auto flex items-center gap-2">
			{#if showAddVibeInTargets && !editor.dynamicSource}<Button variant="outline" size="sm" onclick={chooseVibe}><Plus class="size-4" /> Add source</Button>{/if}
			{#if targetActionsVisible}
				<div
					class="flex items-center gap-2"
					onoutroend={finishTargetActionExit}
					in:fly={{ x: reducedMotion ? 0 : 6, duration: reducedMotion ? 0 : 150, easing: cubicOut }}
					out:fly={{ x: reducedMotion ? 0 : -6, duration: reducedMotion ? 0 : 130, easing: cubicIn }}
				>
					{#if targetActionMode === "live"}
						<Button variant="outline" size="sm" onclick={captureAllTargets}>Capture all</Button>
					{:else}
						<DropdownMenu>
							<DropdownMenuTrigger>
								{#snippet child({ props })}
									<Button {...props} variant="outline" size="sm"><Plus class="size-4" /> Add</Button>
								{/snippet}
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onclick={() => (targetDrawerOpen = true)}><Plus class="size-4" /> Simple</DropdownMenuItem>
								<DropdownMenuItem onclick={addSelector}><SlidersHorizontal class="size-4" /> Selector</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet supportingToolbar()}
	<div class="flex min-h-9 w-full flex-wrap items-center justify-between gap-2">
		<Button variant={supportingLiveMode ? "default" : "outline"} size="sm" onclick={() => (supportingLiveMode = !supportingLiveMode)}><Eye class="size-4" /> Live</Button>
		<Button variant="outline" size="sm" class="ml-auto" onclick={() => (supportingDrawerOpen = true)}><Plus class="size-4" /> Add</Button>
	</div>
{/snippet}

{#snippet targetList()}
	<div class="flex flex-col gap-1">
		{#each editor.targets as target (target.uid)}
			<div in:slide={{ duration: reducedMotion || !rowTransitionsReady ? 0 : 180, easing: cubicOut }} out:slide={{ duration: reducedMotion || !rowTransitionsReady ? 0 : 150, easing: cubicIn }} animate:flip={{ duration: reducedMotion || !rowTransitionsReady ? 0 : 160 }}>{@render targetRow(target)}</div>
		{/each}
	</div>
{/snippet}

{#snippet supportingList()}
	<div class="space-y-2">
		{#each Array.from(editor.supportingStates.values()) as supporting (supporting.deviceId)}
			{@const device = devices.find((candidate) => candidate.id === supporting.deviceId) ?? $deviceStore[supporting.deviceId]}
			{#if device}
				<div class="rounded-lg bg-muted px-3 py-2" in:slide={{ duration: reducedMotion || !rowTransitionsReady ? 0 : 180, easing: cubicOut }} out:slide={{ duration: reducedMotion || !rowTransitionsReady ? 0 : 150, easing: cubicIn }}>
					<div class="flex items-center justify-between gap-3"><div class="flex items-center gap-2"><Lightbulb class="size-4 text-muted-foreground" /><div><p class="text-sm font-medium">{deviceDisplayName(device)}</p>{#if supportingLiveMode}<p class="text-xs text-muted-foreground">{device.state?.on === false ? "Off" : "Live"}</p>{/if}</div></div><div class="flex gap-1">{#if supportingLiveMode}<Button variant="outline" size="xs" onclick={() => captureSupporting(device)}>Capture</Button>{/if}<Button variant="ghost" size="icon-sm" onclick={() => removeSupporting(device.id)} aria-label={`Remove ${deviceDisplayName(device)}`}><Trash2 class="size-4" /></Button></div></div>
					{#if !supportingLiveMode}<div class="mt-2"><DeviceStateEditor target={null} capabilities={device.capabilities} value={JSON.stringify(supporting.state)} onchange={(payload) => updateSupportingPayload(device.id, payload)} {devices} {groups} {rooms} compact /></div>{/if}
				</div>
			{/if}
		{/each}
	</div>
{/snippet}

{#if editor.dynamicSource}
	<div class="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
		<section class="space-y-5 rounded-lg bg-card p-5 shadow-card">
			<div class="flex items-start justify-between gap-3">
				<div class="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center">
					<h2 class="text-lg font-medium">Lighting</h2>
					<div class="flex flex-wrap items-center gap-2"><HiveChip type="color" label={editor.dynamicSource.domain === "white_ambience" ? "White" : "Color"} /><HiveChip type="scene" label={editor.dynamicSource.presetTitle ?? (editor.dynamicSource.sourceKind === "photo" ? "Photo" : "Guided")} /></div>
				</div>
				<div class="flex shrink-0 gap-1 sm:gap-2">
					<Button variant="outline" size="icon-sm" class="sm:w-auto sm:gap-1 sm:px-2.5" onclick={chooseVibe} aria-label="Change source"><Pencil class="size-4" /><span class="hidden sm:inline">Change</span></Button>
					<Button variant="ghost" size="icon-sm" class="text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto sm:gap-1 sm:px-2.5" onclick={() => update({ dynamicSource: null })} aria-label="Remove source"><X class="size-4" /><span class="hidden sm:inline">Remove</span></Button>
				</div>
			</div>
			<div class="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
				<div class="min-h-80 overflow-hidden rounded-lg"><VibePreview {preview} brightness={previewBrightness} movement={previewMovement} cycleSeconds={previewCycleSeconds} seed={previewSeed} maximumTemporalFrequency={zigbeeMotionBands} /></div>
				<div class="space-y-5">
					<div class="space-y-2"><div class="flex justify-between text-sm"><label for="scene-vibe-brightness">Brightness</label><span class="tabular-nums text-muted-foreground">{Math.round(previewBrightness * 100)}%</span></div><Slider id="scene-vibe-brightness" type="single" min={0.05} max={1} step={0.01} bind:value={previewBrightness} onValueCommit={(value) => updateDynamic({ brightness: value })} /></div>
					<div class="space-y-2"><div class="flex justify-between text-sm"><label for="scene-vibe-movement">Movement</label><span class="text-muted-foreground">{previewMovement === 0 ? "Still" : previewMovement < 0.4 ? "Gentle" : previewMovement < 0.75 ? "Flowing" : "Alive"}</span></div><Slider id="scene-vibe-movement" type="single" min={0} max={1} step={0.01} bind:value={previewMovement} onValueCommit={(value) => updateDynamic({ movement: value })} /></div>
					<div class="space-y-2">
						<div class="flex justify-between text-sm"><label for="scene-vibe-pace">Pace</label><span class="tabular-nums text-muted-foreground">{formatVibeCycle(previewCycleSeconds)}</span></div>
						<Slider id="scene-vibe-pace" type="single" min={0} max={100} step={1} bind:value={previewPacePosition} onValueChange={(value) => (previewCycleSeconds = pacePositionToCycleSeconds(value))} onValueCommit={(value) => { previewCycleSeconds = pacePositionToCycleSeconds(value); updateDynamic({ cycleSeconds: previewCycleSeconds }); }} disabled={previewMovement === 0} />
						{#if previewMovement > 0 && dynamicZigbeeLightCount > 0}
							<p class="text-xs text-muted-foreground">
								{dynamicZigbeeLightCount} {dynamicZigbeeLightCount === 1 ? "scene light" : "scene lights"} · {projectedContinuousZigbeeLightCount} Zigbee {projectedContinuousZigbeeLightCount === 1 ? "light" : "lights"} sharing continuous output · about {formatRevisit(zigbeeRevisitSeconds)} between updates per light.
							</p>
							{#if zigbeeMotionBands === 0}
								<p class="text-xs text-destructive">
									This cycle is too fast for the available continuous output. Hive will hold the motion still to avoid abrupt colour jumps. Choose a longer cycle or increase the continuous command rate.
								</p>
							{:else if zigbeeMotionBands < 3}
								<p class="text-xs text-muted-foreground">
									Hive will simplify the motion to keep transitions smooth. Choose a longer cycle or increase the continuous command rate for full motion detail.
								</p>
							{/if}
						{/if}
					</div>
					<Button variant="outline" size="sm" onclick={shuffleVibe}><Shuffle class="size-4" /> Shuffle</Button>
				</div>
			</div>
		</section>

		<section class="min-w-0 overflow-hidden rounded-lg bg-card p-5 shadow-card select-none">
			<Tabs bind:value={sidePanel} class="gap-4">
				<div class="space-y-3">
					<TabsList class="grid w-full grid-cols-2">
						<TabsTrigger value="targets">Targets</TabsTrigger>
						<TabsTrigger value="supporting">Supporting devices</TabsTrigger>
					</TabsList>
					{#if sidePanel === "targets"}
						{@render targetToolbar()}
					{:else}
						{@render supportingToolbar()}
					{/if}
				</div>

				<TabsContent value="targets" class="m-0 space-y-3">
					{@render targetList()}
				</TabsContent>

				<TabsContent value="supporting" class="m-0 space-y-4">
					{@render supportingList()}
				</TabsContent>
			</Tabs>
		</section>
	</div>
{:else}
	<div class="grid items-start gap-6 lg:grid-cols-2">
		<section class="min-w-0 space-y-4 overflow-hidden rounded-lg bg-card p-5 shadow-card select-none">
			<h2 class="text-lg font-medium">Targets</h2>
			{@render targetToolbar()}
			{@render targetList()}
		</section>

		<section class="min-w-0 space-y-4 overflow-hidden rounded-lg bg-card p-5 shadow-card select-none">
			<h2 class="text-lg font-medium">Supporting devices</h2>
			{@render supportingToolbar()}
			{@render supportingList()}
		</section>
	</div>
{/if}

<HiveDrawer bind:open={targetDrawerOpen} title="Add lighting targets" description="Choose devices, groups, or rooms." multiple groups={targetDrawerGroups} onselect={addTarget} />
<HiveDrawer bind:open={supportingDrawerOpen} title="Add supporting devices" description="Add controllable non-light devices." multiple groups={supportingGroups} onselect={addSupporting} />
<EffectPickerDrawer open={effectPicker !== null} {effects} caps={effectPicker?.caps ?? []} onselect={pickEffect} onclose={() => (effectPicker = null)} />

<Dialog bind:open={vibePickerOpen}>
	<DialogContent class="sm:max-w-4xl">
		<DialogHeader><DialogTitle>{editor.dynamicSource ? "Change source" : "Add source"}</DialogTitle></DialogHeader>
		<VibeSourcePicker onselect={setDynamicSource} />
	</DialogContent>
</Dialog>

<Dialog open={selectorEditor !== null} onOpenChange={(open) => { if (!open) selectorEditor = null; }}>
	<DialogContent class="sm:max-w-lg">
		<DialogHeader><DialogTitle>{selectorEditor?.uid ? "Edit selector" : "Add selector"}</DialogTitle></DialogHeader>
		{#if selectorEditor}
			<div class="space-y-4">
				<Input
					value={selectorEditor.name}
					oninput={(event) => (selectorEditor = { ...selectorEditor!, name: event.currentTarget.value })}
					placeholder="Selector name"
					aria-label="Selector name"
				/>
				<TargetSelectorField
					value={selectorEditor.expression}
					onchange={(expression) => (selectorEditor = { ...selectorEditor!, expression })}
					{devices}
					{groups}
					{rooms}
				/>
			</div>
		{/if}
		<DialogFooter>
			<Button variant="ghost" size="sm" onclick={() => (selectorEditor = null)}>Cancel</Button>
			<Button size="sm" onclick={saveSelector}>Done</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
