<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import LightColorPicker from "$lib/components/light-color-picker.svelte";
	import type { DeviceState } from "$lib/stores/devices";

	interface CommandInput {
		on?: boolean;
		brightness?: number;
		colorTemp?: number;
		color?: { r: number; g: number; b: number; x: number; y: number };
	}

	interface Props {
		lightState: DeviceState;
		oncommand: (input: CommandInput) => void;
	}

	let { lightState, oncommand }: Props = $props();

	let brightnessTimer: ReturnType<typeof setTimeout> | null = $state(null);
	let colorTempTimer: ReturnType<typeof setTimeout> | null = $state(null);
	let colorTimer: ReturnType<typeof setTimeout> | null = $state(null);

	let localBrightness = $state(127);
	let initialized = $state(false);

	$effect(() => {
		if (!initialized) {
			localBrightness = lightState.brightness ?? 127;
			initialized = true;
		}
	});

	$effect(() => {
		if (!brightnessTimer && lightState.brightness != null) {
			localBrightness = lightState.brightness;
		}
	});

	function handleToggle(checked: boolean) {
		oncommand({ on: checked });
	}

	function autoOn(): { on: true } | Record<string, never> {
		return lightState.on ? {} : { on: true };
	}

	function handleBrightnessChange(val: number) {
		localBrightness = val;
		if (brightnessTimer) clearTimeout(brightnessTimer);
		brightnessTimer = setTimeout(() => {
			brightnessTimer = null;
			oncommand({ ...autoOn(), brightness: val });
		}, 200);
	}

	function handleColorTempChange(val: number) {
		if (colorTempTimer) clearTimeout(colorTempTimer);
		colorTempTimer = setTimeout(() => {
			colorTempTimer = null;
			oncommand({ ...autoOn(), colorTemp: val });
		}, 200);
	}

	function rgbToXy(r: number, g: number, b: number): { x: number; y: number } {
		let rn = r / 255;
		let gn = g / 255;
		let bn = b / 255;

		rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
		gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
		bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;

		const X = rn * 0.4124 + gn * 0.3576 + bn * 0.1805;
		const Y = rn * 0.2126 + gn * 0.7152 + bn * 0.0722;
		const Z = rn * 0.0193 + gn * 0.1192 + bn * 0.9505;

		const sum = X + Y + Z;
		if (sum === 0) return { x: 0, y: 0 };
		return {
			x: Math.round((X / sum) * 10000) / 10000,
			y: Math.round((Y / sum) * 10000) / 10000,
		};
	}

	function handleColorChange(color: { r: number; g: number; b: number }) {
		if (colorTimer) clearTimeout(colorTimer);
		colorTimer = setTimeout(() => {
			colorTimer = null;
			const xy = rgbToXy(color.r, color.g, color.b);
			oncommand({
				...autoOn(),
				color: { ...color, x: xy.x, y: xy.y },
			});
		}, 200);
	}

	const brightnessPercent = $derived(
		Math.round((localBrightness / 254) * 100)
	);

	const hasColor = $derived(lightState.color != null);
	const hasColorTemp = $derived(lightState.colorTemp != null);
</script>

<div class="space-y-4">
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<CardTitle>Power</CardTitle>
				<Switch
					checked={lightState.on ?? false}
					onCheckedChange={handleToggle}
				/>
			</div>
		</CardHeader>
	</Card>

	{#if hasColor || hasColorTemp}
		<Card>
			<CardHeader>
				<CardTitle>Color</CardTitle>
			</CardHeader>
			<CardContent>
				<LightColorPicker
					color={lightState.color ?? null}
					colorTemp={lightState.colorTemp ?? null}
					{hasColor}
					{hasColorTemp}
					hasBrightness={lightState.brightness != null}
					brightness={localBrightness}
					oncolorchange={handleColorChange}
					ontempchange={handleColorTempChange}
					onbrightnesschange={handleBrightnessChange}
				/>
			</CardContent>
		</Card>
	{:else if lightState.brightness != null}
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>Brightness</CardTitle>
					<span class="text-sm tabular-nums text-muted-foreground">{brightnessPercent}%</span>
				</div>
			</CardHeader>
			<CardContent>
				<Slider
					type="single"
					value={localBrightness}
					min={0}
					max={254}
					step={1}
					onValueChange={handleBrightnessChange}
				/>
			</CardContent>
		</Card>
	{/if}
</div>
