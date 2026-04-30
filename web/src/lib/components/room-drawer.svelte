<script lang="ts">
	import {
		Sheet,
		SheetContent,
		SheetTitle,
		SheetDescription,
	} from "$lib/components/ui/sheet/index.js";
	import EntityCard from "$lib/components/entity-card.svelte";
	import DashboardLightCard from "$lib/components/dashboard-light-card.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
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
	const sensorReadings = $derived(aggregateSensorReadings(sensors));
	const hasSensors = $derived(sensorReadings.length > 0);

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
				entity: { id: dev.id, name: dev.name, icon: null },
				devices: [dev],
				isGroup: false,
				fallbackIcon: deviceIcon(dev.type) ?? Lightbulb,
			});
		}

		return entries;
	});

	const filteredScenes = $derived.by((): SceneInfo[] => {
		if (!room || roomDeviceIds.size === 0) return [];
		return scenes.filter((s) => {
			for (const a of s.actions) {
				const resolved = resolveTargetDevices(
					{ type: a.targetType as "device" | "group" | "room", id: a.targetId },
					devices,
					groups,
					rooms,
				);
				for (const d of resolved) {
					if (roomDeviceIds.has(d.id)) return true;
				}
			}
			return false;
		});
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
		class="max-h-[85vh] overflow-y-auto rounded-t-2xl p-4 sm:max-w-none lg:left-1/2! lg:right-auto! lg:w-[calc(100%-3rem)] lg:max-w-3xl lg:-translate-x-1/2"
	>
		<SheetTitle class="sr-only">{room?.name ?? "Room"}</SheetTitle>
		<SheetDescription class="sr-only">
			Scenes and lights for this room.
		</SheetDescription>

		{#if room}
			<div class="mr-12">
				<EntityCard
					entity={room}
					fallbackIcon={DoorOpen}
					subtitle={isOn ? `On · ${onLights.length} of ${lightDevices.length} light${lightDevices.length === 1 ? "" : "s"}` : "Off"}
					tintColors={tintColors.length > 0 ? tintColors : null}
					{tintStrength}
					tintInactive={!isOn}
					readOnly
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
			</div>

			{#if filteredScenes.length > 0}
				<div class="mt-4 flex gap-2 overflow-x-auto pb-1">
					{#each filteredScenes as scene (scene.id)}
						<Button
							variant="outline"
							size="sm"
							class="shrink-0"
							disabled={applyingSceneId === scene.id}
							onclick={() => onapplyscene(scene)}
						>
							<Clapperboard class="size-3.5" />
							<span>{applyingSceneId === scene.id ? "Applying..." : scene.name}</span>
						</Button>
					{/each}
				</div>
			{/if}

			<section class="mt-6">
				<div class="mb-3 flex items-center gap-3">
					<h3 class="text-sm font-semibold text-foreground">Lights</h3>
					<div class="h-px flex-1 bg-muted" aria-hidden="true"></div>
				</div>
				{#if sectionAEntries.length === 0}
					<p class="text-sm text-muted-foreground">No lights in this room.</p>
				{:else}
					<div class="grid grid-cols-2 gap-3">
						{#each sectionAEntries as entry (entry.key)}
							<DashboardLightCard
								entity={entry.entity}
								devices={entry.devices}
								isGroup={entry.isGroup}
								fallbackIcon={entry.fallbackIcon}
								{client}
							/>
						{/each}
					</div>
				{/if}
			</section>

			<section class="mt-6">
				<div class="mb-3 flex items-center gap-3">
					<h3 class="text-sm font-semibold text-foreground">More</h3>
					<div class="h-px flex-1 bg-muted" aria-hidden="true"></div>
				</div>
				<p class="text-sm text-muted-foreground">Coming soon.</p>
			</section>
		{/if}
	</SheetContent>
</Sheet>
