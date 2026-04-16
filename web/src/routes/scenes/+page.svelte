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
	import { Plus, Clapperboard, X } from "@lucide/svelte";

	interface SceneAction {
		id: string;
		targetType: string;
		targetId: string;
		payload: string;
	}

	interface SceneData {
		id: string;
		name: string;
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

	let clientRef: Client | null = null;
	let scenes = $state<SceneData[]>([]);
	let loading = $state(true);
	let applyingId = $state<string | null>(null);
	let createDialogOpen = $state(false);
	let newSceneName = $state("");
	let createLoading = $state(false);
	let deleteConfirmScene = $state<SceneData | null>(null);
	let deleteLoading = $state(false);
	let errorMessage = $state<string | null>(null);

	function clearError() {
		errorMessage = null;
	}

	function dismissErrorAfterDelay() {
		setTimeout(clearError, 5000);
	}

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
			errorMessage = result.error.message;
			dismissErrorAfterDelay();
		}
	}

	async function handleCreateScene() {
		if (!clientRef || !newSceneName.trim()) return;
		createLoading = true;
		clearError();

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
			errorMessage = result.error.message;
			dismissErrorAfterDelay();
			return;
		}

		newSceneName = "";
		createDialogOpen = false;

		if (result.data) {
			goto(`/scenes/${result.data.createScene.id}`);
		}
	}

	async function handleApply(scene: SceneData) {
		if (!clientRef) return;
		applyingId = scene.id;
		clearError();

		const result = await clientRef
			.mutation<ApplySceneResult>(APPLY_SCENE, { sceneId: scene.id })
			.toPromise();

		applyingId = null;

		if (result.error) {
			errorMessage = result.error.message;
			dismissErrorAfterDelay();
		}
	}

	async function handleDelete() {
		if (!clientRef || !deleteConfirmScene) return;
		deleteLoading = true;
		clearError();

		const result = await clientRef
			.mutation<DeleteSceneResult>(DELETE_SCENE, { id: deleteConfirmScene.id })
			.toPromise();

		deleteLoading = false;

		if (result.error) {
			errorMessage = result.error.message;
			dismissErrorAfterDelay();
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

	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-semibold">Scenes</h1>
		<Button onclick={() => (createDialogOpen = true)}>
			<Plus class="size-4" />
			<span>Create Scene</span>
		</Button>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each [1, 2, 3] as _ (_.toString())}
				<div class="h-20 animate-pulse rounded-lg border border-border bg-card"></div>
			{/each}
		</div>
	{:else if scenes.length === 0}
		<div class="rounded-lg border border-border bg-card p-12 text-center">
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
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each scenes as scene (scene.id)}
				<SceneCard
					{scene}
					applying={applyingId === scene.id}
					onapply={handleApply}
					onedit={handleEdit}
					ondelete={(s) => (deleteConfirmScene = s)}
				/>
			{/each}
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

	<Dialog bind:open={() => deleteConfirmScene !== null, (v) => { if (!v) deleteConfirmScene = null; }}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Delete Scene</DialogTitle>
				<DialogDescription>
					Are you sure you want to delete "{deleteConfirmScene?.name}"? This action cannot be undone.
				</DialogDescription>
			</DialogHeader>
			<DialogFooter>
				<Button variant="outline" onclick={() => (deleteConfirmScene = null)}>
					Cancel
				</Button>
				<Button variant="destructive" onclick={handleDelete} disabled={deleteLoading}>
					{deleteLoading ? "Deleting..." : "Delete"}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</div>
