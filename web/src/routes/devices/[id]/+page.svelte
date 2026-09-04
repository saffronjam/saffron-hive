<script lang="ts">
	import { page } from "$app/stores";
	import { onDestroy, untrack } from "svelte";
	import { fly } from "svelte/transition";
	import type { Device, DeviceState } from "$lib/stores/devices";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import IconCell from "$lib/components/table-cells/icon-cell.svelte";
	import { deviceDisplayName, deviceIcon, entityDisplayName, groupDisplayName } from "$lib/utils";
	import { deviceStore, devicesHydrated } from "$lib/stores/devices";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { groupsStore } from "$lib/stores/groups.svelte";
	import { floorplanStore } from "$lib/stores/floorplan.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import LightControls from "$lib/components/light-controls.svelte";
	import ClimateControls from "$lib/components/climate-controls.svelte";
	import SensorDisplay from "$lib/components/sensor-display.svelte";
	import ButtonDisplay from "$lib/components/button-display.svelte";
	import DeviceConfigurationEditor from "$lib/components/device-configuration-editor.svelte";
	import StateHistoryChart from "$lib/components/state-history-chart.svelte";
	import BucketResolutionSelect from "$lib/components/bucket-resolution-select.svelte";
	import DateRangePicker from "$lib/components/date-range-picker.svelte";
	import PlugDisplay from "$lib/components/plug-display.svelte";
	import MemberTable from "$lib/components/member-table.svelte";
	import DeviceRolesEditor from "$lib/components/device-roles-editor.svelte";
	import type { ContactRole, ControlledLoadRole, DeviceRoles } from "$lib/gql/graphql";
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import { membershipRowsForDevice } from "$lib/memberships";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import ZigbeeDeviceInfoCard from "$lib/components/zigbee-device-info-card.svelte";
	import ZigbeeDetailsCard from "$lib/components/zigbee-details-card.svelte";
	import {
		configurationContains,
		configurationEntriesEqual,
		writableConfigurationCapabilities,
	} from "$lib/device-configuration";
	import { ArrowLeft, DoorOpen, ExternalLink, Group as GroupIcon, Trash2, Undo2 } from "@lucide/svelte";

	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import type {
		Zigbee2MqttDeviceDocumentation,
		Zigbee2MqttDeviceMetadata,
	} from "$lib/gql/graphql";
	import { loadSessionSnapshot, saveSessionSnapshot } from "$lib/session-cache";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface ZigbeeDetailSnapshot {
		metadata: Zigbee2MqttDeviceMetadata | null;
		frontendUrl: string | null;
		documentation: Zigbee2MqttDeviceDocumentation | null;
	}

	const ZIGBEE_DETAIL_CACHE_VERSION = 3;
	const zigbeeDetailCacheName = (id: string) => `device-zigbee-detail:${id}`;
	const loadZigbeeDetailSnapshot = (id: string) =>
		loadSessionSnapshot<ZigbeeDetailSnapshot>(
			typeof window === "undefined" ? null : window.sessionStorage,
			zigbeeDetailCacheName(id),
			ZIGBEE_DETAIL_CACHE_VERSION,
		);
	const initialDeviceId = $page.params.id ?? "";
	const initialZigbeeDetail = loadZigbeeDetailSnapshot(initialDeviceId);
	const deviceId = $derived($page.params.id ?? "");

	// Generic device state remains live in the shared store. Zigbee-specific
	// detail is loaded only on this route.
	const device = $derived($deviceStore[deviceId] ?? null);
	let zigbeeMetadata = $state<Zigbee2MqttDeviceMetadata | null | undefined>(
		initialZigbeeDetail?.metadata,
	);
	let zigbeeFrontendUrl = $state<string | null>(initialZigbeeDetail?.frontendUrl ?? null);
	let zigbeeDocumentation = $state<Zigbee2MqttDeviceDocumentation | null>(
		initialZigbeeDetail?.documentation ?? null,
	);
	let metadataDeviceId = $state("");
	let documentationRequestKey = $state("");
	const firmwareUpdateAvailable = $derived(
		zigbeeMetadata?.ota.installedVersion != null &&
			zigbeeMetadata.ota.latestVersion != null &&
			zigbeeMetadata.ota.latestVersion !== "-1" &&
			zigbeeMetadata.ota.installedVersion !== zigbeeMetadata.ota.latestVersion,
	);
	const firmwareUpdateUrl = $derived(
		firmwareUpdateAvailable && zigbeeFrontendUrl
			? `${zigbeeFrontendUrl.replace(/\/+$/, "")}/#/device/0/${encodeURIComponent(deviceId)}/info`
			: null,
	);
	const contactMapped = $derived(
		floorplanStore.current?.doorBindings.some((binding) => binding.deviceId === deviceId) ?? false,
	);
	// metadataName holds only the override, so "" is a real state meaning
	// "unset"; fallbackName is what the device shows when it is empty.
	let metadataName = $state("");
	let savedMetadataName = $state("");
	let metadataIcon = $state<string | null>(null);
	let savedMetadataIcon = $state<string | null>(null);
	let metadataRoles = $state<DeviceRoles>({ controlledLoad: null, contact: null });
	let savedMetadataRoles = $state<DeviceRoles>({ controlledLoad: null, contact: null });
	let metadataDisabled = $state(false);
	let savedMetadataDisabled = $state(false);
	const fallbackName = $derived(device ? device.friendlyName || device.id : "");
	let savingMetadata = $state(false);
	let deleteConfirmOpen = $state(false);
	let deleteLoading = $state(false);
	let restoreLoading = $state(false);
	function rolesEqual(a: DeviceRoles, b: DeviceRoles): boolean {
		return a.controlledLoad === b.controlledLoad && a.contact === b.contact;
	}
	const metadataDirty = $derived(
		metadataName.trim() !== savedMetadataName ||
			metadataIcon !== savedMetadataIcon ||
			metadataDisabled !== savedMetadataDisabled ||
			!rolesEqual(metadataRoles, savedMetadataRoles)
	);

	$effect(() => {
		pageHeader.breadcrumbs = [
			{ label: m.nav_devices({}, locale.messageOptions()), href: "/devices" },
			{
				label: device
					? deviceDisplayName(device)
					: m.device_generic({}, locale.messageOptions()),
			},
		];
		pageHeader.actions = device
			? [
					...(firmwareUpdateUrl
						? [
								{
									label: m.device_update({}, locale.messageOptions()),
									icon: ExternalLink,
									variant: "outline" as const,
									href: firmwareUpdateUrl,
									target: "_blank" as const,
									hideLabelOnMobile: true,
								},
							]
						: []),
					{
						label: m.common_save({}, locale.messageOptions()),
						onclick: saveMetadata,
						disabled: !metadataDirty || savingMetadata,
						saving: savingMetadata,
						hideLabelOnMobile: true,
					},
					...(device.deleted
						? [
								{
									label: m.devices_restore({}, locale.messageOptions()),
									icon: Undo2,
									variant: "outline" as const,
									onclick: restoreDevice,
									disabled: restoreLoading,
									hideLabelOnMobile: true,
								},
							]
						: [
								{
									label: m.common_delete({}, locale.messageOptions()),
									icon: Trash2,
									variant: "destructive" as const,
									onclick: () => (deleteConfirmOpen = true),
									disabled: deleteLoading,
									hideLabelOnMobile: true,
								},
							]),
				]
			: [];
	});
	let error = $state<string | null>(null);

	interface GroupMember {
		id: string;
		memberType: string;
		memberId: string;
	}

	const groups = $derived(groupsStore.items);
	const rooms = $derived(roomsStore.items);
	let pickerOpen = $state(false);

	const SET_DEVICE_STATE = graphql(`
		mutation SetDeviceState($deviceId: ID!, $state: DeviceStateInput!) {
			setTargetState(target: { type: DEVICE, id: $deviceId }, state: $state)
		}
	`);

	const SET_DEVICE_CONFIGURATION = graphql(`
		mutation DeviceDetailSetConfiguration(
			$deviceId: ID!
			$settings: [DeviceConfigurationEntryInput!]!
		) {
			setDeviceConfiguration(deviceId: $deviceId, settings: $settings)
		}
	`);

	const UPDATE_DEVICE = graphql(`
		mutation DeviceDetailUpdateDevice($id: ID!, $input: UpdateDeviceInput!) {
			updateDevice(id: $id, input: $input) {
				id
				name
				icon
				roles {
					controlledLoad
					contact
				}
				disabled
				friendlyName
				seen
			}
		}
	`);

	const DELETE_DEVICE = graphql(`
		mutation DeviceDetailDeleteDevice($id: ID!) {
			deleteDevice(id: $id) {
				id
				disabled
				deleted
			}
		}
	`);

	const RESTORE_DEVICE = graphql(`
		mutation DeviceDetailRestoreDevice($id: ID!) {
			restoreDevice(id: $id) {
				id
				disabled
				deleted
			}
		}
	`);

	const DEVICE_ZIGBEE_DETAIL = graphql(`
		query DeviceZigbeeDetail($id: ID!) {
			zigbee2MqttConfig {
				frontendUrl
			}
			device(id: $id) {
				id
				source
				zigbee2Mqtt {
					imageCandidate
					imageVersion
					networkType
					ieeeAddress
					addressVendor
					networkAddress
					supported
					interviewState
					interviewCompleted
					interviewing
					description
					manufacturer
					modelId
					powerSource
					softwareBuildId
					dateCode
					definitionUrl
					definition {
						model
						vendor
						description
						source
						icon
						supportsOta
					}
					ota {
						state
						installedVersion
						latestVersion
						progress
					}
					endpoints {
						id
						profileId
						deviceId
						inputClusters
						outputClusters
						bindings {
							cluster
							targetType
							targetIeeeAddress
							targetEndpoint
							targetGroupId
						}
						reportings {
							cluster
							attribute
							minimumReportInterval
							maximumReportInterval
							reportableChange
						}
					}
					groups {
						id
						providerGroupId
						name
						endpoint
					}
					bridgeInfo {
						adapterType
						firmwareVersion
						channel
						panId
						extendedPanId
						zigbee2MqttVersion
						zigbee2MqttCommit
						zigbeeHerdsmanVersion
						zigbeeHerdsmanConvertersVersion
					}
				}
			}
		}
	`);

	const DEVICE_ZIGBEE_DOCUMENTATION = graphql(`
		query DeviceZigbeeDocumentation($id: ID!) {
			device(id: $id) {
				zigbee2Mqtt {
					documentation {
						sourceUrl
						lastCheckedAt
						model
						vendor
						description
						exposes
						batteryType
					}
				}
			}
		}
	`);

	const clientRef = getContextClient();

	function saveZigbeeDetailSnapshot(id: string) {
		const snapshot: ZigbeeDetailSnapshot = {
			metadata: zigbeeMetadata ?? null,
			frontendUrl: zigbeeFrontendUrl,
			documentation: zigbeeDocumentation,
		};
		saveSessionSnapshot(
			window.sessionStorage,
			zigbeeDetailCacheName(id),
			ZIGBEE_DETAIL_CACHE_VERSION,
			snapshot,
			256_000,
		);
	}

	async function loadZigbeeMetadata(id: string) {
		let failed = false;
		for (let attempt = 0; attempt < 6; attempt++) {
			const result = await clientRef
				.query(DEVICE_ZIGBEE_DETAIL, { id }, { requestPolicy: "network-only" })
				.toPromise();
			if (metadataDeviceId !== id) return;
			if (result.error) {
				console.error(result.error);
				failed = true;
			} else {
				const metadata = result.data?.device?.zigbee2Mqtt ?? null;
				if (
					metadata ||
					(result.data?.device && result.data.device.source !== "zigbee2mqtt") ||
					attempt === 5
				) {
					zigbeeMetadata = metadata;
					zigbeeFrontendUrl = result.data?.zigbee2MqttConfig?.frontendUrl ?? null;
					saveZigbeeDetailSnapshot(id);
					return;
				}
			}
			await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
		}
		if (failed) error = m.common_error_generic({}, locale.messageOptions());
	}

	$effect(() => {
		const id = deviceId;
		if (!id || metadataDeviceId === id) return;
		metadataDeviceId = id;
		const snapshot = loadZigbeeDetailSnapshot(id);
		zigbeeMetadata = snapshot?.metadata;
		zigbeeFrontendUrl = snapshot?.frontendUrl ?? null;
		zigbeeDocumentation = snapshot?.documentation ?? null;
		documentationRequestKey = "";
		void loadZigbeeMetadata(id);
	});

	async function loadZigbeeDocumentation(id: string, requestKey: string) {
		const result = await clientRef
			.query(DEVICE_ZIGBEE_DOCUMENTATION, { id }, { requestPolicy: "network-only" })
			.toPromise();
		if (documentationRequestKey !== requestKey || result.error) return;
		zigbeeDocumentation = result.data?.device?.zigbee2Mqtt?.documentation ?? null;
		saveZigbeeDetailSnapshot(id);
	}

	$effect(() => {
		const id = deviceId;
		const model = zigbeeMetadata?.definition?.model;
		if (!id || !model) return;
		const requestKey = `${id}\u0000${model}`;
		if (documentationRequestKey === requestKey) return;
		documentationRequestKey = requestKey;
		void loadZigbeeDocumentation(id, requestKey);
	});

	const light = $derived(device?.type === "light" ? device.state : null);
	const plug = $derived(device?.type === "plug" ? device.state : null);
	const sensor = $derived(device?.type === "sensor" ? device.state : null);
	const climate = $derived(device?.type === "climate" ? device.state : null);
	const isButton = $derived(device?.type === "button");
	const actionValues = $derived(
		device?.capabilities.find((capability) => capability.name === "action")?.values ?? [],
	);
	const configurationCapabilities = $derived(
		writableConfigurationCapabilities(device?.capabilities ?? []),
	);
	let configurationDeviceId = $state("");
	let configurationBaseline = $state<Device["configuration"]>([]);
	let configurationDraft = $state<Device["configuration"]>([]);
	let configurationPending = $state<Device["configuration"] | null>(null);
	let configurationSaving = $state(false);
	let configurationTimer: ReturnType<typeof setTimeout> | null = null;
	const configurationDirty = $derived(
		!configurationEntriesEqual(configurationDraft, configurationBaseline),
	);

	const membershipData = $derived(membershipRowsForDevice(deviceId, rooms, groups));

	const membershipRows = $derived(
		membershipData.map((row) => ({
			id: row.id,
			name: row.name,
			type: row.kind,
			related: [] as [],
			href:
				row.kind === "room"
					? `/rooms?edit=${row.roomId}`
					: `/groups?edit=${row.groupId}`,
		}))
	);

	const pickerDrawerGroups = $derived.by((): DrawerGroup<"room" | "group">[] => {
		const availableRooms = rooms.filter(
			(r) =>
				!r.members.some((m) => m.memberType === "device" && m.memberId === deviceId),
		);
		const availableGroups = groups.filter(
			(g) => !g.members.some((m) => m.memberType === "device" && m.memberId === deviceId)
		);
		const result: DrawerGroup<"room" | "group">[] = [];
		if (availableRooms.length > 0) {
			result.push({
				heading: m.nav_rooms({}, locale.messageOptions()),
				items: availableRooms.map((r) => ({
					type: "room" as const,
					id: r.id,
					name: entityDisplayName("room", r),
					icon: DoorOpen,
				})),
			});
		}
		if (availableGroups.length > 0) {
			result.push({
				heading: m.nav_groups({}, locale.messageOptions()),
				items: availableGroups.map((g) => ({
					type: "group" as const,
					id: g.id,
					name: groupDisplayName(g),
					icon: GroupIcon,
				})),
			});
		}
		return result;
	});

	async function handlePickerSelect(type: "room" | "group", id: string) {
		if (!clientRef) return;
		if (type === "room") {
			await roomsStore.addMember(clientRef, id, "device", deviceId);
		} else {
			await groupsStore.addMember(clientRef, id, "device", deviceId);
		}
	}

	async function handleRemoveMembership(rowId: string) {
		if (!clientRef) return;
		const row = membershipData.find((r) => r.id === rowId);
		if (!row) return;
		if (row.kind === "room") {
			await roomsStore.removeMember(clientRef, row.roomMemberId);
		} else {
			await groupsStore.removeMember(clientRef, row.groupMemberId);
		}
	}

	async function saveMetadata() {
		if (!clientRef || !device) return;
		// An empty name is the valid way to clear the override, so there is nothing
		// to validate here.
		const name = metadataName.trim();
		const submitted = {
			name,
			icon: metadataIcon,
			roles: { ...metadataRoles },
			disabled: metadataDisabled,
		};

		savingMetadata = true;
		error = null;
		const currentDeviceId = device.id;
		const input: {
			name?: string;
			icon?: string | null;
			roles?: {
				controlledLoad?: ControlledLoadRole | null;
				contact?: ContactRole | null;
			};
			disabled?: boolean;
		} = {};
		if (name !== savedMetadataName) input.name = name;
		if (metadataIcon !== savedMetadataIcon) input.icon = metadataIcon;
		if (!rolesEqual(metadataRoles, savedMetadataRoles)) {
			input.roles = {
				controlledLoad: metadataRoles.controlledLoad,
				contact: metadataRoles.contact,
			};
		}
		if (metadataDisabled !== savedMetadataDisabled) input.disabled = metadataDisabled;
		const result = await clientRef
			.mutation(UPDATE_DEVICE, { id: currentDeviceId, input })
			.toPromise();
		savingMetadata = false;

		if (result.error) {
			console.error(result.error);
			error = m.device_save_failed({}, locale.messageOptions());
			return;
		}

		if (result.data?.updateDevice) {
			const updatedName = result.data.updateDevice.name ?? null;
			const updatedIcon = result.data.updateDevice.icon ?? null;
			const updatedRoles = { ...result.data.updateDevice.roles } as DeviceRoles;
			const updatedDisabled = result.data.updateDevice.disabled;
			if (metadataName.trim() === submitted.name) metadataName = updatedName ?? "";
			savedMetadataName = updatedName ?? "";
			if (metadataIcon === submitted.icon) metadataIcon = updatedIcon;
			savedMetadataIcon = updatedIcon;
			if (rolesEqual(metadataRoles, submitted.roles) && !rolesEqual(metadataRoles, updatedRoles)) {
				metadataRoles = { ...updatedRoles };
			}
			savedMetadataRoles = { ...updatedRoles };
			if (metadataDisabled === submitted.disabled) metadataDisabled = updatedDisabled;
			savedMetadataDisabled = updatedDisabled;
			deviceStore.updateName(currentDeviceId, updatedName);
			deviceStore.updateIcon(currentDeviceId, updatedIcon);
			deviceStore.updateRoles(currentDeviceId, updatedRoles);
			deviceStore.updateDisabled(currentDeviceId, updatedDisabled);
		}
	}

	async function deleteDevice() {
		if (!device || deleteLoading) return;
		deleteLoading = true;
		error = null;
		const result = await clientRef.mutation(DELETE_DEVICE, { id: device.id }).toPromise();
		deleteLoading = false;
		if (result.error) {
			console.error(result.error);
			error = m.devices_delete_failed({}, locale.messageOptions());
			return;
		}
		deviceStore.updateDeleted(device.id, true);
		metadataDisabled = true;
		savedMetadataDisabled = true;
		deleteConfirmOpen = false;
	}

	async function restoreDevice() {
		if (!device || restoreLoading) return;
		restoreLoading = true;
		error = null;
		const result = await clientRef.mutation(RESTORE_DEVICE, { id: device.id }).toPromise();
		restoreLoading = false;
		if (result.error) {
			console.error(result.error);
			error = m.devices_restore_failed({}, locale.messageOptions());
			return;
		}
		deviceStore.updateDeleted(device.id, false);
	}

	interface CommandInput {
		on?: boolean;
		brightness?: number;
		colorTemp?: number;
		color?: { r: number; g: number; b: number; x: number; y: number };
		transition?: number;
		targetTemperature?: number;
		hvacMode?: string;
		fanMode?: string;
		swing?: string;
	}

	function handleDeviceCommand(input: CommandInput) {
		if (!clientRef || !device) return;
		void clientRef.mutation(SET_DEVICE_STATE, { deviceId: device.id, state: input }).toPromise();
	}

	function clearConfigurationTimer() {
		if (configurationTimer === null) return;
		clearTimeout(configurationTimer);
		configurationTimer = null;
	}

	async function applyConfiguration() {
		if (!clientRef || !device || !configurationDirty) return;
		const baseline = new Map(configurationBaseline.map((entry) => [entry.capability, entry]));
		const changes = configurationDraft.filter((entry) => {
			const previous = baseline.get(entry.capability);
			return !previous || !configurationEntriesEqual([entry], [previous]);
		});
		if (changes.length === 0) return;

		configurationSaving = true;
		error = null;
		const settings = changes.map((entry) => ({
			capability: entry.capability,
			booleanValue: entry.booleanValue,
			numberValue: entry.numberValue,
			stringValue: entry.stringValue,
		}));
		const result = await clientRef
			.mutation(SET_DEVICE_CONFIGURATION, { deviceId: device.id, settings })
			.toPromise();
		configurationSaving = false;
		if (result.error) {
			console.error(result.error);
			error = m.device_configuration_failed({}, locale.messageOptions());
			return;
		}
		if (configurationContains(device.configuration, changes)) {
			configurationBaseline = device.configuration.map((entry) => ({ ...entry }));
			configurationDraft = configurationBaseline.map((entry) => ({ ...entry }));
			configurationPending = null;
			return;
		}
		configurationPending = changes.map((entry) => ({ ...entry }));
		clearConfigurationTimer();
		configurationTimer = setTimeout(() => {
			configurationTimer = null;
			configurationPending = null;
			error = m.device_configuration_timeout({}, locale.messageOptions());
		}, 15_000);
	}

	$effect(() => {
		const currentDeviceId = device?.id ?? "";
		const confirmed = (device?.configuration ?? []).map((entry) => ({ ...entry }));
		untrack(() => {
			if (configurationDeviceId !== currentDeviceId) {
				configurationDeviceId = currentDeviceId;
				configurationBaseline = confirmed;
				configurationDraft = confirmed.map((entry) => ({ ...entry }));
				configurationPending = null;
				clearConfigurationTimer();
				return;
			}
			const draftWasClean = configurationEntriesEqual(
				configurationDraft,
				configurationBaseline,
			);
			const pendingConfirmed =
				configurationPending !== null && configurationContains(confirmed, configurationPending);
			configurationBaseline = confirmed;
			if (draftWasClean || pendingConfirmed) {
				configurationDraft = confirmed.map((entry) => ({ ...entry }));
			}
			if (pendingConfirmed) {
				configurationPending = null;
				clearConfigurationTimer();
			}
		});
	});

	// Seed the metadata form from the store once the device is known.
	let metadataSeeded = false;
	$effect(() => {
		if (metadataSeeded || !device) return;
		metadataSeeded = true;
		metadataName = device.name ?? "";
		savedMetadataName = device.name ?? "";
		metadataIcon = device.icon ?? null;
		savedMetadataIcon = device.icon ?? null;
		metadataRoles = { ...device.roles };
		savedMetadataRoles = { ...device.roles };
		metadataDisabled = device.disabled;
		savedMetadataDisabled = device.disabled;
	});

	$effect(() => {
		if (!device?.deleted) return;
		metadataDisabled = true;
		savedMetadataDisabled = true;
	});

	let historyFrom = $state<Date>(new Date(Date.now() - 24 * 60 * 60 * 1000));
	let historyTo = $state<Date>(new Date());
	let historyBucketSeconds = $state<number>(0);

	onDestroy(clearConfigurationTimer);
