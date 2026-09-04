<script lang="ts">
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import SceneEditor from "$lib/components/scene-editor.svelte";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import IconPickerTrigger from "$lib/components/icon-picker-trigger.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import {
		editorDefinitionInput,
		sceneControllableDeviceCount,
		sceneToEditorState,
		type EditorState,
		type SceneData,
		type ScenePreview,
	} from "$lib/scene-editable";
	import { effectSummary, type EffectSummary } from "$lib/effect-editable";
	import { deviceStore, isRuntimeEnabledDevice } from "$lib/stores/devices";
	import { groupsStore } from "$lib/stores/groups.svelte";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { scenesStore } from "$lib/stores/scenes.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import type { GroupLite, RoomLite } from "$lib/target-resolve";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import { ArrowLeft, Clapperboard, Play, Plus, Square, X } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { entityDisplayName } from "$lib/utils";

	const EFFECTS = graphql(`
		query SceneEditorEffects {
			effects { id name icon kind nativeName loop requiredCapabilities }
		}
	`);

	const sceneId = $derived(page.params.id ?? "");
	const client = getContextClient();
	const devices = $derived(Object.values($deviceStore).filter(isRuntimeEnabledDevice));
	const groups = $derived<GroupLite[]>(groupsStore.items.map((group) => ({
		id: group.id,
		name: group.name,
		friendlyName: group.friendlyName,
		icon: group.icon,
		removed: group.removed,
		members: group.members,
	})));
	const rooms = $derived<RoomLite[]>(roomsStore.items.map((room) => ({
		id: room.id,
		name: room.name,
		icon: room.icon,
		members: room.members,
		resolvedDevices: room.resolvedDevices,
	})));

	let name = $state("");
	let icon = $state<string | null>(null);
	let editorState = $state<EditorState | null>(null);
	let preview = $state<ScenePreview | null>(null);
	let effects = $state<EffectSummary[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let applying = $state(false);
	let error = $state<string | null>(null);
	let savedSignature = $state("");
	let dirty = $state(false);
	let vibePickerOpen = $state(false);
	let initializedSceneId = "";

	const active = $derived(scenesStore.byId.get(sceneId)?.activatedAt != null);
	const controllableDeviceCount = $derived(
		editorState ? sceneControllableDeviceCount(editorState, devices, groups, rooms) : 0,
	);

	function currentSignature(state = editorState, sceneName = name, sceneIcon = icon): string {
		return state ? JSON.stringify({ name: sceneName, icon: sceneIcon, definition: editorDefinitionInput(state) }) : "";
	}

	function refreshDirty() {
		dirty = editorState !== null && currentSignature() !== savedSignature;
	}

	function cloneState(source: EditorState): EditorState {
		return structuredClone($state.snapshot(source)) as EditorState;
	}

	function setInitialScene(value: SceneData) {
		name = value.name;
		icon = value.icon ?? null;
		editorState = sceneToEditorState(value);
		preview = value.preview;
		savedSignature = currentSignature(editorState, name, icon);
		dirty = false;
	}

	function handleEditorChange(next: EditorState) {
		if (
			editorState &&
			JSON.stringify(editorDefinitionInput(editorState)) === JSON.stringify(editorDefinitionInput(next))
		) {
			return;
		}
		editorState = cloneState(next);
		refreshDirty();
	}

	async function save() {
		if (!editorState || !name.trim()) return;
		saving = true;
		error = null;
		try {
			const updated = await scenesStore.update(client, sceneId, {
				name: name.trim(),
				icon,
				definition: editorDefinitionInput(editorState),
			});
			name = updated.name;
			icon = updated.icon ?? null;
			preview = updated.preview;
			if (editorState.dynamicSource && updated.lighting.dynamicSource) {
				editorState = {
					...editorState,
					dynamicSource: { ...editorState.dynamicSource, seed: updated.lighting.dynamicSource.seed },
				};
			}
			savedSignature = currentSignature(editorState, name, icon);
			dirty = false;
		} catch (caught) {
			error = graphqlErrorMessage(caught, m.scene_error_save({}, locale.messageOptions()));
		} finally {
			saving = false;
		}
	}

	async function applyOrStop() {
		if (!editorState || dirty || (!active && controllableDeviceCount === 0)) return;
		applying = true;
		error = null;
		try {
			if (active) await scenesStore.deactivate(client, sceneId);
			else await scenesStore.apply(client, sceneId);
		} catch (caught) {
			error = graphqlErrorMessage(caught, active ? m.scenes_error_stop({}, locale.messageOptions()) : m.scenes_error_apply({}, locale.messageOptions()));
		} finally {
			applying = false;
		}
	}

	onMount(() => {
		pageHeader.viewToggle = null;
		void client.query(EFFECTS, {}).toPromise().then((result) => {
			if (result.data) effects = result.data.effects.map(effectSummary);
		});
	});

	$effect(() => {
		const id = sceneId;
		if (initializedSceneId === id) return;
		const scene = scenesStore.byId.get(id);
		if (scene) {
			setInitialScene(scene as unknown as SceneData);
			initializedSceneId = id;
			loading = false;
			return;
		}
		loading = !scenesStore.hydrated;
	});

	$effect(() => {
		void locale.currentLanguage;
		pageHeader.breadcrumbs = [
			{ label: m.scenes_title({}, locale.messageOptions()), href: "/scenes" },
			{ label: name ? entityDisplayName("scene", { id: sceneId, name }) : m.scene_fallback({}, locale.messageOptions()) },
		];
		pageHeader.actions = [
			{ label: active ? m.scene_action_stop({}, locale.messageOptions()) : m.scene_action_apply({}, locale.messageOptions()), icon: active ? Square : Play, variant: "outline", onclick: applyOrStop, disabled: applying || dirty || !editorState || (!active && controllableDeviceCount === 0), hideLabelOnMobile: true },
			{ label: m.common_cancel({}, locale.messageOptions()), icon: X, variant: "outline", onclick: () => goto("/scenes"), hideLabelOnMobile: true },
			{ label: m.common_save({}, locale.messageOptions()), saving, onclick: save, disabled: saving || !dirty || !name.trim(), hideLabelOnMobile: true },
		];
	});

</script>

<UnsavedGuard {dirty} />

{#if error}<ErrorBanner class="mb-4" message={error} ondismiss={() => (error = null)} />{/if}

{#if loading}
	<div class="rounded-lg shadow-card bg-card p-12 text-center text-muted-foreground">{m.scene_loading({}, locale.messageOptions())}</div>
{:else if !editorState || !preview}
	<div class="rounded-lg shadow-card bg-card p-12 text-center">
		<p class="text-muted-foreground">{m.scene_not_found({}, locale.messageOptions())}</p>
		<Button class="mt-4" variant="outline" onclick={() => goto("/scenes")}><ArrowLeft class="size-4" /> {m.scene_back({}, locale.messageOptions())}</Button>
	</div>
{:else}
	<div class="mx-auto max-w-[90rem] space-y-6">
		<div class="flex items-center gap-3 rounded-lg shadow-card bg-card p-4">
			<IconPicker value={icon} onselect={(value) => { icon = value; refreshDirty(); }}>
				<IconPickerTrigger ariaLabel={m.scene_choose_icon({}, locale.messageOptions())}>
					<AnimatedIcon {icon} class="size-5">{#snippet fallback()}<Clapperboard class="size-5" />{/snippet}</AnimatedIcon>
				</IconPickerTrigger>
			</IconPicker>
			<Input value={name} oninput={(event) => { name = event.currentTarget.value; refreshDirty(); }} aria-label={m.scene_name_aria({}, locale.messageOptions())} class="max-w-md text-lg font-medium" />
			{#if !editorState.dynamicSource}
				<Button class="ml-auto sm:w-auto sm:gap-1 sm:px-2.5" variant="outline" size="icon-sm" onclick={() => (vibePickerOpen = true)} aria-label={m.scene_add_source({}, locale.messageOptions())}><Plus class="size-4" /><span class="hidden sm:inline">{m.scene_add_source({}, locale.messageOptions())}</span></Button>
			{/if}
		</div>
		<SceneEditor
			editor={editorState}
			{preview}
			{devices}
			{groups}
			{rooms}
			{effects}
			onchange={handleEditorChange}
			onpreviewchange={(value) => (preview = value)}
			bind:vibePickerOpen
			showAddVibeInTargets={false}
		/>
	</div>
{/if}
