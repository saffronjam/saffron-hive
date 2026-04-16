<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Clapperboard, Play } from "@lucide/svelte";

	interface SceneData {
		id: string;
		name: string;
	}

	interface Props {
		scenes: SceneData[];
		applyingId: string | null;
		onapply: (scene: SceneData) => void;
	}

	let { scenes, applyingId, onapply }: Props = $props();
</script>

{#if scenes.length > 0}
	<div class="flex gap-2 overflow-x-auto pb-2">
		{#each scenes as scene (scene.id)}
			<Button
				variant="outline"
				size="sm"
				class="shrink-0"
				disabled={applyingId === scene.id}
				onclick={() => onapply(scene)}
			>
				<Clapperboard class="size-3.5" />
				<span>{applyingId === scene.id ? "Applying..." : scene.name}</span>
			</Button>
		{/each}
	</div>
{:else}
	<div class="rounded-lg shadow-card bg-card px-4 py-3 text-center">
		<p class="text-sm text-muted-foreground">No scenes configured yet.</p>
	</div>
{/if}
