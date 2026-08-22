<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { Thermometer, Droplets, Gauge, Sun } from "@lucide/svelte";
	import type { DeviceState } from "$lib/stores/devices";
	import { ContactRole } from "$lib/gql/graphql";
	import { formatTemperature } from "$lib/sensor-format";
	import { me } from "$lib/stores/me.svelte";
	import { contactIcon, sentenceCase } from "$lib/utils";
	import type { Component } from "svelte";

	interface Props {
		state: DeviceState;
		contactRole?: ContactRole | null;
	}

	let { state, contactRole = null }: Props = $props();

	interface Reading {
		label: string;
		value: string;
		unit: string;
		icon: Component;
	}

	const readings = $derived.by((): Reading[] => {
		const result: Reading[] = [];
		if (state.contact != null) {
			result.push({
				label:
					contactRole === ContactRole.Door
						? "Door"
						: contactRole === ContactRole.Window
							? "Window"
							: "Contact",
				value: state.contact ? "Closed" : "Open",
				unit: "",
				icon: contactIcon(contactRole),
			});
		}
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

	const details = $derived.by(() => {
		const result: { label: string; value: string }[] = [];
		if (state.orientation) {
			result.push({ label: "Orientation", value: sentenceCase(state.orientation) });
		}
		if (state.devicePosture) {
			result.push({ label: "Device posture", value: sentenceCase(state.devicePosture) });
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
									{reading.value}{#if reading.unit}<span class="ml-0.5 text-base font-normal text-muted-foreground">{reading.unit}</span>{/if}
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

	{#if details.length > 0}
		<Card>
			<CardHeader>
				<CardTitle>Sensor Details</CardTitle>
			</CardHeader>
			<CardContent>
				<dl class="space-y-3">
					{#each details as detail, index (detail.label)}
						{#if index > 0}<Separator />{/if}
						<div class="flex items-center justify-between gap-4">
							<dt class="text-sm text-muted-foreground">{detail.label}</dt>
							<dd class="text-sm text-foreground">{detail.value}</dd>
						</div>
					{/each}
				</dl>
			</CardContent>
		</Card>
	{/if}
</div>
