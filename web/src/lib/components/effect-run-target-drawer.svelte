<script lang="ts">
	import { getContextClient, subscriptionStore } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { onGraphQLRecovered } from "$lib/graphql/app-recovery";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import { toast } from "svelte-sonner";
	import { DoorOpen, Group as GroupIcon } from "@lucide/svelte";
	import { deviceIcon, deviceDisplayName, entityDisplayName, groupDisplayName } from "$lib/utils";
	import { deviceSupportsCaps } from "$lib/effect-editable";
	import { resolveTargetDevices, type GroupLite, type RoomLite, type TargetKind } from "$lib/target-resolve";
	import { deviceStore, deviceSupportsNativeEffect, isRuntimeEnabledDevice, type Device } from "$lib/stores/devices";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { groupsStore } from "$lib/stores/groups.svelte";
	import { NativeEffectRunStatus, NativeEffectSupportStatus } from "$lib/gql/graphql";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { formatList } from "$lib/i18n/format";
	import { localizedNamesStore } from "$lib/stores/localized-names.svelte";

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

	onGraphQLRecovered(() => {
		if (drawerOpen) void loadNativeSupport();
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
			name: entityDisplayName("room", r),
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
				return m.effects_support_confirmed({}, locale.messageOptions());
			case NativeEffectSupportStatus.Unsupported:
				return m.effects_support_unsupported({}, locale.messageOptions());
			default:
				return m.effects_support_untested({}, locale.messageOptions());
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
		void locale.currentLanguage;
		const out: DrawerGroup<TargetKind>[] = [];
		if (eligibleDevices.length > 0) {
			out.push({
				heading: m.scene_editor_devices({}, locale.messageOptions()),
				items: eligibleDevices.map((d) => ({
					type: "device" as const,
					id: d.id,
					name: deviceDisplayName(d),
					icon: deviceIcon(d.type, d.roles.contact),
					iconRef: d.icon ?? null,
					searchValue: `${localizedNamesStore.searchValues("device", d.id, d.name, d.friendlyName).join(" ")} ${d.type}`,
					badge: mode === "native" ? supportBadge(d) : undefined,
					disabled: mode === "native" && deviceSupportStatus(d) === NativeEffectSupportStatus.Unsupported,
				})),
			});
		}
		if (eligibleGroups.length > 0) {
			out.push({
				heading: m.scene_editor_groups({}, locale.messageOptions()),
				items: eligibleGroups.map((g) => ({
					type: "group" as const,
					id: g.id,
					name: groupDisplayName(g),
					icon: GroupIcon,
					searchValue: localizedNamesStore.searchValues("group", g.id, g.name, g.friendlyName).join(" "),
					badge: mode === "native"
						? m.scenes_target_count({ count: commandableTargetCount("group", g.id) }, locale.messageOptions())
						: m.scenes_member_count({ count: g.members.length }, locale.messageOptions()),
					disabled: mode === "native" && commandableTargetCount("group", g.id) === 0,
				})),
			});
		}
		if (eligibleRooms.length > 0) {
			out.push({
				heading: m.scene_editor_rooms({}, locale.messageOptions()),
				items: eligibleRooms.map((r) => ({
					type: "room" as const,
					id: r.id,
					name: entityDisplayName("room", r),
					icon: DoorOpen,
					searchValue: localizedNamesStore.searchValues("room", r.id, r.name).join(" "),
					badge: mode === "native"
						? m.scenes_target_count({ count: commandableTargetCount("room", r.id) }, locale.messageOptions())
						: m.scenes_member_count({ count: r.members.length }, locale.messageOptions()),
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
					console.error(result.error);
					toast.error(m.effects_start_failed({}, locale.messageOptions()));
					return;
				}
				const devices = result.data?.runNativeEffect.devices ?? [];
				const confirmed = devices.filter((device) => device.status === NativeEffectRunStatus.Confirmed).length;
				const unsupported = devices.filter((device) => device.status === NativeEffectRunStatus.Unsupported).length;
				const unconfirmed = devices.filter((device) => device.status === NativeEffectRunStatus.Unconfirmed).length;
				if (confirmed === devices.length && devices.length > 0) {
					toast.success(m.effects_started_devices({ count: confirmed }, locale.messageOptions()));
				} else if (confirmed > 0) {
					const details = [
						unsupported > 0 ? m.effects_unsupported_count({ count: unsupported }, locale.messageOptions()) : "",
						unconfirmed > 0 ? m.effects_unconfirmed_count({ count: unconfirmed }, locale.messageOptions()) : "",
					].filter(Boolean);
					toast.warning(m.effects_started_partial({ confirmed, total: devices.length }, locale.messageOptions()), { description: formatList(details) });
				} else if (unsupported === devices.length && devices.length > 0) {
					toast.error(m.effects_target_unsupported({}, locale.messageOptions()));
				} else {
					toast.warning(m.effects_no_confirmation({}, locale.messageOptions()), {
						description: unsupported > 0 ? m.effects_unsupported_count({ count: unsupported }, locale.messageOptions()) : undefined,
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
					console.error(result.error);
					toast.error(m.effects_start_failed({}, locale.messageOptions()));
					return;
				}
				toast.success(m.effects_started({}, locale.messageOptions()));
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
	title={m.effects_run({}, locale.messageOptions())}
	description={m.effects_run_description({}, locale.messageOptions())}
	groups={drawerGroups}
	disabled={starting}
	pendingItem={pendingTarget}
	hapticOnSelect="execute"
	onselect={handleSelect}
/>
