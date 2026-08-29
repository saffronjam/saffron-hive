<script lang="ts">
	import type { ScenePreview } from "$lib/scene-editable";
	import { paintVibeFrame, previewMotionSeconds } from "$lib/vibe-preview";

	interface Props {
		preview: ScenePreview;
		movement: number;
		cycleSeconds: number;
		seed: string;
		scale?: number;
		class?: string;
	}

	let { preview, movement, cycleSeconds, seed, scale = 4, class: className = "" }: Props =
		$props();
	let canvas = $state<HTMLCanvasElement | null>(null);
	let rasterVisible = $state(false);
	let hasPainted = false;

	const rasterScale = $derived(Math.max(1, Math.round(scale)));
	const rasterWidth = $derived(preview.width * rasterScale);
	const rasterHeight = $derived(preview.height * rasterScale);
	const motionSeconds = $derived(previewMotionSeconds(cycleSeconds));

	$effect(() => {
		if (!canvas) return;
		const currentPreview = preview;
		const currentMovement = movement;
		const currentMotionSeconds = motionSeconds;
		const currentSeed = seed;
		const currentScale = rasterScale;
		const context = canvas.getContext("2d");
		if (!context) return;
		let frame: number | null = null;
		let visibilityFrame: number | null = null;
		let raster: ImageData | null = null;
		const paint = () => {
			const phase = currentMovement === 0 ? 0 : (Date.now() % (currentMotionSeconds * 1000)) / (currentMotionSeconds * 1000);
			raster = paintVibeFrame(
				context,
				currentPreview,
				currentMovement,
				phase,
				currentSeed,
				raster,
				currentScale,
			);
			const firstPaint = !hasPainted && raster !== null;
			hasPainted = raster !== null;
			if (firstPaint) {
				visibilityFrame = requestAnimationFrame(() => {
					visibilityFrame = null;
					rasterVisible = true;
				});
			} else {
				rasterVisible = raster !== null;
			}
			if (currentMovement > 0) frame = requestAnimationFrame(paint);
		};
		paint();
		return () => {
			if (visibilityFrame !== null) cancelAnimationFrame(visibilityFrame);
			if (frame !== null) cancelAnimationFrame(frame);
		};
	});
</script>

<div class="h-full w-full {className}">
	<canvas
		bind:this={canvas}
		width={rasterWidth}
		height={rasterHeight}
		class="block h-full w-full transition-opacity duration-300 ease-out motion-reduce:transition-none {rasterVisible ? 'opacity-100' : 'opacity-0'}"
		aria-hidden="true"
	></canvas>
</div>
