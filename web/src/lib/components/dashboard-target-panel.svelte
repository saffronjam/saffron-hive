<script module lang="ts">
	export interface DashboardRoom {
		id: string;
		name: string;
		icon?: string | null;
		members: { memberType: string; memberId: string }[];
	}
	export type DashboardTarget = { kind: "apartment" } | { kind: "room"; room: DashboardRoom };
</script>

<script lang="ts">
	import BulkBrightnessSlider from "$lib/components/bulk-brightness-slider.svelte";
	import { powerIntents } from "$lib/stores/power-intents.svelte";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import EntityCard from "$lib/components/entity-card.svelte";
	import SectionDivider from "$lib/components/section-divider.svelte";
	import SensorHistoryPopover from "$lib/components/sensor-history-popover.svelte";
	import DashboardLightCard from "$lib/components/dashboard-light-card.svelte";
	import DashboardApplianceCard from "$lib/components/dashboard-appliance-card.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import LightColorPicker from "$lib/components/light-color-picker.svelte";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { Clapperboard, DoorOpen, House, Lightbulb, Group as GroupIcon } from "@lucide/svelte";
	import {
		aggregateLightAppearance,
		lightTintTransitionSeconds,
		aggregateSensorReadings,
		rememberedLightPalette,
		scenePreviewColors,
	} from "$lib/device-tint";
	import type { ScenePreview } from "$lib/scene-editable";
	import { resolveTargetDevices, type RoomLite } from "$lib/target-resolve";
	import {
		isApplianceDevice,
		isLightControlDevice,
		isRuntimeEnabledDevice,
		type Device,
	} from "$lib/stores/devices";
	import { type Client } from "@urql/svelte";
	import { contactIcon, deviceIcon, deviceDisplayName, entityDisplayName, groupDisplayName } from "$lib/utils";
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
	import { contactCollectionSummary } from "$lib/device-collection-summary";
	import { onDestroy } from "svelte";
	import { CommandTargetType, ContactRole } from "$lib/gql/graphql";
	import { summarizeContacts, formatContactSummary } from "$lib/contact-summary";
	import { haptics } from "$lib/stores/haptics.svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { compareLocalized } from "$lib/i18n/format";

	interface DashboardGroup {
		id: string;
		name?: string | null;
		friendlyName?: string | null;
		icon?: string | null;
		tags: GroupTag[];
		members: { memberType: string; memberId: string }[];
	}

	interface SceneInfo {
		id: string;
		name: string;
		icon?: string | null;
		rooms: { id: string }[];
		preview: ScenePreview;
		activatedAt?: string | null;
	}

	interface Props {
		target: DashboardTarget;
		presentation: "compact" | "desktop";
		devices: Device[];
		groups: DashboardGroup[];
		rooms: RoomLite[];
		scenes: SceneInfo[];
		client: Client;
		onapplyscene: (scene: { id: string; name: string }) => void;
		onstopscene: (scene: { id: string; name: string }) => void;
		sensorHistoryEnabled?: boolean;
	}

	let {
		target,
		presentation,
		devices: allDevices,
		groups,
		rooms,
		scenes,
		client,
		onapplyscene,
		onstopscene,
		sensorHistoryEnabled = true,
	}: Props = $props();
	const devices = $derived(allDevices.filter(isRuntimeEnabledDevice));
	const desktop = $derived(presentation === "desktop");
	const room = $derived(target.kind === "room" ? target.room : null);
	const entity = $derived(room ?? { id: "apartment", name: m.dashboard_apartment({}, locale.messageOptions()), icon: null });
	const displayName = $derived(room ? entityDisplayName("room", room) : entity.name);
	const HeaderIcon = $derived(room ? DoorOpen : House);

	const roomDevices = $derived.by((): Device[] => {
		if (!room) return devices.filter(isRuntimeEnabledDevice);
		return resolveTargetDevices({ type: "room", id: room.id }, devices, groups, rooms);
	});

	const sensors = $derived(roomDevices.filter((d) => d.type === "sensor"));
	const sensorReadings = $derived(
		aggregateSensorReadings(sensors, me.user?.temperatureUnit ?? "celsius").filter(
			(reading) => reading.field !== "contact",
		),
	);
	const hasSensors = $derived(sensorReadings.length > 0);
	const sensorFields = $derived(sensorReadings.map((r) => r.field));
	const contacts = $derived([ContactRole.Door, ContactRole.Window]
		.map((role) => summarizeContacts(roomDevices, role))
		.filter((summary) => summary !== null));

	const lightDevices = $derived(roomDevices.filter(isLightControlDevice));
	const commandTarget = $derived(room && lightDevices.length === roomDevices.length ? { targetType: CommandTargetType.Room, targetId: room.id } : undefined);
	const applianceDevices = $derived(
		roomDevices
			.filter(isApplianceDevice)
			.toSorted((a, b) => compareLocalized(deviceDisplayName(a), deviceDisplayName(b))),
	);
	const fullWidthApplianceId = $derived(
		applianceDevices.length % 2 === 1
			? applianceDevices[applianceDevices.length - 1]?.id
			: null,
	);
	const onLights = $derived(powerIntents.devices(lightDevices).filter((d) => d.state?.on));
	const isOn = $derived(onLights.length > 0);

	const roomHasColor = $derived(
		lightDevices.some((d) => d.capabilities.some((c) => c.name === "color")),
	);
	const roomHasColorTemp = $derived(
		lightDevices.some((d) => d.capabilities.some((c) => c.name === "color_temp")),
	);
	const roomHasPicker = $derived(roomHasColor || roomHasColorTemp);

	const roomAggregatedColor = $derived.by((): { r: number; g: number; b: number } | null => {
		const onWithColor = lightDevices.find((d) => d.state?.on && d.state?.color);
		if (!onWithColor?.state?.color) return null;
		const c = onWithColor.state.color;
		return { r: c.r, g: c.g, b: c.b };
	});

	const roomAggregatedTemp = $derived.by((): number | null => {
		const onWithTemp = lightDevices.find((d) => d.state?.on && d.state?.colorTemp != null);
		return onWithTemp?.state?.colorTemp ?? null;
	});

	let roomPickerOpen = $state(false);

	const roomColorThrottle: Throttle = { lastSent: 0, trailing: null };
	const roomTempThrottle: Throttle = { lastSent: 0, trailing: null };

	function handleRoomColorChange(c: { r: number; g: number; b: number }) {
		throttle(roomColorThrottle, () =>
			commitGroupColor(client, lightDevices, c, commandTarget),
		);
	}
	function handleRoomTempChange(mired: number) {
		throttle(roomTempThrottle, () =>
			commitGroupTemp(client, lightDevices, mired, commandTarget),
		);
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
	const roomAppearance = $derived(
		aggregateLightAppearance(
			powerIntents.devices(roomDevices),
			roomPreviewBrightness == null ? {} : { brightnessPreview: roomPreviewBrightness },
		),
	);
	const tintColors = $derived(roomAppearance.colors);
	const inactiveTintColors = $derived(rememberedLightPalette(roomDevices));
	const tintStrength = $derived(roomAppearance.tintStrength);
	const tintTransitionSeconds = $derived(lightTintTransitionSeconds(roomDevices));

	function noteRoomInteract() {
		if (roomInteractingTimer) clearTimeout(roomInteractingTimer);
		roomInteractingTimer = setTimeout(() => {
			roomInteractingTimer = null;
			roomPreviewBrightness = null;
		}, ROOM_INTERACT_COOLDOWN_MS);
	}
	onDestroy(() => {
		if (roomInteractingTimer) clearTimeout(roomInteractingTimer);
		flushThrottle(roomBrightnessThrottle);
		flushThrottle(roomColorThrottle);
		flushThrottle(roomTempThrottle);
	});

	const roomBrightnessFill = $derived(
		roomAppearance.hasDimmable ? roomAppearance.outputRatio : null,
	);
	const roomBrightnessActive = $derived(roomAppearance.active);
	const roomBrightnessThrottle: Throttle = { lastSent: 0, trailing: null };
	$effect(() => {
		if (!powerIntents.has(lightDevices)) return;
		roomPreviewBrightness = null;
		flushThrottle(roomBrightnessThrottle);
		flushThrottle(roomColorThrottle);
		flushThrottle(roomTempThrottle);
	});

	function setBrightness(value: number) {
		roomPreviewBrightness = value;
		noteRoomInteract();
		void commitGroupBrightness(client, lightDevices, value, commandTarget);
	}

	function setOn(on: boolean) {
		void commitGroupToggle(client, lightDevices, on, commandTarget);
	}

	const roomDragOpts = $derived({
		initial: () => (isOn ? roomAvgBrightness : 0),
		onpreview: (v: number) => {
			if (!room) return;
			roomPreviewBrightness = v;
			throttle(roomBrightnessThrottle, () =>
				commitGroupBrightness(client, roomDevices, v, commandTarget),
			);
		},
		oncommit: (v: number) => {
			if (!room) return;
			flushThrottle(roomBrightnessThrottle);
			commitGroupBrightness(client, roomDevices, v, commandTarget);
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
			const groupDevs = resolveTargetDevices(
				{ type: "group", id: group.id },
				devices,
				groups,
				rooms,
			);
			if (!groupDevs.some(isLightControlDevice)) continue;
			for (const d of groupDevs) claimedDeviceIds.add(d.id);
			entries.push({
				key: `group:${group.id}`,
				entity: { id: group.id, name: groupDisplayName(group), icon: group.icon ?? null },
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
			if (!isLightControlDevice(dev)) continue;
			entries.push({
				key: `device:${dev.id}`,
				entity: { id: dev.id, name: deviceDisplayName(dev), icon: dev.icon ?? null },
				devices: [dev],
				isGroup: false,
				fallbackIcon: deviceIcon(dev.type, dev.roles.contact) ?? Lightbulb,
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
			.toSorted((a, b) =>
				compareLocalized(entityDisplayName("scene", a), entityDisplayName("scene", b)),
			);
	});
</script>

<div class="target-panel flex min-w-0 flex-col {desktop ? 'gap-4' : 'gap-2'}" class:desktop>
			<EntityCard
				pressFeedback={!desktop}
				{entity}
				entityType={room ? "room" : undefined}
				fallbackIcon={HeaderIcon}
				subtitle={desktop ? undefined : contactCollectionSummary(roomDevices)}
				tintColors={tintColors.length > 0 ? tintColors : null}
				inactiveTintColors={inactiveTintColors.length > 0 ? inactiveTintColors : null}
				{tintStrength}
				{tintTransitionSeconds}
				tintInactive={!roomBrightnessActive}
				brightnessFill={desktop ? null : roomBrightnessFill}
				dragOpts={desktop ? undefined : roomDragOpts}
				readOnly
				size={desktop ? "default" : "sm"}
				onclick={desktop ? undefined : (_entity, event) => {
					if (popoverDismissedRecently()) return;
					haptics.play("selection", event);
					setOn(!isOn);
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
											aria-label={m.room_adjust_color(
								{ name: displayName },
												locale.messageOptions(),
											)}
										>
											{#if hasTint}
												<div
													class="pointer-events-none absolute inset-0 rounded-md transition-opacity duration-300 ease-out"
													style="background: {iconGradient}; opacity: {ti === true ? 1 : 0}"
													aria-hidden="true"
												></div>
											{/if}
											<AnimatedIcon icon={entity.icon} class="relative size-3.5 {iconTextClass}">
												{#snippet fallback()}
													<HeaderIcon class="relative size-3.5 {iconTextClass}" />
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
							<AnimatedIcon icon={entity.icon} class="relative size-3.5 {iconTextClass}">
								{#snippet fallback()}
									<HeaderIcon class="relative size-3.5 {iconTextClass}" />
								{/snippet}
							</AnimatedIcon>
						</div>
					{/if}
				{/snippet}
				{#snippet leadingActions()}
					{#if desktop && lightDevices.length > 0}
						<Switch checked={isOn} onCheckedChange={setOn} aria-label={m.device_toggle_named({ name: displayName }, locale.messageOptions())} />
					{/if}
					{#if hasSensors && !desktop}
						<SensorHistoryPopover
							target={room ? { kind: "room", id: room.id } : { kind: "apartment" }}
							fields={sensorFields}
							title={displayName}
							align="end"
							triggerClass="group rounded focus-visible:outline-none"
							interactive={sensorHistoryEnabled}
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
				{#snippet footer()}
					{#if desktop && roomDimmableLights.length > 0}
						<div class="pt-4">
							<BulkBrightnessSlider devices={lightDevices} onbrightness={setBrightness} />
						</div>
					{/if}
				{/snippet}
			</EntityCard>

			{#if desktop && hasSensors}
				<div class="grid grid-cols-2 gap-3" data-dashboard-sensors>
					{#each sensorReadings as reading (reading.field)}
						<SensorHistoryPopover
							target={room ? { kind: "room", id: room.id } : { kind: "apartment" }}
							fields={[reading.field]}
							title={displayName}
							triggerClass="block w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							interactive={sensorHistoryEnabled}
						>
							<div class="flex items-center gap-4 rounded-lg bg-card p-4 shadow-card">
								<div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
									<reading.icon class="size-6 text-muted-foreground" />
								</div>
								<div>
									<p class="text-xs text-muted-foreground">{reading.label}</p>
									<p class="text-2xl font-semibold tabular-nums text-foreground">{reading.value}<span class="ml-0.5 text-base font-normal text-muted-foreground">{reading.unit}</span></p>
								</div>
							</div>
						</SensorHistoryPopover>
					{/each}
				</div>
			{/if}

			{#if desktop && contacts.length > 0}
				<div class="grid grid-cols-2 gap-3" data-dashboard-contacts>
					{#each contacts as contact (contact.role)}
						<EntityCard entity={{ id: contact.role, name: formatContactSummary(contact) }} fallbackIcon={contactIcon(contact.role)} readOnly />
					{/each}
				</div>
			{/if}

			{#if filteredScenes.length > 0}
				<section aria-label={m.nav_scenes({}, locale.messageOptions())}>
				{#if desktop}
					<SectionDivider label={m.nav_scenes({}, locale.messageOptions())} class="mb-2" />
				{/if}
				<div
					class="scene-strip no-scrollbar mt-1 gap-2 p-1 {desktop ? 'grid grid-cols-2' : 'flex overflow-x-auto'}"
					class:scene-strip-single={filteredScenes.length === 1}
					class:scene-strip-pair={filteredScenes.length === 2}
					class:scene-strip-mobile-overflow={filteredScenes.length > 2}
					class:scene-strip-desktop-overflow={filteredScenes.length > 3}
				>
					{#each filteredScenes as scene (scene.id)}
						{@const active = scene.activatedAt != null}
						{@const tintColors = scenePreviewColors(scene.preview)}
						<div class="scene-card min-w-0 shrink-0">
							<EntityCard
								entity={scene}
								entityType="scene"
								fallbackIcon={Clapperboard}
								tintColors={tintColors.length > 0 ? tintColors : null}
								tintInactive={tintColors.length > 0 ? !active : null}
								readOnly
								size="sm"
								iconAreaSize="sm"
								pressFeedback
								class="h-full"
								onclick={(_scene, event) => {
									haptics.play("execute", event);
									if (active) onstopscene(scene);
									else onapplyscene(scene);
								}}
							/>
						</div>
					{/each}
				</div>
				</section>
			{/if}

			{#if room}
			{#if sectionAEntries.length > 0}
			<section>
				<div class="mb-1 flex items-center gap-3">
					<h3 class="text-sm font-semibold text-foreground">
						{m.room_lights({}, locale.messageOptions())}
					</h3>
					<div class="h-px flex-1 bg-muted" aria-hidden="true"></div>
				</div>
					<div class="grid grid-cols-2 gap-3">
						{#each sectionARows as { entry, fullWidth } (entry.key)}
							<DashboardLightCard
								entity={entry.entity}
								devices={entry.devices}
								isGroup={entry.isGroup}
								fallbackIcon={entry.fallbackIcon}
								{client}
								explicitControls={desktop}
								class={!desktop && fullWidth ? "col-span-2" : ""}
							/>
						{/each}
					</div>
			</section>
			{/if}

			{#if applianceDevices.length > 0}
				<section>
					<div class="mb-1 flex items-center gap-3">
						<h3 class="text-sm font-semibold text-foreground">
							{m.room_appliances({}, locale.messageOptions())}
						</h3>
						<div class="h-px flex-1 bg-muted" aria-hidden="true"></div>
					</div>
					<div class="grid grid-cols-2 gap-3">
						{#each applianceDevices as device (device.id)}
							<DashboardApplianceCard
								{device}
								explicitControls={desktop}
								class={!desktop && device.id === fullWidthApplianceId ? "col-span-2" : ""}
							/>
						{/each}
					</div>
				</section>
			{/if}
		{/if}
</div>

<style>
	.target-panel {
		container-type: inline-size;
	}

	@container (min-width: 840px) {
		.desktop .scene-strip {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	.scene-card {
		flex-basis: calc((100% - 0.5rem) / 2);
	}

	.scene-strip-mobile-overflow .scene-card {
		flex-basis: calc((100% - 1rem) / 2.3);
	}

	.scene-strip-single .scene-card {
		flex-basis: 100%;
	}

	@media (min-width: 640px) {
		.scene-card,
		.scene-strip-mobile-overflow .scene-card {
			flex-basis: calc((100% - 1rem) / 3);
		}

		.scene-strip-desktop-overflow .scene-card {
			flex-basis: calc((100% - 1.5rem) / 3.25);
		}

		.scene-strip-single .scene-card {
			flex-basis: 100%;
		}

		.scene-strip-pair .scene-card {
			flex-basis: calc((100% - 0.5rem) / 2);
		}
	}
</style>
