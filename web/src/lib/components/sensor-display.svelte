<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { Thermometer, Droplets, Gauge, Sun, Battery } from "@lucide/svelte";
	import type { DeviceState } from "$lib/stores/devices";
	import { formatTemperature } from "$lib/sensor-format";
	import { me } from "$lib/stores/me.svelte";

	interface Props {
		state: DeviceState;
	}

	let { state }: Props = $props();

	interface Reading {
		label: string;
		value: string;
		unit: string;
		icon: typeof Thermometer;
	}

	const readings = $derived.by((): Reading[] => {
		const result: Reading[] = [];
		if (state.temperature != null) {
			const t = formatTemperature(state.temperature, me.user?.temperatureUnit ?? "celsius");
			result.push({
				label: "Temperature",
				value: t.value,
				unit: t.unit,
				icon: Thermometer,
			});
		}
		if (state.humidity != null) {
			result.push({
				label: "Humidity",
				value: state.humidity.toFixed(1),
				unit: "%",
				icon: Droplets,
			});
		}
		if (state.pressure != null) {
			result.push({
				label: "Pressure",
				value: state.pressure.toFixed(0),
				unit: "hPa",
				icon: Gauge,
			});
		}
		if (state.illuminance != null) {
			result.push({
				label: "Illuminance",
				value: state.illuminance.toFixed(0),
				unit: "lx",
				icon: Sun,
			});
		}
		return result;
	});
</script>

<div class="space-y-4">
	{#if readings.length > 0}
		<Card>
			<CardHeader>
				<CardTitle>Current Readings</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
					{#each readings as reading (reading.label)}
						<div class="flex items-center gap-4">
							<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
								<reading.icon class="size-6 text-muted-foreground" />
							</div>
							<div>
								<p class="text-xs text-muted-foreground">{reading.label}</p>
								<p class="text-2xl font-semibold tabular-nums text-foreground">
									{reading.value}<span class="ml-0.5 text-base font-normal text-muted-foreground">{reading.unit}</span>
								</p>
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{:else}
		<Card>
			<CardContent class="py-8 text-center">
				<p class="text-muted-foreground">No sensor readings available.</p>
			</CardContent>
		</Card>
	{/if}

	{#if state.battery != null}
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>Battery</CardTitle>
					<Badge variant={state.battery > 20 ? "secondary" : "destructive"}>
						{Math.round(state.battery)}%
					</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<div class="flex items-center gap-3">
					<Battery class="size-5 text-muted-foreground" />
					<div class="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full transition-all {state.battery > 20 ? 'bg-primary' : 'bg-destructive'}"
							style:width="{state.battery}%"
						></div>
					</div>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
