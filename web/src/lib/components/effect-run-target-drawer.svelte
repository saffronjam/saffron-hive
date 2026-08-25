<script lang="ts">
	import { getContextClient, subscriptionStore } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import { toast } from "svelte-sonner";
	import { DoorOpen, Group as GroupIcon } from "@lucide/svelte";
	import { deviceIcon, deviceDisplayName, groupDisplayName } from "$lib/utils";
	import { deviceSupportsCaps } from "$lib/effect-editable";
	import { resolveTargetDevices, type GroupLite, type RoomLite, type TargetKind } from "$lib/target-resolve";
	import { deviceStore, deviceSupportsNativeEffect, isRuntimeEnabledDevice, type Device } from "$lib/stores/devices";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { groupsStore } from "$lib/stores/groups.svelte";
	import { NativeEffectRunStatus, NativeEffectSupportStatus } from "$lib/gql/graphql";

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
				runId
				devices {
					deviceId
					status
				}
			}
		}
	`);

	const NATIVE_EFFECT_SUPPORT = graphql(`
		query EffectRunTargetDrawerNativeSupport($name: String!) {
			nativeEffectSupport(name: $name) {
				deviceId
				status
			}
		}
	`);

	const NATIVE_EFFECT_SUPPORT_CHANGED = graphql(`
		subscription EffectRunTargetDrawerNativeSupportChanged {
			nativeEffectSupportChanged
		}
	`);

	const client = getContextClient();
	let drawerOpen = $state(false);
	const devices = $derived(Object.values($deviceStore).filter(isRuntimeEnabledDevice));
	const groups = $derived(groupsStore.items);
	const rooms = $derived(roomsStore.items);
	let starting = $state(false);
	let pendingTarget = $state<{ type: TargetKind; id: string } | null>(null);
	let supportByDevice = $state<Record<string, NativeEffectSupportStatus>>({});
	let supportRequest = 0;
	const supportUpdates = subscriptionStore({ client, query: NATIVE_EFFECT_SUPPORT_CHANGED });

	$effect(() => {
		drawerOpen = open;
	});

	$effect(() => {
		if (!drawerOpen && open) {
			onclose();
		}
	});

	async function loadNativeSupport() {
		if (mode !== "native" || !nativeName) return;
		const request = ++supportRequest;
		const result = await client
			.query(NATIVE_EFFECT_SUPPORT, { name: nativeName }, { requestPolicy: "network-only" })
			.toPromise();
		if (request !== supportRequest || result.error) return;
		supportByDevice = Object.fromEntries(
			(result.data?.nativeEffectSupport ?? []).map((item) => [item.deviceId, item.status]),
		);
	}

	$effect(() => {
		if (!drawerOpen || mode !== "native" || !nativeName) return;
		void loadNativeSupport();
	});

	$effect(() => {
		if (!$supportUpdates.data?.nativeEffectSupportChanged || !drawerOpen || mode !== "native") return;
		void loadNativeSupport();
	});


	const groupsLite = $derived<GroupLite[]>(
		groups.map((g) => ({
			id: g.id,
			name: groupDisplayName(g),
			friendlyName: g.friendlyName,
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

	function targetEligibleDevices(type: TargetKind, id: string): Device[] {
		const reached = resolveTargetDevices({ type, id }, devices, groupsLite, roomsLite);
		return reached.filter(deviceFilter);
	}

	function deviceSupportStatus(device: Device): NativeEffectSupportStatus {
		return supportByDevice[device.id] ?? NativeEffectSupportStatus.Untested;
	}

	function supportBadge(device: Device): string {
		switch (deviceSupportStatus(device)) {
			case NativeEffectSupportStatus.Confirmed:
				return "Confirmed";
			case NativeEffectSupportStatus.Unsupported:
				return "Unsupported";
			default:
				return "Untested";
		}
	}

	function commandableTargetCount(type: TargetKind, id: string): number {
		return targetEligibleDevices(type, id).filter(
			(device) => mode !== "native" || deviceSupportStatus(device) !== NativeEffectSupportStatus.Unsupported,
		).length;
	}

	const eligibleGroups = $derived(groups.filter((g) => targetEligibleDevices("group", g.id).length > 0));
	const eligibleRooms = $derived(rooms.filter((r) => targetEligibleDevices("room", r.id).length > 0));

	const drawerGroups = $derived.by((): DrawerGroup<TargetKind>[] => {
		const out: DrawerGroup<TargetKind>[] = [];
		if (eligibleDevices.length > 0) {
			out.push({
				heading: "Devices",
				items: eligibleDevices.map((d) => ({
					type: "device" as const,
					id: d.id,
					name: deviceDisplayName(d),
					icon: deviceIcon(d.type, d.roles.contact),
					iconRef: d.icon ?? null,
					searchValue: `${d.name} ${d.type}`,
					badge: mode === "native" ? supportBadge(d) : undefined,
					disabled: mode === "native" && deviceSupportStatus(d) === NativeEffectSupportStatus.Unsupported,
				})),
			});
		}
		if (eligibleGroups.length > 0) {
			out.push({
				heading: "Groups",
				items: eligibleGroups.map((g) => ({
					type: "group" as const,
					id: g.id,
					name: groupDisplayName(g),
					icon: GroupIcon,
					badge: mode === "native"
						? `${commandableTargetCount("group", g.id)} target${commandableTargetCount("group", g.id) === 1 ? "" : "s"}`
						: `${g.members.length} member${g.members.length === 1 ? "" : "s"}`,
					disabled: mode === "native" && commandableTargetCount("group", g.id) === 0,
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
					badge: mode === "native"
						? `${commandableTargetCount("room", r.id)} target${commandableTargetCount("room", r.id) === 1 ? "" : "s"}`
						: `${r.members.length} member${r.members.length === 1 ? "" : "s"}`,
					disabled: mode === "native" && commandableTargetCount("room", r.id) === 0,
				})),
			});
		}
		return out;
	});

	async function handleSelect(type: TargetKind, id: string) {
		if (starting) return;
		starting = true;
		pendingTarget = { type, id };
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
				const devices = result.data?.runNativeEffect.devices ?? [];
				const confirmed = devices.filter((device) => device.status === NativeEffectRunStatus.Confirmed).length;
				const unsupported = devices.filter((device) => device.status === NativeEffectRunStatus.Unsupported).length;
				const unconfirmed = devices.filter((device) => device.status === NativeEffectRunStatus.Unconfirmed).length;
				if (confirmed === devices.length && devices.length > 0) {
					toast.success(`Effect started on ${confirmed} device${confirmed === 1 ? "" : "s"}`);
				} else if (confirmed > 0) {
					const details = [
						unsupported > 0 ? `${unsupported} unsupported` : "",
						unconfirmed > 0 ? `${unconfirmed} unconfirmed` : "",
					].filter(Boolean).join(" · ");
					toast.warning(`Effect started on ${confirmed} of ${devices.length} devices`, { description: details });
				} else if (unsupported === devices.length && devices.length > 0) {
					toast.error("Effect is unsupported on the selected target");
				} else {
					toast.warning("Effect requested, but no device confirmed it", {
						description: unsupported > 0 ? `${unsupported} unsupported` : undefined,
					});
				}
				void loadNativeSupport();
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
				toast.success("Effect started");
			}
			drawerOpen = false;
			onstarted?.();
		} finally {
			starting = false;
			pendingTarget = null;
		}
	}
</script>

<HiveDrawer
	bind:open={drawerOpen}
	title="Run effect"
	description="Pick a device, group, or room to run this effect on."
	groups={drawerGroups}
	disabled={starting}
	pendingItem={pendingTarget}
	hapticOnSelect="execute"
	onselect={handleSelect}
/>
