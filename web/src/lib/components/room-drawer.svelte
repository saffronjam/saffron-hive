<script lang="ts">
	import {
		Sheet,
		SheetContent,
		SheetTitle,
		SheetDescription,
	} from "$lib/components/ui/sheet/index.js";
	import EntityCard from "$lib/components/entity-card.svelte";
	import SensorHistoryPopover from "$lib/components/sensor-history-popover.svelte";
	import DashboardLightCard from "$lib/components/dashboard-light-card.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import LightColorPicker from "$lib/components/light-color-picker.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { Clapperboard, DoorOpen, Lightbulb, Group as GroupIcon } from "@lucide/svelte";
	import {
		groupBaseTintColors,
		brightnessToTintStrength,
		aggregateSensorReadings,
	} from "$lib/device-tint";
	import { resolveTargetDevices, type GroupLite, type RoomLite } from "$lib/target-resolve";
	import type { Device } from "$lib/stores/devices";
	import { type Client } from "@urql/svelte";
	import { deviceIcon } from "$lib/utils";
	import type { GroupTag } from "$lib/components/group-tags-select.svelte";
	import type { Component } from "svelte";
	import {
		commitGroupBrightness,
		commitGroupColor,
		commitGroupTemp,
		commitGroupToggle,
	} from "$lib/group-commands";
	import { throttle, flushThrottle, type Throttle } from "$lib/throttle";
	import { markPopoverDismissed, popoverDismissedRecently } from "$lib/popover-guard";
	import { me } from "$lib/stores/me.svelte";
	import { onDestroy } from "svelte";

	interface RoomEntity {
		id: string;
		name: string;
		icon?: string | null;
		members: { memberType: string; memberId: string }[];
	}

	interface DashboardGroup {
		id: string;
		name: string;
		icon?: string | null;
		tags: GroupTag[];
		members: { memberType: string; memberId: string }[];
	}

	interface SceneAction {
		targetType: string;
		targetId: string;
	}

	interface SceneInfo {
		id: string;
		name: string;
		icon?: string | null;
		rooms: { id: string }[];
		actions: SceneAction[];
	}

	interface Props {
		room: RoomEntity | null;
		open: boolean;
		devices: Device[];
		groups: DashboardGroup[];
		rooms: RoomLite[];
		scenes: SceneInfo[];
		client: Client;
		applyingSceneId: string | null;
		onclose: () => void;
		onapplyscene: (scene: { id: string; name: string }) => void;
	}

	let {
		room,
		open,
		devices,
		groups,
		rooms,
		scenes,
		client,
		applyingSceneId,
		onclose,
		onapplyscene,
	}: Props = $props();

	const roomDevices = $derived.by((): Device[] => {
		if (!room) return [];
		return resolveTargetDevices({ type: "room", id: room.id }, devices, groups, rooms);
	});

	const roomDeviceIds = $derived(new Set(roomDevices.map((d) => d.id)));

	const sensors = $derived(roomDevices.filter((d) => d.type === "sensor"));
	const sensorReadings = $derived(
		aggregateSensorReadings(sensors, me.user?.temperatureUnit ?? "celsius"),
	);
	const hasSensors = $derived(sensorReadings.length > 0);
	const sensorFields = $derived(sensorReadings.map((r) => r.field));

	const lightDevices = $derived(roomDevices.filter((d) => d.type === "light"));
	const onLights = $derived(lightDevices.filter((d) => d.state?.on));
	const isOn = $derived(onLights.length > 0);
	const tintColors = $derived(groupBaseTintColors(roomDevices));
	const tintStrength = $derived.by(() => {
		const lit = onLights.filter((d) => d.state?.brightness != null);
		if (lit.length === 0) return 0;
		let sum = 0;
		for (const d of lit) sum += d.state!.brightness!;
		return brightnessToTintStrength(sum / lit.length);
	});

	const roomHasColor = $derived(
		roomDevices.some((d) => d.capabilities.some((c) => c.name === "color")),
	);
	const roomHasColorTemp = $derived(
		roomDevices.some((d) => d.capabilities.some((c) => c.name === "color_temp")),
	);
	const roomHasPicker = $derived(roomHasColor || roomHasColorTemp);

	const roomAggregatedColor = $derived.by((): { r: number; g: number; b: number } | null => {
		const onWithColor = roomDevices.find((d) => d.state?.on && d.state?.color);
		if (!onWithColor?.state?.color) return null;
		const c = onWithColor.state.color;
		return { r: c.r, g: c.g, b: c.b };
	});

	const roomAggregatedTemp = $derived.by((): number | null => {
		const onWithTemp = roomDevices.find((d) => d.state?.on && d.state?.colorTemp != null);
		return onWithTemp?.state?.colorTemp ?? null;
	});

	let roomPickerOpen = $state(false);

	const roomColorThrottle: Throttle = { lastSent: 0, trailing: null };
	const roomTempThrottle: Throttle = { lastSent: 0, trailing: null };

	function handleRoomColorChange(c: { r: number; g: number; b: number }) {
		throttle(roomColorThrottle, () => commitGroupColor(client, roomDevices, c));
	}
	function handleRoomTempChange(mired: number) {
		throttle(roomTempThrottle, () => commitGroupTemp(client, roomDevices, mired));
	}

	const roomDimmableLights = $derived(
		roomDevices.filter((d) => d.type === "light" && d.state?.brightness != null),
	);
	const roomAvgBrightness = $derived.by((): number => {
		const lit = onLights.filter((d) => d.state?.brightness != null);
		if (lit.length === 0) return 0;
		let sum = 0;
		for (const d of lit) sum += d.state!.brightness!;
		return sum / lit.length;
	});
	let roomPreviewBrightness = $state<number | null>(null);
	let roomInteractingTimer: ReturnType<typeof setTimeout> | null = null;
	const ROOM_INTERACT_COOLDOWN_MS = 1500;

	function noteRoomInteract() {
		if (roomInteractingTimer) clearTimeout(roomInteractingTimer);
		roomInteractingTimer = setTimeout(() => {
			roomInteractingTimer = null;
			roomPreviewBrightness = null;
		}, ROOM_INTERACT_COOLDOWN_MS);
	}
	onDestroy(() => {
		if (roomInteractingTimer) clearTimeout(roomInteractingTimer);
	});

	const roomEffectiveBrightness = $derived(
		roomPreviewBrightness ?? (isOn ? roomAvgBrightness : 0),
	);
	const roomBrightnessFill = $derived(
		roomDimmableLights.length === 0 ? null : roomEffectiveBrightness / 254,
	);
	const roomBrightnessActive = $derived(
		roomPreviewBrightness != null ? roomPreviewBrightness > 0 : isOn,
	);
	const roomBrightnessThrottle: Throttle = { lastSent: 0, trailing: null };

	const roomDragOpts = $derived({
		initial: () => (isOn ? roomAvgBrightness : 0),
		onpreview: (v: number) => {
			roomPreviewBrightness = v;
			throttle(roomBrightnessThrottle, () =>
				commitGroupBrightness(client, roomDimmableLights, v),
			);
		},
		oncommit: (v: number) => {
			flushThrottle(roomBrightnessThrottle);
			commitGroupBrightness(client, roomDimmableLights, v);
			roomPreviewBrightness = v;
			noteRoomInteract();
		},
		enabled: () => roomDimmableLights.length > 0,
	});

	const groupsById = $derived(new Map(groups.map((g) => [g.id, g])));

	interface LightCardEntry {
		key: string;
		entity: { id: string; name: string; icon?: string | null };
		devices: Device[];
		isGroup: boolean;
		fallbackIcon: Component;
	}

	const sectionAEntries = $derived.by((): LightCardEntry[] => {
		if (!room) return [];
		const entries: LightCardEntry[] = [];
		const claimedDeviceIds = new Set<string>();

		for (const m of room.members) {
			if (m.memberType !== "group") continue;
			const group = groupsById.get(m.memberId);
			if (!group) continue;
			if (!group.tags?.includes("LIGHT")) continue;
			const groupDevs = resolveTargetDevices(
				{ type: "group", id: group.id },
				devices,
				groups,
				rooms,
			).filter((d) => d.type === "light" || d.capabilities.some((c) => c.name === "on_off"));
			if (groupDevs.length === 0) continue;
			for (const d of groupDevs) claimedDeviceIds.add(d.id);
			entries.push({
				key: `group:${group.id}`,
				entity: { id: group.id, name: group.name, icon: group.icon ?? null },
				devices: groupDevs,
				isGroup: true,
				fallbackIcon: GroupIcon,
			});
		}

		for (const m of room.members) {
			if (m.memberType !== "device") continue;
			if (claimedDeviceIds.has(m.memberId)) continue;
			const dev = devices.find((d) => d.id === m.memberId);
			if (!dev) continue;
			const isLightLike =
				dev.type === "light" || dev.capabilities.some((c) => c.name === "on_off");
			if (!isLightLike) continue;
			entries.push({
				key: `device:${dev.id}`,
				entity: { id: dev.id, name: dev.name, icon: dev.icon ?? null },
				devices: [dev],
				isGroup: false,
				fallbackIcon: deviceIcon(dev.type) ?? Lightbulb,
			});
		}

		return entries;
	});

	// Pair up groups with groups and individual lights with individual lights;
	// never let the two kinds share a row. When a kind has an odd count, the
	// trailing item spans both columns instead of pairing with the next kind.
	const sectionARows = $derived.by((): { entry: LightCardEntry; fullWidth: boolean }[] => {
		const groups = sectionAEntries.filter((e) => e.isGroup);
		const singles = sectionAEntries.filter((e) => !e.isGroup);
		const result: { entry: LightCardEntry; fullWidth: boolean }[] = [];
		for (let i = 0; i < groups.length; i++) {
			const isLast = i === groups.length - 1;
			result.push({ entry: groups[i], fullWidth: isLast && groups.length % 2 === 1 });
		}
		for (let i = 0; i < singles.length; i++) {
			const isLast = i === singles.length - 1;
			result.push({ entry: singles[i], fullWidth: isLast && singles.length % 2 === 1 });
		}
		return result;
	});

	const filteredScenes = $derived.by((): SceneInfo[] => {
		if (!room) return [];
		return scenes
			.filter((s) => s.rooms.some((r) => r.id === room.id))
			.toSorted((a, b) => a.name.localeCompare(b.name));
	});
