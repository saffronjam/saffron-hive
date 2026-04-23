<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import ColorPicker from "$lib/components/color-picker.svelte";
	import TempWheel from "$lib/components/temp-wheel.svelte";
	import { Palette, Sun } from "@lucide/svelte";

	interface ColorValue {
		r: number;
		g: number;
		b: number;
	}

	interface Props {
		color: ColorValue | null;
		colorTemp: number | null;
		hasColor: boolean;
		hasColorTemp: boolean;
		minColorTemp?: number;
		maxColorTemp?: number;
		hasBrightness?: boolean;
		brightness?: number | null;
		minBrightness?: number;
		maxBrightness?: number;
		onbrightnesschange?: (val: number) => void;
		oncolorchange: (c: ColorValue) => void;
		ontempchange: (mired: number) => void;
		disabled?: boolean;
	}

	let {
		color,
		colorTemp,
		hasColor,
		hasColorTemp,
		minColorTemp = 150,
		maxColorTemp = 500,
		hasBrightness = false,
		brightness = null,
		minBrightness = 0,
		maxBrightness = 254,
		onbrightnesschange,
		oncolorchange,
		ontempchange,
		disabled = false,
	}: Props = $props();

	type Mode = "color" | "temp";
	let mode = $state<Mode>("color");

	$effect(() => {
		if (mode === "color" && !hasColor && hasColorTemp) mode = "temp";
		if (mode === "temp" && !hasColorTemp && hasColor) mode = "color";
	});

	const showWheelToggle = $derived(hasColor && hasColorTemp);
	const showAnyWheel = $derived(hasColor || hasColorTemp);
	const brightnessPct = $derived(() => {
		const span = maxBrightness - minBrightness;
		if (span <= 0) return 0;
		const val = brightness ?? minBrightness;
		return Math.round(((val - minBrightness) / span) * 100);
	});

	let brightnessEl: HTMLDivElement | null = $state(null);
	let brightnessDragging = $state(false);
	let brightnessHovered = $state(false);
	let brightnessFocused = $state(false);
	const brightnessExpanded = $derived(brightnessDragging || brightnessHovered || brightnessFocused);

	function brightnessFromClientX(clientX: number): number {
		const el = brightnessEl;
		if (!el) return minBrightness;
		const rect = el.getBoundingClientRect();
		if (rect.width === 0) return minBrightness;
		const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		return Math.round(minBrightness + pct * (maxBrightness - minBrightness));
	}

	function handleBrightnessDown(e: MouseEvent | TouchEvent) {
		if (disabled) return;
		brightnessDragging = true;
		const x = "touches" in e ? e.touches[0].clientX : e.clientX;
		onbrightnesschange?.(brightnessFromClientX(x));
	}

	function handleBrightnessMove(e: MouseEvent | TouchEvent) {
		if (!brightnessDragging) return;
		const x = "touches" in e ? e.touches[0].clientX : e.clientX;
		onbrightnesschange?.(brightnessFromClientX(x));
	}

	function handleBrightnessUp() {
		brightnessDragging = false;
	}

	function handleBrightnessKey(e: KeyboardEvent) {
		if (disabled) return;
		const step = Math.max(1, Math.round((maxBrightness - minBrightness) / 100));
		const current = brightness ?? minBrightness;
		if (e.key === "ArrowRight" || e.key === "ArrowUp") {
			e.preventDefault();
			onbrightnesschange?.(Math.min(maxBrightness, current + step));
		} else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
			e.preventDefault();
			onbrightnesschange?.(Math.max(minBrightness, current - step));
		}
	}
</script>

<svelte:window
	onmousemove={handleBrightnessMove}
	onmouseup={handleBrightnessUp}
	ontouchmove={handleBrightnessMove}
	ontouchend={handleBrightnessUp}
/>

{#snippet colorMode()}
	<ColorPicker
		r={color?.r ?? 255}
		g={color?.g ?? 255}
		b={color?.b ?? 255}
		onchange={oncolorchange}
		showPreview={false}
		{disabled}
	/>
{/snippet}

{#snippet tempMode()}
	<TempWheel
		value={colorTemp}
		min={minColorTemp}
		max={maxColorTemp}
		onchange={ontempchange}
		{disabled}
	/>
{/snippet}

<div class="flex flex-col gap-3">
	{#if hasColor && hasColorTemp}
		<div class="relative">
			<div
				class="transition-opacity duration-300 ease-out"
				class:opacity-0={mode !== "color"}
				class:pointer-events-none={mode !== "color"}
			>
				{@render colorMode()}
			</div>
			<div
				class="absolute inset-0 transition-opacity duration-300 ease-out"
				class:opacity-0={mode !== "temp"}
				class:pointer-events-none={mode !== "temp"}
			>
				{@render tempMode()}
			</div>
		</div>
	{:else if hasColor}
		{@render colorMode()}
	{:else if hasColorTemp}
		{@render tempMode()}
	{/if}

	{#if (showWheelToggle && showAnyWheel) || hasBrightness}
		<div class="flex items-center gap-2">
			{#if showWheelToggle && showAnyWheel}
				<div class="flex gap-1 rounded-full bg-muted p-1">
					<Button
						variant={mode === "color" ? "default" : "ghost"}
						size="xs"
						class="rounded-full"
						onclick={() => (mode = "color")}
						{disabled}
						aria-pressed={mode === "color"}
					>
						<Palette class="size-3.5" />
						Color
					</Button>
					<Button
						variant={mode === "temp" ? "default" : "ghost"}
						size="xs"
						class="rounded-full"
						onclick={() => (mode = "temp")}
						{disabled}
						aria-pressed={mode === "temp"}
					>
						<Sun class="size-3.5" />
						White
					</Button>
				</div>
			{/if}
			{#if hasBrightness}
				<div
					bind:this={brightnessEl}
					class="relative ml-auto h-8 overflow-hidden rounded-full bg-muted transition-[width] duration-300 ease-out select-none"
					class:w-48={brightnessExpanded}
					class:w-24={!brightnessExpanded}
					class:opacity-50={disabled}
					role="slider"
					aria-label="Brightness"
					aria-valuemin={minBrightness}
					aria-valuemax={maxBrightness}
					aria-valuenow={brightness ?? minBrightness}
					tabindex={disabled ? -1 : 0}
					onmousedown={handleBrightnessDown}
					ontouchstart={handleBrightnessDown}
					onmouseenter={() => (brightnessHovered = true)}
					onmouseleave={() => (brightnessHovered = false)}
					onfocus={() => (brightnessFocused = true)}
					onblur={() => (brightnessFocused = false)}
					onkeydown={handleBrightnessKey}
				>
					<div
						class="absolute inset-y-0 left-0 bg-primary/30 transition-[width] duration-150"
						style:width="{brightnessPct()}%"
					></div>
					<div class="relative flex h-full items-center gap-1.5 px-3 text-xs">
						<Sun class="size-3.5 shrink-0 text-muted-foreground" />
						<span class="tabular-nums">{brightnessPct()}%</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
