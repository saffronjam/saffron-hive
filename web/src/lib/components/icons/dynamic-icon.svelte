<script lang="ts">
	import type { Snippet } from "svelte";
	import { parseIconRef, loadMdiPath, loadLucideData } from "./icon-utils.js";

	interface Props {
		icon: string | null | undefined;
		class?: string;
		fallback?: Snippet;
	}

	let { icon, class: className, fallback }: Props = $props();

	let mdiPath = $state<string | null>(null);
	let lucideElements = $state<[string, Record<string, string>][] | null>(null);
	let loading = $state(false);

	$effect(() => {
		mdiPath = null;
		lucideElements = null;

		if (!icon) return;

		const ref = parseIconRef(icon);
		if (!ref) return;

		loading = true;
		if (ref.source === "mdi") {
			loadMdiPath(ref.name).then((path) => {
				mdiPath = path;
				loading = false;
			});
		} else {
			loadLucideData(ref.name).then((data) => {
				lucideElements = data;
				loading = false;
			});
		}
	});
</script>

{#if mdiPath}
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class={className}>
		<path fill="currentColor" d={mdiPath} />
	</svg>
{:else if lucideElements}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={className}
	>
		{#each lucideElements as [tag, attrs]}
			<svelte:element this={tag} {...attrs} />
		{/each}
	</svg>
{:else if fallback && !loading}
	{@render fallback()}
{/if}
