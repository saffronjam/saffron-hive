<script lang="ts">
	import EntityCard from "$lib/components/entity-card.svelte";
	import { DoorOpen } from "@lucide/svelte";
	import {
		groupBaseTintColors,
		brightnessToTintStrength,
		aggregateSensorReadings,
	} from "$lib/device-tint";
	import { resolveTargetDevices, type GroupLite, type RoomLite } from "$lib/target-resolve";
	import type { Device } from "$lib/stores/devices";
	import { type Client } from "@urql/svelte";
	import { commitGroupBrightness } from "$lib/group-commands";
	import { throttle, flushThrottle, type Throttle } from "$lib/throttle";
	import { onDestroy } from "svelte";

	interface RoomEntity {
		id: string;
		name: string;
		icon?: string | null;
	}

	interface Props {
		room: RoomLite & RoomEntity;
		devices: Device[];
		groups: GroupLite[];
		rooms: RoomLite[];
		client: Client;
		onopen: (room: RoomEntity) => void;
	}

	let { room, devices, groups, rooms, client, onopen }: Props = $props();

	const roomDevices = $derived(
		resolveTargetDevices({ type: "room", id: room.id }, devices, groups, rooms),
	);

	const lights = $derived(
		roomDevices.filter(
			(d) => d.type === "light" || d.capabilities.some((c) => c.name === "on_off"),
		),
	);
	const onLights = $derived(lights.filter((d) => d.state?.on));
	const isOn = $derived(onLights.length > 0);

	const sensors = $derived(roomDevices.filter((d) => d.type === "sensor"));
	const sensorReadings = $derived(aggregateSensorReadings(sensors));
	const hasSensors = $derived(sensorReadings.length > 0);

	const tintColors = $derived(groupBaseTintColors(roomDevices));
	const tintStrength = $derived.by(() => {
		const lit = onLights.filter((d) => d.state?.brightness != null);
		if (lit.length === 0) return 0;
		let sum = 0;
		for (const d of lit) sum += d.state!.brightness!;
		return brightnessToTintStrength(sum / lit.length);
	});

	const dimmableLights = $derived(
		roomDevices.filter((d) => d.type === "light" && d.state?.brightness != null),
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
	entity={room}
	fallbackIcon={DoorOpen}
	{subtitle}
	tintColors={tintColors.length > 0 ? tintColors : null}
	{tintStrength}
	tintInactive={!brightnessActive}
	{brightnessFill}
	{dragOpts}
	readOnly
	onclick={() => onopen(room)}
>
	{#snippet leadingActions()}
		{#if hasSensors}
			<div class="flex items-center gap-3 text-sm tabular-nums">
				{#each sensorReadings as r (r.label)}
					<span class="flex items-center gap-1 text-muted-foreground">
						<r.icon class="size-4" />
						<span class="text-foreground">{r.value}</span>
						<span class="ml-0.5 text-xs">{r.unit}</span>
					</span>
				{/each}
			</div>
		{/if}
	{/snippet}
</EntityCard>
