<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { Thermometer, Droplets, Gauge, Sun } from "@lucide/svelte";
	import type { DeviceState } from "$lib/stores/devices";
	import { ContactRole } from "$lib/gql/graphql";
	import { formatTemperature } from "$lib/sensor-format";
	import { me } from "$lib/stores/me.svelte";
	import { contactIcon } from "$lib/utils";
	import type { Component } from "svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { identifierLabel } from "$lib/i18n/vocabulary";
	import { formatNumber } from "$lib/i18n/format";

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
						? m.sensor_door({}, locale.messageOptions())
						: contactRole === ContactRole.Window
							? m.sensor_window({}, locale.messageOptions())
							: m.sensor_contact({}, locale.messageOptions()),
				value: state.contact
					? m.state_closed({}, locale.messageOptions())
					: m.state_open({}, locale.messageOptions()),
				unit: "",
				icon: contactIcon(contactRole),
			});
		}
		if (state.temperature != null) {
			const t = formatTemperature(state.temperature, me.user?.temperatureUnit ?? "celsius");
			result.push({
				label: m.sensor_temperature({}, locale.messageOptions()),
				value: t.value,
				unit: t.unit,
				icon: Thermometer,
			});
		}
		if (state.humidity != null) {
			result.push({
				label: m.sensor_humidity({}, locale.messageOptions()),
				value: formatNumber(state.humidity, {
					minimumFractionDigits: 1,
					maximumFractionDigits: 1,
				}),
				unit: "%",
				icon: Droplets,
			});
		}
		if (state.pressure != null) {
			result.push({
				label: m.sensor_pressure({}, locale.messageOptions()),
				value: formatNumber(state.pressure, { maximumFractionDigits: 0 }),
				unit: "hPa",
				icon: Gauge,
			});
		}
		if (state.illuminance != null) {
			result.push({
				label: m.sensor_illuminance({}, locale.messageOptions()),
				value: formatNumber(state.illuminance, { maximumFractionDigits: 0 }),
				unit: "lx",
				icon: Sun,
			});
		}
		return result;
	});

	const details = $derived.by(() => {
		const result: { label: string; value: string }[] = [];
		if (state.orientation) {
			result.push({
				label: m.sensor_orientation({}, locale.messageOptions()),
				value: identifierLabel(state.orientation),
			});
		}
		if (state.devicePosture) {
			result.push({
				label: m.sensor_device_posture({}, locale.messageOptions()),
				value: identifierLabel(state.devicePosture),
			});
		}
		return result;
	});
</script>

<div class="space-y-4">
	{#if readings.length > 0}
		<Card>
			<CardHeader>
				<CardTitle>{m.sensor_current_readings({}, locale.messageOptions())}</CardTitle>
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
				<p class="text-muted-foreground">
					{m.sensor_no_readings({}, locale.messageOptions())}
				</p>
			</CardContent>
		</Card>
	{/if}

	{#if details.length > 0}
		<Card>
			<CardHeader>
				<CardTitle>{m.sensor_details({}, locale.messageOptions())}</CardTitle>
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
