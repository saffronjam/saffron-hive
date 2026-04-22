<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import type { Device } from "$lib/stores/devices";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import ColorPicker from "$lib/components/color-picker.svelte";
	import { Palette } from "@lucide/svelte";

	interface Props {
		device: Device;
	}

	let { device }: Props = $props();

	const SET_DEVICE_STATE = graphql(`
		mutation DeviceTableSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
			setDeviceState(deviceId: $deviceId, state: $state) {
				id
				state {
					on
					brightness
					colorTemp
					color { r g b x y }
				}
			}
		}
	`);

	const client = getContextClient();
	let sending = $state(false);

	const hasOnOff = $derived(device.state?.on != null);
	const hasBrightness = $derived(device.state?.brightness != null);
	const hasColor = $derived(device.state?.color != null);
	const hasColorTemp = $derived(device.state?.colorTemp != null);
	const hasPopover = $derived(hasBrightness || hasColor || hasColorTemp);

	interface CommandInput {
		on?: boolean;
		brightness?: number;
		colorTemp?: number;
		color?: { r: number; g: number; b: number; x: number; y: number };
	}

	async function send(input: CommandInput) {
		sending = true;
		await client.mutation(SET_DEVICE_STATE, { deviceId: device.id, state: input }).toPromise();
		sending = false;
	}

	function handleToggle(checked: boolean) {
		void send({ on: checked });
	}

	let brightnessTimer: ReturnType<typeof setTimeout> | null = null;
	let colorTempTimer: ReturnType<typeof setTimeout> | null = null;
	let colorTimer: ReturnType<typeof setTimeout> | null = null;

	let localBrightness = $state(127);
	let localColorTemp = $state(250);

	$effect(() => {
		if (!brightnessTimer && device.state?.brightness != null) {
			localBrightness = device.state.brightness;
		}
	});

	$effect(() => {
		if (!colorTempTimer && device.state?.colorTemp != null) {
			localColorTemp = device.state.colorTemp;
		}
	});

	function autoOn(): { on: true } | Record<string, never> {
		return device.state?.on ? {} : { on: true };
	}

	function handleBrightnessChange(val: number) {
		localBrightness = val;
		if (brightnessTimer) clearTimeout(brightnessTimer);
		brightnessTimer = setTimeout(() => {
			brightnessTimer = null;
			void send({ ...autoOn(), brightness: val });
		}, 200);
	}

	function handleColorTempChange(val: number) {
		localColorTemp = val;
		if (colorTempTimer) clearTimeout(colorTempTimer);
		colorTempTimer = setTimeout(() => {
			colorTempTimer = null;
			void send({ ...autoOn(), colorTemp: val });
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
			void send({ ...autoOn(), color: { ...color, x: xy.x, y: xy.y } });
		}, 200);
	}

	const brightnessPercent = $derived(Math.round((localBrightness / 254) * 100));
	const isOn = $derived(device.state?.on ?? false);
</script>

{#if hasOnOff}
	<Tooltip>
		<TooltipTrigger>
			<Switch
				checked={isOn}
				onCheckedChange={handleToggle}
				disabled={sending || !device.available}
				aria-label={`Toggle ${device.name}`}
			/>
		</TooltipTrigger>
		<TooltipContent>{isOn ? "Turn off" : "Turn on"}</TooltipContent>
	</Tooltip>
{/if}

{#if hasPopover}
	<Popover>
		<PopoverTrigger>
			<Tooltip>
				<TooltipTrigger>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={`Adjust ${device.name}`}
						disabled={!device.available}
					>
						<Palette class="size-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Adjust</TooltipContent>
			</Tooltip>
		</PopoverTrigger>
		<PopoverContent class="w-72 p-3 space-y-4" align="end">
			{#if hasBrightness}
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Brightness</span>
						<span class="text-sm tabular-nums text-muted-foreground">{brightnessPercent}%</span>
					</div>
					<Slider
						type="single"
						value={localBrightness}
						min={0}
						max={254}
						step={1}
						onValueChange={handleBrightnessChange}
						disabled={sending}
					/>
				</div>
			{/if}

			{#if hasColorTemp}
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Color temperature</span>
						<span class="text-sm tabular-nums text-muted-foreground">{localColorTemp}</span>
					</div>
					<Slider
						type="single"
						value={localColorTemp}
						min={150}
						max={500}
						step={1}
						onValueChange={handleColorTempChange}
						disabled={sending}
					/>
				</div>
			{/if}

			{#if hasColor && device.state?.color}
				<div class="space-y-2">
					<span class="text-sm font-medium">Color</span>
					<ColorPicker
						r={device.state.color.r}
						g={device.state.color.g}
						b={device.state.color.b}
						onchange={handleColorChange}
						disabled={sending}
					/>
				</div>
			{/if}
		</PopoverContent>
	</Popover>
{/if}
