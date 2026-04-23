<script lang="ts">
	interface Props {
		value: number | null;
		min?: number;
		max?: number;
		onchange: (mired: number) => void;
		disabled?: boolean;
	}

	let { value, min = 150, max = 500, onchange, disabled = false }: Props = $props();

	let canvasEl: HTMLCanvasElement | null = $state(null);
	let dragging = $state(false);
	let markerX = $state(0.5);
	let markerY = $state(0.5);

	function valueToX(mired: number): number {
		const clamped = Math.min(max, Math.max(min, mired));
		return (max - clamped) / (max - min);
	}

	function xToValue(x: number): number {
		const clamped = Math.min(1, Math.max(0, x));
		return Math.round(max - clamped * (max - min));
	}

	$effect(() => {
		if (!dragging && value != null) {
			markerX = valueToX(value);
		}
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

		const warm = { r: 255, g: 138, b: 54 };
		const cool = { r: 160, g: 200, b: 255 };

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

				const tx = Math.min(1, Math.max(0, 0.5 + dx / (2 * radius)));
				const sat = Math.min(1, dist / radius);

				const tr = warm.r + (cool.r - warm.r) * tx;
				const tg = warm.g + (cool.g - warm.g) * tx;
				const tb = warm.b + (cool.b - warm.b) * tx;

				data[idx] = Math.round(255 + (tr - 255) * sat);
				data[idx + 1] = Math.round(255 + (tg - 255) * sat);
				data[idx + 2] = Math.round(255 + (tb - 255) * sat);

				const edge = radius - dist;
				data[idx + 3] = edge < 1 ? Math.round(edge * 255) : 255;
			}
		}

		ctx.putImageData(image, 0, 0);
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

		let finalDx = dx;
		let finalDy = dy;
		if (dist > radius) {
			const scale = radius / dist;
			finalDx = dx * scale;
			finalDy = dy * scale;
		}

		const tx = Math.min(1, Math.max(0, 0.5 + finalDx / (2 * radius)));
		markerX = tx;
		markerY = (finalDy + cy) / rect.height;
		onchange(xToValue(tx));
	}

	function pointerCoords(e: MouseEvent | TouchEvent): { x: number; y: number } {
		if ("touches" in e) {
			return { x: e.touches[0].clientX, y: e.touches[0].clientY };
		}
		return { x: e.clientX, y: e.clientY };
	}

	function handleDown(e: MouseEvent | TouchEvent) {
		if (disabled) return;
		dragging = true;
		const p = pointerCoords(e);
		handlePoint(p.x, p.y);
	}

	function handleWindowMove(e: MouseEvent | TouchEvent) {
		if (!dragging) return;
		const p = pointerCoords(e);
		handlePoint(p.x, p.y);
	}

	function handleWindowUp() {
		dragging = false;
	}

	const markerLeftPct = $derived(`${markerX * 100}%`);
	const markerTopPct = $derived(`${markerY * 100}%`);
</script>

<svelte:window
	onmousemove={handleWindowMove}
	onmouseup={handleWindowUp}
	ontouchmove={handleWindowMove}
	ontouchend={handleWindowUp}
/>

<div class="relative mx-auto aspect-square w-full max-w-xs" class:opacity-50={disabled}>
	<canvas
		bind:this={canvasEl}
		width={320}
		height={320}
		class="h-full w-full"
		onmousedown={handleDown}
		ontouchstart={handleDown}
		role="slider"
		aria-label="Color temperature (warm to cool)"
		aria-valuemin={min}
		aria-valuemax={max}
		aria-valuenow={value ?? 0}
		tabindex={disabled ? -1 : 0}
	></canvas>
	<div
		class="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
		class:transition-[left,top]={!dragging}
		class:duration-300={!dragging}
		class:ease-out={!dragging}
		style:left={markerLeftPct}
		style:top={markerTopPct}
	></div>
</div>
