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
	import DashboardTargetPanel, { type DashboardTarget } from "$lib/components/dashboard-target-panel.svelte";
	import { DashboardNavigation } from "$lib/dashboard-navigation.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { PlugZap } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { resolveTargetDevices } from "$lib/target-resolve";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { untrack } from "svelte";

	interface Props {
		/**
		 * Whether this is the page the user is on. The component outlives
		 * navigation — the layout keeps it mounted after the first visit — so
		 * shared surfaces (the page header) and timers gate on this.
		 */
		visible: boolean;
		guest?: boolean;
		onworkstationchange?: (workstation: boolean) => void;
	}

	let { visible, guest = false, onworkstationchange }: Props = $props();
	let contentWidth = $state(0);

	$effect(() => {
		if (!visible) return;
		pageHeader.breadcrumbs = [{ label: m.nav_dashboard({}, locale.messageOptions()) }];
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

	const integrationsQuery = queryStore({
		client,
		query: INTEGRATIONS_QUERY,
		pause: untrack(() => guest),
	});

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
		!guest && !!$integrationsQuery.data && !$integrationsQuery.data.integrations.some((i) => i.configured),
	);

	const scenes = $derived(scenesStore.items);
	const workstation = $derived(contentWidth >= 960 && !needsIntegration);
	const navigation = new DashboardNavigation({
		open: (roomId) => pushState("", { ...page.state, dashboardRoomId: roomId }),
		back: () => history.back(),
	});

	const openRoomId = $derived<string | null>(
		(page.state as { dashboardRoomId?: string }).dashboardRoomId ?? null,
	);

	const openRoom = $derived(openRoomId ? rooms.find((r) => r.id === openRoomId) ?? null : null);

	const selectedRoom = $derived(rooms.find((r) => r.id === navigation.selectedRoomId) ?? null);
	const selectedTarget = $derived<DashboardTarget>(selectedRoom ? { kind: "room", room: selectedRoom } : { kind: "apartment" });

	$effect(() => {
		if (!visible || contentWidth === 0) return;
		const roomIds = new Set(rooms.map((room) => room.id));
		const wide = workstation;
		const drawerId = openRoomId;
		const hydrated = roomsStore.hydrated;
		untrack(() => navigation.synchronize(wide, drawerId, roomIds, hydrated));
	});

	$effect(() => {
		if (visible) onworkstationchange?.(workstation);
	});

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

<div bind:clientWidth={contentWidth} class="w-full {workstation ? 'h-full min-h-0 flex-1' : ''}">
{#if visible}
{#if workstation}
	<div class="mx-auto grid h-full min-h-0 max-w-7xl grid-cols-[320px_minmax(0,1fr)] gap-6" data-dashboard-workstation>
		<nav class="-m-2 flex min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain p-3 [&>*]:shrink-0" aria-label={m.dashboard_rooms({}, locale.messageOptions())}>
			<div class="transition-opacity duration-200 {selectedRoom ? 'opacity-75' : ''}">
				<DashboardApartmentCard {devices} {client} onselect={() => navigation.select(null)} selected={!selectedRoom} sensorHistoryEnabled={false} />
			</div>
			<SectionDivider label={m.dashboard_rooms({}, locale.messageOptions())} class="mt-3" />
			{#each orderedRooms as room (room.id)}
				<div class="transition-opacity duration-200 {selectedRoom?.id === room.id ? '' : 'opacity-75'}">
					<DashboardRoomCard {room} {devices} {groups} {rooms} {client} navigationOnly selected={selectedRoom?.id === room.id} sensorHistoryEnabled={false} onopen={(room) => navigation.select(room.id)} />
				</div>
			{/each}
			{#if roomsStore.hydrated && rooms.length === 0}
				<p class="text-sm text-muted-foreground">{m.dashboard_no_rooms_help({}, locale.messageOptions())}</p>
			{/if}
		</nav>
		{#key navigation.selectedRoomId}
			<section class="min-h-0 overflow-y-auto overscroll-contain p-1" aria-label={selectedRoom ? selectedRoom.name : m.dashboard_apartment({}, locale.messageOptions())} data-dashboard-panel>
				<DashboardTargetPanel target={selectedTarget} presentation="desktop" {devices} {groups} {rooms} {scenes} {client} sensorHistoryEnabled={!guest} onapplyscene={handleApplyScene} onstopscene={handleStopScene} />
			</section>
		{/key}
	</div>
{:else}
<div class="mx-auto flex max-w-3xl flex-col gap-3">
	{#if !needsIntegration}
		<DashboardApartmentCard {devices} {client} sensorHistoryEnabled={!guest} />
	{/if}

	{#if needsIntegration}
		<div class="rounded-lg shadow-card bg-card p-12 text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<PlugZap class="size-6 text-muted-foreground" />
			</div>
			<p class="text-muted-foreground">
				{m.dashboard_no_integrations({}, locale.messageOptions())}
			</p>
			<p class="mt-2 text-sm text-muted-foreground">
				{m.dashboard_no_integrations_help({}, locale.messageOptions())}
			</p>
			<Button class="mt-4" href="/integrations">
				{m.dashboard_setup_integration({}, locale.messageOptions())}
			</Button>
		</div>
	{:else if $devicesHydrated && rooms.length === 0}
		<div class="rounded-lg shadow-card bg-card p-12 text-center">
			<p class="text-muted-foreground">
				{m.dashboard_no_rooms({}, locale.messageOptions())}
			</p>
			<p class="mt-2 text-sm text-muted-foreground">
				{m.dashboard_no_rooms_help({}, locale.messageOptions())}
			</p>
		</div>
	{:else}
		<SectionDivider label={m.dashboard_rooms({}, locale.messageOptions())} class="mt-3" />
		{#each orderedRooms as room (room.id)}
			<DashboardRoomCard
				{room}
				{devices}
				{groups}
				{rooms}
				{client}
				sensorHistoryEnabled={!guest}
				onopen={(r) => navigation.select(r.id)}
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
	sensorHistoryEnabled={!guest}
	onclose={() => navigation.close()}
	onapplyscene={handleApplyScene}
	onstopscene={handleStopScene}
/>
{/if}
{/if}
</div>
