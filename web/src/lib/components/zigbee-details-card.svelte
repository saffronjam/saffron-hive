<script lang="ts">
	import type { Zigbee2MqttDeviceMetadata } from "$lib/gql/graphql";
	import type { Device } from "$lib/stores/devices";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { ExternalLink } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { identifierLabel } from "$lib/i18n/vocabulary";
	import { formatPercent } from "$lib/i18n/format";

	interface Props {
		device: Device;
		metadata: Zigbee2MqttDeviceMetadata;
		batteryType?: string | null;
	}

	let { device, metadata, batteryType = null }: Props = $props();

	const networkAddress = $derived.by(() => {
		if (metadata.networkAddress == null) return null;
		return `0x${metadata.networkAddress.toString(16).toUpperCase().padStart(4, "0")} · ${metadata.networkAddress}`;
	});
	const panId = $derived.by(() => {
		if (metadata.bridgeInfo?.panId == null) return null;
		return `0x${metadata.bridgeInfo.panId.toString(16).toUpperCase().padStart(4, "0")} · ${metadata.bridgeInfo.panId}`;
	});
	const updateAvailable = $derived(
		metadata.ota.installedVersion != null &&
			metadata.ota.latestVersion != null &&
			metadata.ota.latestVersion !== "-1" &&
			metadata.ota.installedVersion !== metadata.ota.latestVersion,
	);
	const otaLabel = $derived.by(() => {
		if (updateAvailable) return null;
		const support = metadata.definition?.supportsOta;
		if (support === false) return m.common_unsupported({}, locale.messageOptions());
		if (support == null) return null;
		const options = locale.messageOptions();
		const state = metadata.ota.state
			? identifierLabel(metadata.ota.state)
			: m.common_supported({}, options);
		const version =
			metadata.ota.installedVersion == null
				? null
				: metadata.ota.installedVersion === "-1"
					? m.zigbee_unknown_version({}, options)
					: metadata.ota.installedVersion;
		const progress =
			metadata.ota.progress == null ? null : formatPercent(metadata.ota.progress / 100);
		if (version && progress) return m.zigbee_ota_version_progress({ state, version, progress }, options);
		if (version) return m.zigbee_ota_version({ state, version }, options);
		if (progress) return m.zigbee_ota_progress({ state, progress }, options);
		return state;
	});
	const interviewLabel = $derived(
		metadata.interviewing
			? m.common_in_progress({}, locale.messageOptions())
			: metadata.interviewState
				? identifierLabel(metadata.interviewState.toLowerCase())
				: metadata.interviewCompleted === true
					? m.common_complete({}, locale.messageOptions())
					: m.state_unknown({}, locale.messageOptions()),
	);
	const hasInterview = $derived(
		!!metadata.interviewState ||
			metadata.interviewCompleted != null ||
			metadata.interviewing != null,
	);
	const hasNetwork = $derived(
		!!metadata.ieeeAddress ||
			!!metadata.addressVendor ||
			networkAddress != null ||
			!!metadata.networkType ||
			metadata.supported === false ||
			metadata.bridgeInfo?.channel != null ||
			panId != null ||
			!!metadata.bridgeInfo?.extendedPanId ||
			hasInterview,
	);
	const zigbee2MqttCommit = $derived.by(() => {
		const commit = metadata.bridgeInfo?.zigbee2MqttCommit?.trim();
		return commit && commit.toLowerCase() !== "unknown" ? commit : null;
	});
	const hasCoordinator = $derived(
		!!metadata.bridgeInfo?.adapterType || !!metadata.bridgeInfo?.firmwareVersion,
	);
	const hasDeviceIdentity = $derived(
		!!metadata.powerSource ||
			!!batteryType ||
			!!metadata.manufacturer ||
			!!metadata.modelId ||
			!!metadata.softwareBuildId ||
			!!metadata.dateCode,
	);
	const hasDefinition = $derived(
		!!metadata.definition?.vendor ||
			!!metadata.definition?.model ||
			!!metadata.definition?.description,
	);
	const hasIntegration = $derived(
		!!otaLabel ||
			!!device.friendlyName ||
			!!metadata.bridgeInfo?.zigbee2MqttVersion ||
			!!zigbee2MqttCommit ||
			!!metadata.bridgeInfo?.zigbeeHerdsmanVersion ||
			!!metadata.bridgeInfo?.zigbeeHerdsmanConvertersVersion,
	);
</script>

