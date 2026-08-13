<script lang="ts">
	import type { MeshLinkView } from "$lib/floorplan/connectivity";

	interface Props {
		links: MeshLinkView[];
		/** Per-device pulse sequence numbers; a bump remounts that ring. */
		pulses: { key: string; x: number; y: number }[];
		pxPerM: number;
	}

	let { links, pulses, pxPerM }: Props = $props();

	function strokeFor(link: MeshLinkView): string {
		return link.kind === "parent" ? "var(--primary)" : "var(--muted-foreground)";
	}

	function widthFor(link: MeshLinkView): number {
		switch (link.kind) {
			case "parent":
				return 2;
			case "route":
				return 1.5;
			default:
				return 1;
		}
	}

	function opacityFor(link: MeshLinkView): number {
		if (link.stale) return 0.4;
		if (link.kind === "neighbour") return 0.1 + 0.25 * link.quality;
		return link.kind === "parent" ? 0.8 : 0.55;
	}
</script>

<g class="pointer-events-none">
	{#each links as link (link.key)}
		<line
			x1={link.x1}
			y1={link.y1}
			x2={link.x2}
			y2={link.y2}
			stroke={strokeFor(link)}
			stroke-width={widthFor(link)}
			stroke-opacity={opacityFor(link)}
			stroke-dasharray={link.stale ? "6 4" : undefined}
			stroke-linecap="round"
			vector-effect="non-scaling-stroke"
		/>
	{/each}

	{#each pulses as pulse (pulse.key)}
		<g transform="translate({pulse.x} {pulse.y}) scale({1 / pxPerM})">
			<circle class="map-tx-ring" r="6" fill="none" stroke-width="2" />
		</g>
	{/each}
</g>
