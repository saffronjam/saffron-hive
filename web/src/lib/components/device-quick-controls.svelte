<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { deviceSceneCapabilities, type Device } from "$lib/stores/devices";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import LightColorPicker from "$lib/components/light-color-picker.svelte";
	import HiveColorSwatch from "$lib/components/hive-color-swatch.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { deviceTint } from "$lib/device-tint";
	import { sentenceCase } from "$lib/utils";
	import { throttle, type Throttle } from "$lib/throttle";
	import { Palette, Thermometer } from "@lucide/svelte";

	interface Props {
		device: Device;
		variant?: "palette" | "swatch";
	}

	let { device, variant = "palette" }: Props = $props();

	const SET_DEVICE_STATE = graphql(`
		mutation DeviceTableSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
			setDeviceState(deviceId: $deviceId, state: $state) {
				id
				state {
					on
					brightness
					colorTemp
					targetTemperature
					hvacMode
					fanMode
					swing
					color { r g b x y }
				}
			}
		}
	`);

	const client = getContextClient();

	const caps = $derived(deviceSceneCapabilities(device));
	const hasOnOff = $derived(caps.hasOnOff);
	const hasColor = $derived(caps.hasColor);
	const hasColorTemp = $derived(caps.hasColorTemp);
	const hasPopover = $derived(hasColor || hasColorTemp);
	const targetTempCap = $derived(device.capabilities.find((c) => c.name === "target_temperature"));
	const hvacCap = $derived(device.capabilities.find((c) => c.name === "hvac_mode"));
	const fanCap = $derived(device.capabilities.find((c) => c.name === "fan_mode"));
	const swingCap = $derived(device.capabilities.find((c) => c.name === "swing"));
	const targetTempMin = $derived(targetTempCap?.valueMin ?? 16);
	const targetTempMax = $derived(targetTempCap?.valueMax ?? 31);
	const hvacValues = $derived(hvacCap?.values ?? []);
	const fanValues = $derived(fanCap?.values ?? []);
	const swingValues = $derived(swingCap?.values && swingCap.values.length > 0 ? swingCap.values : ["off", "on"]);
	const hasClimatePopover = $derived(Boolean(targetTempCap || hvacCap || fanCap || swingCap));

	interface CommandInput {
		on?: boolean;
		colorTemp?: number;
		targetTemperature?: number;
		hvacMode?: string;
		fanMode?: string;
		swing?: string;
		color?: { r: number; g: number; b: number; x: number; y: number };
	}

	function send(input: CommandInput) {
		void client.mutation(SET_DEVICE_STATE, { deviceId: device.id, state: input }).toPromise();
	}

	function handleToggle(checked: boolean) {
		send({ on: checked });
	}

	const colorTempThrottle: Throttle = { lastSent: 0, trailing: null };
	const colorThrottle: Throttle = { lastSent: 0, trailing: null };
	const targetTemperatureThrottle: Throttle = { lastSent: 0, trailing: null };
	let selectedTargetTemperature = $state(0);
	let selectedHvacMode = $state("");
	let selectedFanMode = $state("");
	let selectedSwing = $state("");

	$effect(() => {
		selectedTargetTemperature = device.state?.targetTemperature ?? Math.round((targetTempMin + targetTempMax) / 2);
		selectedHvacMode = device.state?.hvacMode ?? "";
		selectedFanMode = device.state?.fanMode ?? "";
		selectedSwing = device.state?.swing ?? "";
	});

	function autoOn(): { on: true } | Record<string, never> {
		return device.state?.on ? {} : { on: true };
	}

	function handleColorTempChange(val: number) {
		throttle(colorTempThrottle, () => send({ ...autoOn(), colorTemp: val }));
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
		throttle(colorThrottle, () => {
			const xy = rgbToXy(color.r, color.g, color.b);
			send({ ...autoOn(), color: { ...color, x: xy.x, y: xy.y } });
		});
	}

	function handleTargetTemperatureChange(value: number) {
		selectedTargetTemperature = value;
		throttle(targetTemperatureThrottle, () => send({ targetTemperature: value }));
	}

	function handleHvacModeChange(value: string | undefined) {
		if (!value) return;
		selectedHvacMode = value;
		send({ hvacMode: value });
	}

	function handleFanModeChange(value: string | undefined) {
		if (!value) return;
		selectedFanMode = value;
		send({ fanMode: value });
	}

	function handleSwingChange(value: string | undefined) {
		if (!value) return;
		selectedSwing = value;
		send({ swing: value });
	}

	const isOn = $derived(device.state?.on ?? false);
