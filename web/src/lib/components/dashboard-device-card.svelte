<script lang="ts">
	import {
		isLightState,
		isSensorState,
		isSwitchState,
		type Device,
		type LightState,
	} from "$lib/stores/devices";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import { Lightbulb, Thermometer, ToggleLeft, Package, ChevronDown } from "@lucide/svelte";

	interface LightStateInput {
		on?: boolean;
		brightness?: number;
		colorTemp?: number;
		color?: { r: number; g: number; b: number; x: number; y: number };
		transition?: number;
	}

	interface Props {
		device: Device;
		oncommand: (deviceId: string, input: LightStateInput) => void;
		sending: boolean;
	}

	let { device, oncommand, sending }: Props = $props();

	let expanded = $state(false);
	let brightnessTimer: ReturnType<typeof setTimeout> | null = $state(null);
	let localBrightness = $state(127);
	let brightnessInitialized = $state(false);

	const light = $derived(isLightState(device.state) ? device.state : null);
	const sensor = $derived(isSensorState(device.state) ? device.state : null);
	const sw = $derived(isSwitchState(device.state) ? device.state : null);

	$effect(() => {
		if (light && !brightnessInitialized) {
			localBrightness = light.brightness ?? 127;
			brightnessInitialized = true;
		}
	});

	$effect(() => {
		if (light && !brightnessTimer && light.brightness != null) {
			localBrightness = light.brightness;
		}
	});

	function deviceIcon(type: string): typeof Lightbulb {
		switch (type) {
			case "light":
				return Lightbulb;
			case "sensor":
				return Thermometer;
			case "switch":
				return ToggleLeft;
			default:
				return Package;
		}
	}

	function handleToggle() {
		if (!light) return;
		oncommand(device.id, { on: !light.on });
	}

	function handleSwitchToggle(checked: boolean) {
		oncommand(device.id, { on: checked });
	}

	function handleBrightnessChange(val: number) {
		localBrightness = val;
		if (brightnessTimer) clearTimeout(brightnessTimer);
		brightnessTimer = setTimeout(() => {
			brightnessTimer = null;
			oncommand(device.id, { brightness: val });
		}, 200);
	}

	function handleCardClick() {
		if (light) {
			handleToggle();
		}
	}

	function toggleExpand(e: MouseEvent) {
		e.stopPropagation();
		expanded = !expanded;
	}

	const brightnessPercent = $derived(
		Math.round((localBrightness / 254) * 100)
	);

	const Icon = $derived(deviceIcon(device.type));

	const lightOn = $derived(light?.on ?? false);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="rounded-lg shadow-card bg-card transition-colors {light ? 'cursor-pointer hover:bg-accent/50' : ''}"
	onclick={handleCardClick}
	role={light ? "button" : undefined}
	tabindex={light ? 0 : undefined}
>
	<div class="flex w-full items-center gap-3 p-3">
		<div
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md {lightOn ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}"
		>
			<Icon class="size-4" />
		</div>

		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<h3 class="truncate text-sm font-medium text-card-foreground">{device.name}</h3>
				<span
					class="h-2 w-2 shrink-0 rounded-full {device.available ? 'bg-green-500' : 'bg-destructive'}"
				></span>
			</div>

			{#if light}
				<p class="text-xs text-muted-foreground">
					{lightOn ? "On" : "Off"}
					{#if lightOn && light.brightness != null}
						- {brightnessPercent}%
					{/if}
				</p>
			{:else if sensor}
				<p class="text-xs text-muted-foreground">
					{#if sensor.temperature != null}
						{sensor.temperature.toFixed(1)}&deg;C
					{/if}
					{#if sensor.temperature != null && sensor.humidity != null}
						/
					{/if}
					{#if sensor.humidity != null}
						{sensor.humidity.toFixed(0)}% RH
					{/if}
					{#if sensor.temperature == null && sensor.humidity == null && sensor.battery != null}
						Battery {sensor.battery}%
					{/if}
					{#if sensor.temperature == null && sensor.humidity == null && sensor.battery == null}
						No data
					{/if}
				</p>
			{:else if sw}
				<p class="text-xs text-muted-foreground">
					{sw.action ? `Last: ${sw.action}` : "No action"}
				</p>
			{/if}
		</div>

		{#if light}
			<div class="flex items-center gap-2">
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div onclick={(e: MouseEvent) => e.stopPropagation()}>
					<Switch
						size="sm"
						checked={lightOn}
						onCheckedChange={handleSwitchToggle}
						disabled={sending}
					/>
				</div>
				{#if light.brightness != null}
					<button
						type="button"
						class="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						onclick={toggleExpand}
					>
						<ChevronDown class="size-4 transition-transform {expanded ? 'rotate-180' : ''}" />
					</button>
				{/if}
			</div>
		{/if}
	</div>

	{#if expanded && light && light.brightness != null}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="border-t border-border px-3 pb-3 pt-2" onclick={(e: MouseEvent) => e.stopPropagation()}>
			<div class="mb-1 flex items-center justify-between">
				<span class="text-xs text-muted-foreground">Brightness</span>
				<span class="text-xs tabular-nums text-muted-foreground">{brightnessPercent}%</span>
			</div>
			<Slider
				type="single"
				value={localBrightness}
				min={0}
				max={254}
				step={1}
				onValueChange={handleBrightnessChange}
				disabled={!lightOn || sending}
			/>
		</div>
	{/if}
</div>
