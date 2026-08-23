<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import { Group } from "@lucide/svelte";
	import { CommandTargetType, type DeviceState } from "$lib/gql/graphql";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import LightColorPicker from "$lib/components/light-color-picker.svelte";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { isLightControlDevice, type Device } from "$lib/stores/devices";
	import { aggregateLightAppearance, tintCardBg } from "$lib/device-tint";
	import {
		commitGroupBrightness,
		commitGroupColor,
		commitGroupTemp,
	} from "$lib/group-commands";
	import { markPopoverDismissed } from "$lib/popover-guard";
	import { capabilityUnion, hasCapability } from "$lib/target-resolve";
	import { flushThrottle, throttle, type Throttle } from "$lib/throttle";

	interface Props {
		group: { id: string; name: string; icon?: string | null };
		/** The group's resolved device list — what the marker tints and commands. */
		devices: Device[];
		x: number;
		y: number;
		/** Screen pixels per world meter; the marker keeps a constant screen size. */
		pxPerM: number;
		selected?: boolean;
		/** Render as a translucent in-flight marker while being dragged in. */
		draft?: boolean;
		/** Live map mode: tinted disc and swatch popover; no editing. */
		live?: boolean;
		/** The armed brush cannot paint this group: muted and stroke-inert. */
		inert?: boolean;
		/** Picker interaction feeds the page's preview map (anti-flicker). */
		onpreviewstate?: (partial: Partial<DeviceState>) => void;
	}

	let {
		group,
		devices,
		x,
		y,
		pxPerM,
		selected = false,
		draft = false,
		live = false,
		inert = false,
		onpreviewstate,
	}: Props = $props();

	const client = getContextClient();

	const muted = $derived(devices.every((d) => d.disabled || !d.available));

	const appearance = $derived(aggregateLightAppearance(devices));
	const tintBase = $derived(appearance.dominantColor);
	const tintStrength = $derived(appearance.tintStrength);
	const discFill = $derived(
		live && tintBase && tintStrength > 0
			? tintCardBg(tintBase, Math.round(20 + 45 * tintStrength))
			: "var(--card)",
	);

	const caps = $derived(capabilityUnion(devices));
	const hasColor = $derived(hasCapability(caps, "color"));
	const hasColorTemp = $derived(hasCapability(caps, "color_temp"));
	const hasSwatch = $derived(
		live &&
			!draft &&
			devices.some((d) => !d.disabled && d.available && isLightControlDevice(d)) &&
			(hasColor || hasColorTemp),
	);

	const litColor = $derived(devices.find((d) => d.state?.on && d.state?.color)?.state?.color ?? null);
	const litTemp = $derived(
		devices.find((d) => d.state?.on && d.state?.colorTemp != null)?.state?.colorTemp ?? null,
	);
	const litBrightness = $derived(
		devices.find((d) => d.state?.on && d.state?.brightness != null)?.state?.brightness ?? null,
	);
	const hasBrightness = $derived(devices.some((d) => d.state?.brightness != null));

	let pickerOpen = $state(false);
	const colorThrottle: Throttle = { lastSent: 0, trailing: null };
	const tempThrottle: Throttle = { lastSent: 0, trailing: null };
	const brightnessThrottle: Throttle = { lastSent: 0, trailing: null };

	function handleColorChange(c: { r: number; g: number; b: number }) {
		onpreviewstate?.({ color: { ...c, x: 0, y: 0 }, on: true });
		throttle(colorThrottle, () =>
			commitGroupColor(client, devices, c, {
				targetType: CommandTargetType.Group,
				targetId: group.id,
			}),
		);
	}
	function handleTempChange(mired: number) {
		onpreviewstate?.({ colorTemp: mired, color: null, on: true });
		throttle(tempThrottle, () =>
			commitGroupTemp(client, devices, mired, {
				targetType: CommandTargetType.Group,
				targetId: group.id,
			}),
		);
	}
	function handleBrightnessChange(v: number) {
		onpreviewstate?.({ brightness: v, on: v > 0 });
		throttle(brightnessThrottle, () =>
			commitGroupBrightness(client, devices, v, {
				targetType: CommandTargetType.Group,
				targetId: group.id,
			}),
		);
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
	data-group-id={group.id}
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
			<AnimatedIcon icon={group.icon} class="size-4">
				{#snippet fallback()}<Group class="size-4" />{/snippet}
			</AnimatedIcon>
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
								aria-label={`Adjust ${group.name} colour`}
							></button>
						{/snippet}
					</PopoverTrigger>
					<PopoverContent class="w-72 p-3" align="start">
						<LightColorPicker
							color={litColor}
							colorTemp={litTemp}
							{hasColor}
							{hasColorTemp}
							{hasBrightness}
							brightness={litBrightness}
							oncolorchange={handleColorChange}
							ontempchange={handleTempChange}
							onbrightnesschange={handleBrightnessChange}
						/>
					</PopoverContent>
				</Popover>
			</span>
		</foreignObject>
	{/if}
</g>
