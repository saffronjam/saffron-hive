<script lang="ts">
	import { isRuntimeEnabledDevice, type Device } from "$lib/stores/devices";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { onDestroy } from "svelte";
	import { throttle, flushThrottle, type Throttle } from "$lib/throttle";
	import { powerIntents } from "$lib/stores/power-intents.svelte";

	interface Props {
		devices: Device[];
		value?: number;
		onbrightness?: (val: number) => void;
		oninteract?: () => void;
		disabled?: boolean;
		ariaLabel?: string;
	}

	let {
		devices,
		value = $bindable<number>(),
		onbrightness,
		oninteract,
		disabled = false,
		ariaLabel,
	}: Props = $props();
	const resolvedAriaLabel = $derived(
		ariaLabel ?? m.device_brightness({}, locale.messageOptions()),
	);

	// Runtime-disabled devices are excluded: the slider must show, and average,
	// only what it can actually command.
	const dimmable = $derived(
		powerIntents.devices(devices).filter(
			(d) => isRuntimeEnabledDevice(d) && d.type === "light" && d.state?.brightness != null,
		),
	);
	const hasLights = $derived(dimmable.length > 0);

	const liveValue = $derived.by(() => {
		const on = dimmable.filter((d) => d.state?.on && d.state?.brightness != null);
		if (on.length === 0) return 0;
		let sum = 0;
		for (const d of on) sum += d.state!.brightness!;
		return Math.round(sum / on.length);
	});

	// Seed the value synchronously, before the first render, when devices are
	// already available at mount. Without this, value would be undefined for
	// the first render (slider draws at 0), then a `$effect` would set it to
	// liveValue — the slider would animate from 0 to the real position on
	// every page load. The post-mount `$effect` below still handles the case
	// where devices arrive asynchronously after mount.
	// svelte-ignore state_referenced_locally
	if (value === undefined && hasLights) {
		// svelte-ignore state_referenced_locally
		value = liveValue;
	}

	let initialised = $state(value !== undefined);
	let interacting = $state(false);
	let interactingTimer: ReturnType<typeof setTimeout> | null = null;
	const brightnessThrottle: Throttle = { lastSent: 0, trailing: null };
	const INTERACT_COOLDOWN_MS = 1500;

	function noteInteract() {
		interacting = true;
		if (interactingTimer) clearTimeout(interactingTimer);
		interactingTimer = setTimeout(() => {
			interactingTimer = null;
			interacting = false;
		}, INTERACT_COOLDOWN_MS);
	}

	$effect(() => {
		if (powerIntents.has(devices)) {
			flushThrottle(brightnessThrottle);
			if (interactingTimer) clearTimeout(interactingTimer);
			interactingTimer = null;
			interacting = false;
			value = liveValue;
		}
	});

	$effect(() => {
		if (!initialised && hasLights) {
			value = liveValue;
			initialised = true;
		}
	});

	// Sync from external state. `value` is written but not read, so user drags
	// (which mutate `value`) do not retrigger this effect — that prevents the
	// thumb from snapping backward to a stale `liveValue` mid-drag while the
	// echo from our own commit is still in flight.
	$effect(() => {
		if (initialised && !interacting && !brightnessThrottle.trailing) {
			value = liveValue;
		}
	});

	function handleChange(val: number) {
		powerIntents.clear(devices);
		value = val;
		oninteract?.();
		noteInteract();
		throttle(brightnessThrottle, () => onbrightness?.(val));
	}

	function handleCommit() {
		const pending = brightnessThrottle.trailing !== null;
		flushThrottle(brightnessThrottle);
		if (pending && value !== undefined) onbrightness?.(value);
		noteInteract();
	}

	onDestroy(() => {
		flushThrottle(brightnessThrottle);
		if (interactingTimer) clearTimeout(interactingTimer);
	});
</script>

{#if hasLights}
	<Slider
		type="single"
		value={value ?? 0}
		min={0}
		max={254}
		step={1}
		onValueChange={handleChange}
		onValueCommit={handleCommit}
		{disabled}
	aria-label={resolvedAriaLabel}
	/>
{/if}
