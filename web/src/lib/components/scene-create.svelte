<script lang="ts">
	import { onMount, tick } from "svelte";
	import { goto, pushState, replaceState } from "$app/navigation";
	import { page } from "$app/state";
	import { cubicIn, cubicOut } from "svelte/easing";
	import { flip } from "svelte/animate";
	import { fly, slide } from "svelte/transition";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import SceneEditor from "$lib/components/scene-editor.svelte";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import FieldError from "$lib/components/field-error.svelte";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import VibePreview from "$lib/components/vibe-preview.svelte";
	import VibeChoiceCard from "$lib/components/vibe-choice-card.svelte";
	import VibeGuided from "$lib/components/vibe-guided.svelte";
	import TargetSelectorField from "$lib/components/target-selector-field.svelte";
	import { normalizePhoto, type NormalizedPhotoSample } from "$lib/photo-sample";
	import {
		classifyVibeDevices,
		resolveSceneTargets,
	} from "$lib/scene-capability-summary";
	import {
		capturedSceneState,
		defaultDesiredState,
		editorDefinitionInput,
		initialSupportingState,
		newTargetUid,
		sceneStateInput,
		type DynamicLighting,
		type EditableTarget,
		type EditorState,
		type SceneLightOverride,
		type ScenePreview,
		type SceneSupportingState,
		type VibeDomain,
	} from "$lib/scene-editable";
	import { scenesStore } from "$lib/stores/scenes.svelte";
	import { effectsStore } from "$lib/stores/effects.svelte";
	import { effectSummary } from "$lib/effect-editable";
	import { vibeCatalog, type VibePreset } from "$lib/stores/vibe-catalog.svelte";
	import {
		deviceSceneCapabilities,
		deviceStore,
		isLightControlDevice,
		isRuntimeEnabledDevice,
		type Device,
	} from "$lib/stores/devices";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { groupsStore } from "$lib/stores/groups.svelte";
	import type { Clause, GroupLite, RoomLite } from "$lib/target-resolve";
	import { deviceDisplayName, deviceIcon, groupDisplayName } from "$lib/utils";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import { randomVibeSeed } from "$lib/vibe-seed";
	import {
		VibeFieldDomain,
		type SceneDefinitionInput,
		type VibeSourceInput,
	} from "$lib/gql/graphql";
	import {
		ArrowLeft,
		Camera,
		Clapperboard,
		DoorOpen,
		Group as GroupIcon,
		Image,
		Lightbulb,
		Loader2,
		Plus,
		SlidersHorizontal,
		Sparkles,
		Trash2,
	} from "@lucide/svelte";

	type CreationKind = "gallery" | "photo" | "guided" | "individual";
	type Stage = "start" | "look" | "targets" | "adjust" | "name";
	type DirectTargetKind = "device" | "group" | "room";

	type VibeSource =
		| { preset: { presetId: string; seed: string } }
		| { photo: { domain: VibeDomain; seed: string; width: number; height: number; rgbBase64: string } }
		| { guided: { domain: VibeDomain; seed: string; selectedIds: string[] } };

	const PREVIEW_VIBE = graphql(`
		query SceneCreateVibePreview($input: PreviewVibeInput!) {
			previewVibe(input: $input) {
				preview { width height pixels { r g b } swatches { x y color { r g b } } }
				domain seed brightness movement cycleSeconds minimumLightness maximumLightness
			}
		}
	`);

	const client = getContextClient();
	const devices = $derived(Object.values($deviceStore).filter(isRuntimeEnabledDevice));
	const groups = $derived(groupsStore.items);
	const rooms = $derived(roomsStore.items);
	const groupsLite = $derived<GroupLite[]>(groups.map((group) => ({
		id: group.id,
		name: group.name,
		friendlyName: group.friendlyName,
		icon: group.icon,
		removed: group.removed,
		members: group.members,
	})));
	const roomsLite = $derived<RoomLite[]>(rooms.map((room) => ({
		id: room.id,
		name: room.name,
		icon: room.icon,
		members: room.members,
		resolvedDevices: room.resolvedDevices,
	})));

	let stage = $state<Stage>("start");
	let stageDirection = $state<"forward" | "back">("forward");
	let stageMotionReady = $state(false);
	let stageVisible = $state(true);
	let pendingStage = $state<Stage | null>(null);
	let reducedMotion = $state(false);
	let kind = $state<CreationKind | null>(null);
	let name = $state("");
	let seed = $state<string>(randomVibeSeed());
	let domain = $state<VibeDomain>("full_color");
	let source = $state<VibeSource | null>(null);
	let preview = $state<ScenePreview | null>(null);
	const presets = $derived(vibeCatalog.items);
	const effects = $derived(effectsStore.items.map(effectSummary));
	let selectedPresetId = $state<string | null>(null);
	let photo = $state<NormalizedPhotoSample | null>(null);
	let guidedSelectedIds = $state<string[]>([]);
	let brightness = $state(0.82);
	let movement = $state(0.45);
	let cycleSeconds = $state(720);
	let targets = $state<EditableTarget[]>([]);
	let overrides = $state<Map<string, SceneLightOverride>>(new Map());
	let supportingStates = $state<Map<string, SceneSupportingState>>(new Map());
	let targetDrawerOpen = $state(false);
	let supportingDrawerOpen = $state(false);
	let loadingPreview = $state(false);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let photoError = $state<string | null>(null);
	let saved = $state(false);
	const emptyPreview: ScenePreview = {
		width: 1,
		height: 1,
		pixels: [{ r: 255, g: 255, b: 255 }],
		swatches: [],
	};

	$effect(() => {
		void vibeCatalog.load(client);
	});

	const resolvedTargets = $derived(resolveSceneTargets(targets, devices, groupsLite, roomsLite));
	const capabilitySummary = $derived(classifyVibeDevices(resolvedTargets, domain));
	const eligibleVibeCount = $derived(
		capabilitySummary.fullColor.length + capabilitySummary.tunableWhite.length +
		capabilitySummary.dimming.length + capabilitySummary.switchOnly.length,
	);
	const canContinueTargets = $derived(
		(targets.length > 0 || supportingStates.size > 0) && (kind === "individual" || eligibleVibeCount > 0),
	);
	const dirty = $derived(!saved && (stage !== "start" || name.trim() !== "" || targets.length > 0 || supportingStates.size > 0));
	const creationEditor = $derived.by((): EditorState => ({
		targets,
		dynamicSource: currentDynamicSource(),
		overrides,
		supportingStates,
	}));
	const stageOrder: Record<Stage, number> = { start: 0, look: 1, targets: 2, adjust: 3, name: 4 };

	$effect(() => {
		const historyStage = page.state.sceneCreateStage;
		if (!historyStage || historyStage === pendingStage) return;
		queueStage(historyStage);
	});

	onMount(() => {
		replaceState("", { ...page.state, sceneCreateStage: "start" });
		stage = "start";
		pendingStage = null;
		stageVisible = true;
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		const syncMotion = () => (reducedMotion = media.matches);
		syncMotion();
		media.addEventListener("change", syncMotion);
		requestAnimationFrame(() => (stageMotionReady = true));
		return () => media.removeEventListener("change", syncMotion);
	});

	function moveTo(next: Stage) {
		if (next === stage || next === pendingStage) return;
		queueStage(next);
		pushState("", { ...page.state, sceneCreateStage: next });
	}

	function queueStage(next: Stage) {
		if (next === stage) {
			pendingStage = null;
			stageVisible = true;
			return;
		}
		stageDirection = stageOrder[next] < stageOrder[stage] ? "back" : "forward";
		pendingStage = next;
		stageVisible = false;
	}

	async function finishStageExit(event: Event) {
		if (event.target !== event.currentTarget) return;
		const next = pendingStage;
		if (!next) return;
		await tick();
		if (pendingStage !== next) return;
		stage = next;
		pendingStage = null;
		stageVisible = true;
	}

	const targetDrawerGroups = $derived.by((): DrawerGroup<DirectTargetKind>[] => {
		const existing = new Set(targets.filter((target) => target.type !== "expression").map((target) => `${target.type}:${target.id}`));
		return [
			{
				heading: "Devices",
				items: devices
					.filter((device) => isLightControlDevice(device) && !existing.has(`device:${device.id}`))
					.map((device) => ({
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
					badge: `${group.resolvedDevices.length} devices`,
				})),
			},
			{
				heading: "Rooms",
				items: rooms.filter((room) => !existing.has(`room:${room.id}`)).map((room) => ({
					type: "room" as const,
					id: room.id,
					name: room.name,
					icon: DoorOpen,
					iconRef: room.icon,
					badge: `${room.resolvedDevices.length} devices`,
				})),
			},
		];
	});

	const supportingDrawerGroups = $derived.by((): DrawerGroup<"device">[] => [{
		heading: "Supporting devices",
		items: devices
			.filter((device) => !isLightControlDevice(device) && initialSupportingState(device) !== null && !supportingStates.has(device.id))
			.map((device) => ({
				type: "device" as const,
				id: device.id,
				name: deviceDisplayName(device),
				icon: deviceIcon(device.type, device.roles.contact),
				iconRef: device.icon,
				badgeType: device.type,
			})),
	}]);

	const presetGroups = $derived.by(() => {
		const grouped = new Map<string, VibePreset[]>();
		for (const preset of presets) {
			const label = `${preset.domain === "white_ambience" ? "White ambience" : "Full colour"} · ${preset.category}`;
			grouped.set(label, [...(grouped.get(label) ?? []), preset]);
		}
		return Array.from(grouped.entries());
	});

	function begin(next: CreationKind) {
		kind = next;
		moveTo(next === "individual" ? "targets" : "look");
		error = null;
	}

	function goBack() {
		history.back();
	}

	function apiSource(value: VibeSource): VibeSourceInput {
		if ("photo" in value) return { photo: { ...value.photo, domain: value.photo.domain as VibeFieldDomain } };
		if ("guided" in value) return { guided: { ...value.guided, domain: value.guided.domain as VibeFieldDomain } };
		return value;
	}

	function currentDynamicSource(): DynamicLighting | null {
		const current = source;
		if (!current) return null;
		const sourceKind = "preset" in current ? "preset" : "photo" in current ? "photo" : "guided";
		const preset = "preset" in current
			? presets.find((candidate) => candidate.id === current.preset.presetId)
			: null;
		return {
			domain,
			sourceKind,
			presetId: "preset" in current ? current.preset.presetId : null,
			presetTitle: preset?.title ?? null,
			guidedSelectedIds: "guided" in current ? current.guided.selectedIds : [],
			seed,
			brightness,
			movement,
			cycleSeconds,
			gridWidth: 0,
			gridHeight: 0,
			samples: [],
			sourceInput: apiSource(current) as DynamicLighting["sourceInput"],
		};
	}

	function localSource(input: DynamicLighting["sourceInput"]): VibeSource | null {
		if (!input) return null;
		if ("preset" in input) return { preset: { ...input.preset, seed: input.preset.seed ?? seed } };
		if ("photo" in input) return { photo: { ...input.photo, domain: input.photo.domain as VibeDomain } };
		return { guided: { ...input.guided, domain: input.guided.domain as VibeDomain } };
	}

	function updateCreationEditor(next: EditorState) {
		targets = next.targets;
		overrides = new Map(next.overrides);
		supportingStates = new Map(next.supportingStates);
		if (!next.dynamicSource) {
			source = null;
			return;
		}
		domain = next.dynamicSource.domain;
		seed = next.dynamicSource.seed;
		brightness = next.dynamicSource.brightness;
		movement = next.dynamicSource.movement;
		cycleSeconds = next.dynamicSource.cycleSeconds;
		source = localSource(next.dynamicSource.sourceInput);
	}

	async function requestPreview(nextSource: VibeSource) {
		loadingPreview = true;
		error = null;
		const result = await client.query(PREVIEW_VIBE, {
			input: {
				source: apiSource(nextSource),
				brightness,
				movement,
				cycleSeconds,
			},
		}, { requestPolicy: "network-only" }).toPromise();
		loadingPreview = false;
		if (result.error || !result.data) {
			error = result.error?.message ?? "Could not build this Vibe.";
			return false;
		}
		const resultPreview = result.data.previewVibe;
		preview = resultPreview.preview;
		domain = resultPreview.domain;
		seed = resultPreview.seed;
		brightness = resultPreview.brightness;
		movement = resultPreview.movement;
		cycleSeconds = resultPreview.cycleSeconds;
		source = nextSource;
		return true;
	}

	function selectPreset(preset: VibePreset) {
		selectedPresetId = preset.id;
		domain = preset.domain;
		seed = preset.seed;
		brightness = preset.brightness;
		movement = preset.movement;
		cycleSeconds = preset.cycleSeconds;
		preview = preset.preview;
		source = { preset: { presetId: preset.id, seed: preset.seed } };
	}

	async function handlePhoto(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		photoError = null;
		try {
			photo = await normalizePhoto(file);
			seed = randomVibeSeed();
			await previewPhoto();
		} catch (caught) {
			photoError = caught instanceof Error ? caught.message : "Could not process this image.";
		}
		input.value = "";
	}

	async function previewPhoto() {
		if (!photo) return;
		await requestPreview({ photo: { domain, seed, ...photo } });
	}

	async function useGuided(selectedIds = guidedSelectedIds) {
		if (selectedIds.length < 3) return;
		const nextSource: VibeSource = { guided: { domain, seed, selectedIds } };
		if (await requestPreview(nextSource)) moveTo("targets");
	}

	function addTarget(type: DirectTargetKind, id: string) {
		let label = id;
		let icon: string | null | undefined;
		let deviceType: string | undefined;
		if (type === "device") {
			const device = devices.find((candidate) => candidate.id === id);
			if (!device) return;
			label = deviceDisplayName(device);
			icon = device.icon;
			deviceType = device.type;
			if (kind === "individual") {
				const next = new Map(overrides);
				next.set(device.id, { kind: "state", deviceId: device.id, state: capturedSceneState(device) ?? defaultDesiredState(device) });
				overrides = next;
			}
		} else if (type === "group") {
			const group = groups.find((candidate) => candidate.id === id);
			if (!group) return;
			label = groupDisplayName(group);
			icon = group.icon;
		} else {
			const room = rooms.find((candidate) => candidate.id === id);
			if (!room) return;
			label = room.name;
			icon = room.icon;
		}
		targets = [...targets, { uid: newTargetUid(), type, id, name: label, icon, deviceType }];
	}

	function addSelector() {
		targets = [...targets, { uid: newTargetUid(), type: "expression", id: "", name: "Selector", expression: [] }];
	}

	function setSelector(uid: string, expression: Clause[]) {
		targets = targets.map((target) => target.uid === uid ? { ...target, expression } : target);
	}

	function removeTarget(uid: string) {
		const removed = targets.find((target) => target.uid === uid);
		targets = targets.filter((target) => target.uid !== uid);
		if (removed?.type === "device") {
			const next = new Map(overrides);
			next.delete(removed.id);
			overrides = next;
		}
	}

	function addSupporting(_type: "device", id: string) {
		const device = devices.find((candidate) => candidate.id === id);
		if (!device) return;
		const state = initialSupportingState(device);
		if (!state) return;
		const next = new Map(supportingStates);
		next.set(id, { deviceId: id, state });
		supportingStates = next;
	}

	function removeBehavior(id: string) {
		const next = new Map(supportingStates);
		next.delete(id);
		supportingStates = next;
	}

	function setBehaviorOn(id: string, on: boolean) {
		const supporting = supportingStates.get(id);
		if (!supporting) return;
		const next = new Map(supportingStates);
		next.set(id, { ...supporting, state: { ...supporting.state, on } });
		supportingStates = next;
	}

	function continueFromLook() {
		if (!source || !preview) {
			error = "Choose a Vibe before continuing.";
			return;
		}
		moveTo("targets");
	}

	function continueFromTargets() {
		if (!canContinueTargets) return;
		moveTo("adjust");
	}

	function definitionInput(): SceneDefinitionInput {
		return editorDefinitionInput(creationEditor);
	}

	async function save() {
		if (!name.trim() || !kind) return;
		saving = true;
		error = null;
		try {
			const created = await scenesStore.create(client, { name: name.trim(), definition: definitionInput() });
			saved = true;
			await tick();
			await goto(`/scenes/${created.id}`);
		} catch (caught) {
			error = graphqlErrorMessage(caught, "Could not create the scene.");
			saving = false;
		}
	}

