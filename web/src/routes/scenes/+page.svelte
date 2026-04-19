<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount, onDestroy } from "svelte";
	import { createGraphQLClient } from "$lib/graphql/client";
	import { gql } from "@urql/svelte";
	import type { Client } from "@urql/svelte";
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
	import SceneCard from "$lib/components/scene-card.svelte";
	import SceneTable from "$lib/components/scene-table.svelte";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import ListView from "$lib/components/list-view.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import { Plus, Clapperboard, X } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { profile, type ListView as ListViewMode } from "$lib/stores/profile.svelte";
	import { ErrorBanner } from "$lib/stores/error-banner.svelte";

	interface SceneAction {
		id: string;
		targetType: string;
		targetId: string;
		payload: string;
	}

	interface SceneData {
		id: string;
		name: string;
		icon?: string | null;
		actions: SceneAction[];
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

	const SCENES_QUERY = gql`
		query Scenes {
			scenes {
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
	`;

	const CREATE_SCENE = gql`
		mutation CreateScene($input: CreateSceneInput!) {
			createScene(input: $input) {
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

	const APPLY_SCENE = gql`
		mutation ApplyScene($sceneId: ID!) {
			applyScene(sceneId: $sceneId) {
				id
				name
			}
		}
	`;

	const DELETE_SCENE = gql`
		mutation DeleteScene($id: ID!) {
			deleteScene(id: $id)
		}
	`;

	const UPDATE_SCENE_NAME = gql`
		mutation UpdateScene($id: ID!, $input: UpdateSceneInput!) {
			updateScene(id: $id, input: $input) {
				id
				name
				icon
			}
		}
	`;

	let clientRef: Client | null = null;
	let scenes = $state<SceneData[]>([]);
	let loading = $state(true);
	let applyingId = $state<string | null>(null);
	let createDialogOpen = $state(false);
	let newSceneName = $state("");
	let createLoading = $state(false);

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
	const errors = new ErrorBanner();

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

	async function handleCreateScene() {
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

		const result = await clientRef
			.mutation<ApplySceneResult>(APPLY_SCENE, { sceneId: scene.id })
			.toPromise();

		applyingId = null;

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
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

	onMount(() => {
		clientRef = createGraphQLClient();
		fetchScenes();
	});
</script>

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


	{#if !loading && scenes.length === 0}
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
		<ListView mode={view}>
			{#snippet card()}
				<AnimatedGrid>
					{#each scenes as scene (scene.id)}
						<SceneCard
							{scene}
							applying={applyingId === scene.id}
							onapply={handleApply}
							onedit={handleEdit}
							ondelete={(s) => (deleteConfirmScene = s)}
							onrename={handleRename}
							oniconchange={handleIconChange}
						/>
					{/each}
				</AnimatedGrid>
			{/snippet}
			{#snippet table()}
				<SceneTable
					{scenes}
					{applyingId}
					onapply={handleApply}
					onedit={handleEdit}
					ondelete={(s) => (deleteConfirmScene = s)}
					onrename={handleRename}
					oniconchange={handleIconChange}
				/>
			{/snippet}
		</ListView>
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
				<Input bind:value={newSceneName} placeholder="Scene name" autofocus />
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
</div>
