<script lang="ts">
	import type { LabelTone, PlanLabel } from "$lib/floorplan/labels";

	interface Props {
		labels: PlanLabel[];
		/** Screen pixels per world meter, so text keeps its size through the zoom. */
		pxPerM: number;
	}

	let { labels, pxPerM }: Props = $props();

	/** Every label is drawn with a background halo so it stays legible over walls. */
	const TONE: Record<LabelTone, { size: number; weight: number; fill: string }> = {
		room: { size: 12, weight: 500, fill: "var(--foreground)" },
		area: { size: 11, weight: 400, fill: "var(--muted-foreground)" },
		measure: { size: 11, weight: 400, fill: "var(--primary)" },
		draft: { size: 12, weight: 500, fill: "var(--primary)" },
	};
</script>

<g class="pointer-events-none">
	{#each labels as label (label.id)}
		{@const tone = TONE[label.tone]}
		<g
			transform="translate({label.x} {label.y}) scale({1 / pxPerM})"
			class="transition-opacity duration-200"
		>
			<text
				text-anchor={label.anchor}
				dominant-baseline="central"
				dy={label.dy}
				font-size={tone.size}
				font-weight={tone.weight}
				paint-order="stroke"
				stroke="var(--background)"
				stroke-width="3"
				fill={tone.fill}
			>
				{label.text}
			</text>
		</g>
	{/each}
</g>
