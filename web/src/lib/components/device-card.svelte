<script lang="ts">
	import { goto } from "$app/navigation";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { type Device } from "$lib/stores/devices";
	import { deviceTintColor } from "$lib/device-tint";
	import { Card, CardContent, CardHeader } from "$lib/components/ui/card/index.js";
	import HiveIcon from "$lib/components/hive-icon.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu/index.js";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover/index.js";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import DeviceQuickControls from "$lib/components/device-quick-controls.svelte";
	import { stateSummary } from "$lib/device-state";
	import { Battery, Droplets, EllipsisVertical, Gauge, MousePointerClick, Pencil, Plus, Sun, Thermometer } from "@lucide/svelte";

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

	let localBrightness = $state(127);
	let brightnessLastSent = 0;
	let brightnessTrailingTimer: ReturnType<typeof setTimeout> | null = null;
	const BRIGHTNESS_THROTTLE_MS = 250;

	const isSensor = $derived(device.type === "sensor");
	const hasBrightness = $derived(device.state?.brightness != null);
	const actionValues = $derived(
		device.capabilities.find((c) => c.name === "action")?.values ?? [],
	);
	const hasActions = $derived(actionValues.length > 0);
	const summary = $derived(stateSummary(device.state, device.type));
	const tintDevice = $derived(
		device.state?.brightness != null
			? { ...device, state: { ...device.state, brightness: localBrightness } }
			: device,
	);
	const tintColor = $derived(deviceTintColor(tintDevice));
	const cardStyle = $derived(tintColor ? `--tint-color: ${tintColor}` : "");
	const mutedTextClass = $derived(tintColor ? "text-foreground/70" : "text-muted-foreground");

	const SET_DEVICE_STATE = graphql(`
		mutation DeviceCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
			setDeviceState(deviceId: $deviceId, state: $state) {
				id
				state {
					on
					brightness
				}
			}
		}
	`);

	const SIMULATE_DEVICE_ACTION = graphql(`
		mutation DeviceCardSimulateAction($deviceId: ID!, $action: String!) {
			simulateDeviceAction(deviceId: $deviceId, action: $action)
		}
	`);

	function handleActionClick(action: string) {
		void client.mutation(SIMULATE_DEVICE_ACTION, { deviceId: device.id, action }).toPromise();
	}

	const client = getContextClient();
	let sending = $state(false);

	$effect(() => {
		if (!brightnessTrailingTimer && device.state?.brightness != null) {
			localBrightness = device.state.brightness;
		}
	});

	function sendBrightness(val: number) {
		const input: { on?: true; brightness: number } = { brightness: val };
		if (!device.state?.on) input.on = true;
		sending = true;
		void client
			.mutation(SET_DEVICE_STATE, { deviceId: device.id, state: input })
			.toPromise()
			.finally(() => (sending = false));
	}

	function handleBrightnessChange(val: number) {
		localBrightness = val;
		const now = Date.now();
		const elapsed = now - brightnessLastSent;
		if (brightnessTrailingTimer) {
			clearTimeout(brightnessTrailingTimer);
			brightnessTrailingTimer = null;
		}
		if (elapsed >= BRIGHTNESS_THROTTLE_MS) {
			brightnessLastSent = now;
			sendBrightness(val);
		} else {
			brightnessTrailingTimer = setTimeout(() => {
				brightnessTrailingTimer = null;
				brightnessLastSent = Date.now();
				sendBrightness(val);
			}, BRIGHTNESS_THROTTLE_MS - elapsed);
		}
	}

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

<Card
	size="sm"
	class="h-full min-h-28 transition-all hover:shadow-card-hover {tintColor ? 'tint-1' : ''}"
	style={cardStyle}
>
	<CardHeader>
		<div class="flex items-center justify-between gap-2">
			<div class="flex min-w-0 flex-1 items-center gap-2">
				<HiveIcon type={device.type} class="size-4 shrink-0 {mutedTextClass}" />
				<InlineEditName name={device.name} onsave={(newName) => onrename(device.id, newName)} />
				{#if !device.available}
					<span
						class="size-2.5 shrink-0 rounded-full bg-status-offline"
						title="Offline"
						aria-label="Offline"
					></span>
				{/if}
			</div>
			<div class="flex shrink-0 items-center gap-1">
				<DeviceQuickControls {device} />
				<DropdownMenu>
					<DropdownMenuTrigger class="inline-flex h-8 items-center">
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
			<div class="flex flex-wrap gap-x-2 text-xs {mutedTextClass}">
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
	<CardContent class="mt-auto">
		{#if isSensor && sensorReadings.length > 0}
			<Popover>
				<PopoverTrigger class="block w-full text-left">
					<p class="text-sm transition-colors hover:text-foreground {mutedTextClass}">
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
		{:else if hasBrightness || hasActions}
			<div class="flex items-center gap-2">
				{#if hasBrightness}
					<div class="min-w-0 flex-1">
						<Slider
							type="single"
							value={localBrightness}
							min={0}
							max={254}
							step={1}
							onValueChange={handleBrightnessChange}
							disabled={sending || !device.available}
							aria-label={`${device.name} brightness`}
						/>
					</div>
				{/if}
				{#if hasActions}
					<div class="{hasBrightness ? 'ml-auto' : 'ml-auto'} shrink-0">
						<DropdownMenu>
							<DropdownMenuTrigger>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={`Simulate ${device.name} action`}
								>
									<MousePointerClick class="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" class="max-h-80 overflow-y-auto">
								{#each actionValues as action (action)}
									<DropdownMenuItem onclick={() => handleActionClick(action)}>
										{action}
									</DropdownMenuItem>
								{/each}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				{/if}
			</div>
		{/if}
	</CardContent>
</Card>
