<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import type { Device, DeviceState } from "$lib/gql/graphql";
	import HiveIcon from "$lib/components/hive-icon.svelte";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import LightColorPicker from "$lib/components/light-color-picker.svelte";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { deviceHasCapability, isLightControlDevice } from "$lib/stores/devices";
	import { me } from "$lib/stores/me.svelte";
	import {
		aggregateSensorReadings,
		brightnessToTintStrength,
		deviceTintBase,
		tintCardBg,
	} from "$lib/device-tint";
	import {
		commitGroupBrightness,
		commitGroupColor,
		commitGroupTemp,
	} from "$lib/group-commands";
	import { markPopoverDismissed } from "$lib/popover-guard";
	import { flushThrottle, throttle, type Throttle } from "$lib/throttle";
	import { deviceDisplayName } from "$lib/utils";
	import { m } from "$lib/i18n/messages";

	interface Props {
		device: Device;
		x: number;
		y: number;
		/** Screen pixels per world meter; the marker keeps a constant screen size. */
		pxPerM: number;
		selected?: boolean;
		/** Render as a translucent in-flight marker while being dragged in. */
		draft?: boolean;
		/** Live map mode: tinted disc, swatch popover, sensor chip; no editing. */
		live?: boolean;
		/** The armed brush cannot paint this device: muted and stroke-inert. */
		inert?: boolean;
		/** Whether a sensor shows its reading chip; connectivity hides it. */
		showReading?: boolean;
		/** Picker interaction feeds the page's preview map (anti-flicker). */
		onpreviewstate?: (partial: Partial<DeviceState>) => void;
	}

	let {
		device,
		x,
		y,
		pxPerM,
		selected = false,
		draft = false,
		live = false,
		inert = false,
		showReading = true,
		onpreviewstate,
	}: Props = $props();

	const client = getContextClient();

	const muted = $derived(device.disabled || !device.available);

	const tintBase = $derived(deviceTintBase(device));
	const tintStrength = $derived(
		device.state?.on
			? brightnessToTintStrength(device.state?.brightness ?? device.displayBrightness)
			: 0,
	);
	const discFill = $derived(
		live && tintBase && tintStrength > 0
			? tintCardBg(tintBase, Math.round(20 + 45 * tintStrength))
			: "var(--card)",
	);

	const hasColor = $derived(deviceHasCapability(device, "color"));
	const hasColorTemp = $derived(deviceHasCapability(device, "color_temp"));
	const hasSwatch = $derived(
		live && !draft && device.available && isLightControlDevice(device) && (hasColor || hasColorTemp),
	);

	const isSensor = $derived(device.type === "sensor");
	const reading = $derived(
		live && showReading && isSensor
			? (aggregateSensorReadings([device], me.user?.temperatureUnit ?? "celsius", {
					includeGeneralContact: true,
				})[0] ?? null)
			: null,
	);

	let pickerOpen = $state(false);
	const colorThrottle: Throttle = { lastSent: 0, trailing: null };
	const tempThrottle: Throttle = { lastSent: 0, trailing: null };
	const brightnessThrottle: Throttle = { lastSent: 0, trailing: null };

	function handleColorChange(c: { r: number; g: number; b: number }) {
		onpreviewstate?.({ color: { ...c, x: 0, y: 0 }, on: true });
		throttle(colorThrottle, () => commitGroupColor(client, [device], c));
	}
	function handleTempChange(mired: number) {
		onpreviewstate?.({ colorTemp: mired, color: null, on: true });
		throttle(tempThrottle, () => commitGroupTemp(client, [device], mired));
	}
	function handleBrightnessChange(v: number) {
		onpreviewstate?.({ brightness: v, on: v > 0 });
		throttle(brightnessThrottle, () => commitGroupBrightness(client, [device], v));
	}

	function onPickerChange(open: boolean) {
		if (!open) {
			markPopoverDismissed();
			flushThrottle(colorThrottle);
			flushThrottle(tempThrottle);
			flushThrottle(brightnessThrottle);
		}
	}
</script>

<g
	transform="translate({x} {y}) scale({1 / pxPerM})"
	data-plan-hit={draft ? undefined : "marker"}
	data-device-id={device.id}
	class="transition-opacity duration-200 {muted || inert ? 'opacity-60' : ''} {draft
		? 'opacity-70'
		: ''}"
>
	<circle
		r="14"
		style="fill: {discFill}; transition: fill 300ms ease"
		stroke={selected ? "var(--primary)" : "var(--border)"}
		stroke-width={selected ? 2 : 1}
	/>
	<foreignObject x="-8" y="-8" width="16" height="16" class="pointer-events-none">
		<div class="flex h-4 w-4 items-center justify-center text-foreground">
			<HiveIcon
				type={device.type}
				contactRole={device.roles.contact}
				iconOverride={device.icon}
				class="size-4"
			/>
		</div>
	</foreignObject>

	{#if hasSwatch}
		<foreignObject x="7" y="-21" width="18" height="18">
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				onpointerdown={(e: PointerEvent) => e.stopPropagation()}
				onpointerup={(e: PointerEvent) => e.stopPropagation()}
			>
				<Popover bind:open={pickerOpen} onOpenChange={onPickerChange}>
					<PopoverTrigger>
						{#snippet child({ props })}
							<button
								type="button"
								{...props}
								class="block size-3.5 rounded-full ring-1 ring-border outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring"
								style="background: {tintBase ? tintCardBg(tintBase, 70) : 'var(--muted)'}"
								aria-label={m.room_adjust_color({ name: deviceDisplayName(device) })}
							></button>
						{/snippet}
					</PopoverTrigger>
					<PopoverContent class="w-72 p-3" align="start">
						<LightColorPicker
							color={device.state?.color ?? null}
							colorTemp={device.state?.colorTemp ?? null}
							{hasColor}
							{hasColorTemp}
							hasBrightness={device.state?.brightness != null}
							brightness={device.state?.brightness ?? null}
							oncolorchange={handleColorChange}
							ontempchange={handleTempChange}
							onbrightnesschange={handleBrightnessChange}
						/>
					</PopoverContent>
				</Popover>
			</span>
		</foreignObject>
	{/if}

	{#if reading}
		<foreignObject x="-45" y="17" width="90" height="28" class="pointer-events-none">
			<div class="flex justify-center">
				<HiveChip
					type={reading.field}
					label="{reading.value} {reading.unit}"
					contactRole={device.roles.contact}
				/>
			</div>
		</foreignObject>
	{/if}
</g>
