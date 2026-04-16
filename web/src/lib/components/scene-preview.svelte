<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Lightbulb, Thermometer, ToggleLeft, Package } from "@lucide/svelte";
	import type { Device, LightState, SensorState } from "$lib/stores/devices";
	import { isLightState, isSensorState } from "$lib/stores/devices";

	interface Props {
		devices: Device[];
	}

	let { devices }: Props = $props();

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

	function brightnessPercent(light: LightState): string {
		if (light.brightness == null) return "";
		return `${Math.round((light.brightness / 254) * 100)}%`;
	}

	function colorPreview(light: LightState): string | null {
		if (!light.color) return null;
		return `rgb(${light.color.r}, ${light.color.g}, ${light.color.b})`;
	}
</script>

{#if devices.length === 0}
	<p class="py-6 text-center text-sm text-muted-foreground">
		No effective devices to preview.
	</p>
{:else}
	<div class="space-y-2">
		{#each devices as device (device.id)}
			{@const Icon = deviceIcon(device.type)}
			{@const light = isLightState(device.state) ? device.state : null}
			{@const sensor = isSensorState(device.state) ? device.state : null}
			<div class="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/50">
				<Icon class="size-4 shrink-0 text-muted-foreground" />
				<span class="min-w-0 flex-1 truncate text-sm text-foreground">{device.name}</span>

				<div class="flex items-center gap-2">
					{#if light}
						<span class="flex items-center gap-1.5 text-xs text-muted-foreground">
							<span class="h-2 w-2 rounded-full {light.on ? 'bg-green-500' : 'bg-muted-foreground/50'}"></span>
							{light.on ? "On" : "Off"}
						</span>
						{#if light.brightness != null}
							<Badge variant="secondary" class="text-xs">{brightnessPercent(light)}</Badge>
						{/if}
						{@const color = colorPreview(light)}
						{#if color}
							<div
								class="h-4 w-4 rounded-full border border-border"
								style:background-color={color}
							></div>
						{/if}
					{:else if sensor}
						{#if sensor.temperature != null}
							<Badge variant="secondary" class="text-xs">{sensor.temperature.toFixed(1)}&deg;C</Badge>
						{/if}
					{:else}
						<Badge variant="outline" class="text-xs">
							{device.available ? "Online" : "Offline"}
						</Badge>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
