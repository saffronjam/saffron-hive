<script lang="ts">
	import type { Component } from "svelte";
	import EntityCard from "$lib/components/entity-card.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import LightColorPicker from "$lib/components/light-color-picker.svelte";
	import DashboardLightCard from "$lib/components/dashboard-light-card.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { Lightbulb, Maximize2 } from "@lucide/svelte";
	import { throttle, flushThrottle, type Throttle } from "$lib/throttle";
	import { markPopoverDismissed, popoverDismissedRecently } from "$lib/popover-guard";
	import { onDestroy } from "svelte";
	import {
		groupBaseTintColors,
		brightnessToTintStrength,
		PLUG_TINT_COLOR,
	} from "$lib/device-tint";
	import type { Device } from "$lib/stores/devices";
	import { type Client } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { commitGroupBrightness, commitGroupColor, commitGroupTemp } from "$lib/group-commands";

	interface Entity {
		id: string;
		name: string;
		icon?: string | null;
	}

	interface Props {
		entity: Entity;
		devices: Device[];
		isGroup: boolean;
		fallbackIcon?: Component;
		client: Client;
		class?: string;
	}

	let { entity, devices, isGroup, fallbackIcon, client, class: extraClass = "" }: Props = $props();

	const FallbackIcon = $derived(fallbackIcon ?? Lightbulb);

	const SET_DEVICE_STATE = graphql(`
		mutation DashboardLightCardSetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
			setDeviceState(deviceId: $deviceId, state: $state) {
				id
				state {
					on
					brightness
				}
			}
		}
	`);

	const sortedDevices = $derived(
		[...devices].sort((a, b) => a.name.localeCompare(b.name)),
	);
	const onOffDevices = $derived(
		devices.filter((d) => d.capabilities.some((c) => c.name === "on_off")),
	);
	const isOn = $derived(onOffDevices.some((d) => d.state?.on));

	const dimmableLights = $derived(
		devices.filter((d) => d.type === "light" && d.state?.brightness != null),
	);
	const isPlugOnly = $derived(
		dimmableLights.length === 0 && onOffDevices.length > 0,
	);

	const tintColors = $derived.by(() => {
		const base = groupBaseTintColors(devices);
		if (base.length > 0) return base;
		if (isPlugOnly) return [PLUG_TINT_COLOR];
		return [];
	});
	const tintStrength = $derived.by(() => {
		if (isPlugOnly) return 1;
		const lit = devices.filter(
			(d) => d.type === "light" && d.state?.on && d.state?.brightness != null,
		);
		if (lit.length === 0) return 0;
		let sum = 0;
		for (const d of lit) sum += d.state!.brightness!;
		return brightnessToTintStrength(sum / lit.length);
	});
	const onLights = $derived(dimmableLights.filter((d) => d.state?.on));
	const avgBrightness = $derived.by((): number => {
		if (onLights.length === 0) return 0;
		let sum = 0;
		for (const d of onLights) sum += d.state!.brightness!;
		return sum / onLights.length;
	});

	let previewBrightness = $state<number | null>(null);
	let interactingTimer: ReturnType<typeof setTimeout> | null = null;
	const INTERACT_COOLDOWN_MS = 1500;

	function noteInteract() {
		if (interactingTimer) clearTimeout(interactingTimer);
		interactingTimer = setTimeout(() => {
			interactingTimer = null;
			previewBrightness = null;
		}, INTERACT_COOLDOWN_MS);
	}
	onDestroy(() => {
		if (interactingTimer) clearTimeout(interactingTimer);
	});

	const effectiveBrightness = $derived(previewBrightness ?? (isOn ? avgBrightness : 0));
	const brightnessFill = $derived(
		dimmableLights.length === 0 ? null : effectiveBrightness / 254,
	);
	const brightnessActive = $derived(
		previewBrightness != null ? previewBrightness > 0 : isOn,
	);

	const brightnessThrottle: Throttle = { lastSent: 0, trailing: null };

	const dragOpts = $derived({
		initial: () => (isOn ? avgBrightness : 0),
		onpreview: (v: number) => {
			previewBrightness = v;
			throttle(brightnessThrottle, () =>
				commitGroupBrightness(client, dimmableLights, v),
			);
		},
		oncommit: (v: number) => {
			flushThrottle(brightnessThrottle);
			commitGroupBrightness(client, dimmableLights, v);
			previewBrightness = v;
			noteInteract();
		},
		enabled: () => dimmableLights.length > 0,
	});

	const subtitle = $derived(isOn ? "On" : "Off");

	const hasColor = $derived(devices.some((d) => d.capabilities.some((c) => c.name === "color")));
	const hasColorTemp = $derived(
		devices.some((d) => d.capabilities.some((c) => c.name === "color_temp")),
	);
	const hasPicker = $derived(hasColor || hasColorTemp);

	const aggregatedColor = $derived.by((): { r: number; g: number; b: number } | null => {
		const onWithColor = devices.find((d) => d.state?.on && d.state?.color);
		if (!onWithColor?.state?.color) return null;
		const c = onWithColor.state.color;
		return { r: c.r, g: c.g, b: c.b };
	});

	const aggregatedTemp = $derived.by((): number | null => {
		const onWithTemp = devices.find((d) => d.state?.on && d.state?.colorTemp != null);
		return onWithTemp?.state?.colorTemp ?? null;
	});

	let pickerOpen = $state(false);

	const colorThrottle: Throttle = { lastSent: 0, trailing: null };
	const tempThrottle: Throttle = { lastSent: 0, trailing: null };

	function handleColorChange(c: { r: number; g: number; b: number }) {
		throttle(colorThrottle, () => commitGroupColor(client, devices, c));
	}
	function handleTempChange(mired: number) {
		throttle(tempThrottle, () => commitGroupTemp(client, devices, mired));
	}

	async function handleToggle() {
		if (popoverDismissedRecently()) return;
		const next = !isOn;
		await Promise.all(
			onOffDevices.map((d) =>
				client.mutation(SET_DEVICE_STATE, { deviceId: d.id, state: { on: next } }).toPromise(),
			),
		);
	}

	let popoverOpen = $state(false);

	function onPopoverChange(open: boolean) {
		if (!open) markPopoverDismissed();
	}