</script>

<UnsavedGuard {dirty} />

<div class="mx-auto max-w-5xl space-y-6" in:fly={{ y: -4, duration: reducedMotion ? 0 : 150 }}>
	{#if stage !== "start"}
		<Button variant="ghost" size="sm" onclick={goBack}>
			<ArrowLeft class="size-4" /> Back
		</Button>
	{/if}

	{#if error}
		<ErrorBanner message={error} ondismiss={() => (error = null)} />
	{/if}

	{#if stageVisible}
	<div
		class="space-y-6"
		onoutroend={finishStageExit}
		in:fly={{
			x: stageMotionReady && !reducedMotion ? (stageDirection === "forward" ? 12 : -12) : 0,
			duration: stageMotionReady && !reducedMotion ? 180 : 0,
			easing: cubicOut,
		}}
		out:fly={{
			x: !reducedMotion ? (stageDirection === "forward" ? -12 : 12) : 0,
			duration: reducedMotion ? 0 : 140,
			easing: cubicIn,
		}}
	>
	{#if stage === "start"}
		<div>
			<h1 class="text-2xl font-semibold">Create a scene</h1>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			{#each [
				{ id: "gallery", title: "Gallery", detail: "Start from a curated lighting vibe.", icon: Image },
				{ id: "photo", title: "Photo", detail: "Turn the colour atmosphere of an image into light.", icon: Camera },
				{ id: "guided", title: "Guided", detail: "Build a vibe through three to five visual choices.", icon: Sparkles },
				{ id: "individual", title: "Individual lights", detail: "Choose exact states for lights and devices.", icon: Lightbulb },
			] as option (option.id)}
				<button type="button" class="rounded-lg shadow-card bg-card p-6 text-left transition-colors duration-200 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" onclick={() => begin(option.id as CreationKind)}>
					<option.icon class="mb-5 size-7 text-muted-foreground" />
					<span class="block text-lg font-medium">{option.title}</span>
					<span class="mt-1 block text-sm text-muted-foreground">{option.detail}</span>
				</button>
			{/each}
		</div>
	{:else if stage === "look"}
		<div>
			<h1 class="text-2xl font-semibold">Choose the look</h1>
		</div>

		{#if kind === "gallery"}
			{#if vibeCatalog.loading && presets.length === 0}
				<div class="flex gap-3 overflow-hidden" aria-label="Loading gallery">
					{#each [0, 1, 2] as placeholder}
						<div class="h-44 w-52 shrink-0 animate-pulse rounded-lg shadow-card bg-card" aria-hidden="true"></div>
					{/each}
				</div>
			{:else if vibeCatalog.error}
				<ErrorBanner message={vibeCatalog.error} />
			{:else if presets.length === 0}
				<div class="rounded-lg shadow-card bg-card p-8 text-center text-muted-foreground">No gallery scenes are available.</div>
			{:else}
				<div class="space-y-6">
					{#each presetGroups as [label, entries] (label)}
						<section>
							<h2 class="mb-3 font-medium">{label}</h2>
							<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
								{#each entries as preset (preset.id)}
									<VibeChoiceCard
										class="min-h-36"
										previewClass="min-h-36"
										preview={preset.preview}
										label={preset.title}
										selected={selectedPresetId === preset.id}
										overlayLabel
										frameless
										movement={preset.movement}
										cycleSeconds={preset.cycleSeconds}
										seed={preset.seed}
										onclick={() => selectPreset(preset)}
									/>
								{/each}
							</div>
						</section>
					{/each}
				</div>
			{/if}
		{:else if kind === "photo"}
			<div class="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
				<div class="rounded-lg shadow-card bg-card p-5 space-y-4">
					<div>
						<h2 class="font-medium">Photo atmosphere</h2>
						<p class="mt-1 text-sm text-muted-foreground">Hive uses a small colour sample; your photo stays in this browser.</p>
					</div>
					<div class="flex gap-2">
						<Button variant={domain === "full_color" ? "default" : "outline"} size="sm" onclick={() => { domain = "full_color"; if (photo) void previewPhoto(); }}>Full colour</Button>
						<Button variant={domain === "white_ambience" ? "default" : "outline"} size="sm" onclick={() => { domain = "white_ambience"; if (photo) void previewPhoto(); }}>Whites only</Button>
					</div>
					<label class="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg bg-muted p-5 text-center">
						<Camera class="mb-3 size-6 text-muted-foreground" />
						<span class="text-sm font-medium">{photo ? "Replace photo" : "Choose a photo"}</span>
						<span class="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP, or another browser-supported image</span>
						<input type="file" accept="image/*" class="sr-only" onchange={handlePhoto} />
					</label>
					<FieldError message={photoError} />
				</div>
				<div class="min-h-72 overflow-hidden rounded-lg shadow-card bg-card">
					{#if preview}<VibePreview {preview} {brightness} {movement} {cycleSeconds} {seed} />{:else}<div class="flex h-full min-h-72 items-center justify-center text-sm text-muted-foreground">Your Vibe will appear here.</div>{/if}
				</div>
			</div>
		{:else if kind === "guided"}
			<div class="space-y-5">
				<div class="flex flex-wrap gap-2">
					<Button variant={domain === "full_color" ? "default" : "outline"} size="sm" onclick={() => { domain = "full_color"; guidedSelectedIds = []; }}>Colours</Button>
					<Button variant={domain === "white_ambience" ? "default" : "outline"} size="sm" onclick={() => { domain = "white_ambience"; guidedSelectedIds = []; }}>Whites</Button>
				</div>
				<VibeGuided {domain} {seed} selectedIds={guidedSelectedIds} onchange={(ids) => (guidedSelectedIds = ids)} onuse={useGuided} />
			</div>
		{/if}

		{#if kind !== "guided"}
			<div class="flex justify-end"><Button onclick={continueFromLook} disabled={loadingPreview || !source}>{loadingPreview ? "Building..." : "Continue"}</Button></div>
		{/if}
	{:else if stage === "targets"}
		<div>
			<h1 class="text-2xl font-semibold">Choose where it lives</h1>
		</div>
		<div class="overflow-hidden rounded-lg shadow-card bg-card p-5 space-y-4">
			<div class="flex flex-wrap gap-2">
				<Button variant="outline" size="sm" onclick={() => (targetDrawerOpen = true)}><Plus class="size-4" /> Add target</Button>
				<Button variant="outline" size="sm" onclick={addSelector}><SlidersHorizontal class="size-4" /> Add Selector</Button>
			</div>
			<div class="space-y-3">
					{#each targets as target (target.uid)}
						<div
							class="overflow-hidden rounded-lg bg-muted p-3"
							in:slide={{ duration: reducedMotion ? 0 : 180, easing: cubicOut }}
							out:slide={{ duration: reducedMotion ? 0 : 150, easing: cubicIn }}
							animate:flip={{ duration: reducedMotion ? 0 : 160 }}
						>
							<div class="flex items-center justify-between gap-3">
								<div class="flex items-center gap-2"><HiveChip type={target.type} label={target.name} iconOverride={target.icon} /></div>
								<Button variant="ghost" size="icon-sm" onclick={() => removeTarget(target.uid)} aria-label={`Remove ${target.name}`}><Trash2 class="size-4" /></Button>
							</div>
							{#if target.type === "expression"}
								<div class="mt-3"><TargetSelectorField value={target.expression ?? []} onchange={(expression) => setSelector(target.uid, expression)} devices={devices} groups={groupsLite} rooms={roomsLite} /></div>
							{/if}
						</div>
					{/each}
			</div>
		</div>

		<div class="rounded-lg shadow-card bg-card p-5 space-y-3">
			<div class="flex items-center justify-between gap-3"><h2 class="font-medium">Supporting devices</h2><Button variant="outline" size="sm" onclick={() => (supportingDrawerOpen = true)}><Plus class="size-4" /> Add</Button></div>
			{#each Array.from(supportingStates.values()) as behavior (behavior.deviceId)}
				{@const device = devices.find((candidate) => candidate.id === behavior.deviceId)}
				{#if device && (!targets.some((target) => target.type === "device" && target.id === device.id) || !isLightControlDevice(device))}
					<div
						class="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2"
						in:slide={{ duration: reducedMotion ? 0 : 180, easing: cubicOut }}
						out:slide={{ duration: reducedMotion ? 0 : 150, easing: cubicIn }}
					>
						<p class="text-sm font-medium">{deviceDisplayName(device)}</p>
						<div class="flex items-center gap-2">
							{#if behavior.state.on != null}<Switch checked={behavior.state.on} onclick={() => setBehaviorOn(device.id, !behavior.state.on)} aria-label={`Turn ${deviceDisplayName(device)} on`} />{/if}
							<Button variant="ghost" size="icon-sm" onclick={() => removeBehavior(device.id)} aria-label={`Remove ${deviceDisplayName(device)}`}><Trash2 class="size-4" /></Button>
						</div>
					</div>
				{/if}
			{/each}
		</div>
		<div class="flex justify-end"><Button onclick={continueFromTargets} disabled={!canContinueTargets}>Continue</Button></div>
	{:else if stage === "adjust"}
		<div>
			<h1 class="text-2xl font-semibold">Adjust the lighting</h1>
		</div>
		<SceneEditor
			editor={creationEditor}
			preview={preview ?? emptyPreview}
			{devices}
			groups={groupsLite}
			rooms={roomsLite}
			{effects}
			onchange={updateCreationEditor}
			onpreviewchange={(value) => (preview = value)}
		/>
		<div class="flex justify-end"><Button onclick={() => moveTo("name")}>Continue</Button></div>
	{:else if stage === "name"}
		<div>
			<h1 class="text-2xl font-semibold">Name the scene</h1>
		</div>
		<div class="space-y-4">
			<Input id="scene-name" bind:value={name} placeholder="Evening glow" aria-label="Scene name" autofocus />
			<div class="flex justify-end"><Button onclick={save} disabled={saving || !name.trim()}>{#if saving}<Loader2 class="size-4 animate-spin" />{/if}{saving ? "Creating..." : "Create scene"}</Button></div>
		</div>
	{/if}
	</div>
	{/if}
</div>

<HiveDrawer bind:open={targetDrawerOpen} title="Add lighting targets" description="Choose devices, groups, or rooms." multiple groups={targetDrawerGroups} onselect={addTarget} />
<HiveDrawer bind:open={supportingDrawerOpen} title="Add supporting devices" description="Add controllable devices." multiple groups={supportingDrawerGroups} onselect={addSupporting} />
