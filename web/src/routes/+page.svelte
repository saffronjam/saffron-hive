<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { getContextClient, queryStore } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { deviceStore, devicesHydrated } from "$lib/stores/devices";
	import DashboardApartmentCard from "$lib/components/dashboard-apartment-card.svelte";
	import DashboardRoomCard from "$lib/components/dashboard-room-card.svelte";
	import RoomDrawer from "$lib/components/room-drawer.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import type { GroupTag } from "$lib/components/group-tags-select.svelte";

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Dashboard" }];
	});
	onDestroy(() => pageHeader.reset());

	interface RoomMember {
		memberType: string;
		memberId: string;
	}

	interface RoomData {
		id: string;
		name: string;
		icon?: string | null;
		members: RoomMember[];
		resolvedDevices: { id: string }[];
	}

	interface GroupData {
		id: string;
		name: string;
		icon?: string | null;
		tags: GroupTag[];
		members: RoomMember[];
		resolvedDevices: { id: string }[];
	}

	interface SceneData {
		id: string;
		name: string;
		icon?: string | null;
		rooms: { id: string }[];
		actions: { targetType: string; targetId: string }[];
	}

	const ROOMS_QUERY = graphql(`
		query DashboardRooms {
			rooms {
				id
				name
				icon
				members { memberType memberId }
				resolvedDevices { id }
			}
		}
	`);

	const GROUPS_QUERY = graphql(`
		query DashboardGroups {
			groups {
				id
				name
				icon
				tags
				members { memberType memberId }
				resolvedDevices { id }
			}
		}
	`);

	const SCENES_QUERY = graphql(`
		query DashboardScenes {
			scenes {
				id
				name
				icon
				rooms { id }
				actions { targetType targetId }
			}
		}
	`);

	const APPLY_SCENE = graphql(`
		mutation DashboardApplyScene($sceneId: ID!) {
			applyScene(sceneId: $sceneId) {
				id
				name
			}
		}
	`);

	const client = getContextClient();

	const roomsQuery = queryStore<{ rooms: RoomData[] }>({ client, query: ROOMS_QUERY });
	const groupsQuery = queryStore<{ groups: GroupData[] }>({ client, query: GROUPS_QUERY });
	const scenesQuery = queryStore<{ scenes: SceneData[] }>({ client, query: SCENES_QUERY });

	const rooms = $derived($roomsQuery.data?.rooms ?? []);
	const groups = $derived($groupsQuery.data?.groups ?? []);
	const scenes = $derived($scenesQuery.data?.scenes ?? []);
	const devices = $derived(Object.values($deviceStore));

	let openRoomId = $state<string | null>(null);
	let applyingSceneId = $state<string | null>(null);

	const openRoom = $derived(openRoomId ? rooms.find((r) => r.id === openRoomId) ?? null : null);

	async function handleApplyScene(scene: { id: string; name: string }) {
		applyingSceneId = scene.id;
		const result = await client
			.mutation(APPLY_SCENE, { sceneId: scene.id })
			.toPromise();
		applyingSceneId = null;
		if (result.error) {
			console.error("Failed to apply scene:", result.error.message);
		}
	}
</script>

<div class="mx-auto flex max-w-3xl flex-col gap-3">
	<DashboardApartmentCard {devices} {client} />

	{#if $devicesHydrated && rooms.length === 0}
		<div class="rounded-lg shadow-card bg-card p-12 text-center">
			<p class="text-muted-foreground">No rooms configured yet.</p>
			<p class="mt-2 text-sm text-muted-foreground">
				Create a room on the Rooms page and add devices or light groups to it.
			</p>
		</div>
	{:else}
		<div class="mt-3 flex items-center gap-3">
			<h2 class="text-sm font-medium text-muted-foreground">Rooms</h2>
			<div class="h-px flex-1 bg-border"></div>
		</div>
		{#each rooms as room (room.id)}
			<DashboardRoomCard
				{room}
				{devices}
				{groups}
				{rooms}
				{client}
				onopen={(r) => (openRoomId = r.id)}
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
	{applyingSceneId}
	onclose={() => (openRoomId = null)}
	onapplyscene={handleApplyScene}
/>
