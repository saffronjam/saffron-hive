<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { Thermometer, Droplets, Gauge, Sun, Battery } from "@lucide/svelte";
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
		if (state.linkQuality != null) {
			result.push({ label: "Link quality", value: Math.round(state.linkQuality).toString() });
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
