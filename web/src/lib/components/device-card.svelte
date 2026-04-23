<script lang="ts">
	import { goto } from "$app/navigation";
	import { type Device } from "$lib/stores/devices";
	import { stateSummary } from "$lib/device-state";
	import { deviceTint, tintCardBg } from "$lib/device-tint";
	import { Card, CardContent, CardHeader } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu/index.js";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover/index.js";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import { Battery, Droplets, EllipsisVertical, Gauge, Pencil, Plus, Sun, Thermometer } from "@lucide/svelte";

	interface MembershipChip {
		id: string;
		name: string;
		icon?: string | null;
	}

	interface Props {
		device: Device;
		roomChips?: MembershipChip[];
		groupChips?: MembershipChip[];
		onrename: (id: string, newName: string) => void;
		onAddTo: (device: Device) => void;
	}

	let {
		device,
		roomChips = [],
		groupChips = [],
		onrename,
		onAddTo,
	}: Props = $props();

	const summary = $derived(stateSummary(device.state, device.type));
	const isSensor = $derived(device.type === "sensor");
	const tintBg = $derived(tintCardBg(deviceTint(device)));

	interface Reading {
		label: string;
		value: string;
		unit: string;
		icon: typeof Thermometer;
	}

	const sensorReadings = $derived.by<Reading[]>(() => {
		const state = device.state;
		if (!state) return [];
		const result: Reading[] = [];
		if (state.temperature != null) {
			result.push({ label: "Temperature", value: state.temperature.toFixed(1), unit: "°C", icon: Thermometer });
		}
		if (state.humidity != null) {
			result.push({ label: "Humidity", value: state.humidity.toFixed(1), unit: "%", icon: Droplets });
		}
		if (state.pressure != null) {
			result.push({ label: "Pressure", value: state.pressure.toFixed(0), unit: "hPa", icon: Gauge });
		}
		if (state.illuminance != null) {
			result.push({ label: "Illuminance", value: state.illuminance.toFixed(0), unit: "lx", icon: Sun });
		}
		if (state.battery != null) {
			result.push({ label: "Battery", value: `${state.battery}`, unit: "%", icon: Battery });
		}
		return result;
	});
</script>

<Card size="sm" class="transition-all hover:shadow-card-hover" style="background-color: {tintBg}">
	<CardHeader>
		<div class="flex items-center justify-between gap-2">
			<InlineEditName name={device.name} onsave={(newName) => onrename(device.id, newName)} />
			<div class="flex shrink-0 items-center gap-2">
				<span
					class="h-2.5 w-2.5 shrink-0 rounded-full {device.available
						? 'bg-green-500'
						: 'bg-destructive'}"
				></span>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Button variant="ghost" size="icon-sm" aria-label="Device actions">
							<EllipsisVertical class="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onclick={() => goto(`/devices/${device.id}`)}>
							<Pencil class="size-4" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onclick={() => onAddTo(device)}>
							<Plus class="size-4" />
							Add to
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
		{#if roomChips.length > 0 || groupChips.length > 0}
			<div class="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
				{#each roomChips as chip (chip.id)}
					<a href={`/rooms?edit=${chip.id}`} class="transition-colors hover:text-foreground">
						{chip.name}
					</a>
				{/each}
				{#each groupChips as chip (chip.id)}
					<a href={`/groups?edit=${chip.id}`} class="transition-colors hover:text-foreground">
						{chip.name}
					</a>
				{/each}
			</div>
		{/if}
	</CardHeader>
	<CardContent>
		<div class="flex items-end justify-between gap-2">
			<div class="min-w-0 flex-1">
				{#if isSensor && sensorReadings.length > 0}
					<Popover>
						<PopoverTrigger class="block w-full text-left">
							<p class="text-sm text-muted-foreground transition-colors hover:text-foreground">
								{summary}
							</p>
						</PopoverTrigger>
						<PopoverContent class="w-72 p-3" align="start">
							<div class="space-y-2">
								{#each sensorReadings as reading (reading.label)}
									<div class="flex items-center gap-3 text-sm">
										<reading.icon class="size-4 shrink-0 text-muted-foreground" />
										<span class="text-muted-foreground">{reading.label}</span>
										<span class="ml-auto font-medium tabular-nums text-foreground">
											{reading.value}<span class="ml-0.5 text-xs text-muted-foreground"
												>{reading.unit}</span
											>
										</span>
									</div>
								{/each}
							</div>
						</PopoverContent>
					</Popover>
				{:else}
					<p class="text-sm text-muted-foreground">{summary}</p>
				{/if}
			</div>
			<div class="flex shrink-0 flex-wrap justify-end gap-2">
				<HiveChip type={device.type} />
				<Badge variant="outline">
					{device.source.charAt(0).toUpperCase() + device.source.slice(1)}
				</Badge>
			</div>
		</div>
	</CardContent>
</Card>
