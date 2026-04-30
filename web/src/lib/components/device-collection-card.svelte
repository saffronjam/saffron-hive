<script lang="ts" generics="T extends { id: string; name: string; icon?: string | null }">
	import type { Component } from "svelte";
	import type { Device } from "$lib/stores/devices";
	import EntityCard from "$lib/components/entity-card.svelte";
	import BulkBrightnessSlider from "$lib/components/bulk-brightness-slider.svelte";
	import LightColorPicker from "$lib/components/light-color-picker.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import {
		aggregateSensorReadings,
		brightnessToTintStrength,
		groupBaseTintColors,
	} from "$lib/device-tint";
	import { throttle, type Throttle } from "$lib/throttle";
	import { Palette } from "@lucide/svelte";

	interface Props {
		entity: T;
		devices: Device[];
		fallbackIcon: Component;
		subtitle?: string;
		onrename?: (entity: T, newName: string) => void;
		oniconchange?: (entity: T, icon: string | null) => void;
		onedit?: (entity: T) => void;
		ondelete?: (entity: T) => void;
		onAddTo?: (entity: T) => void;
		onbrightness?: (val: number) => void;
		ontoggle?: (on: boolean) => void;
		oncolor?: (color: { r: number; g: number; b: number }) => void;
		ontemp?: (mired: number) => void;
		addLabel?: string;
	}

	let {
		entity,
		devices,
		fallbackIcon,
		subtitle,
		onrename,
		oniconchange,
		onedit,
		ondelete,
		onAddTo,
		onbrightness,
		ontoggle,
		oncolor,
		ontemp,
		addLabel,
	}: Props = $props();

	let preview = $state<number | undefined>(undefined);
	let userTouched = $state(false);
	// Optimistic toggle intent. Set the moment the user clicks the Switch so
	// the card/slider/tint repaint immediately, before the zigbee echo lands.
	// Cleared by an effect below once the live state confirms the intent.
	let togglePending = $state<"on" | "off" | null>(null);

	const hasLights = $derived(
		devices.some((d) => d.type === "light" && d.state?.brightness != null),
	);
	const sensors = $derived(devices.filter((d) => d.type === "sensor"));
	const sensorReadings = $derived(aggregateSensorReadings(sensors));
	const hasSensors = $derived(sensorReadings.length > 0);

	const onOffDevices = $derived(
		devices.filter((d) => d.capabilities.some((c) => c.name === "on_off")),
	);
	const hasOnOff = $derived(onOffDevices.length > 0);
	const isOn = $derived.by(() => {
		if (togglePending === "off") return false;
		if (togglePending === "on") return true;
		return onOffDevices.some((d) => d.state?.on);
	});

	const hasColor = $derived(
		devices.some((d) => d.capabilities.some((c) => c.name === "color")),
	);
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

	const effectiveDevices = $derived.by((): Device[] => {
		if (togglePending === null && (!userTouched || preview === undefined)) return devices;
		return devices.map((d) => {
			const isOnOffCap = d.capabilities.some((c) => c.name === "on_off");
			const isDimmable = d.type === "light" && d.state?.brightness != null;
			if (!isOnOffCap && !isDimmable) return d;
			let on: boolean = d.state?.on ?? false;
			let brightness: number | null | undefined = d.state?.brightness ?? null;
			if (togglePending === "off" && isOnOffCap) on = false;
			else if (togglePending === "on" && isOnOffCap) on = true;
			if (userTouched && preview !== undefined && isDimmable) {
				brightness = preview;
				on = true;
			}
			if (on === (d.state?.on ?? false) && brightness === (d.state?.brightness ?? null)) {
				return d;
			}
			return { ...d, state: { ...d.state, on, brightness } } as Device;
		});
	});

	$effect(() => {
		if (togglePending === "off") {
			const stillOn = onOffDevices.some((d) => d.state?.on);
			if (!stillOn) togglePending = null;
		} else if (togglePending === "on") {
			const anyOn = onOffDevices.some((d) => d.state?.on);
			if (anyOn) togglePending = null;
		}
	});

	function handleToggle(on: boolean) {
		togglePending = on ? "on" : "off";
		// Drop any active slider override; its `on: true` would otherwise
		// fight the toggle-off intent and keep the card looking lit.
		userTouched = false;
		ontoggle?.(on);
	}

	function handleSliderInteract() {
		userTouched = true;
		// Slider intent supersedes a pending toggle: dragging means "drive
		// to this brightness", not "stay at the previous toggle state".
		togglePending = null;
	}

	const tintColors = $derived(groupBaseTintColors(effectiveDevices));

	const tintStrength = $derived.by((): number => {
		const onLights = effectiveDevices.filter(
			(d) => d.type === "light" && d.state?.on && d.state?.brightness != null,
		);
		if (onLights.length === 0) return 0;
		let sum = 0;
		for (const d of onLights) sum += d.state!.brightness!;
		return brightnessToTintStrength(sum / onLights.length);
	});

	const colorThrottle: Throttle = { lastSent: 0, trailing: null };
	const tempThrottle: Throttle = { lastSent: 0, trailing: null };

	function handleColor(c: { r: number; g: number; b: number }) {
		throttle(colorThrottle, () => oncolor?.(c));
	}

	function handleTemp(mired: number) {
		throttle(tempThrottle, () => ontemp?.(mired));
	}