</script>

<Sheet
	{open}
	onOpenChange={(next) => {
		if (!next) onclose();
	}}
>
	<SheetContent
		side="bottom"
		showCloseButton={false}
		class="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[color-mix(in_oklch,var(--background)_50%,var(--card))] p-4 pb-24 sm:max-w-none lg:left-1/2! lg:right-auto! lg:w-[calc(100%-3rem)] lg:max-w-3xl lg:-translate-x-1/2"
	>
		<SheetTitle class="sr-only">{room?.name ?? "Room"}</SheetTitle>
		<SheetDescription class="sr-only">
			Scenes and lights for this room.
		</SheetDescription>

		{#if room}
			<EntityCard
				entity={room}
				fallbackIcon={DoorOpen}
				subtitle={isOn ? "On" : "Off"}
				tintColors={tintColors.length > 0 ? tintColors : null}
				{tintStrength}
				tintInactive={!roomBrightnessActive}
				brightnessFill={roomBrightnessFill}
				dragOpts={roomDragOpts}
				readOnly
				size="sm"
				onclick={() => {
					if (popoverDismissedRecently()) return;
					commitGroupToggle(client, roomDevices, !isOn);
				}}
			>
				{#snippet iconArea({ iconGradient, iconTextClass, hasTint, tintInactive: ti })}
					{#if roomHasPicker}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<span onclick={(e: MouseEvent) => e.stopPropagation()} class="shrink-0">
							<Popover
								bind:open={roomPickerOpen}
								onOpenChange={(open) => {
									if (!open) markPopoverDismissed();
								}}
							>
								<PopoverTrigger>
									{#snippet child({ props })}
										<button
											type="button"
											{...props}
											class="relative flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/50 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
											aria-label={`Adjust ${room.name} colour`}
										>
											{#if hasTint}
												<div
													class="pointer-events-none absolute inset-0 rounded-md transition-opacity duration-300 ease-out"
													style="background: {iconGradient}; opacity: {ti === true ? 1 : 0}"
													aria-hidden="true"
												></div>
											{/if}
											<AnimatedIcon icon={room.icon} class="relative size-3.5 {iconTextClass}">
												{#snippet fallback()}
													<DoorOpen class="relative size-3.5 {iconTextClass}" />
												{/snippet}
											</AnimatedIcon>
										</button>
									{/snippet}
								</PopoverTrigger>
								<PopoverContent class="w-72 p-3" align="start">
									<LightColorPicker
										color={roomAggregatedColor}
										colorTemp={roomAggregatedTemp}
										hasColor={roomHasColor}
										hasColorTemp={roomHasColorTemp}
										hasBrightness={false}
										oncolorchange={handleRoomColorChange}
										ontempchange={handleRoomTempChange}
									/>
								</PopoverContent>
							</Popover>
						</span>
					{:else}
						<div class="relative flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/50">
							{#if hasTint}
								<div
									class="pointer-events-none absolute inset-0 rounded-md transition-opacity duration-300 ease-out"
									style="background: {iconGradient}; opacity: {ti === true ? 1 : 0}"
									aria-hidden="true"
								></div>
							{/if}
							<AnimatedIcon icon={room.icon} class="relative size-3.5 {iconTextClass}">
								{#snippet fallback()}
									<DoorOpen class="relative size-3.5 {iconTextClass}" />
								{/snippet}
							</AnimatedIcon>
						</div>
					{/if}
				{/snippet}
				{#snippet leadingActions()}
					{#if hasSensors}
						<SensorHistoryPopover
							target={{ kind: "room", id: room.id }}
							fields={sensorFields}
							title={room.name}
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

			{#if filteredScenes.length > 0}
				<div class="mt-2 flex flex-wrap justify-center gap-2">
					{#each filteredScenes as scene (scene.id)}
						<Button
							variant="outline"
							size="lg"
							class="h-12 shrink-0 gap-2 px-5 text-base"
							disabled={applyingSceneId === scene.id}
							onclick={() => onapplyscene(scene)}
						>
							<AnimatedIcon icon={scene.icon} class="size-5 shrink-0">
								{#snippet fallback()}<Clapperboard class="size-5 shrink-0" />{/snippet}
							</AnimatedIcon>
							<span>{applyingSceneId === scene.id ? "Applying..." : scene.name}</span>
						</Button>
					{/each}
				</div>
			{/if}

			<section class="mt-2">
				<div class="mb-2 flex items-center gap-3">
					<h3 class="text-sm font-semibold text-foreground">Lights</h3>
					<div class="h-px flex-1 bg-muted" aria-hidden="true"></div>
				</div>
				{#if sectionAEntries.length === 0}
					<p class="text-sm text-muted-foreground">No lights in this room.</p>
				{:else}
					<div class="grid grid-cols-2 gap-3">
						{#each sectionARows as { entry, fullWidth } (entry.key)}
							<DashboardLightCard
								entity={entry.entity}
								devices={entry.devices}
								isGroup={entry.isGroup}
								fallbackIcon={entry.fallbackIcon}
								{client}
								class={fullWidth ? "col-span-2" : ""}
							/>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	</SheetContent>
</Sheet>
