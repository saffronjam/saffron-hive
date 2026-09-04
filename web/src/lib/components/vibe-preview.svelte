<script lang="ts">
	import { onMount, tick } from "svelte";
	import type { ScenePreview } from "$lib/scene-editable";
	import VibeRaster from "$lib/components/vibe-raster.svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		preview: ScenePreview;
		brightness?: number;
		movement?: number;
		cycleSeconds?: number;
		seed?: string;
		maximumTemporalFrequency?: number;
		rasterScale?: number;
		class?: string;
	}

	let {
		preview,
		brightness = 1,
		movement = 0,
		cycleSeconds = 720,
		seed = "0",
		maximumTemporalFrequency = 3,
		rasterScale = 4,
		class: className = "",
	}: Props = $props();
	let reducedMotion = $state(false);
	function initialSeed(): string {
		return seed;
	}
	let renderedSeed = $state(initialSeed());
	let outgoingSeed = $state<string | null>(null);
	let incomingVisible = $state(true);
	let seedTransitionTimer: ReturnType<typeof setTimeout> | null = null;

	const boundedBrightness = $derived(Math.max(0, Math.min(1, brightness)));
	const boundedMovement = $derived(Math.max(0, Math.min(1, movement)));
	const previewAriaLabel = $derived(
		preview.swatches.length === 0
			? m.vibe_preview_aria_empty({}, locale.messageOptions())
			: m.vibe_preview_aria_swatches({ count: preview.swatches.length }, locale.messageOptions()),
	);
	onMount(() => {
		if (typeof window.matchMedia !== "function") return;
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		const syncMotion = () => (reducedMotion = media.matches);
		syncMotion();
		media.addEventListener("change", syncMotion);
		return () => {
			media.removeEventListener("change", syncMotion);
			if (seedTransitionTimer) clearTimeout(seedTransitionTimer);
		};
	});

	$effect(() => {
		const nextSeed = seed;
		if (nextSeed === renderedSeed) return;
		if (seedTransitionTimer) clearTimeout(seedTransitionTimer);
		if (reducedMotion) {
			renderedSeed = nextSeed;
			outgoingSeed = null;
			incomingVisible = true;
			return;
		}
		outgoingSeed = renderedSeed;
		renderedSeed = nextSeed;
		incomingVisible = false;
		void tick().then(() => {
			requestAnimationFrame(() => {
				incomingVisible = true;
				seedTransitionTimer = setTimeout(() => {
					outgoingSeed = null;
					seedTransitionTimer = null;
				}, 500);
			});
		});
	});
</script>

<div
	class="vibe-preview relative h-full w-full overflow-hidden {className}"
	role="img"
	aria-label={previewAriaLabel}
	style:--vibe-brightness={boundedBrightness}
>
	{#if outgoingSeed}
		<VibeRaster
			{preview}
			movement={reducedMotion ? 0 : boundedMovement}
			{cycleSeconds}
			seed={outgoingSeed}
			{maximumTemporalFrequency}
			scale={rasterScale}
			class="absolute inset-0"
		/>
	{/if}
	<VibeRaster
		{preview}
		movement={reducedMotion ? 0 : boundedMovement}
		{cycleSeconds}
		seed={renderedSeed}
		{maximumTemporalFrequency}
		scale={rasterScale}
		class="relative transition-opacity duration-500 ease-out {outgoingSeed && !incomingVisible ? 'opacity-0' : 'opacity-100'}"
	/>
</div>

<style>
	.vibe-preview {
		filter: brightness(var(--vibe-brightness));
		transition: filter 100ms linear;
	}
</style>
