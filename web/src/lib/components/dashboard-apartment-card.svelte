<script lang="ts">
	import EntityCard from "$lib/components/entity-card.svelte";
	import SensorHistoryPopover from "$lib/components/sensor-history-popover.svelte";
	import { House } from "@lucide/svelte";
	import {
		groupBaseTintColors,
		brightnessToTintStrength,
		aggregateSensorReadings,
	} from "$lib/device-tint";
	import type { Device } from "$lib/stores/devices";
	import { type Client } from "@urql/svelte";
	import { commitGroupBrightness, commitGroupToggle } from "$lib/group-commands";
	import { popoverDismissedRecently } from "$lib/popover-guard";
	import { throttle, flushThrottle, type Throttle } from "$lib/throttle";
	import { me } from "$lib/stores/me.svelte";
	import { onDestroy } from "svelte";

	interface Props {
		devices: Device[];
		client: Client;
	}

	let { devices, client }: Props = $props();

	const apartmentEntity = { id: "apartment", name: "Apartment", icon: null };

	const lights = $derived(
		devices.filter(
			(d) => d.type === "light" || d.capabilities.some((c) => c.name === "on_off"),
		),
	);
	const onLights = $derived(lights.filter((d) => d.state?.on));
	const isOn = $derived(onLights.length > 0);

	const sensors = $derived(devices.filter((d) => d.type === "sensor"));
	const sensorReadings = $derived(
		aggregateSensorReadings(sensors, me.user?.temperatureUnit ?? "celsius"),
	);
	const hasSensors = $derived(sensorReadings.length > 0);
	const sensorFields = $derived(sensorReadings.map((r) => r.field));

	const tintColors = $derived(groupBaseTintColors(devices));
	const tintStrength = $derived.by(() => {
		const lit = onLights.filter((d) => d.state?.brightness != null);
		if (lit.length === 0) return 0;
		let sum = 0;
		for (const d of lit) sum += d.state!.brightness!;
		return brightnessToTintStrength(sum / lit.length);
	});

	const dimmableLights = $derived(
		devices.filter((d) => d.type === "light" && d.state?.brightness != null),
	);
	const avgBrightness = $derived.by((): number => {
		const lit = onLights.filter((d) => d.state?.brightness != null);
		if (lit.length === 0) return 0;
		let sum = 0;
		for (const d of lit) sum += d.state!.brightness!;
		return sum / lit.length;
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

	const subtitle = $derived(
		lights.length === 0
			? undefined
			: isOn
				? `On · ${onLights.length} of ${lights.length} light${lights.length === 1 ? "" : "s"}`
				: "Off",
	);
</script>

<EntityCard
	entity={apartmentEntity}
	fallbackIcon={House}
	{subtitle}
	tintColors={tintColors.length > 0 ? tintColors : null}
	{tintStrength}
	tintInactive={!brightnessActive}
	{brightnessFill}
	{dragOpts}
	readOnly
	iconAreaSize="sm"
	onclick={() => {
		if (popoverDismissedRecently()) return;
		if (lights.length === 0) return;
		void commitGroupToggle(client, lights, !isOn);
	}}
>
	{#snippet leadingActions()}
		{#if hasSensors}
			<SensorHistoryPopover
				target={{ kind: "apartment" }}
				fields={sensorFields}
				title={apartmentEntity.name}
				align="end"
				triggerClass="group rounded focus-visible:outline-none"
			>
				<div class="grid grid-cols-[auto_auto_auto] items-center gap-x-1 gap-y-0.5 text-sm tabular-nums text-muted-foreground transition-colors group-hover:text-foreground group-focus-visible:text-foreground">
					{#each sensorReadings as r (r.label)}
						<r.icon class="size-4" />
						<span class="text-right text-foreground">{r.value}</span>
						<span class="text-xs">{r.unit}</span>
					{/each}
				</div>
			</SensorHistoryPopover>
		{/if}
	{/snippet}
</EntityCard>
