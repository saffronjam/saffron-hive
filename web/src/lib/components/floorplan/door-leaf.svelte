<script lang="ts">
	import type { DoorBindingGeometry } from "$lib/floorplan";

	interface Props {
		geometry: DoorBindingGeometry;
		open: boolean;
		showArc?: boolean;
		active?: boolean;
		muted?: boolean;
		draft?: boolean;
	}

	let {
		geometry,
		open,
		showArc = false,
		active = false,
		muted = false,
		draft = false,
	}: Props = $props();

	const angle = $derived(open ? geometry.openAngle : geometry.closedAngle);
	const delta = $derived.by(() => {
		let value = geometry.openAngle - geometry.closedAngle;
		while (value <= -Math.PI) value += Math.PI * 2;
		while (value > Math.PI) value -= Math.PI * 2;
		return value;
	});
	const arcEnd = $derived({
		x: geometry.hinge.x + Math.cos(geometry.openAngle) * geometry.length,
		y: geometry.hinge.y + Math.sin(geometry.openAngle) * geometry.length,
	});
	const arcPath = $derived(
		`M ${geometry.latch.x} ${geometry.latch.y} A ${geometry.length} ${geometry.length} 0 0 ${delta >= 0 ? 1 : 0} ${arcEnd.x} ${arcEnd.y}`,
	);
</script>

<g
	data-door-leaf
	class:opacity-50={muted}
	class:opacity-70={draft}
	class="pointer-events-none transition-opacity duration-200"
>
	{#if showArc && geometry.length > 0}
		<path
			d={arcPath}
			fill="none"
			stroke={active ? "var(--primary)" : "var(--foreground)"}
			stroke-opacity={active ? 0.7 : 0.35}
			stroke-width="1.5"
			stroke-dasharray="4 3"
			vector-effect="non-scaling-stroke"
		/>
	{/if}
	<g transform="translate({geometry.hinge.x} {geometry.hinge.y})">
		<g class="door-motion" style:transform={`rotate(${angle}rad)`}>
			<line
				x1="0"
				y1="0"
				x2={geometry.length}
				y2="0"
				stroke={active ? "var(--primary)" : "var(--foreground)"}
				stroke-opacity={active ? 1 : 0.8}
				stroke-width="3.5"
				vector-effect="non-scaling-stroke"
			/>
		</g>
	</g>
</g>

<style>
	.door-motion {
		transform-origin: 0 0;
		transition: transform 300ms ease;
	}

	@media (prefers-reduced-motion: reduce) {
		.door-motion {
			transition-duration: 0ms;
		}
	}
</style>
