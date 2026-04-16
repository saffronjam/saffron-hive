<script lang="ts">
	interface Props {
		r: number;
		g: number;
		b: number;
		onchange: (color: { r: number; g: number; b: number }) => void;
		disabled?: boolean;
	}

	let { r, g, b, onchange, disabled = false }: Props = $props();

	let canvasEl: HTMLCanvasElement | null = $state(null);
	let stripEl: HTMLCanvasElement | null = $state(null);
	let draggingCanvas = $state(false);
	let draggingStrip = $state(false);

	let hue = $state(0);
	let saturation = $state(1);
	let value = $state(1);

	function rgbToHsv(red: number, green: number, blue: number): { h: number; s: number; v: number } {
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
		return { h, s, v: max };
	}

	function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
		const c = v * s;
		const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
		const m = v - c;
		let rn = 0, gn = 0, bn = 0;

		if (h < 60) { rn = c; gn = x; }
		else if (h < 120) { rn = x; gn = c; }
		else if (h < 180) { gn = c; bn = x; }
		else if (h < 240) { gn = x; bn = c; }
		else if (h < 300) { rn = x; bn = c; }
		else { rn = c; bn = x; }

		return {
			r: Math.round((rn + m) * 255),
			g: Math.round((gn + m) * 255),
			b: Math.round((bn + m) * 255),
		};
	}

	$effect(() => {
		const hsv = rgbToHsv(r, g, b);
		if (!draggingCanvas && !draggingStrip) {
			hue = hsv.h;
			saturation = hsv.s;
			value = hsv.v;
		}
	});

	$effect(() => {
		drawCanvas();
	});

	$effect(() => {
		drawStrip();
	});

	function drawCanvas() {
		const canvas = canvasEl;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const w = canvas.width;
		const h = canvas.height;

		const hueColor = hsvToRgb(hue, 1, 1);
		const baseColor = `rgb(${hueColor.r}, ${hueColor.g}, ${hueColor.b})`;

		ctx.fillStyle = baseColor;
		ctx.fillRect(0, 0, w, h);

		const whiteGradient = ctx.createLinearGradient(0, 0, w, 0);
		whiteGradient.addColorStop(0, "rgba(255,255,255,1)");
		whiteGradient.addColorStop(1, "rgba(255,255,255,0)");
		ctx.fillStyle = whiteGradient;
		ctx.fillRect(0, 0, w, h);

		const blackGradient = ctx.createLinearGradient(0, 0, 0, h);
		blackGradient.addColorStop(0, "rgba(0,0,0,0)");
		blackGradient.addColorStop(1, "rgba(0,0,0,1)");
		ctx.fillStyle = blackGradient;
		ctx.fillRect(0, 0, w, h);
	}

	function drawStrip() {
		const canvas = stripEl;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const w = canvas.width;
		const h = canvas.height;

		const gradient = ctx.createLinearGradient(0, 0, w, 0);
		gradient.addColorStop(0, "#ff0000");
		gradient.addColorStop(1 / 6, "#ffff00");
		gradient.addColorStop(2 / 6, "#00ff00");
		gradient.addColorStop(3 / 6, "#00ffff");
		gradient.addColorStop(4 / 6, "#0000ff");
		gradient.addColorStop(5 / 6, "#ff00ff");
		gradient.addColorStop(1, "#ff0000");

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, w, h);
	}

	function emitColor() {
		const rgb = hsvToRgb(hue, saturation, value);
		onchange(rgb);
	}

	function handleCanvasInteraction(e: MouseEvent | TouchEvent) {
		if (disabled) return;
		const canvas = canvasEl;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		let clientX: number, clientY: number;

		if ("touches" in e) {
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
		} else {
			clientX = e.clientX;
			clientY = e.clientY;
		}

		const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

		saturation = x;
		value = 1 - y;
		emitColor();
	}

	function handleStripInteraction(e: MouseEvent | TouchEvent) {
		if (disabled) return;
		const canvas = stripEl;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		let clientX: number;

		if ("touches" in e) {
			clientX = e.touches[0].clientX;
		} else {
			clientX = e.clientX;
		}

		const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		hue = Math.round(x * 360);
		emitColor();
	}

	function handleCanvasDown(e: MouseEvent | TouchEvent) {
		if (disabled) return;
		draggingCanvas = true;
		handleCanvasInteraction(e);
	}

	function handleStripDown(e: MouseEvent | TouchEvent) {
		if (disabled) return;
		draggingStrip = true;
		handleStripInteraction(e);
	}

	function handleWindowMove(e: MouseEvent | TouchEvent) {
		if (draggingCanvas) handleCanvasInteraction(e);
		if (draggingStrip) handleStripInteraction(e);
	}

	function handleWindowUp() {
		draggingCanvas = false;
		draggingStrip = false;
	}

	const previewColor = $derived(`rgb(${r}, ${g}, ${b})`);
	const canvasMarkerLeft = $derived(`${saturation * 100}%`);
	const canvasMarkerTop = $derived(`${(1 - value) * 100}%`);
	const stripMarkerLeft = $derived(`${(hue / 360) * 100}%`);
</script>

<svelte:window
	onmousemove={handleWindowMove}
	onmouseup={handleWindowUp}
	ontouchmove={handleWindowMove}
	ontouchend={handleWindowUp}
/>

<div class="flex flex-col gap-3" class:opacity-50={disabled}>
	<div class="relative aspect-square w-full cursor-crosshair overflow-hidden rounded-lg border border-border">
		<canvas
			bind:this={canvasEl}
			width={256}
			height={256}
			class="h-full w-full"
			onmousedown={handleCanvasDown}
			ontouchstart={handleCanvasDown}
			role="slider"
			aria-label="Color saturation and brightness"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(saturation * 100)}
			tabindex={disabled ? -1 : 0}
		></canvas>
		<div
			class="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
			style:left={canvasMarkerLeft}
			style:top={canvasMarkerTop}
		></div>
	</div>

	<div class="relative h-4 w-full cursor-pointer overflow-hidden rounded-full border border-border">
		<canvas
			bind:this={stripEl}
			width={360}
			height={16}
			class="h-full w-full"
			onmousedown={handleStripDown}
			ontouchstart={handleStripDown}
			role="slider"
			aria-label="Color hue"
			aria-valuemin={0}
			aria-valuemax={360}
			aria-valuenow={hue}
			tabindex={disabled ? -1 : 0}
		></canvas>
		<div
			class="pointer-events-none absolute top-0 h-full w-1 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
			style:left={stripMarkerLeft}
		></div>
	</div>

	<div class="flex items-center gap-3">
		<div
			class="h-8 w-8 shrink-0 rounded-md border border-border"
			style:background-color={previewColor}
		></div>
		<span class="text-xs font-mono text-muted-foreground">
			rgb({r}, {g}, {b})
		</span>
	</div>
</div>
