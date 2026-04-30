<script lang="ts">
	import { Slider as SliderPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";
	import { onDestroy } from "svelte";

	let {
		ref = $bindable(null),
		value = $bindable(),
		orientation = "horizontal",
		class: className,
		...restProps
	}: WithoutChildrenOrChild<SliderPrimitive.RootProps> = $props();

	// While the user is actively dragging, skip the position transition so the
	// thumb tracks the cursor instantly. A click on the track (no movement)
	// still uses the smooth transition.
	let dragging = $state(false);
	let downX: number | null = null;
	let downY: number | null = null;
	const DRAG_THRESHOLD = 4;

	function trackMove(e: PointerEvent) {
		if (downX === null || downY === null || dragging) return;
		const dx = e.clientX - downX;
		const dy = e.clientY - downY;
		if (dx * dx + dy * dy >= DRAG_THRESHOLD * DRAG_THRESHOLD) {
			dragging = true;
		}
	}

	function endTracking() {
		downX = null;
		downY = null;
		dragging = false;
		document.removeEventListener("pointermove", trackMove);
		document.removeEventListener("pointerup", endTracking);
		document.removeEventListener("pointercancel", endTracking);
	}

	function onpointerdown(e: PointerEvent) {
		downX = e.clientX;
		downY = e.clientY;
		document.addEventListener("pointermove", trackMove);
		document.addEventListener("pointerup", endTracking);
		document.addEventListener("pointercancel", endTracking);
	}

	onDestroy(endTracking);
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<SliderPrimitive.Root
	bind:ref
	bind:value={value as never}
	data-slot="slider"
	{orientation}
	{onpointerdown}
	class={cn(
		"data-vertical:min-h-40 relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:w-auto data-vertical:flex-col",
		className
	)}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			data-slot="slider-track"
			data-orientation={orientation}
			class={cn(
				"bg-muted rounded-full data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5 bg-muted relative grow overflow-hidden data-horizontal:w-full data-vertical:h-full"
			)}
		>
			<SliderPrimitive.Range
				data-slot="slider-range"
				class={cn(
					"bg-primary absolute select-none data-horizontal:h-full data-vertical:w-full duration-150 ease-out",
					dragging
						? "transition-none"
						: "transition-[width,height,transform,left,right,top,bottom]"
				)}
			/>
		</span>
		{#each thumbItems as thumb (thumb)}
			<SliderPrimitive.Thumb
				data-slot="slider-thumb"
				index={thumb.index}
				class={cn(
					"border-primary ring-ring/50 size-4 rounded-full border bg-white shadow-sm duration-150 ease-out hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden block shrink-0 select-none disabled:pointer-events-none disabled:opacity-50",
					dragging
						? "transition-none"
						: "transition-[color,box-shadow,transform,left,right,top,bottom]"
				)}
			/>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
