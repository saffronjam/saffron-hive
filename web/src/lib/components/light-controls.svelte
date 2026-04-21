<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import ColorPicker from "$lib/components/color-picker.svelte";
	import type { DeviceState } from "$lib/stores/devices";

	interface CommandInput {
		on?: boolean;
		brightness?: number;
		colorTemp?: number;
		color?: { r: number; g: number; b: number; x: number; y: number };
		transition?: number;
	}

	interface Props {
		lightState: DeviceState;
		oncommand: (input: CommandInput) => void;
		sending: boolean;
	}

	let { lightState, oncommand, sending }: Props = $props();

	let brightnessTimer: ReturnType<typeof setTimeout> | null = $state(null);
	let colorTempTimer: ReturnType<typeof setTimeout> | null = $state(null);
	let colorTimer: ReturnType<typeof setTimeout> | null = $state(null);

	let localBrightness = $state(127);
	let localColorTemp = $state(250);
	let transitionValue = $state("");
	let initialized = $state(false);

	$effect(() => {
		if (!initialized) {
			localBrightness = lightState.brightness ?? 127;
			localColorTemp = lightState.colorTemp ?? 250;
			transitionValue = lightState.transition?.toString() ?? "";
			initialized = true;
		}
	});

	$effect(() => {
		if (!brightnessTimer && lightState.brightness != null) {
			localBrightness = lightState.brightness;
		}
	});

	$effect(() => {
		if (!colorTempTimer && lightState.colorTemp != null) {
			localColorTemp = lightState.colorTemp;
		}
	});

	function handleToggle(checked: boolean) {
		oncommand({ on: checked });
	}

	function handleBrightnessChange(val: number) {
		localBrightness = val;
		if (brightnessTimer) clearTimeout(brightnessTimer);
		brightnessTimer = setTimeout(() => {
			brightnessTimer = null;
			const t = parseFloat(transitionValue);
			oncommand({
				brightness: val,
				...(Number.isFinite(t) && t > 0 ? { transition: t } : {}),
			});
		}, 200);
	}

	function handleColorTempChange(val: number) {
		localColorTemp = val;
		if (colorTempTimer) clearTimeout(colorTempTimer);
		colorTempTimer = setTimeout(() => {
			colorTempTimer = null;
			const t = parseFloat(transitionValue);
			oncommand({
				colorTemp: val,
				...(Number.isFinite(t) && t > 0 ? { transition: t } : {}),
			});
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
			const t = parseFloat(transitionValue);
			oncommand({
				color: { ...color, x: xy.x, y: xy.y },
				...(Number.isFinite(t) && t > 0 ? { transition: t } : {}),
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
				<div class="flex items-center gap-2">
					{#if sending}
						<Badge variant="outline">Sending...</Badge>
					{/if}
					<Switch
						checked={lightState.on ?? false}
						onCheckedChange={handleToggle}
						disabled={sending}
					/>
				</div>
			</div>
		</CardHeader>
	</Card>

	{#if lightState.brightness != null}
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
					disabled={!(lightState.on ?? false) || sending}
				/>
			</CardContent>
		</Card>
	{/if}

	{#if hasColorTemp}
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>Color Temperature</CardTitle>
					<span class="text-sm tabular-nums text-muted-foreground">{localColorTemp} mireds</span>
				</div>
			</CardHeader>
			<CardContent>
				<Slider
					type="single"
					value={localColorTemp}
					min={150}
					max={500}
					step={1}
					onValueChange={handleColorTempChange}
					disabled={!(lightState.on ?? false) || sending}
				/>
			</CardContent>
		</Card>
	{/if}

	{#if hasColor && lightState.color}
		<Card>
			<CardHeader>
				<CardTitle>Color</CardTitle>
			</CardHeader>
			<CardContent>
				<ColorPicker
					r={lightState.color.r}
					g={lightState.color.g}
					b={lightState.color.b}
					onchange={handleColorChange}
					disabled={!(lightState.on ?? false) || sending}
				/>
			</CardContent>
		</Card>
	{/if}

	<Card>
		<CardHeader>
			<CardTitle>Transition Time</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="flex items-center gap-3">
				<Input
					type="number"
					placeholder="0.0"
					bind:value={transitionValue}
					class="max-w-32"
					min={0}
					step={0.1}
					disabled={sending}
				/>
				<span class="text-sm text-muted-foreground">seconds</span>
			</div>
		</CardContent>
	</Card>
</div>
