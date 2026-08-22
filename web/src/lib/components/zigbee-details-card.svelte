<script lang="ts">
	import type { Zigbee2MqttBinding, Zigbee2MqttDeviceMetadata } from "$lib/gql/graphql";
	import type { Device } from "$lib/stores/devices";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { Tabs, TabsContent } from "$lib/components/ui/tabs/index.js";
	import SegmentedControl from "$lib/components/segmented-control.svelte";
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from "$lib/components/ui/table/index.js";
	import { sentenceCase } from "$lib/utils";
	import { ExternalLink } from "@lucide/svelte";

	interface Props {
		device: Device;
		metadata: Zigbee2MqttDeviceMetadata;
	}

	let { device, metadata }: Props = $props();
	type DetailTab = "endpoints" | "bindings" | "reporting" | "groups";
	let detailTab = $state<DetailTab>("endpoints");

	const networkAddress = $derived.by(() => {
		if (metadata.networkAddress == null) return null;
		return `0x${metadata.networkAddress.toString(16).toUpperCase().padStart(4, "0")} · ${metadata.networkAddress}`;
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
		if (support === false) return "Unsupported";
		if (support == null) return null;
		let label = metadata.ota.state ? sentenceCase(metadata.ota.state) : "Supported";
		if (metadata.ota.installedVersion != null) {
			label += ` · ${metadata.ota.installedVersion === "-1" ? "Unknown version" : metadata.ota.installedVersion}`;
		}
		if (metadata.ota.progress != null) label += ` · ${Math.round(metadata.ota.progress)}%`;
		return label;
	});
	const interviewLabel = $derived(
		metadata.interviewing
			? "In progress"
			: metadata.interviewState
				? sentenceCase(metadata.interviewState.toLowerCase())
				: metadata.interviewCompleted === true
					? "Complete"
					: "Unknown",
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
			metadata.supported != null ||
			hasInterview,
	);
	const hasDeviceIdentity = $derived(
		!!metadata.powerSource ||
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
	const hasIntegration = $derived(!!otaLabel || !!device.friendlyName);

	const bindings = $derived(
		metadata.endpoints.flatMap((endpoint) =>
			endpoint.bindings.map((binding) => ({ endpoint: endpoint.id, binding })),
		),
	);
	const reportings = $derived(
		metadata.endpoints.flatMap((endpoint) =>
			endpoint.reportings.map((reporting) => ({ endpoint: endpoint.id, reporting })),
		),
	);

	function bindingTarget(binding: Zigbee2MqttBinding): string {
		if (binding.targetType === "group") {
			return binding.targetGroupId == null ? "Group" : `Group ${binding.targetGroupId}`;
		}
		const address = binding.targetIeeeAddress ?? "Endpoint";
		return binding.targetEndpoint == null ? address : `${address} · ${binding.targetEndpoint}`;
	}
</script>

<Card>
	<CardHeader><CardTitle>Zigbee</CardTitle></CardHeader>
	<CardContent>
		<dl class="space-y-3">
			{#if hasNetwork}
				<div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Network</div>
				{#if metadata.ieeeAddress}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">IEEE address</dt><dd><code class="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{metadata.ieeeAddress}</code></dd></div>{/if}
				{#if metadata.addressVendor}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">Address vendor</dt><dd class="text-right text-sm">{metadata.addressVendor}</dd></div>{/if}
				{#if networkAddress}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">Network address</dt><dd class="font-mono text-xs">{networkAddress}</dd></div>{/if}
				{#if metadata.networkType}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">Network role</dt><dd><Badge variant="outline">{metadata.networkType}</Badge></dd></div>{/if}
				<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">Support</dt><dd><Badge variant={metadata.supported === false ? "destructive" : "outline"}>{metadata.supported == null ? "Unknown" : metadata.supported ? "Supported" : "Unsupported"}</Badge></dd></div>
				{#if hasInterview}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">Interview</dt><dd><Badge variant="outline">{interviewLabel}</Badge></dd></div>{/if}
			{/if}

			{#if hasDeviceIdentity}
				{#if hasNetwork}<Separator class="my-4" />{/if}
				<div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Device</div>
				{#if metadata.powerSource}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">Power source</dt><dd class="text-right text-sm">{metadata.powerSource}</dd></div>{/if}
				{#if metadata.manufacturer}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">Manufacturer</dt><dd class="text-right text-sm">{metadata.manufacturer}</dd></div>{/if}
				{#if metadata.modelId}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">Model ID</dt><dd class="text-right font-mono text-xs">{metadata.modelId}</dd></div>{/if}
				{#if metadata.softwareBuildId}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">Software build</dt><dd class="text-right font-mono text-xs">{metadata.softwareBuildId}</dd></div>{/if}
				{#if metadata.dateCode}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">Date code</dt><dd class="text-right font-mono text-xs">{metadata.dateCode}</dd></div>{/if}
			{/if}

			{#if hasDefinition}
				{#if hasNetwork || hasDeviceIdentity}<Separator class="my-4" />{/if}
				<div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Definition</div>
				{#if metadata.definition?.vendor}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">Vendor</dt><dd class="text-right text-sm">{metadata.definition.vendor}</dd></div>{/if}
				{#if metadata.definition?.model}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">Model</dt><dd class="text-right text-sm">{#if metadata.definitionUrl}<a href={metadata.definitionUrl} target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 text-primary hover:underline">{metadata.definition.model}<ExternalLink class="size-3" /></a>{:else}{metadata.definition.model}{/if}</dd></div>{/if}
				{#if metadata.definition?.description}<div class="flex items-start justify-between gap-4"><dt class="shrink-0 text-sm text-muted-foreground">Description</dt><dd class="max-w-xl text-right text-sm">{metadata.definition.description}</dd></div>{/if}
			{/if}

			{#if hasIntegration}
				{#if hasNetwork || hasDeviceIdentity || hasDefinition}<Separator class="my-4" />{/if}
				<div class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Integration</div>
				{#if otaLabel}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">Firmware</dt><dd><Badge variant="outline">{otaLabel}</Badge></dd></div>{/if}
				{#if device.friendlyName}<div class="flex items-center justify-between gap-4"><dt class="text-sm text-muted-foreground">MQTT topic</dt><dd class="max-w-md truncate font-mono text-xs">zigbee2mqtt/{device.friendlyName}</dd></div>{/if}
			{/if}
		</dl>

		<Separator class="my-6" />
		<h3 class="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Details</h3>
		<Tabs bind:value={detailTab}>
			<div class="max-w-full overflow-x-auto pb-1">
				<SegmentedControl
					value={detailTab}
					onchange={(value) => (detailTab = value)}
					options={[
						{ value: "endpoints", label: "Endpoints" },
						{ value: "bindings", label: "Bindings" },
						{ value: "reporting", label: "Reporting" },
						{ value: "groups", label: "Groups" },
					]}
				/>
			</div>

			<TabsContent value="endpoints">
				{#if metadata.endpoints.length === 0}
					<p class="py-8 text-center text-sm text-muted-foreground">No endpoints reported.</p>
				{:else}
					<div class="space-y-4">
						{#each metadata.endpoints as endpoint (endpoint.id)}
							<div class="overflow-x-auto">
								<p class="mb-2 text-sm font-medium">Endpoint {endpoint.id}</p>
								<Table>
									<TableBody>
										{#if endpoint.profileId != null}
											<TableRow><TableCell class="text-muted-foreground">Profile ID</TableCell><TableCell>{endpoint.profileId}</TableCell></TableRow>
										{/if}
										{#if endpoint.deviceId != null}
											<TableRow><TableCell class="text-muted-foreground">Device ID</TableCell><TableCell>{endpoint.deviceId}</TableCell></TableRow>
										{/if}
										<TableRow><TableCell class="text-muted-foreground">Input clusters</TableCell><TableCell class="whitespace-normal">{endpoint.inputClusters.join(", ") || "None"}</TableCell></TableRow>
										<TableRow><TableCell class="text-muted-foreground">Output clusters</TableCell><TableCell class="whitespace-normal">{endpoint.outputClusters.join(", ") || "None"}</TableCell></TableRow>
									</TableBody>
								</Table>
							</div>
						{/each}
					</div>
				{/if}
			</TabsContent>

			<TabsContent value="bindings">
				{#if bindings.length === 0}
					<p class="py-8 text-center text-sm text-muted-foreground">No bindings configured.</p>
				{:else}
					<div class="overflow-x-auto">
						<Table>
							<TableHeader><TableRow><TableHead>Endpoint</TableHead><TableHead>Cluster</TableHead><TableHead>Target</TableHead></TableRow></TableHeader>
							<TableBody>
								{#each bindings as row, index (`${row.endpoint}-${row.binding.cluster}-${index}`)}
									<TableRow><TableCell>{row.endpoint}</TableCell><TableCell>{row.binding.cluster}</TableCell><TableCell>{bindingTarget(row.binding)}</TableCell></TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				{/if}
			</TabsContent>

			<TabsContent value="reporting">
				{#if reportings.length === 0}
					<p class="py-8 text-center text-sm text-muted-foreground">No reporting configured.</p>
				{:else}
					<div class="overflow-x-auto">
						<Table>
							<TableHeader><TableRow><TableHead>Endpoint</TableHead><TableHead>Cluster</TableHead><TableHead>Attribute</TableHead><TableHead>Min</TableHead><TableHead>Max</TableHead><TableHead>Change</TableHead></TableRow></TableHeader>
							<TableBody>
								{#each reportings as row, index (`${row.endpoint}-${row.reporting.cluster}-${row.reporting.attribute}-${index}`)}
									<TableRow><TableCell>{row.endpoint}</TableCell><TableCell>{row.reporting.cluster}</TableCell><TableCell>{row.reporting.attribute}</TableCell><TableCell>{row.reporting.minimumReportInterval ?? "—"}</TableCell><TableCell>{row.reporting.maximumReportInterval ?? "—"}</TableCell><TableCell>{row.reporting.reportableChange ?? "—"}</TableCell></TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				{/if}
			</TabsContent>

			<TabsContent value="groups">
				{#if metadata.groups.length === 0}
					<p class="py-8 text-center text-sm text-muted-foreground">Not in a Zigbee group.</p>
				{:else}
					<div class="overflow-x-auto">
						<Table>
							<TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Group ID</TableHead><TableHead>Endpoint</TableHead></TableRow></TableHeader>
							<TableBody>
								{#each metadata.groups as group (`${group.id}-${group.endpoint}`)}
									<TableRow><TableCell>{group.name}</TableCell><TableCell>{group.providerGroupId}</TableCell><TableCell>{group.endpoint}</TableCell></TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				{/if}
			</TabsContent>
		</Tabs>
	</CardContent>
</Card>
