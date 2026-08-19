<script lang="ts">
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
	import HiveChip from "$lib/components/hive-chip.svelte";
	import { deviceIcon, sentenceCase, deviceDisplayName } from "$lib/utils";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import LazyTooltip from "$lib/components/lazy-tooltip.svelte";
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
	import {
		Ban,
		CircleCheck,
		EllipsisVertical,
		MousePointerClick,
		Pencil,
		Plus,
	} from "@lucide/svelte";

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
		ontoggleenabled: (device: Device) => void;
		/** Set from the list's mount-time snapshot, so the chip does not vanish mid-visit. */
		isNew?: boolean;
	}

	let {
		device,
		roomChips = [],
		groupChips = [],
		onrename,
		oniconchange,
		onAddTo,
		ontoggleenabled,
		isNew = false,
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

	// Disabled and offline both mean the card is not actionable right now, so
	// they share one muted treatment. The Ban icon and the offline dot say which.
	const muted = $derived(device.disabled || !device.available);

	const isSensor = $derived(device.type === "sensor");
	const hasBrightness = $derived(device.state?.brightness != null);
	const actionValues = $derived(
		device.capabilities.find((c) => c.name === "action")?.values ?? [],
	);
	const hasActions = $derived(actionValues.length > 0);

	// Closed bits-ui menus still mount their portals, so a grid of cards pays
	// for every menu nobody has opened. Both menus here are click-activated:
	// dormant is an identical-looking plain button, and the first click mounts
	// the real menu already open. Closing works normally from there — the
	// menu's own dismiss layer exists once it is mounted.
	let eventMenuArmed = $state(false);
	let eventMenuOpen = $state(false);
	let actionsMenuArmed = $state(false);
	let actionsMenuOpen = $state(false);

	function openEventMenu() {
		eventMenuArmed = true;
		eventMenuOpen = true;
	}

	function openActionsMenu() {
		actionsMenuArmed = true;
		actionsMenuOpen = true;
	}
	const sensorReadings = $derived(
		isSensor
			? aggregateSensorReadings([device], me.user?.temperatureUnit ?? "celsius", {
					includeGeneralContact: true,
				})
			: [],
	);
	const tintDevice = $derived(
		device.state?.brightness != null
			? { ...device, state: { ...device.state, brightness: localBrightness } }
			: device,
	);
	const tintColor = $derived(device.disabled ? null : deviceTintBase(tintDevice));
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
	class="h-full min-h-28 transition-all {isNew ? 'ring-new' : 'hover:shadow-card-hover'} {tintColor
		? 'tint-1'
		: ''} {muted ? 'opacity-60' : ''}"
	style={cardStyle}
>
	<CardHeader>
		<div class="flex items-center justify-between gap-2">
			<div class="flex min-w-0 flex-1 items-center gap-2">
				<IconCell
					value={device.icon}
					onselect={(icon) => oniconchange(device.id, icon)}
					fallback={deviceIcon(device.type, device.roles.contact)}
					size="sm"
					iconClass="size-4 {mutedTextClass}"
				/>
				<InlineEditName name={deviceDisplayName(device)} onsave={(newName) => onrename(device.id, newName)} />
				{#if device.disabled}
					<Ban
						class="size-3.5 shrink-0 text-muted-foreground"
						title="Disabled"
						aria-label="Disabled"
					/>
				{:else if !device.available}
					<HiveChip type="offline" label="Offline" />
				{/if}
			</div>
			<div class="flex shrink-0 items-center gap-1">
				{#if !device.disabled}
					<DeviceQuickControls {device} />
				{/if}
				{#if hasActions && !device.disabled}
					{#if !eventMenuArmed}
						<LazyTooltip content="Trigger event">
							{#snippet children(props)}
								{@render eventButton({ ...props, onclick: openEventMenu })}
							{/snippet}
						</LazyTooltip>
					{:else}
						<LazyTooltip content="Trigger event">
							{#snippet children(props)}
								<span {...props} class="inline-flex">
									<DropdownMenu bind:open={eventMenuOpen}>
										<DropdownMenuTrigger class="inline-flex h-8 items-center">
											{@render eventButton({})}
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" class="max-h-80 overflow-y-auto">
											{#each actionValues as action (action)}
												<DropdownMenuItem onclick={() => handleActionClick(action)}>
													{sentenceCase(action)}
												</DropdownMenuItem>
											{/each}
										</DropdownMenuContent>
									</DropdownMenu>
								</span>
							{/snippet}
						</LazyTooltip>
					{/if}
				{/if}
				{#if !actionsMenuArmed}
					{@render actionsButton({ onclick: openActionsMenu })}
				{:else}
				<DropdownMenu bind:open={actionsMenuOpen}>
					<DropdownMenuTrigger class="inline-flex h-8 items-center">
						{@render actionsButton({})}
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem>
							{#snippet child({ props })}
								<a href={`/devices/${device.id}`} {...props}>
									<Pencil class="size-4" />
									Edit
								</a>
							{/snippet}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onclick={() => onAddTo(device)}>
							<Plus class="size-4" />
							Add to
						</DropdownMenuItem>
						<DropdownMenuItem onclick={() => ontoggleenabled(device)}>
							{#if device.disabled}
								<CircleCheck class="size-4" />
								Enable
							{:else}
								<Ban class="size-4" />
								Disable
							{/if}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				{/if}
			</div>
		</div>
		{#if roomChips.length > 0 || groupChips.length > 0}
			<div class="flex flex-wrap gap-x-2 text-xs {mutedTextClass}">
				{#each roomChips as chip (chip.id)}
					<a href={`/rooms?edit=${chip.id}`} class="cursor-default transition-colors hover:text-foreground">
						{chip.name}
					</a>
				{/each}
				{#each groupChips as chip (chip.id)}
					<a href={`/groups?edit=${chip.id}`} class="cursor-default transition-colors hover:text-foreground">
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
				title={deviceDisplayName(device)}
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
		{:else if hasBrightness}
			<Slider
				type="single"
				value={localBrightness}
				min={0}
				max={254}
				step={1}
				onValueChange={handleBrightnessChange}
				disabled={!device.available || device.disabled}
				aria-label={`${device.name} brightness`}
			/>
		{/if}
	</CardContent>
</Card>

{#snippet eventButton(props: Record<string, unknown>)}
	<Button {...props} variant="ghost" size="icon-sm" aria-label={`Trigger ${device.name} event`}>
		<MousePointerClick class="size-4" />
	</Button>
{/snippet}

{#snippet actionsButton(props: Record<string, unknown>)}
	<Button {...props} variant="ghost" size="icon-sm" aria-label="Device actions">
		<EllipsisVertical class="size-4" />
	</Button>
{/snippet}