</script>

<EntityCard
	{entity}
	{fallbackIcon}
	{subtitle}
	tintColors={tintColors.length > 0 ? tintColors : null}
	{tintStrength}
	{onedit}
	{ondelete}
	{onrename}
	{oniconchange}
	{onAddTo}
	{addLabel}
	class="h-full min-h-28"
>
	{#snippet leadingActions()}
		{#if hasOnOff}
			<Tooltip>
				<TooltipTrigger class="inline-flex h-8 items-center">
					<Switch
						checked={isOn}
						onCheckedChange={handleToggle}
						aria-label={`Toggle ${entity.name}`}
					/>
				</TooltipTrigger>
				<TooltipContent>{isOn ? "Turn off" : "Turn on"}</TooltipContent>
			</Tooltip>
		{/if}
		{#if hasPicker}
			<Popover>
				<PopoverTrigger class="inline-flex h-8 items-center">
					<Tooltip>
						<TooltipTrigger class="inline-flex h-8 items-center">
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={`Adjust ${entity.name}`}
							>
								<Palette class="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Adjust</TooltipContent>
					</Tooltip>
				</PopoverTrigger>
				<PopoverContent class="w-72 p-3" align="end">
					<LightColorPicker
						color={aggregatedColor}
						colorTemp={aggregatedTemp}
						{hasColor}
						{hasColorTemp}
						hasBrightness={false}
						oncolorchange={handleColor}
						ontempchange={handleTemp}
					/>
				</PopoverContent>
			</Popover>
		{/if}
	{/snippet}
	{#snippet footer()}
		{#if hasLights || hasSensors}
			<div class="mt-auto flex flex-col gap-2 pt-3">
				{#if hasSensors}
					<div class="flex items-center justify-end gap-3 text-sm tabular-nums">
						{#each sensorReadings as r (r.label)}
							<span class="flex items-center gap-1 text-muted-foreground">
								<r.icon class="size-4" />
								<span class="text-foreground"
									>{r.value}<span class="ml-0.5 text-xs">{r.unit}</span></span
								>
							</span>
						{/each}
					</div>
				{/if}
				{#if hasLights}
					<BulkBrightnessSlider
						devices={effectiveDevices}
						bind:value={preview}
						oninteract={handleSliderInteract}
						{onbrightness}
					/>
				{/if}
			</div>
		{/if}
	{/snippet}
</EntityCard>
