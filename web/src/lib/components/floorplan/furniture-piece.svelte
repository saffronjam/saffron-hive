<script lang="ts">
	import { furnitureShapes } from "$lib/floorplan/furniture";
	import type { FloorplanFurnitureData } from "$lib/floorplan-editable";

	interface Props {
		piece: FloorplanFurnitureData;
		selected?: boolean;
		/** Live mode has nothing to do with a piece, so it never takes the pointer. */
		live?: boolean;
		/** A piece being dragged out of the drawer, not yet on the plan. */
		draft?: boolean;
	}

	let { piece, selected = false, draft = false, live = false }: Props = $props();

	const shapes = $derived(furnitureShapes(piece));
	const stroke = $derived(selected ? "var(--primary)" : "var(--foreground)");
</script>

<g
	transform="translate({piece.x} {piece.y}) rotate({piece.rotation})"
	opacity={draft ? 0.7 : 1}
	class={live ? "pointer-events-none" : undefined}
	data-plan-hit={live ? undefined : "furniture"}
	data-furniture-id={piece.id}
>
	{#each shapes as shape, i (i)}
		{@const detail = shape.role === "detail"}
		{#if shape.s === "rect"}
			<rect
				x={shape.x}
				y={shape.y}
				width={shape.w}
				height={shape.h}
				rx={shape.r ?? 0}
				fill={detail ? "none" : "var(--card)"}
				fill-opacity={detail ? 0 : piece.occluder ? 0.9 : 0.7}
				{stroke}
				stroke-opacity={detail ? 0.35 : 0.55}
				stroke-width={selected ? 2 : 1.5}
				vector-effect="non-scaling-stroke"
				class="transition-[stroke-opacity] duration-200"
			/>
		{:else if shape.s === "ellipse"}
			<ellipse
				cx={shape.x}
				cy={shape.y}
				rx={shape.rx}
				ry={shape.ry}
				fill={detail ? "none" : "var(--card)"}
				fill-opacity={detail ? 0 : piece.occluder ? 0.9 : 0.7}
				{stroke}
				stroke-opacity={detail ? 0.35 : 0.55}
				stroke-width={selected ? 2 : 1.5}
				vector-effect="non-scaling-stroke"
				class="transition-[stroke-opacity] duration-200"
			/>
		{:else}
			<line
				x1={shape.x1}
				y1={shape.y1}
				x2={shape.x2}
				y2={shape.y2}
				{stroke}
				stroke-opacity="0.35"
				stroke-width="1.5"
				vector-effect="non-scaling-stroke"
			/>
		{/if}
	{/each}
</g>
