<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import { toast } from "svelte-sonner";
	import { DoorOpen, Group as GroupIcon } from "@lucide/svelte";
	import { deviceIcon, deviceDisplayName } from "$lib/utils";
	import { deviceSupportsCaps } from "$lib/effect-editable";
	import { resolveTargetDevices, type GroupLite, type RoomLite, type TargetKind } from "$lib/target-resolve";
	import { deviceStore, deviceSupportsNativeEffect, type Device } from "$lib/stores/devices";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { groupsStore } from "$lib/stores/groups.svelte";

	interface BaseProps {
		open: boolean;
		requiredCapabilities?: readonly string[];
		onclose: () => void;
		onstarted?: () => void;
	}

	type Props =
		| (BaseProps & { mode: "timeline"; effectId: string; nativeName?: undefined })
		| (BaseProps & { mode: "native"; nativeName: string; effectId?: undefined });

	let {
		open,
		mode,
		effectId,
		nativeName,
		requiredCapabilities = [],
		onclose,
		onstarted,
	}: Props = $props();

	const RUN_EFFECT = graphql(`
		mutation EffectRunTargetDrawerRunEffect($effectId: ID!, $targetType: String!, $targetId: ID!) {
			runEffect(effectId: $effectId, targetType: $targetType, targetId: $targetId) {
				id
			}
		}
	`);

	const RUN_NATIVE_EFFECT = graphql(`
		mutation EffectRunTargetDrawerRunNativeEffect($nativeName: String!, $targetType: String!, $targetId: ID!) {
			runNativeEffect(nativeName: $nativeName, targetType: $targetType, targetId: $targetId) {
				id
			}
		}
	`);

	const client = getContextClient();
	let drawerOpen = $state(false);
	const devices = $derived(Object.values($deviceStore).filter((d) => !d.disabled));
	const groups = $derived(groupsStore.items);
	const rooms = $derived(roomsStore.items);
	let starting = $state(false);

	$effect(() => {
		drawerOpen = open;
	});

	$effect(() => {
		if (!drawerOpen && open) {
			onclose();
		}
	});


	const groupsLite = $derived<GroupLite[]>(
		groups.map((g) => ({
			id: g.id,
			name: g.name,
			icon: g.icon,
			members: g.members.map((m) => ({ memberType: m.memberType, memberId: m.memberId })),
		})),
	);

	const roomsLite = $derived<RoomLite[]>(
		rooms.map((r) => ({
			id: r.id,
			name: r.name,
			icon: r.icon,
			members: r.members.map((m) => ({ memberType: m.memberType, memberId: m.memberId })),
		})),
	);

	function deviceFilter(device: Device): boolean {
		if (mode === "native") {
			return deviceSupportsNativeEffect(device, nativeName!);
		}
		if (requiredCapabilities.length === 0) return true;
		return deviceSupportsCaps(device, requiredCapabilities);
	}

	const eligibleDevices = $derived(devices.filter(deviceFilter));

	function targetReachesEligibleDevice(type: TargetKind, id: string): boolean {
		const reached = resolveTargetDevices({ type, id }, devices, groupsLite, roomsLite);
		return reached.some(deviceFilter);
	}

	const eligibleGroups = $derived(groups.filter((g) => targetReachesEligibleDevice("group", g.id)));
	const eligibleRooms = $derived(rooms.filter((r) => targetReachesEligibleDevice("room", r.id)));

	const drawerGroups = $derived.by((): DrawerGroup<TargetKind>[] => {
		const out: DrawerGroup<TargetKind>[] = [];
		if (eligibleDevices.length > 0) {
			out.push({
				heading: "Devices",
				items: eligibleDevices.map((d) => ({
					type: "device" as const,
					id: d.id,
					name: deviceDisplayName(d),
					icon: deviceIcon(d.type),
					iconRef: d.icon ?? null,
					searchValue: `${d.name} ${d.type}`,
				})),
			});
		}
		if (eligibleGroups.length > 0) {
			out.push({
				heading: "Groups",
				items: eligibleGroups.map((g) => ({
					type: "group" as const,
					id: g.id,
					name: g.name,
					icon: GroupIcon,
					badge: `${g.members.length} member${g.members.length === 1 ? "" : "s"}`,
				})),
			});
		}
		if (eligibleRooms.length > 0) {
			out.push({
				heading: "Rooms",
				items: eligibleRooms.map((r) => ({
					type: "room" as const,
					id: r.id,
					name: r.name,
					icon: DoorOpen,
					badge: `${r.members.length} member${r.members.length === 1 ? "" : "s"}`,
				})),
			});
		}
		return out;
	});

	async function handleSelect(type: TargetKind, id: string) {
		if (starting) return;
		starting = true;
		try {
			if (mode === "native") {
				const result = await client
					.mutation(RUN_NATIVE_EFFECT, {
						nativeName: nativeName!,
						targetType: type,
						targetId: id,
					})
					.toPromise();
				if (result.error) {
					toast.error(`Could not start effect: ${result.error.message}`);
					return;
				}
			} else {
				const result = await client
					.mutation(RUN_EFFECT, {
						effectId: effectId!,
						targetType: type,
						targetId: id,
					})
					.toPromise();
				if (result.error) {
					toast.error(`Could not start effect: ${result.error.message}`);
					return;
				}
			}
			toast.success("Effect started");
			drawerOpen = false;
			onstarted?.();
		} finally {
			starting = false;
		}
	}
</script>

<HiveDrawer
	bind:open={drawerOpen}
	title="Run effect"
	description="Pick a device, group, or room to run this effect on."
	groups={drawerGroups}
	onselect={handleSelect}
/>