<Card>
	<CardHeader><CardTitle>Zigbee</CardTitle></CardHeader>
	<CardContent>
		<dl class="space-y-3">
			{#if hasNetwork}
				<div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{m.zigbee_network({}, locale.messageOptions())}</div>
				{#if metadata.ieeeAddress}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_ieee_address({}, locale.messageOptions())}</dt><dd><code class="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{metadata.ieeeAddress}</code></dd></div>{/if}
				{#if metadata.addressVendor}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_address_vendor({}, locale.messageOptions())}</dt><dd class="text-right text-sm">{metadata.addressVendor}</dd></div>{/if}
				{#if networkAddress}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_network_address({}, locale.messageOptions())}</dt><dd class="font-mono text-xs">{networkAddress}</dd></div>{/if}
				{#if metadata.networkType}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_network_role({}, locale.messageOptions())}</dt><dd><Badge variant="outline">{metadata.networkType}</Badge></dd></div>{/if}
				{#if metadata.supported === false}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_support({}, locale.messageOptions())}</dt><dd><Badge variant="outline">{m.common_unsupported({}, locale.messageOptions())}</Badge></dd></div>{/if}
				{#if metadata.bridgeInfo?.channel != null}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_channel({}, locale.messageOptions())}</dt><dd class="font-mono text-xs">{metadata.bridgeInfo.channel}</dd></div>{/if}
				{#if panId}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">PAN ID</dt><dd class="font-mono text-xs">{panId}</dd></div>{/if}
				{#if metadata.bridgeInfo?.extendedPanId}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_extended_pan_id({}, locale.messageOptions())}</dt><dd class="font-mono text-xs">{metadata.bridgeInfo.extendedPanId}</dd></div>{/if}
				{#if hasInterview}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_interview({}, locale.messageOptions())}</dt><dd><Badge variant="outline">{interviewLabel}</Badge></dd></div>{/if}
			{/if}

			{#if hasCoordinator}
				{#if hasNetwork}<Separator class="my-4" />{/if}
				<div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{m.zigbee_coordinator({}, locale.messageOptions())}</div>
				{#if metadata.bridgeInfo?.adapterType}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_adapter({}, locale.messageOptions())}</dt><dd class="text-right text-sm">{metadata.bridgeInfo.adapterType}</dd></div>{/if}
				{#if metadata.bridgeInfo?.firmwareVersion}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_firmware({}, locale.messageOptions())}</dt><dd class="text-right font-mono text-xs">{metadata.bridgeInfo.firmwareVersion}</dd></div>{/if}
			{/if}

			{#if hasDeviceIdentity}
				{#if hasNetwork || hasCoordinator}<Separator class="my-4" />{/if}
				<div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{m.zigbee_device({}, locale.messageOptions())}</div>
				{#if metadata.powerSource}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_power_source({}, locale.messageOptions())}</dt><dd class="text-right text-sm">{metadata.powerSource}</dd></div>{/if}
				{#if batteryType}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_battery_type({}, locale.messageOptions())}</dt><dd class="text-right text-sm">{batteryType}</dd></div>{/if}
				{#if metadata.manufacturer}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_manufacturer({}, locale.messageOptions())}</dt><dd class="text-right text-sm">{metadata.manufacturer}</dd></div>{/if}
				{#if metadata.modelId}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_model_id({}, locale.messageOptions())}</dt><dd class="text-right font-mono text-xs">{metadata.modelId}</dd></div>{/if}
				{#if metadata.softwareBuildId}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_software_build({}, locale.messageOptions())}</dt><dd class="text-right font-mono text-xs">{metadata.softwareBuildId}</dd></div>{/if}
				{#if metadata.dateCode}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_date_code({}, locale.messageOptions())}</dt><dd class="text-right font-mono text-xs">{metadata.dateCode}</dd></div>{/if}
			{/if}

			{#if hasDefinition}
				{#if hasNetwork || hasCoordinator || hasDeviceIdentity}<Separator class="my-4" />{/if}
				<div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{m.zigbee_definition({}, locale.messageOptions())}</div>
				{#if metadata.definition?.vendor}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_vendor({}, locale.messageOptions())}</dt><dd class="text-right text-sm">{metadata.definition.vendor}</dd></div>{/if}
				{#if metadata.definition?.model}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_model({}, locale.messageOptions())}</dt><dd class="text-right text-sm">{#if metadata.definitionUrl}<a href={metadata.definitionUrl} target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 text-primary hover:underline">{metadata.definition.model}<ExternalLink class="size-3" /></a>{:else}{metadata.definition.model}{/if}</dd></div>{/if}
				{#if metadata.definition?.description}<div class="flex items-start justify-between gap-4"><dt class="shrink-0 text-sm text-muted-foreground">{m.zigbee_description({}, locale.messageOptions())}</dt><dd class="max-w-xl text-right text-sm">{metadata.definition.description}</dd></div>{/if}
			{/if}

			{#if hasIntegration}
				{#if hasNetwork || hasCoordinator || hasDeviceIdentity || hasDefinition}<Separator class="my-4" />{/if}
				<div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{m.zigbee_integration({}, locale.messageOptions())}</div>
				{#if otaLabel}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_firmware({}, locale.messageOptions())}</dt><dd><Badge variant="outline">{otaLabel}</Badge></dd></div>{/if}
				{#if metadata.bridgeInfo?.zigbee2MqttVersion}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">Zigbee2MQTT</dt><dd class="font-mono text-xs">{metadata.bridgeInfo.zigbee2MqttVersion}</dd></div>{/if}
				{#if zigbee2MqttCommit}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_commit({}, locale.messageOptions())}</dt><dd class="font-mono text-xs">{zigbee2MqttCommit}</dd></div>{/if}
				{#if metadata.bridgeInfo?.zigbeeHerdsmanVersion}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">zigbee-herdsman</dt><dd class="font-mono text-xs">{metadata.bridgeInfo.zigbeeHerdsmanVersion}</dd></div>{/if}
				{#if metadata.bridgeInfo?.zigbeeHerdsmanConvertersVersion}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_converters({}, locale.messageOptions())}</dt><dd class="font-mono text-xs">{metadata.bridgeInfo.zigbeeHerdsmanConvertersVersion}</dd></div>{/if}
				{#if device.friendlyName}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">{m.zigbee_mqtt_topic({}, locale.messageOptions())}</dt><dd class="max-w-md truncate font-mono text-xs">zigbee2mqtt/{device.friendlyName}</dd></div>{/if}
			{/if}
		</dl>
	</CardContent>
</Card>
