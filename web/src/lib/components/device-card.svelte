<script lang="ts">
	import { goto } from "$app/navigation";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { type Device } from "$lib/stores/devices";
	import {
		aggregateSensorReadings,
		brightnessToTintStrength,
		deviceTintBase,
	} from "$lib/device-tint";
	import { Card, CardContent, CardHeader } from "$lib/components/ui/card/index.js";
	import IconCell from "$lib/components/table-cells/icon-cell.svelte";
	import { deviceIcon } from "$lib/utils";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu/index.js";
	import SensorHistoryPopover from "$lib/components/sensor-history-popover.svelte";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import DeviceQuickControls from "$lib/components/device-quick-controls.svelte";
	import { me } from "$lib/stores/me.svelte";
	import { EllipsisVertical, MousePointerClick, Pencil, Plus } from "@lucide/svelte";

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
		oniconchange: (id: string, icon: string | null) => void;
		onAddTo: (device: Device) => void;
	}

	let {
		device,
		roomChips = [],
		groupChips = [],
		onrename,
		oniconchange,
		onAddTo,
	}: Props = $props();

	let localBrightness = $state(0);
	let brightnessLastSent = 0;
	let brightnessTrailingTimer: ReturnType<typeof setTimeout> | null = null;
	let interacting = $state(false);
	let interactingTimer: ReturnType<typeof setTimeout> | null = null;
	const BRIGHTNESS_THROTTLE_MS = 250;
	const INTERACT_COOLDOWN_MS = 1500;

	function noteInteract() {
		interacting = true;
		if (interactingTimer) clearTimeout(interactingTimer);
		interactingTimer = setTimeout(() => {
			interactingTimer = null;
			interacting = false;
		}, INTERACT_COOLDOWN_MS);
	}

	const isSensor = $derived(device.type === "sensor");
	const hasBrightness = $derived(device.state?.brightness != null);
	const actionValues = $derived(
		device.capabilities.find((c) => c.name === "action")?.values ?? [],
	);
	const hasActions = $derived(actionValues.length > 0);
	const sensorReadings = $derived(
		isSensor ? aggregateSensorReadings([device], me.user?.temperatureUnit ?? "celsius") : [],
	);
	const tintDevice = $derived(
		device.state?.brightness != null
			? { ...device, state: { ...device.state, brightness: localBrightness } }
			: device,
	);
	const tintColor = $derived(deviceTintBase(tintDevice));
	const tintStrength = $derived.by(() => {
		if (!device.state?.on) return 0;
		return hasBrightness ? brightnessToTintStrength(localBrightness) : 1;
	});
	const cardStyle = $derived(
		tintColor ? `--tint-color: ${tintColor}; --tint-strength: ${tintStrength}` : "",
	);
	const mutedTextClass = $derived(
		tintColor && device.state?.on ? "text-foreground/70" : "text-muted-foreground",
	);

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

	$effect(() => {
		if (!brightnessTrailingTimer && !interacting && device.state?.brightness != null) {
			localBrightness = device.state.on ? device.state.brightness : 0;
		}
	});

	function sendBrightness(val: number) {
		const input: { on?: true; brightness: number } = { brightness: val };
		if (!device.state?.on) input.on = true;
		void client.mutation(SET_DEVICE_STATE, { deviceId: device.id, state: input }).toPromise();
	}

	function handleBrightnessChange(val: number) {
		localBrightness = val;
		noteInteract();
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

	const hasSensorReading = $derived(sensorReadings.length > 0);
</script>

<Card
	size="sm"
	class="h-full min-h-28 transition-all hover:shadow-card-hover {tintColor ? 'tint-1' : ''}"
	style={cardStyle}
>
	<CardHeader>
		<div class="flex items-center justify-between gap-2">
			<div class="flex min-w-0 flex-1 items-center gap-2">
				<IconCell
					value={device.icon}
					onselect={(icon) => oniconchange(device.id, icon)}
					fallback={deviceIcon(device.type)}
					size="sm"
					iconClass="size-4 {mutedTextClass}"
				/>
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
		{#if hasSensorReading}
			<SensorHistoryPopover
				target={{ kind: "device", id: device.id }}
				title={device.name}
				align="end"
				triggerClass="group block w-full rounded focus-visible:outline-none"
			>
				<div class="flex items-center justify-end gap-3 text-sm tabular-nums">
					{#each sensorReadings as r (r.label)}
						<span class="flex items-center gap-1 {mutedTextClass} transition-colors group-hover:text-foreground group-focus-visible:text-foreground">
							<r.icon class="size-4" />
							<span class="text-foreground">{r.value}</span>
							<span class="ml-0.5 text-xs">{r.unit}</span>
						</span>
					{/each}
				</div>
			</SensorHistoryPopover>
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
							disabled={!device.available}
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
