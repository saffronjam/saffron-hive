<script lang="ts">
	import { page } from "$app/stores";
	import { onMount, onDestroy, untrack } from "svelte";
	import { fly } from "svelte/transition";
	import type { Device, DeviceState } from "$lib/stores/devices";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import IconCell from "$lib/components/table-cells/icon-cell.svelte";
	import { deviceDisplayName, deviceIcon } from "$lib/utils";
	import { deviceStore, devicesHydrated } from "$lib/stores/devices";
	import { roomsStore } from "$lib/stores/rooms.svelte";
	import { groupsStore } from "$lib/stores/groups.svelte";
	import { floorplanStore } from "$lib/stores/floorplan.svelte";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import {
		Tooltip,
		TooltipContent,
		TooltipTrigger,
		TooltipProvider,
	} from "$lib/components/ui/tooltip/index.js";
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
	import { sentenceCase } from "$lib/utils";
	import {
		configurationContains,
		configurationEntriesEqual,
		writableConfigurationCapabilities,
	} from "$lib/device-configuration";
	import { ArrowLeft, Ban, Copy, Check, DoorOpen, Group as GroupIcon, Save } from "@lucide/svelte";

	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	const deviceId = $derived($page.params.id ?? "");

	// deviceStore already holds every field this page renders and keeps it live
	// over the shared subscriptions, so there is nothing to fetch here.
	const device = $derived($deviceStore[deviceId] ?? null);
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
	function rolesEqual(a: DeviceRoles, b: DeviceRoles): boolean {
		return a.controlledLoad === b.controlledLoad && a.contact === b.contact;
	}
	const metadataDirty = $derived(
		metadataName.trim() !== savedMetadataName ||
			metadataIcon !== savedMetadataIcon ||
			metadataDisabled !== savedMetadataDisabled ||
			!rolesEqual(metadataRoles, savedMetadataRoles)
	);

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Devices", href: "/devices" }, { label: "Device" }];
	});
	onDestroy(() => pageHeader.reset());

	$effect(() => {
		if (device) {
			pageHeader.breadcrumbs = [
				{ label: "Devices", href: "/devices" },
				{ label: deviceDisplayName(device) },
			];
		}
		pageHeader.actions = device
			? [
					{
						label: "Save",
						icon: Save,
						onclick: saveMetadata,
						disabled: !metadataDirty || savingMetadata,
						saving: savingMetadata,
						hideLabelOnMobile: true,
					},
				]
			: [];
	});
	let error = $state<string | null>(null);
	let copied = $state(false);

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
			setDeviceState(deviceId: $deviceId, state: $state) {
				id
			}
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

	const clientRef = getContextClient();

	const light = $derived(device?.type === "light" ? device.state : null);
	const plug = $derived(device?.type === "plug" ? device.state : null);
	const sensor = $derived(device?.type === "sensor" ? device.state : null);
	const climate = $derived(device?.type === "climate" ? device.state : null);
	const isButton = $derived(device?.type === "button");
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
				heading: "Rooms",
				items: availableRooms.map((r) => ({
					type: "room" as const,
					id: r.id,
					name: r.name,
					icon: DoorOpen,
				})),
			});
		}
		if (availableGroups.length > 0) {
			result.push({
				heading: "Groups",
				items: availableGroups.map((g) => ({
					type: "group" as const,
					id: g.id,
					name: g.name,
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

	const formattedLastSeen = $derived.by(() => {
		if (!device) return "";
		const date = new Date(device.lastSeen);
		if (isNaN(date.getTime())) return "Unknown";
		return date.toLocaleString();
	});

	async function copyDeviceId() {
		if (!device) return;
		try {
			await navigator.clipboard.writeText(device.id);
			copied = true;
			setTimeout(() => { copied = false; }, 2000);
		} catch {
			// Clipboard API may not be available
		}
	}

	async function saveMetadata() {
		if (!clientRef || !device) return;
		// An empty name is the valid way to clear the override, so there is nothing
		// to validate here.
		const name = metadataName.trim();

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
			error = result.error.message;
			return;
		}

		if (result.data?.updateDevice) {
			const updatedName = result.data.updateDevice.name ?? null;
			const updatedIcon = result.data.updateDevice.icon ?? null;
			const updatedRoles = { ...result.data.updateDevice.roles } as DeviceRoles;
			const updatedDisabled = result.data.updateDevice.disabled;
			metadataName = updatedName ?? "";
			savedMetadataName = updatedName ?? "";
			metadataIcon = updatedIcon;
			savedMetadataIcon = updatedIcon;
			metadataRoles = { ...updatedRoles };
			savedMetadataRoles = { ...updatedRoles };
			metadataDisabled = updatedDisabled;
			savedMetadataDisabled = updatedDisabled;
			deviceStore.updateName(currentDeviceId, updatedName);
			deviceStore.updateIcon(currentDeviceId, updatedIcon);
			deviceStore.updateRoles(currentDeviceId, updatedRoles);
			deviceStore.updateDisabled(currentDeviceId, updatedDisabled);
		}
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
			error = result.error.message;
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
			error = "The device did not confirm its settings. You can try applying them again.";
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
					Device Name
				</label>
				<div class="flex items-center gap-3">
					<IconCell
						value={metadataIcon}
						onselect={(icon) => (metadataIcon = icon)}
						fallback={deviceIcon(device.type, device.roles.contact)}
						size="lg"
						iconClass="size-5 text-muted-foreground"
					/>
					<Input
						id="device-name"
						bind:value={metadataName}
						disabled={savingMetadata}
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
						<span class="w-16 pt-2 text-sm font-medium text-foreground">Roles</span>
						<DeviceRolesEditor
							value={metadataRoles}
							onchange={(next) => (metadataRoles = next)}
							disabled={savingMetadata}
							{contactMapped}
						/>
					</div>
				{/if}
				<div class="mt-4 flex items-center gap-3">
					<label class="w-16 text-sm font-medium text-foreground" for="device-enabled">
						Enabled
					</label>
					<Switch
						id="device-enabled"
						checked={!metadataDisabled}
						onCheckedChange={(v) => (metadataDisabled = !v)}
						disabled={savingMetadata}
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
				<div class="space-y-6">
				<Card>
					<CardHeader>
						<div class="flex items-center justify-between">
							<CardTitle>Device Info</CardTitle>
							{#if device.disabled}
								<span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
									<Ban class="size-3.5" />
									Disabled
								</span>
							{:else}
								<span
									class="inline-flex items-center gap-1.5 text-sm {device.available ? 'text-status-online' : 'text-status-offline'}"
								>
									<span class="h-2 w-2 rounded-full {device.available ? 'bg-status-online' : 'bg-status-offline'}"></span>
									{device.available ? "Online" : "Offline"}
								</span>
							{/if}
						</div>
					</CardHeader>
					<CardContent>
						<dl class="space-y-3">
							<div class="flex items-center justify-between">
								<dt class="text-sm text-muted-foreground">Device ID</dt>
								<dd class="flex items-center gap-1.5">
									<code class="max-w-48 truncate rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{device.id}</code>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger>
												{#snippet child({ props })}
													<button
														{...props}
														type="button"
														onclick={copyDeviceId}
														class="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
													>
														{#if copied}
															<Check class="size-3.5" />
														{:else}
															<Copy class="size-3.5" />
														{/if}
													</button>
												{/snippet}
											</TooltipTrigger>
											<TooltipContent>
												{copied ? "Copied!" : "Copy ID"}
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</dd>
							</div>

							<Separator />

							<div class="flex items-center justify-between">
								<dt class="text-sm text-muted-foreground">Type</dt>
								<dd>
									<HiveChip type={device.type} />
								</dd>
							</div>

							<div class="flex items-center justify-between">
								<dt class="text-sm text-muted-foreground">Source</dt>
								<dd>
									<Badge variant="outline">{sentenceCase(device.source)}</Badge>
								</dd>
							</div>

							{#if device.source === "zigbee"}
								<Separator />
								<div class="flex items-center justify-between">
									<dt class="text-sm text-muted-foreground">IEEE Address</dt>
									<dd>
										<code class="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{device.id}</code>
									</dd>
								</div>
							{/if}

							<Separator />

							<div class="flex items-center justify-between">
								<dt class="text-sm text-muted-foreground">Last Seen</dt>
								<dd class="text-sm">{formattedLastSeen}</dd>
							</div>
						</dl>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Rooms & Groups</CardTitle>
					</CardHeader>
					<CardContent>
						<MemberTable
							rows={membershipRows}
							emptyMessage="Not in any room or group yet."
							addLabel="Add to"
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
								Controls are unavailable while this device is disabled.
							</p>
							<p class="mt-1 text-sm text-muted-foreground">
								Switch <span class="font-medium text-foreground">Enabled</span> back on above to
								command it again.
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
					<ButtonDisplay lastSeen={device.lastSeen} />
				{:else}
					<Card>
						<CardContent class="py-8 text-center">
							<p class="text-muted-foreground">No state information available for this device.</p>
						</CardContent>
					</Card>
				{/if}

				{#if configurationCapabilities.length > 0}
					<Card>
						<CardHeader>
							<div class="flex items-center justify-between gap-4">
								<CardTitle>Settings</CardTitle>
								<Button
									size="sm"
									onclick={applyConfiguration}
									disabled={!configurationDirty || configurationSaving || configurationPending !== null || device.disabled}
								>
									{configurationSaving
										? "Applying…"
										: configurationPending
											? "Waiting for device…"
											: "Apply"}
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
								<CardTitle>History</CardTitle>
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
				<p class="text-lg font-medium text-foreground">Device not found</p>
				<p class="mt-2 text-sm text-muted-foreground">
					The device you're looking for doesn't exist or has been removed.
				</p>
				<Button variant="outline" class="mt-4" href="/devices">
					<ArrowLeft class="size-4" />
					Back to Devices
				</Button>
			</CardContent>
		</Card>
	{/if}

	<HiveDrawer
		bind:open={pickerOpen}
		title="Add to rooms or groups"
		description="Pick one or more rooms and groups for this device."
		multiple
		groups={pickerDrawerGroups}
		onselect={handlePickerSelect}
	/>
</div>
