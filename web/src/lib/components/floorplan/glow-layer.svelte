<script lang="ts" module>
	export type { GlowGroup, GlowView } from "$lib/floorplan/glow";

	/**
	 * Blend two frames' bytes into `out` at mix `t`, rounding once.
	 *
	 * Compositing the frames as two canvas draws instead would round each to 8
	 * bits separately, landing a pixel neither frame touches on `v` or `v+1`
	 * depending on where the fade is — invisible in a lit room, a shimmer
	 * across every dim one, where the light sits a level or two above black.
	 */
	export function blendBytes(
		from: Uint8ClampedArray,
		to: Uint8ClampedArray,
		t: number,
		out: Uint8ClampedArray,
	): void {
		for (let i = 0; i < out.length; i++) {
			out[i] = from[i] + (to[i] - from[i]) * t;
		}
	}

	/**
	 * Whether a new frame replaces the old outright instead of fading into it.
	 *
	 * Every dimension counts: a room dragged downward grows the grid's rows
	 * while its columns and origin stay put, and fading across that would
	 * stretch the old frame over a canvas of a different shape.
	 */
	export function needsSnap(
		shown: LightmapFrame | null,
		next: LightmapFrame | null,
		canvas: { width: number; height: number },
		scale: number,
	): boolean {
		const moved =
			next &&
			shown &&
			(next.cols !== shown.cols ||
				next.rows !== shown.rows ||
				next.x !== shown.x ||
				next.y !== shown.y ||
				next.width !== shown.width ||
				next.height !== shown.height);
		return (
			canvas.width !== (next?.cols ?? 0) * scale ||
			canvas.height !== (next?.rows ?? 0) * scale ||
			!!moved
		);
	}

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
	 * The crossfade blends the two frames' bytes into one image and draws that
	 * once. Compositing them as two draws instead would round each to 8 bits
	 * separately, so a pixel neither frame touches lands on `v` or `v+1`
	 * depending on where the fade is — invisible in a lit room, a shimmer
	 * across every dim one, where the light sits a level or two above black.
	 *
	 * Fades are linear and queue rather than restart: a bulb ramping up reports
	 * several states, and back-to-back linear fades chain into one swell.
	 */
	let shown: LightmapFrame | null = null;
	let fadeFrom: LightmapFrame | null = null;
	let fadeTo: LightmapFrame | null = null;
	let fadeStart = 0;
	let queued: LightmapFrame | null | undefined;
	let raf = 0;
	let snapRaf = 0;

	/** Cell-resolution scratch the blend writes into, before the upscale. */
	let cells: HTMLCanvasElement | null = null;
	let blend: Uint8ClampedArray<ArrayBuffer> | null = null;

	function blendedCells(from: LightmapFrame | null, to: LightmapFrame | null, t: number) {
		const frame = to ?? from;
		if (!frame) return null;
		if (!cells) cells = document.createElement("canvas");
		if (cells.width !== frame.cols || cells.height !== frame.rows) {
			cells.width = frame.cols;
			cells.height = frame.rows;
			blend = null;
		}
		const ctx = cells.getContext("2d");
		if (!ctx) return null;
		const size = frame.cols * frame.rows * 4;
		if (!blend || blend.length !== size) blend = new Uint8ClampedArray(size);
		const a = from?.rgba;
		const b = to?.rgba;
		const sameShape = a && b && a.length === size && b.length === size;
		if (!sameShape) {
			blend.set(b ?? a!);
		} else {
			blendBytes(a, b, t, blend);
		}
		ctx.putImageData(new ImageData(blend, frame.cols, frame.rows), 0, 0);
		return cells;
	}

	function draw(mix: number) {
		// A frame timestamp can precede the performance.now() that started the
		// fade, so the mix needs clamping before it reaches the blend.
		const t = Math.min(1, Math.max(0, mix));
		const canvas = ensureDisplay();
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.globalCompositeOperation = "source-over";
		ctx.imageSmoothingEnabled = true;
		ctx.filter = `blur(${DISPLAY_SCALE * 0.6}px)`;
		const source = blendedCells(fadeFrom, fadeTo, t);
		if (source) ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
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
		ctx.globalCompositeOperation = "source-over";
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
		fadeTo = next;
		fadeStart = performance.now();
		raf = requestAnimationFrame(tick);
	}

	$effect(() => {
		const next = lightmap;
		if (next === shown) return;
		const canvas = ensureDisplay();
		if (needsSnap(shown, next, canvas, DISPLAY_SCALE)) {
			canvas.width = (next?.cols ?? 1) * DISPLAY_SCALE;
			canvas.height = (next?.rows ?? 1) * DISPLAY_SCALE;
			if (raf) cancelAnimationFrame(raf);
			raf = 0;
			queued = undefined;
			shown = next;
			fadeFrom = next;
			fadeTo = next;
			// A snap rides a mode switch or a plan edit, where the browser is
			// already swapping a screenful of chrome. Encoding the light map in
			// that same frame is what tips it into a dropped one, and the image
			// simply holds its last pixels until the next.
			if (snapRaf) cancelAnimationFrame(snapRaf);
			snapRaf = requestAnimationFrame(() => {
				snapRaf = 0;
				draw(1);
			});
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
		if (snapRaf) cancelAnimationFrame(snapRaf);
	});

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

