<script lang="ts">
	import { Check } from "@lucide/svelte";
	import type { ScenePreview } from "$lib/scene-editable";
	import VibePreview from "$lib/components/vibe-preview.svelte";
	import { choicePreviewMotionSeconds } from "$lib/vibe-preview";

	interface Props {
		preview: ScenePreview;
		label: string;
		selected?: boolean;
		disabled?: boolean;
		overlayLabel?: boolean;
		animateOnHover?: boolean;
		frameless?: boolean;
		showGlow?: boolean;
		previewClass?: string;
		movement?: number;
		cycleSeconds?: number;
		seed?: string;
		rasterScale?: number;
		class?: string;
		onclick: () => void;
	}

	let {
		preview,
		label,
		selected = false,
		disabled = false,
		overlayLabel = false,
		animateOnHover = false,
		frameless = false,
		showGlow = true,
		previewClass = "h-32",
		movement = 0.45,
		cycleSeconds = 720,
		seed = "0",
		rasterScale = 3,
		class: className = "",
		onclick,
	}: Props = $props();
	const selectedMovement = $derived(Math.max(0.85, movement));
	const previewCycleSeconds = $derived(Math.min(360, cycleSeconds));
	let hovered = $state(false);
	let glowMounted = $state(false);
	let glowRemovalTimer: ReturnType<typeof setTimeout> | null = null;
	const motionActive = $derived(animateOnHover ? hovered : selected);
	const glowVisible = $derived(motionActive || glowMounted);
	const motionMounted = $derived(glowVisible);
	const glowRasterScale = $derived(Math.max(2, rasterScale - 1));
	const motionDuration = $derived(`${choicePreviewMotionSeconds(previewCycleSeconds)}s`);
	const motionX = $derived(`${(selectedMovement * 6).toFixed(2)}%`);
	const motionNegativeX = $derived(`${(selectedMovement * -6).toFixed(2)}%`);
	const motionY = $derived(`${(selectedMovement * 4.5).toFixed(2)}%`);
	const motionNegativeY = $derived(`${(selectedMovement * -4.5).toFixed(2)}%`);

	$effect(() => {
		if (glowRemovalTimer) {
			clearTimeout(glowRemovalTimer);
			glowRemovalTimer = null;
		}
		if (motionActive) {
			glowMounted = true;
			return;
		}
		if (!glowMounted) return;
		glowRemovalTimer = setTimeout(() => {
			glowMounted = false;
			glowRemovalTimer = null;
		}, 280);
		return () => {
			if (glowRemovalTimer) clearTimeout(glowRemovalTimer);
		};
	});

	function handlePointerEnter(event: PointerEvent) {
		if (animateOnHover && event.pointerType === "mouse") hovered = true;
	}

	function handlePointerLeave(event: PointerEvent) {
		if (animateOnHover && event.pointerType === "mouse") hovered = false;
	}

</script>

<div
	class="vibe-choice isolate relative {className}"
	class:selected
	class:live-preview={motionActive}
	class:live-motion={motionMounted}
	style:--vibe-card-motion-duration={motionDuration}
	style:--vibe-card-motion-x={motionX}
	style:--vibe-card-motion-negative-x={motionNegativeX}
	style:--vibe-card-motion-y={motionY}
	style:--vibe-card-motion-negative-y={motionNegativeY}
>
	{#if showGlow}
		<div
			class="field-glow pointer-events-none absolute overflow-hidden rounded-2xl {frameless ? 'inset-x-0 top-0' : 'inset-x-2 top-2'} {previewClass}"
			aria-hidden="true"
		>
			{#if glowVisible}
				<div class="field-motion h-full w-full">
					<VibePreview
						{preview}
						movement={0}
						cycleSeconds={previewCycleSeconds}
						{seed}
						rasterScale={glowRasterScale}
					/>
				</div>
			{/if}
		</div>
	{/if}
	<button
		type="button"
		class="relative z-10 block h-full w-full rounded-2xl text-left transition-colors duration-200 focus-visible:outline-none {frameless ? 'bg-transparent p-0 shadow-none' : 'bg-card p-2 shadow-card'}"
		{disabled}
		{onclick}
		onpointerenter={handlePointerEnter}
		onpointerleave={handlePointerLeave}
		aria-label={label}
		aria-pressed={selected}
	>
		<div class="relative {previewClass}">
			<div class="relative z-10 h-full overflow-hidden rounded-2xl">
				<div class="field-motion h-full w-full">
					<VibePreview
						{preview}
						movement={0}
						cycleSeconds={previewCycleSeconds}
						{seed}
						{rasterScale}
					/>
				</div>
				{#if overlayLabel}
					<span class="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-lg bg-card/85 px-3 py-2 text-left text-sm font-medium text-card-foreground">
						{label}
						<Check class="size-4 transition-[opacity,transform] duration-200 ease-out {selected ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}" aria-hidden="true" />
					</span>
				{/if}
			</div>
		</div>
		{#if !overlayLabel}
			<span class="mt-2 flex items-center justify-between gap-2 px-1 text-sm font-medium">
				{label}
				<Check class="size-4 transition-[opacity,transform] duration-200 ease-out {selected ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}" aria-hidden="true" />
			</span>
		{/if}
	</button>
</div>

<style>
	.field-glow {
		filter: blur(21px) saturate(1.18);
		transform: scale(1.08);
		will-change: opacity;
		opacity: 0;
		transition: opacity 280ms ease-out;
	}

	.field-motion {
		transform-origin: center;
	}

	.live-motion .field-motion {
		animation: vibe-card-field-motion var(--vibe-card-motion-duration) ease-in-out infinite;
		will-change: transform;
	}

	.live-preview .field-glow {
		opacity: 0.42;
	}

	@media (prefers-reduced-motion: reduce) {
		.field-glow {
			transition: none;
		}

		.live-motion .field-motion {
			animation: none;
		}
	}

	@keyframes vibe-card-field-motion {
		0%,
		100% {
			transform: translate3d(0, 0, 0) scale(1);
		}
		22% {
			transform: scale(1.18) translate3d(var(--vibe-card-motion-negative-x), var(--vibe-card-motion-y), 0);
		}
		48% {
			transform: scale(1.15) translate3d(var(--vibe-card-motion-x), var(--vibe-card-motion-negative-y), 0);
		}
		73% {
			transform: scale(1.19) translate3d(var(--vibe-card-motion-x), var(--vibe-card-motion-y), 0);
		}
	}
</style>
