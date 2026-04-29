<script lang="ts">
	import type { Device } from "$lib/stores/devices";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import { Battery, ChevronDown, Droplets, Thermometer } from "@lucide/svelte";
	import { deviceIcon } from "$lib/utils";

	interface CommandInput {
		on?: boolean;
		brightness?: number;
		colorTemp?: number;
		color?: { r: number; g: number; b: number; x: number; y: number };
		transition?: number;
	}

	interface Props {
		device: Device;
		oncommand: (deviceId: string, input: CommandInput) => void;
		sending: boolean;
	}

	let { device, oncommand, sending }: Props = $props();

	let expanded = $state(false);
	let brightnessTimer: ReturnType<typeof setTimeout> | null = $state(null);
	let localBrightness = $state(127);
	let brightnessInitialized = $state(false);

	const isLight = $derived(device.type === "light");
	const isPlug = $derived(device.type === "plug");
	const isSensor = $derived(device.type === "sensor");
	const isButton = $derived(device.type === "button");
	const light = $derived(isLight ? device.state : null);
	const plug = $derived(isPlug ? device.state : null);
	const sensor = $derived(isSensor ? device.state : null);
	const sw = $derived(isButton ? device.state : null);

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

	function handleToggle() {
		const state = light ?? plug;
		if (!state) return;
		oncommand(device.id, { on: !state.on });
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
		if (light || plug) {
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
	const plugOn = $derived(plug?.on ?? false);
	const toggleOn = $derived(lightOn || plugOn);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="rounded-lg shadow-card bg-card transition-colors {light || plug ? 'hover:bg-accent/50' : ''}"
	onclick={handleCardClick}
	role={light || plug ? "button" : undefined}
	tabindex={light || plug ? 0 : undefined}
>
	<div class="flex w-full items-center gap-3 p-3">
		<div
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md {toggleOn ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}"
		>
			<Icon class="size-4" />
		</div>

		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<h3 class="truncate text-sm font-medium text-card-foreground">{device.name}</h3>
				<span
					class="h-2 w-2 shrink-0 rounded-full {device.available ? 'bg-status-online' : 'bg-status-offline'}"
				></span>
			</div>

			{#if light}
				<p class="text-xs text-muted-foreground">
					{lightOn ? "On" : "Off"}
					{#if lightOn && light.brightness != null}
						- {brightnessPercent}%
					{/if}
				</p>
			{:else if plug}
				<p class="text-xs text-muted-foreground">
					{plugOn ? "On" : "Off"}
					{#if plug.power != null}
						- {plug.power.toFixed(0)} W
					{/if}
				</p>
			{:else if sensor}
				<div class="flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
					{#if sensor.temperature != null}
						<span class="flex items-center gap-1">
							<Thermometer class="size-3.5" />
							<span class="text-foreground">{sensor.temperature.toFixed(1)}&deg;C</span>
						</span>
					{/if}
					{#if sensor.humidity != null}
						<span class="flex items-center gap-1">
							<Droplets class="size-3.5" />
							<span class="text-foreground">{sensor.humidity.toFixed(0)}%</span>
						</span>
					{/if}
					{#if sensor.temperature == null && sensor.humidity == null && sensor.battery != null}
						<span class="flex items-center gap-1">
							<Battery class="size-3.5" />
							<span class="text-foreground">{Math.round(sensor.battery)}%</span>
						</span>
					{/if}
					{#if sensor.temperature == null && sensor.humidity == null && sensor.battery == null}
						<span>No data</span>
					{/if}
				</div>
			{:else if sw}
				<p class="text-xs text-muted-foreground">Button</p>
			{/if}
		</div>

		{#if light || plug}
			<div class="flex items-center gap-2">
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div onclick={(e: MouseEvent) => e.stopPropagation()}>
					<Switch
						size="sm"
						checked={toggleOn}
						onCheckedChange={handleSwitchToggle}
						disabled={sending}
					/>
				</div>
				{#if light && light.brightness != null}
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
