<script lang="ts">
	import {
		isLightState,
		isSensorState,
		isSwitchState,
		type Device,
	} from "$lib/stores/devices";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";

	interface Props {
		device: Device;
	}

	let { device }: Props = $props();

	const light = $derived(isLightState(device.state) ? device.state : null);
	const sensor = $derived(isSensorState(device.state) ? device.state : null);
	const sw = $derived(isSwitchState(device.state) ? device.state : null);

	function typeBadgeVariant(type: string): "default" | "secondary" | "outline" {
		switch (type) {
			case "light":
				return "default";
			case "sensor":
				return "secondary";
			case "switch":
				return "outline";
			default:
				return "secondary";
		}
	}

	function stateSummary(): string {
		if (light) {
			if (light.on === false) return "Off";
			if (light.brightness != null) {
				return `On - ${Math.round((light.brightness / 254) * 100)}%`;
			}
			return light.on ? "On" : "Unknown";
		}
		if (sensor) {
			const parts: string[] = [];
			if (sensor.temperature != null) parts.push(`${sensor.temperature.toFixed(1)}\u00b0C`);
			if (sensor.humidity != null) parts.push(`${sensor.humidity.toFixed(0)}% RH`);
			if (parts.length > 0) return parts.join(" / ");
			if (sensor.battery != null) return `Battery ${sensor.battery}%`;
			return "No data";
		}
		if (sw) {
			return sw.action ? `Last: ${sw.action}` : "No action";
		}
		return "Unknown";
	}
</script>

<a href="/devices/{device.id}" class="block">
	<Card
		size="sm"
		class="cursor-pointer transition-colors hover:bg-accent"
	>
		<CardHeader>
			<div class="flex items-center justify-between">
				<CardTitle class="truncate">{device.name}</CardTitle>
				<span
					class="h-2.5 w-2.5 shrink-0 rounded-full {device.available ? 'bg-green-500' : 'bg-destructive'}"
				></span>
			</div>
			<div class="flex items-center gap-2">
				<Badge variant={typeBadgeVariant(device.type)}>
					{device.type}
				</Badge>
				<Badge variant="outline">
					{device.source}
				</Badge>
			</div>
		</CardHeader>
		<CardContent>
			<p class="text-sm text-muted-foreground">{stateSummary()}</p>
		</CardContent>
	</Card>
</a>