</script>

<EntityCard
	{entity}
	fallbackIcon={FallbackIcon}
	{subtitle}
	tintColors={tintColors.length > 0 ? tintColors : null}
	{tintStrength}
	tintInactive={!brightnessActive}
	{brightnessFill}
	{dragOpts}
	readOnly
	size="sm"
	onclick={handleToggle}
	class={extraClass}
>
	{#snippet iconArea({ iconGradient, iconTextClass, hasTint, tintInactive: ti })}
		{#if hasPicker}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<span onclick={(e: MouseEvent) => e.stopPropagation()} class="shrink-0">
				<Popover bind:open={pickerOpen} onOpenChange={onPopoverChange}>
					<PopoverTrigger>
						{#snippet child({ props })}
							<button
								type="button"
								{...props}
								class="relative flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/50 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
								aria-label={`Adjust ${entity.name} colour`}
							>
								{#if hasTint}
									<div
										class="pointer-events-none absolute inset-0 rounded-md transition-opacity duration-300 ease-out"
										style="background: {iconGradient}; opacity: {ti === true ? 1 : 0}"
										aria-hidden="true"
									></div>
								{/if}
								<AnimatedIcon icon={entity.icon} class="relative size-3.5 {iconTextClass}">
									{#snippet fallback()}
										<FallbackIcon class="relative size-3.5 {iconTextClass}" />
									{/snippet}
								</AnimatedIcon>
							</button>
						{/snippet}
					</PopoverTrigger>
					<PopoverContent class="w-72 p-3" align="start">
						<LightColorPicker
							color={aggregatedColor}
							colorTemp={aggregatedTemp}
							{hasColor}
							{hasColorTemp}
							hasBrightness={false}
							oncolorchange={handleColorChange}
							ontempchange={handleTempChange}
						/>
					</PopoverContent>
				</Popover>
			</span>
		{:else}
			<div class="relative flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/50">
				{#if hasTint}
					<div
						class="pointer-events-none absolute inset-0 rounded-md transition-opacity duration-300 ease-out"
						style="background: {iconGradient}; opacity: {ti === true ? 1 : 0}"
						aria-hidden="true"
					></div>
				{/if}
				<AnimatedIcon icon={entity.icon} class="relative size-3.5 {iconTextClass}">
					{#snippet fallback()}
						<FallbackIcon class="relative size-3.5 {iconTextClass}" />
					{/snippet}
				</AnimatedIcon>
			</div>
		{/if}
	{/snippet}
	{#snippet leadingActions()}
		{#if isGroup && devices.length > 1}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<span onclick={(e: MouseEvent) => e.stopPropagation()}>
				<Popover bind:open={popoverOpen} onOpenChange={onPopoverChange}>
					<PopoverTrigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="ghost"
								size="icon-sm"
								aria-label={`Show ${entity.name} members`}
							>
								<Maximize2 class="size-4" />
							</Button>
						{/snippet}
					</PopoverTrigger>
				<PopoverContent class="w-80 space-y-2 p-3" align="end">
					{#each sortedDevices as d (d.id)}
						<DashboardLightCard
							entity={{ id: d.id, name: d.name, icon: null }}
							devices={[d]}
							isGroup={false}
							{client}
							class="p-2"
						/>
					{/each}
				</PopoverContent>
				</Popover>
			</span>
		{/if}
	{/snippet}
</EntityCard>
