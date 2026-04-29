<script lang="ts">
	import { createConfirmationHold } from "$lib/utils/confirmation-hold";

	interface Props {
		r: number;
		g: number;
		b: number;
		onchange: (color: { r: number; g: number; b: number }) => void;
		disabled?: boolean;
		showPreview?: boolean;
		compact?: boolean;
	}

	let { r, g, b, onchange, disabled = false, showPreview = true, compact = false }: Props = $props();

	const HUE_TOLERANCE_DEG = 5;
	const SATURATION_TOLERANCE = 0.05;
	const hold = createConfirmationHold<{ h: number; s: number }>({
		matches: (incoming, pending) => {
			let dh = Math.abs(incoming.h - pending.h);
			if (dh > 180) dh = 360 - dh;
			return dh <= HUE_TOLERANCE_DEG && Math.abs(incoming.s - pending.s) <= SATURATION_TOLERANCE;
		},
	});

	let canvasEl: HTMLCanvasElement | null = $state(null);
	let pointerDown = $state(false);
	let dragging = $state(false);

	let hue = $state(0);
	let saturation = $state(0);

	function rgbToHs(red: number, green: number, blue: number): { h: number; s: number } {
		const rn = red / 255;
		const gn = green / 255;
		const bn = blue / 255;
		const max = Math.max(rn, gn, bn);
		const min = Math.min(rn, gn, bn);
		const d = max - min;
		let h = 0;

		if (d !== 0) {
			if (max === rn) h = ((gn - bn) / d) % 6;
			else if (max === gn) h = (bn - rn) / d + 2;
			else h = (rn - gn) / d + 4;
			h = Math.round(h * 60);
			if (h < 0) h += 360;
		}

		const s = max === 0 ? 0 : d / max;
		return { h, s };
	}

	function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
		const c = v * s;
		const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
		const m = v - c;
		let rn = 0,
			gn = 0,
			bn = 0;

		if (h < 60) {
			rn = c;
			gn = x;
		} else if (h < 120) {
			rn = x;
			gn = c;
		} else if (h < 180) {
			gn = c;
			bn = x;
		} else if (h < 240) {
			gn = x;
			bn = c;
		} else if (h < 300) {
			rn = x;
			bn = c;
		} else {
			rn = c;
			bn = x;
		}

		return {
			r: Math.round((rn + m) * 255),
			g: Math.round((gn + m) * 255),
			b: Math.round((bn + m) * 255),
		};
	}

	$effect(() => {
		if (pointerDown) return;
		const hs = rgbToHs(r, g, b);
		if (hold.shouldSuppress(hs)) return;
		hue = hs.h;
		saturation = hs.s;
	});

	$effect(() => {
		if (canvasEl) drawWheel();
	});

	function drawWheel() {
		const canvas = canvasEl;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const w = canvas.width;
		const h = canvas.height;
		const cx = w / 2;
		const cy = h / 2;
		const radius = Math.min(cx, cy);

		const image = ctx.createImageData(w, h);
		const data = image.data;

		for (let py = 0; py < h; py++) {
			for (let px = 0; px < w; px++) {
				const dx = px - cx + 0.5;
				const dy = py - cy + 0.5;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const idx = (py * w + px) * 4;

				if (dist > radius) {
					data[idx + 3] = 0;
					continue;
				}

				let ang = (Math.atan2(dy, dx) * 180) / Math.PI;
				if (ang < 0) ang += 360;
				const sat = Math.min(1, dist / radius);
				const rgb = hsvToRgb(ang, sat, 1);

				data[idx] = rgb.r;
				data[idx + 1] = rgb.g;
				data[idx + 2] = rgb.b;

				const edge = radius - dist;
				data[idx + 3] = edge < 1 ? Math.round(edge * 255) : 255;
			}
		}

		ctx.putImageData(image, 0, 0);
	}

	function emitColor() {
		const rgb = hsvToRgb(hue, saturation, 1);
		hold.hold({ h: hue, s: saturation });
		onchange(rgb);
	}

	function handlePoint(clientX: number, clientY: number) {
		const canvas = canvasEl;
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const cx = rect.width / 2;
		const cy = rect.height / 2;
		const radius = Math.min(cx, cy);

		const dx = clientX - rect.left - cx;
		const dy = clientY - rect.top - cy;
		const dist = Math.sqrt(dx * dx + dy * dy);
		const clamped = Math.min(dist, radius);
		const sat = radius === 0 ? 0 : clamped / radius;
		let ang = (Math.atan2(dy, dx) * 180) / Math.PI;
		if (ang < 0) ang += 360;

		hue = ang;
		saturation = sat;
		emitColor();
	}

	function pointerCoords(e: MouseEvent | TouchEvent): { x: number; y: number } {
		if ("touches" in e) {
			return { x: e.touches[0].clientX, y: e.touches[0].clientY };
		}
		return { x: e.clientX, y: e.clientY };
	}

	function handleDown(e: MouseEvent | TouchEvent) {
		if (disabled) return;
		pointerDown = true;
		const p = pointerCoords(e);
		handlePoint(p.x, p.y);
	}

	function handleWindowMove(e: MouseEvent | TouchEvent) {
		if (!pointerDown) return;
		dragging = true;
		const p = pointerCoords(e);
		handlePoint(p.x, p.y);
	}

	function handleWindowUp() {
		pointerDown = false;
		dragging = false;
	}

	const markerLeft = $derived(`${50 + Math.cos((hue * Math.PI) / 180) * saturation * 50}%`);
	const markerTop = $derived(`${50 + Math.sin((hue * Math.PI) / 180) * saturation * 50}%`);
	const previewColor = $derived(`rgb(${r}, ${g}, ${b})`);
</script>

<svelte:window
	onmousemove={handleWindowMove}
	onmouseup={handleWindowUp}
	ontouchmove={handleWindowMove}
	ontouchend={handleWindowUp}
/>

<div class="flex flex-col gap-3" class:opacity-50={disabled}>
	<div
		class="relative mx-auto aspect-square w-full"
		class:max-w-xs={!compact}
		class:max-w-[160px]={compact}
	>
		<canvas
			bind:this={canvasEl}
			width={320}
			height={320}
			class="h-full w-full touch-none"
			onmousedown={handleDown}
			ontouchstart={handleDown}
			role="slider"
			aria-label="Hue and saturation"
			aria-valuemin={0}
			aria-valuemax={360}
			aria-valuenow={Math.round(hue)}
			tabindex={disabled ? -1 : 0}
		></canvas>
		<div
			class="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
			class:transition-[left,top]={!dragging}
			class:duration-300={!dragging}
			class:ease-out={!dragging}
			style:left={markerLeft}
			style:top={markerTop}
		></div>
	</div>

	{#if showPreview}
		<div class="flex items-center gap-3">
			<div
				class="h-8 w-8 shrink-0 rounded-md border border-border"
				style:background-color={previewColor}
			></div>
			<span class="font-mono text-xs text-muted-foreground">
				rgb({r}, {g}, {b})
			</span>
		</div>
	{/if}
</div>
