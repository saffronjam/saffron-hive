<script lang="ts">
	import type { Device } from "$lib/stores/devices";
	import { Slider } from "$lib/components/ui/slider/index.js";

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
		ariaLabel = "Brightness",
	}: Props = $props();

	const dimmable = $derived(
		devices.filter((d) => d.type === "light" && d.state?.brightness != null),
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
	let lastSent = 0;
	let trailingTimer: ReturnType<typeof setTimeout> | null = null;
	const THROTTLE_MS = 250;
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
		if (initialised && !interacting && !trailingTimer) {
			value = liveValue;
		}
	});

	function handleChange(val: number) {
		value = val;
		oninteract?.();
		noteInteract();
		const now = Date.now();
		const elapsed = now - lastSent;
		if (trailingTimer) {
			clearTimeout(trailingTimer);
			trailingTimer = null;
		}
		if (elapsed >= THROTTLE_MS) {
			lastSent = now;
			onbrightness?.(val);
		} else {
			trailingTimer = setTimeout(() => {
				trailingTimer = null;
				lastSent = Date.now();
				onbrightness?.(val);
			}, THROTTLE_MS - elapsed);
		}
	}
</script>

{#if hasLights}
	<Slider
		type="single"
		value={value ?? 0}
		min={0}
		max={254}
		step={1}
		onValueChange={handleChange}
		{disabled}
		aria-label={ariaLabel}
	/>
{/if}
