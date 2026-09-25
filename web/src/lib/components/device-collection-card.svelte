<script lang="ts" generics="T extends { id: string; name?: string | null; friendlyName?: string | null; icon?: string | null }">
	import { onDestroy, type Component } from "svelte";
	import { controlIntents } from "$lib/stores/control-intents.svelte";
	import { isLightControlDevice, isRuntimeEnabledDevice, type Device } from "$lib/stores/devices";
	import EntityCard from "$lib/components/entity-card.svelte";
	import BulkBrightnessSlider from "$lib/components/bulk-brightness-slider.svelte";
	import LightColorPicker from "$lib/components/light-color-picker.svelte";
	import SensorHistoryPopover, {
		type SensorPopoverTarget,
	} from "$lib/components/sensor-history-popover.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import {
		aggregateSensorReadings,
		aggregateLightAppearance,
		lightTintTransitionSeconds,
	} from "$lib/device-tint";
	import { throttle, flushThrottle, type Throttle } from "$lib/throttle";
	import { me } from "$lib/stores/me.svelte";
	import { contactCollectionSummary } from "$lib/device-collection-summary";
	import { Palette } from "@lucide/svelte";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import { entityDisplayName, groupDisplayName } from "$lib/utils";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		entity: T;
		entityType: "room" | "group";
		devices: Device[];
		fallbackIcon: Component;
		subtitle?: string;
		stateSummary?: boolean;
		onrename?: (entity: T, newName: string) => void;
		oniconchange?: (entity: T, icon: string | null) => void;
		editHref?: string;
		ondelete?: (entity: T) => void;
		onAddTo?: (entity: T) => void;
		onbrightness?: (val: number) => void;
		ontoggle?: (on: boolean) => void;
		oncolor?: (color: { r: number; g: number; b: number }) => void;
		ontemp?: (mired: number) => void;
		addLabel?: string;
		aggregateTarget?: SensorPopoverTarget;
		source?: string;
	}

	let {
		entity,
		entityType,
		devices: allDevices,
		fallbackIcon,
		subtitle,
		stateSummary = false,
		onrename,
		oniconchange,
		editHref,
		ondelete,
		onAddTo,
		onbrightness,
		ontoggle,
		oncolor,
		ontemp,
		addLabel,
		aggregateTarget,
		source,
	}: Props = $props();

	// A room or group card aggregates and commands only its enabled members; the
	// disabled ones stay visible on their own detail page instead.
	const devices = $derived(allDevices.filter(isRuntimeEnabledDevice));
	const displayName = $derived(
		entityType === "group" ? groupDisplayName(entity) : entityDisplayName("room", entity),
	);

	let preview = $state<number | undefined>(undefined);
	let userTouched = $state(false);
	let previewTimer: ReturnType<typeof setTimeout> | null = null;

	const hasLights = $derived(
		devices.some((d) => d.type === "light" && d.state?.brightness != null),
	);
	const sensors = $derived(devices.filter((d) => d.type === "sensor"));
	const sensorReadings = $derived(
		aggregateSensorReadings(sensors, me.user?.temperatureUnit ?? "celsius").filter(
			(reading) => !stateSummary || reading.field !== "contact",
		),
	);
	const hasSensors = $derived(sensorReadings.length > 0);
	const sensorFields = $derived(sensorReadings.map((r) => r.field));

	const onOffDevices = $derived(devices.filter(isLightControlDevice));
	const hasOnOff = $derived(onOffDevices.length > 0);
	const isOn = $derived(controlIntents.devices(onOffDevices).some((d) => d.state?.on));

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

	const effectiveDevices = $derived(controlIntents.devices(devices));

	const resolvedSubtitle = $derived(
		stateSummary ? contactCollectionSummary(effectiveDevices) : subtitle,
	);

	function handleToggle(on: boolean) {
		userTouched = false;
		ontoggle?.(on);
	}

	function handleSliderInteract() {
		userTouched = true;
		if (previewTimer) clearTimeout(previewTimer);
		previewTimer = setTimeout(() => {
			previewTimer = null;
			userTouched = false;
		}, 1500);
	}

	const appearance = $derived(aggregateLightAppearance(effectiveDevices,
		userTouched && preview !== undefined ? { brightnessPreview: preview } : {},
	));
	const tintColors = $derived(appearance.colors);
	const tintStrength = $derived(appearance.tintStrength);
	const tintTransitionSeconds = $derived(lightTintTransitionSeconds(effectiveDevices));

	const colorThrottle: Throttle = { lastSent: 0, trailing: null };
	const tempThrottle: Throttle = { lastSent: 0, trailing: null };
	$effect(() => {
		if (!controlIntents.has(devices, "power")) return;
		userTouched = false;
		flushThrottle(colorThrottle);
		flushThrottle(tempThrottle);
	});
	onDestroy(() => {
		if (previewTimer) clearTimeout(previewTimer);
		flushThrottle(colorThrottle);
		flushThrottle(tempThrottle);
	});

	function handleColor(c: { r: number; g: number; b: number }) {
		throttle(colorThrottle, () => oncolor?.(c));
	}

	function handleTemp(mired: number) {
		throttle(tempThrottle, () => ontemp?.(mired));
	}
</script>

<EntityCard
	{entity}
	{entityType}
	{fallbackIcon}
	subtitle={resolvedSubtitle}
	tintColors={tintColors.length > 0 ? tintColors : null}
	{tintStrength}
	{tintTransitionSeconds}
	{editHref}
	{ondelete}
	{onrename}
	{oniconchange}
	{onAddTo}
	{addLabel}
	class="h-full min-h-28"
>
	{#snippet leadingActions()}
		{#if hasOnOff}
			<Switch
				checked={isOn}
				onCheckedChange={handleToggle}
				aria-label={m.device_toggle_named({ name: displayName }, locale.messageOptions())}
			/>
		{/if}
		{#if hasPicker}
			<Popover>
				<PopoverTrigger class="inline-flex h-8 items-center">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={m.device_adjust_named({ name: displayName }, locale.messageOptions())}
					>
						<Palette class="size-4" />
					</Button>
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
		{#if hasLights || hasSensors || source}
			<div class="mt-auto flex flex-col gap-2 pt-3">
				{#if source}
					<div><HiveChip type={source === "zigbee2mqtt" ? "hub" : "group"} label={source === "zigbee2mqtt" ? "Zigbee" : "Hive"} /></div>
				{/if}
				{#if hasSensors}
					{#if aggregateTarget}
						<div class="flex justify-end">
							<SensorHistoryPopover
								target={aggregateTarget}
								fields={sensorFields}
								title={displayName}
								align="end"
								triggerClass="group rounded focus-visible:outline-none"
							>
								<div class="flex items-center gap-3 text-sm tabular-nums">
									{#each sensorReadings as r (r.label)}
										<span class="flex items-center gap-1 text-muted-foreground transition-colors group-hover:text-foreground group-focus-visible:text-foreground">
											<r.icon class="size-4" />
											<span class="text-foreground"
												>{r.value}<span class="ml-0.5 text-xs">{r.unit}</span></span
											>
										</span>
									{/each}
								</div>
							</SensorHistoryPopover>
						</div>
					{:else}
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
				{/if}
				{#if hasLights}
					<BulkBrightnessSlider
						{devices}
						bind:value={preview}
						oninteract={handleSliderInteract}
						{onbrightness}
					/>
				{/if}
			</div>
		{/if}
	{/snippet}
</EntityCard>