</script>

<div>

	{#if error}
		<ErrorBanner class="mb-4" message={error} />
	{/if}

	{#if !$devicesHydrated}
		<div class="space-y-4">
			<div class="h-48 animate-pulse rounded-xl shadow-card bg-card"></div>
			<div class="h-64 animate-pulse rounded-xl shadow-card bg-card"></div>
		</div>
	{:else if device}
		<div class="space-y-6" in:fly={{ y: -4, duration: 150 }}>
			<div class="rounded-lg shadow-card bg-card p-4">
				<label class="mb-2 block text-sm font-medium text-foreground" for="device-name">
					{m.device_name({}, locale.messageOptions())}
				</label>
				<div class="flex items-center gap-3">
					<IconCell
						value={metadataIcon}
						onselect={(icon) => (metadataIcon = icon)}
						fallback={deviceIcon(device.type, metadataRoles.contact)}
						size="lg"
						iconClass="size-5 text-muted-foreground"
					/>
					<Input
						id="device-name"
						bind:value={metadataName}
						placeholder={fallbackName}
						onkeydown={(event) => {
							if (event.key === "Enter" && metadataDirty && !savingMetadata) {
								void saveMetadata();
							}
						}}
					/>
				</div>
				{#if metadataRoles.controlledLoad != null || metadataRoles.contact != null}
					<div class="mt-4 flex items-start gap-3">
						<span class="w-16 pt-2 text-sm font-medium text-foreground">
							{m.device_roles({}, locale.messageOptions())}
						</span>
						<DeviceRolesEditor
							value={metadataRoles}
							onchange={(next) => (metadataRoles = next)}
							{contactMapped}
						/>
					</div>
				{/if}
				<div class="mt-4 flex items-center gap-3">
					<label class="w-16 text-sm font-medium text-foreground" for="device-enabled">
						{m.field_enabled({}, locale.messageOptions())}
					</label>
					<Switch
						id="device-enabled"
						checked={!metadataDisabled}
						disabled={device.deleted}
						onCheckedChange={(v) => (metadataDisabled = !v)}
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
				<div class="space-y-6">
					<ZigbeeDeviceInfoCard {device} metadata={zigbeeMetadata} />

					{#if zigbeeMetadata}
						<ZigbeeDetailsCard
							{device}
							metadata={zigbeeMetadata}
							batteryType={zigbeeDocumentation?.batteryType}
						/>
					{/if}

					<Card>
						<CardHeader>
							<CardTitle>{m.field_rooms_groups({}, locale.messageOptions())}</CardTitle>
						</CardHeader>
						<CardContent>
							<MemberTable
								rows={membershipRows}
								emptyMessage={m.device_memberships_empty({}, locale.messageOptions())}
								addLabel={m.common_add_to({}, locale.messageOptions())}
								onadd={() => (pickerOpen = true)}
								onremove={handleRemoveMembership}
							/>
						</CardContent>
					</Card>
				</div>

				<div class="flex flex-col gap-4">
				{#if device.disabled && (light || climate || plug)}
					<Card>
						<CardContent class="py-8 text-center">
							<p class="text-muted-foreground">
								{m.device_controls_disabled({}, locale.messageOptions())}
							</p>
							<p class="mt-1 text-sm text-muted-foreground">
								{m.device_controls_enable_help({}, locale.messageOptions())}
							</p>
						</CardContent>
					</Card>
				{:else if light}
					<LightControls lightState={light} oncommand={handleDeviceCommand} />
				{:else if climate}
					<ClimateControls deviceState={climate} capabilities={device.capabilities} oncommand={handleDeviceCommand} />
				{:else if plug}
					<PlugDisplay state={plug} oncommand={handleDeviceCommand} />
				{:else if sensor}
					<SensorDisplay state={sensor} contactRole={device.roles.contact} />
				{:else if isButton}
					<ButtonDisplay
						lastSeen={device.lastSeen}
						deviceId={device.id}
						name={deviceDisplayName(device)}
						actions={actionValues}
						disabled={device.disabled}
					/>
				{:else}
					<Card>
						<CardContent class="py-8 text-center">
							<p class="text-muted-foreground">
								{m.device_no_state({}, locale.messageOptions())}
							</p>
						</CardContent>
					</Card>
				{/if}

				{#if configurationCapabilities.length > 0}
					<Card>
						<CardHeader>
							<div class="flex items-center justify-between gap-4">
								<CardTitle>{m.device_settings({}, locale.messageOptions())}</CardTitle>
								<Button
									size="sm"
									onclick={applyConfiguration}
									disabled={!configurationDirty || configurationSaving || configurationPending !== null || device.disabled}
								>
									{configurationSaving
										? m.device_applying({}, locale.messageOptions())
										: configurationPending
											? m.device_waiting({}, locale.messageOptions())
											: m.device_apply({}, locale.messageOptions())}
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<DeviceConfigurationEditor
								capabilities={device.capabilities}
								values={configurationDraft}
								onchange={(values) => (configurationDraft = values)}
								disabled={device.disabled || configurationSaving || configurationPending !== null}
							/>
						</CardContent>
					</Card>
				{/if}

				{#if !isButton}
					<Card>
						<CardHeader>
							<div class="flex flex-wrap items-center justify-between gap-2">
								<CardTitle>{m.device_history({}, locale.messageOptions())}</CardTitle>
								<div class="flex items-center gap-2">
									<BucketResolutionSelect bind:value={historyBucketSeconds} />
									<DateRangePicker bind:from={historyFrom} bind:to={historyTo} compact />
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<StateHistoryChart
								sources={[{ kind: "device", id: device.id }]}
								from={historyFrom}
								to={historyTo}
								bucketSeconds={historyBucketSeconds > 0 ? historyBucketSeconds : undefined}
							/>
						</CardContent>
					</Card>
				{/if}
			</div>
			</div>
		</div>
	{:else}
		<Card>
			<CardContent class="py-12 text-center">
				<p class="text-lg font-medium text-foreground">
					{m.device_not_found({}, locale.messageOptions())}
				</p>
				<p class="mt-2 text-sm text-muted-foreground">
					{m.device_not_found_help({}, locale.messageOptions())}
				</p>
				<Button variant="outline" class="mt-4" href="/devices">
					<ArrowLeft class="size-4" />
					{m.device_back_to_devices({}, locale.messageOptions())}
				</Button>
			</CardContent>
		</Card>
	{/if}

	<HiveDrawer
		bind:open={pickerOpen}
		title={m.devices_add_to_generic({}, locale.messageOptions())}
		description={m.devices_add_to_description({}, locale.messageOptions())}
		multiple
		groups={pickerDrawerGroups}
		onselect={handlePickerSelect}
	/>

	<ConfirmDialog
		bind:open={deleteConfirmOpen}
		title={m.devices_delete_one_title({}, locale.messageOptions())}
		description={m.devices_delete_one_description(
			{ name: device ? deviceDisplayName(device) : "" },
			locale.messageOptions(),
		)}
		confirmLabel={m.common_delete({}, locale.messageOptions())}
		loading={deleteLoading}
		onconfirm={deleteDevice}
		oncancel={() => (deleteConfirmOpen = false)}
	/>
</div>