</script>

{#if hasOnOff}
	<Tooltip>
		<TooltipTrigger class="inline-flex h-8 items-center">
			<Switch
				checked={isOn}
				onCheckedChange={handleToggle}
				disabled={!device.available}
				aria-label={`Toggle ${device.name}`}
			/>
		</TooltipTrigger>
		<TooltipContent>{isOn ? "Turn off" : "Turn on"}</TooltipContent>
	</Tooltip>
{/if}

{#if hasClimatePopover}
	<Popover>
		<PopoverTrigger class="inline-flex h-8 items-center">
			<Tooltip>
				<TooltipTrigger class="inline-flex h-8 items-center">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={`Adjust ${device.name} climate`}
						disabled={!device.available}
					>
						<Thermometer class="size-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Climate</TooltipContent>
			</Tooltip>
		</PopoverTrigger>
		<PopoverContent class="w-72 p-3 space-y-3" align="end">
			{#if targetTempCap}
				<div class="space-y-1.5">
					<div class="flex items-center justify-between gap-2">
						<span class="text-xs font-medium">Target</span>
						<span class="text-[10px] tabular-nums text-muted-foreground">
							{selectedTargetTemperature}{targetTempCap.unit ?? ""}
						</span>
					</div>
					<Slider
						type="single"
						value={selectedTargetTemperature}
						min={targetTempMin}
						max={targetTempMax}
						step={1}
						aria-label="Target temperature"
						disabled={!device.available}
						onValueChange={handleTargetTemperatureChange}
					/>
				</div>
			{/if}

			{#if hvacCap && hvacValues.length > 0}
				<div class="space-y-1.5">
					<span class="text-xs font-medium">Mode</span>
					<Select
						type="single"
						bind:value={selectedHvacMode}
						onValueChange={handleHvacModeChange}
						disabled={!device.available}
					>
						<SelectTrigger class="w-full text-xs">
							{selectedHvacMode ? sentenceCase(selectedHvacMode) : "Select mode"}
						</SelectTrigger>
						<SelectContent>
							{#each hvacValues as value (value)}
								<SelectItem value={value}>{sentenceCase(value)}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
			{/if}

			{#if fanCap && fanValues.length > 0}
				<div class="space-y-1.5">
					<span class="text-xs font-medium">Fan</span>
					<Select
						type="single"
						bind:value={selectedFanMode}
						onValueChange={handleFanModeChange}
						disabled={!device.available}
					>
						<SelectTrigger class="w-full text-xs">
							{selectedFanMode ? sentenceCase(selectedFanMode) : "Select fan"}
						</SelectTrigger>
						<SelectContent>
							{#each fanValues as value (value)}
								<SelectItem value={value}>{sentenceCase(value)}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
			{/if}

			{#if swingCap}
				<div class="space-y-1.5">
					<span class="text-xs font-medium">Swing</span>
					<Select
						type="single"
						bind:value={selectedSwing}
						onValueChange={handleSwingChange}
						disabled={!device.available}
					>
						<SelectTrigger class="w-full text-xs">
							{selectedSwing ? sentenceCase(selectedSwing) : "Select swing"}
						</SelectTrigger>
						<SelectContent>
							{#each swingValues as value (value)}
								<SelectItem value={value}>{sentenceCase(value)}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
			{/if}
		</PopoverContent>
	</Popover>
{/if}

{#if hasPopover}
	<Popover>
		<PopoverTrigger class="inline-flex h-8 items-center">
			<Tooltip>
				<TooltipTrigger class="inline-flex h-8 items-center">
					{#if variant === "swatch"}
						<button
							type="button"
							aria-label={`Adjust ${device.name}`}
							disabled={!device.available}
							class="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
						>
							<HiveColorSwatch color={deviceTint(device)} />
						</button>
					{:else}
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={`Adjust ${device.name}`}
							disabled={!device.available}
						>
							<Palette class="size-4" />
						</Button>
					{/if}
				</TooltipTrigger>
				<TooltipContent>Adjust</TooltipContent>
			</Tooltip>
		</PopoverTrigger>
		<PopoverContent class="w-72 p-3 space-y-4" align="end">
			<div class="space-y-2">
				<LightColorPicker
					color={device.state?.color ?? null}
					colorTemp={device.state?.colorTemp ?? null}
					{hasColor}
					{hasColorTemp}
					oncolorchange={handleColorChange}
					ontempchange={handleColorTempChange}
				/>
			</div>
		</PopoverContent>
	</Popover>
{/if}
