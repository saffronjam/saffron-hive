<script lang="ts" module>
	export type { GlowGroup, GlowView } from "$lib/floorplan/glow";

	/** One rendered light-map frame: raw pixels placed in world meters. */
	export interface LightmapFrame {
		rgba: Uint8ClampedArray<ArrayBuffer>;
		cols: number;
		rows: number;
		x: number;
		y: number;
		width: number;
		height: number;
	}
</script>

<script lang="ts">
	import { glowStops } from "$lib/floorplan/glow";
	import type { GlowGroup, GlowView } from "$lib/floorplan/glow";
	import type { Point } from "$lib/floorplan";

	interface Props {
		groups: GlowGroup[];
		outside: GlowView[];
		lightmap?: LightmapFrame | null;
	}

	let { groups, outside, lightmap = null }: Props = $props();

	/** Cells to display pixels: enough that the blur has room to smooth. */
	const DISPLAY_SCALE = 6;
	const FADE_MS = 300;

	/**
	 * The composited result reaches the SVG as an `<image>` data URL rather
	 * than a live canvas: Chrome paints `foreignObject` content displaced from
	 * its layout position when an ancestor carries a scale transform, and the
	 * error grows with zoom — a native SVG image is positioned exactly.
	 */
	let display: HTMLCanvasElement | null = null;
	let href = $state("");

	function ensureDisplay(): HTMLCanvasElement {
		if (!display) display = document.createElement("canvas");
		return display;
	}

	/**
	 * The crossfade is drawn by hand with canvas `lighter` compositing:
	 * `old×(1−t) + new×t` per pixel, so a region the change does not touch holds
	 * exactly its value all the way through. CSS opacity transitions on
	 * plus-lighter layers cannot promise that — mid-animation the compositor
	 * falls back to normal blending and the whole plan visibly dips.
	 *
	 * Fades are linear and queue rather than restart: a bulb ramping up reports
	 * several states, and back-to-back linear fades chain into one swell.
	 */
	let shown: LightmapFrame | null = null;
	let fadeFrom: HTMLCanvasElement | null = null;
	let fadeTo: HTMLCanvasElement | null = null;
	let fadeStart = 0;
	let queued: LightmapFrame | null | undefined;
	let raf = 0;

	function cellCanvas(frame: LightmapFrame): HTMLCanvasElement | null {
		const canvas = document.createElement("canvas");
		canvas.width = frame.cols;
		canvas.height = frame.rows;
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;
		ctx.putImageData(new ImageData(frame.rgba, frame.cols, frame.rows), 0, 0);
		return canvas;
	}

	function draw(mix: number) {
		// A frame timestamp can precede the performance.now() that started the
		// fade, and canvas silently ignores an out-of-range globalAlpha — an
		// unclamped mix would paint both frames at full strength for one frame.
		const t = Math.min(1, Math.max(0, mix));
		const canvas = ensureDisplay();
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.globalCompositeOperation = "lighter";
		ctx.imageSmoothingEnabled = true;
		ctx.filter = `blur(${DISPLAY_SCALE * 0.45}px)`;
		if (fadeFrom && t < 1) {
			ctx.globalAlpha = 1 - t;
			ctx.drawImage(fadeFrom, 0, 0, canvas.width, canvas.height);
		}
		if (fadeTo && t > 0) {
			ctx.globalAlpha = t;
			ctx.drawImage(fadeTo, 0, 0, canvas.width, canvas.height);
		}
		ctx.globalAlpha = 1;
		mask(ctx, canvas);
		href = canvas.toDataURL();
	}

	/**
	 * Erase every texel outside the rooms, after the smoothing has run. The
	 * blur and the upscale both drag bright edge texels past a room's boundary,
	 * and with two rooms standing close that smear lands where the neighbour's
	 * geometry begins — a vector clip cannot stop the browser from sampling it,
	 * but a masked texel simply does not exist.
	 */
	function mask(ctx: CanvasRenderingContext2D, display: HTMLCanvasElement) {
		const box = shown;
		if (!box || groups.length === 0) return;
		const sx = display.width / box.width;
		const sy = display.height / box.height;
		ctx.filter = "none";
		ctx.globalCompositeOperation = "destination-in";
		ctx.beginPath();
		for (const grp of groups) {
			const polygon = grp.polygon;
			if (polygon.length < 3) continue;
			ctx.moveTo((polygon[0].x - box.x) * sx, (polygon[0].y - box.y) * sy);
			for (let i = 1; i < polygon.length; i++) {
				ctx.lineTo((polygon[i].x - box.x) * sx, (polygon[i].y - box.y) * sy);
			}
			ctx.closePath();
		}
		ctx.fill();
		ctx.globalCompositeOperation = "lighter";
	}

	function tick(now: number) {
		const t = Math.min(1, (now - fadeStart) / FADE_MS);
		draw(t);
		if (t < 1) {
			raf = requestAnimationFrame(tick);
			return;
		}
		raf = 0;
		fadeFrom = fadeTo;
		if (queued !== undefined) {
			const next = queued;
			queued = undefined;
			beginFade(next);
		}
	}

	function beginFade(next: LightmapFrame | null) {
		shown = next;
		fadeTo = next ? cellCanvas(next) : null;
		fadeStart = performance.now();
		raf = requestAnimationFrame(tick);
	}

	$effect(() => {
		const next = lightmap;
		if (next === shown) return;
		const canvas = ensureDisplay();
		// A different grid (plan edited, mode switched) repositions the canvas —
		// snap rather than fade across unrelated geometry. Every dimension
		// counts: a room dragged downward grows the grid's rows while cols and
		// origin stay put, and fading across that would stretch the old frame.
		const moved =
			next &&
			shown &&
			(next.cols !== shown.cols ||
				next.rows !== shown.rows ||
				next.x !== shown.x ||
				next.y !== shown.y ||
				next.width !== shown.width ||
				next.height !== shown.height);
		if (
			canvas.width !== (next?.cols ?? 0) * DISPLAY_SCALE ||
			canvas.height !== (next?.rows ?? 0) * DISPLAY_SCALE ||
			moved
		) {
			canvas.width = (next?.cols ?? 1) * DISPLAY_SCALE;
			canvas.height = (next?.rows ?? 1) * DISPLAY_SCALE;
			if (raf) cancelAnimationFrame(raf);
			raf = 0;
			queued = undefined;
			shown = next;
			fadeFrom = next ? cellCanvas(next) : null;
			fadeTo = fadeFrom;
			draw(1);
			return;
		}
		if (raf) {
			queued = next;
			return;
		}
		beginFade(next);
	});

	$effect(() => () => {
		if (raf) cancelAnimationFrame(raf);
	});

	function points(polygon: Point[]): string {
		return polygon.map((p) => `${p.x},${p.y}`).join(" ");
	}
