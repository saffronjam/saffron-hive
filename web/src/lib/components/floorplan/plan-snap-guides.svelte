<script lang="ts">
	import type { Point } from "$lib/floorplan";

	interface Props {
		/** The wall the cursor landed on, drawn solid along its whole length. */
		segment: { a: Point; b: Point } | null;
		/** The locked-angle ray the cursor is running along. */
		ray: { from: Point; to: Point } | null;
		/** The vertex the cursor caught, ringed. */
		vertex: Point | null;
		/** The wall being drawn right now, from the last point to the cursor. */
		rubber: { from: Point; to: Point } | null;
		pxPerM: number;
	}

	let { segment, ray, vertex, rubber, pxPerM }: Props = $props();
</script>

{#if segment}
	<line
		x1={segment.a.x}
		y1={segment.a.y}
		x2={segment.b.x}
		y2={segment.b.y}
		stroke="var(--primary)"
		stroke-width="2"
		vector-effect="non-scaling-stroke"
	/>
{/if}

{#if ray}
	<line
		x1={ray.from.x}
		y1={ray.from.y}
		x2={ray.to.x}
		y2={ray.to.y}
		stroke="var(--primary)"
		stroke-opacity="0.4"
		stroke-dasharray="4 4"
		vector-effect="non-scaling-stroke"
	/>
{/if}

{#if vertex}
	<circle
		cx={vertex.x}
		cy={vertex.y}
		r={7 / pxPerM}
		fill="none"
		stroke="var(--primary)"
		stroke-width="2"
		vector-effect="non-scaling-stroke"
	/>
{/if}

{#if rubber}
	<line
		x1={rubber.from.x}
		y1={rubber.from.y}
		x2={rubber.to.x}
		y2={rubber.to.y}
		stroke="var(--primary)"
		stroke-width="2"
		stroke-dasharray="6 4"
		vector-effect="non-scaling-stroke"
	/>
{/if}
