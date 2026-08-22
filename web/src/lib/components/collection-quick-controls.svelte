<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import { isLightControlDevice, type Device } from "$lib/stores/devices";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import LightColorPicker from "$lib/components/light-color-picker.svelte";
	import HiveColorSwatch from "$lib/components/hive-color-swatch.svelte";
	import { capabilityUnion, hasCapability } from "$lib/target-resolve";
	import { groupBaseTintColors } from "$lib/device-tint";
	import { throttle, type Throttle } from "$lib/throttle";
	import {
		commitGroupToggle,
		commitGroupColor,
		commitGroupTemp,
		type CommandTarget,
	} from "$lib/group-commands";

	interface Props {
		devices: Device[];
		name: string;
		target?: CommandTarget;
	}

	let { devices, name, target }: Props = $props();

	const client = getContextClient();

	const caps = $derived(capabilityUnion(devices));
	const onOffDevices = $derived(devices.filter(isLightControlDevice));
	const hasOnOff = $derived(onOffDevices.length > 0);
	const hasColor = $derived(hasCapability(caps, "color"));
	const hasColorTemp = $derived(hasCapability(caps, "color_temp"));
	const hasPopover = $derived(hasColor || hasColorTemp);

	const swatchColor = $derived.by(() => {
		const cs = groupBaseTintColors(devices);
		if (cs.length === 0) return null;
		if (cs.length === 1) return cs[0];
		return `linear-gradient(135deg, ${cs.join(", ")})`;
	});

	const isOn = $derived(onOffDevices.some((d) => d.state?.on));
	const colorSeed = $derived(
		devices.find((d) => d.state?.on && d.state?.color)?.state?.color ?? null,
	);
	const tempSeed = $derived(
		devices.find((d) => d.state?.on && d.state?.colorTemp != null)?.state?.colorTemp ?? null,
	);

	const colorThrottle: Throttle = { lastSent: 0, trailing: null };
	const tempThrottle: Throttle = { lastSent: 0, trailing: null };

	function handleToggle(checked: boolean) {
		void commitGroupToggle(client, devices, checked, target);
	}

	function handleColorChange(color: { r: number; g: number; b: number }) {
		throttle(colorThrottle, () => commitGroupColor(client, devices, color, target));
	}

	function handleTempChange(mired: number) {
		throttle(tempThrottle, () => commitGroupTemp(client, devices, mired, target));
	}
</script>

{#if hasOnOff}
	<Switch checked={isOn} onCheckedChange={handleToggle} aria-label={`Toggle ${name}`} />
{/if}

{#if hasPopover}
	<Popover>
		<PopoverTrigger class="inline-flex h-8 items-center">
			<button
				type="button"
				aria-label={`Adjust ${name}`}
				class="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent"
			>
				<HiveColorSwatch color={swatchColor} />
			</button>
		</PopoverTrigger>
		<PopoverContent class="w-72 p-3 space-y-4" align="end">
			<LightColorPicker
				color={colorSeed}
				colorTemp={tempSeed}
				{hasColor}
				{hasColorTemp}
				oncolorchange={handleColorChange}
				ontempchange={handleTempChange}
			/>
		</PopoverContent>
	</Popover>
{/if}