</script>

<defs>
	{#each outside as g (g.id)}
		<radialGradient id="map-glow-{g.id}">
			{#each glowStops(g.rgb) as stop, i (i)}
				<stop
					offset={stop.offset}
					stop-color={stop.color}
					stop-opacity={stop.opacity}
					style="transition: stop-color 300ms ease"
				/>
			{/each}
		</radialGradient>
	{/each}
</defs>

{#if lightmap}
	<image
		{href}
		x={lightmap.x}
		y={lightmap.y}
		width={lightmap.width}
		height={lightmap.height}
		preserveAspectRatio="none"
		style="mix-blend-mode: plus-lighter"
	/>
{/if}

{#if outside.length > 0}
	<g style="isolation: isolate">
		{#each outside as g (g.id)}
			<circle
				cx={g.x}
				cy={g.y}
				r={g.radius}
				fill="url(#map-glow-{g.id})"
				opacity={g.opacity}
				style="mix-blend-mode: plus-lighter; transition: opacity 300ms ease, r 300ms ease"
			/>
		{/each}
	</g>
{/if}

{#each groups as grp (grp.key)}
	<polygon
		points={points(grp.polygon)}
		fill="var(--background)"
		opacity={grp.dim}
		style="transition: opacity 300ms ease"
	/>
{/each}
