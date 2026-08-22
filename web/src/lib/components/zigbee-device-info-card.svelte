<script lang="ts">
	import type { Device } from "$lib/stores/devices";
	import type { Zigbee2MqttDeviceMetadata } from "$lib/gql/graphql";
	import { deviceDisplayName, sentenceCase } from "$lib/utils";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger,
	} from "$lib/components/ui/tooltip/index.js";
	import { Ban, Check, Copy, Link } from "@lucide/svelte";
	import DeviceImage from "$lib/components/device-image.svelte";
	import { formatTooltip } from "$lib/time-format";
	import { me } from "$lib/stores/me.svelte";

	interface Props {
		device: Device;
		metadata?: Zigbee2MqttDeviceMetadata | null;
	}

	let { device, metadata }: Props = $props();
	let copied = $state(false);
	const imageVersion = $derived(metadata?.imageVersion ?? "");
	const showImageColumn = $derived(
		(device.source === "zigbee2mqtt" && metadata === undefined) ||
			metadata?.imageCandidate === true,
	);

	const formattedLastSeen = $derived.by(() => {
		if (!device.lastSeen) return "Unknown";
		const date = new Date(device.lastSeen);
		return Number.isNaN(date.getTime())
			? "Unknown"
			: formatTooltip(date, me.user?.timeFormat ?? "24h");
	});

	const linkQuality = $derived(
		device.available && device.state?.linkQuality != null
			? Math.round(device.state.linkQuality)
			: null,
	);
	const linkQualityClass = $derived.by(() => {
		if (linkQuality == null || linkQuality <= 84) return "text-status-offline";
		if (linkQuality <= 169) return "text-yellow-500";
		return "text-status-online";
	});

	async function copyDeviceId() {
		try {
			await navigator.clipboard.writeText(device.id);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			copied = false;
		}
	}
</script>

<TooltipProvider>
	<Card>
		<CardHeader>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<CardTitle>Device Info</CardTitle>
				<div class="flex items-center gap-3">
					{#if device.state?.battery != null}
						<HiveChip type="battery" label={`${Math.round(device.state.battery)}%`} />
					{/if}
					{#if linkQuality != null}
						<Tooltip>
							<TooltipTrigger class="inline-flex items-center gap-1 text-sm {linkQualityClass}">
								<Link class="size-3.5" />
								<span>{linkQuality}</span>
							</TooltipTrigger>
							<TooltipContent>Link quality</TooltipContent>
						</Tooltip>
					{/if}
					{#if device.disabled}
						<span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
							<Ban class="size-3.5" />
							Disabled
						</span>
					{:else}
						<span class="inline-flex items-center gap-1.5 text-sm {device.available ? 'text-status-online' : 'text-status-offline'}">
							<span class="h-2 w-2 rounded-full {device.available ? 'bg-status-online' : 'bg-status-offline'}"></span>
							{device.available ? "Online" : "Offline"}
						</span>
					{/if}
				</div>
			</div>
		</CardHeader>
		<CardContent>
			<div
				class={showImageColumn ? "grid gap-6 lg:grid-cols-[1.3fr_minmax(12rem,0.7fr)]" : ""}
				data-image-column={showImageColumn}
			>
				<div class="min-w-0">
					<dl class="space-y-3">
						<div class="flex items-center justify-between gap-4">
							<dt class="text-sm text-muted-foreground">Name</dt>
							<dd class="min-w-0 truncate text-sm">{deviceDisplayName(device)}</dd>
						</div>
						<Separator />
						<div class="flex items-center justify-between gap-4">
							<dt class="text-sm text-muted-foreground">Device ID</dt>
							<dd class="flex min-w-0 items-center gap-1.5">
								<code class="max-w-48 truncate rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{device.id}</code>
								<Tooltip>
									<TooltipTrigger>
										{#snippet child({ props })}
											<button {...props} type="button" onclick={copyDeviceId} class="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Copy device ID">
												{#if copied}<Check class="size-3.5" />{:else}<Copy class="size-3.5" />{/if}
											</button>
										{/snippet}
									</TooltipTrigger>
									<TooltipContent>{copied ? "Copied!" : "Copy ID"}</TooltipContent>
								</Tooltip>
							</dd>
						</div>
						<Separator />
						<div class="flex items-center justify-between gap-4">
							<dt class="text-sm text-muted-foreground">Enabled</dt>
							<dd><Badge variant="outline">{device.disabled ? "No" : "Yes"}</Badge></dd>
						</div>
						<div class="flex items-center justify-between gap-4">
							<dt class="text-sm text-muted-foreground">Availability</dt>
							<dd><Badge variant="outline">{device.available ? "Online" : "Offline"}</Badge></dd>
						</div>
						<div class="flex items-center justify-between gap-4">
							<dt class="text-sm text-muted-foreground">Type</dt>
							<dd><HiveChip type={device.type} contactRole={device.roles.contact} /></dd>
						</div>
						<div class="flex items-center justify-between gap-4">
							<dt class="text-sm text-muted-foreground">Source</dt>
							<dd><Badge variant="outline">{sentenceCase(device.source)}</Badge></dd>
						</div>
						<Separator />
						<div class="flex items-center justify-between gap-4">
							<dt class="text-sm text-muted-foreground">Last seen</dt>
							<dd class="text-sm">{formattedLastSeen}</dd>
						</div>
					</dl>
				</div>
				{#if showImageColumn}
					<div class="flex items-center justify-center">
						{#if metadata?.imageCandidate && imageVersion}
							<DeviceImage
								deviceId={device.id}
								version={imageVersion}
								alt={`${deviceDisplayName(device)} device`}
							/>
						{:else}
							<div class="h-44 w-full lg:h-56" aria-hidden="true"></div>
						{/if}
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>
</TooltipProvider>
