<script lang="ts">
	import { measureMount } from "$lib/perf";
	import SectionDivider from "$lib/components/section-divider.svelte";
	import { getContextClient, queryStore } from "@urql/svelte";
	import { pushState } from "$app/navigation";
	import { page } from "$app/state";
	import { graphql } from "$lib/gql";
	import {
		deviceStore,
		devicesHydrated,
		isApplianceDevice,
		isLightControlDevice,
		isRuntimeEnabledDevice,
	} from "$lib/stores/devices";
	import { roomsStore, type Room } from "$lib/stores/rooms.svelte";
	import { groupsStore } from "$lib/stores/groups.svelte";
	import { scenesStore } from "$lib/stores/scenes.svelte";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import DashboardApartmentCard from "$lib/components/dashboard-apartment-card.svelte";
	import DashboardRoomCard from "$lib/components/dashboard-room-card.svelte";
	import RoomDrawer from "$lib/components/room-drawer.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { PlugZap } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { resolveTargetDevices } from "$lib/target-resolve";

	interface Props {
		/**
		 * Whether this is the page the user is on. The component outlives
		 * navigation — the layout keeps it mounted after the first visit — so
		 * shared surfaces (the page header) and timers gate on this.
		 */
		visible: boolean;
	}

	let { visible }: Props = $props();

	$effect(() => {
		if (!visible) return;
		pageHeader.breadcrumbs = [{ label: "Dashboard" }];
	});

	const INTEGRATIONS_QUERY = graphql(`
		query DashboardIntegrations {
			integrations {
				provider
				configured
			}
		}
	`);

	const client = getContextClient();

	const integrationsQuery = queryStore({ client, query: INTEGRATIONS_QUERY });

	const rooms = $derived(roomsStore.items);
	const groups = $derived(groupsStore.items);
	// The dashboard is purely a runtime surface, so runtime-disabled devices leave it
	// entirely: no card, no room membership, no contribution to a sensor average.
	const devices = $derived(Object.values($deviceStore).filter(isRuntimeEnabledDevice));
	const orderedRooms = $derived.by(() => {
		const withLights: Room[] = [];
		const withAppliances: Room[] = [];
		const withoutControls: Room[] = [];
		for (const room of rooms) {
			const roomDevices = resolveTargetDevices(
				{ type: "room", id: room.id },
				devices,
				groups,
				rooms,
			);
			if (roomDevices.some(isLightControlDevice)) withLights.push(room);
			else if (roomDevices.some(isApplianceDevice)) withAppliances.push(room);
			else withoutControls.push(room);
		}
		return [...withLights, ...withAppliances, ...withoutControls];
	});

	const needsIntegration = $derived(
		!!$integrationsQuery.data && !$integrationsQuery.data.integrations.some((i) => i.configured),
	);

	const scenes = $derived(scenesStore.items);

	const openRoomId = $derived<string | null>(
		(page.state as { dashboardRoomId?: string }).dashboardRoomId ?? null,
	);

	const openRoom = $derived(openRoomId ? rooms.find((r) => r.id === openRoomId) ?? null : null);

	function openDrawer(roomId: string) {
		pushState("", { ...page.state, dashboardRoomId: roomId });
	}

	function closeDrawer() {
		if (openRoomId !== null) history.back();
	}

	async function handleApplyScene(scene: { id: string; name: string }) {
		try {
			await scenesStore.apply(client, scene.id);
		} catch (e) {
			console.error("Failed to apply scene:", graphqlErrorMessage(e, "unknown error"));
		}
	}

	async function handleStopScene(scene: { id: string; name: string }) {
		try {
			await scenesStore.deactivate(client, scene.id);
		} catch (e) {
			console.error("Failed to stop scene:", graphqlErrorMessage(e, "unknown error"));
		}
	}

	const mountTimer = measureMount("dashboard", { ready: () => $devicesHydrated && roomsStore.hydrated });
	$effect(() => mountTimer.tick());
</script>

<div class="mx-auto flex max-w-3xl flex-col gap-3">
	{#if !needsIntegration}
		<DashboardApartmentCard {devices} {client} />
	{/if}

	{#if needsIntegration}
		<div class="dashboard-card shadow-card bg-card p-12 text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<PlugZap class="size-6 text-muted-foreground" />
			</div>
			<p class="text-muted-foreground">No integrations yet.</p>
			<p class="mt-2 text-sm text-muted-foreground">
				Add an integration to bring external devices into Saffron Hive.
			</p>
			<Button class="mt-4" href="/integrations">Set up your first integration</Button>
		</div>
	{:else if $devicesHydrated && rooms.length === 0}
		<div class="dashboard-card shadow-card bg-card p-12 text-center">
			<p class="text-muted-foreground">No rooms configured yet.</p>
			<p class="mt-2 text-sm text-muted-foreground">
				Create a room on the Rooms page and add devices or light groups to it.
			</p>
		</div>
	{:else}
		<SectionDivider label="Rooms" class="mt-3" />
		{#each orderedRooms as room (room.id)}
			<DashboardRoomCard
				{room}
				{devices}
				{groups}
				{rooms}
				{client}
				onopen={(r) => openDrawer(r.id)}
			/>
		{/each}
	{/if}
</div>

<RoomDrawer
	room={openRoom}
	open={openRoomId !== null}
	{devices}
	{groups}
	{rooms}
	{scenes}
	{client}
	onclose={closeDrawer}
	onapplyscene={handleApplyScene}
	onstopscene={handleStopScene}
/>
