<script lang="ts">
	import type { Component } from "svelte";
	import { deviceDisplayName } from "$lib/utils";
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
	import { aggregateLightAppearance, lightTintTransitionSeconds, rememberedLightPalette } from "$lib/device-tint";
	import { isLightControlDevice, type Device } from "$lib/stores/devices";
	import { type Client } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { commitGroupBrightness, commitGroupColor, commitGroupTemp, commitGroupToggle } from "$lib/group-commands";
	import { haptics } from "$lib/stores/haptics.svelte";
	import { CommandTargetType } from "$lib/gql/graphql";

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
			setTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)
		}
	`);

	const sortedDevices = $derived(
		[...devices].sort((a, b) => deviceDisplayName(a).localeCompare(deviceDisplayName(b))),
	);
	const onOffDevices = $derived(
		devices.filter((d) => d.capabilities.some((c) => c.name === "on_off")),
	);
	const isOn = $derived(onOffDevices.some((d) => d.state?.on));

	const dimmableLights = $derived(
		devices.filter((d) => d.type === "light" && d.state?.brightness != null),
	);
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
	const appearance = $derived(
		aggregateLightAppearance(
			devices,
			previewBrightness == null ? {} : { brightnessPreview: previewBrightness },
		),
	);
	const tintColors = $derived(appearance.colors);
	const inactiveTintColors = $derived(rememberedLightPalette(devices));
	const tintStrength = $derived(appearance.tintStrength);
	const tintTransitionSeconds = $derived(lightTintTransitionSeconds(devices));

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

	const brightnessFill = $derived(appearance.hasDimmable ? appearance.outputRatio : null);
	const brightnessActive = $derived(appearance.active);

	const brightnessThrottle: Throttle = { lastSent: 0, trailing: null };

	const dragOpts = $derived({
		initial: () => (isOn ? avgBrightness : 0),
		onpreview: (v: number) => {
			previewBrightness = v;
			throttle(brightnessThrottle, () =>
				commitGroupBrightness(client, devices, v, isGroup ? { targetType: CommandTargetType.Group, targetId: entity.id } : undefined),
			);
		},
		oncommit: (v: number) => {
			flushThrottle(brightnessThrottle);
			commitGroupBrightness(client, devices, v, isGroup ? { targetType: CommandTargetType.Group, targetId: entity.id } : undefined);
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
		throttle(colorThrottle, () => commitGroupColor(client, devices, c, isGroup ? { targetType: CommandTargetType.Group, targetId: entity.id } : undefined));
	}
	function handleTempChange(mired: number) {
		throttle(tempThrottle, () => commitGroupTemp(client, devices, mired, isGroup ? { targetType: CommandTargetType.Group, targetId: entity.id } : undefined));
	}

	async function handleToggle(_entity: typeof entity, event: MouseEvent | KeyboardEvent) {
		if (popoverDismissedRecently()) return;
		haptics.play("selection", event);
		const next = !isOn;
		if (isGroup) {
			await commitGroupToggle(client, devices, next, { targetType: CommandTargetType.Group, targetId: entity.id });
		} else {
			await Promise.all(
				onOffDevices.map((d) =>
					client.mutation(SET_DEVICE_STATE, { deviceId: d.id, state: { on: next } }).toPromise(),
				),
			);
		}
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
	inactiveTintColors={inactiveTintColors.length > 0 ? inactiveTintColors : null}
	{tintStrength}
	{tintTransitionSeconds}
	tintInactive={!brightnessActive}
	{brightnessFill}
	{dragOpts}
	readOnly
	size="sm"
	pressFeedback
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
									class="relative flex size-7 shrink-0 items-center justify-center rounded-icon bg-muted/50 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
								aria-label={`Adjust ${entity.name} colour`}
							>
								{#if hasTint}
									<div
										class="pointer-events-none absolute inset-0 rounded-icon transition-opacity duration-300 ease-out"
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
			<div class="relative flex size-7 shrink-0 items-center justify-center rounded-icon bg-muted/50">
				{#if hasTint}
					<div
						class="pointer-events-none absolute inset-0 rounded-icon transition-opacity duration-300 ease-out"
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
							entity={{ id: d.id, name: deviceDisplayName(d), icon: null }}
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
