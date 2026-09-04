<script lang="ts">
	import type { Device } from "$lib/stores/devices";
	import type { Zigbee2MqttDeviceMetadata } from "$lib/gql/graphql";
	import { deviceDisplayName } from "$lib/utils";
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
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

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
		if (!device.lastSeen) return m.state_unknown({}, locale.messageOptions());
		const date = new Date(device.lastSeen);
		return Number.isNaN(date.getTime())
			? m.state_unknown({}, locale.messageOptions())
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
				<CardTitle>{m.device_info({}, locale.messageOptions())}</CardTitle>
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
							<TooltipContent>
								{m.field_link_quality({}, locale.messageOptions())}
							</TooltipContent>
						</Tooltip>
					{/if}
					{#if device.disabled}
						<span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
							<Ban class="size-3.5" />
							{m.field_disabled({}, locale.messageOptions())}
						</span>
					{:else}
						<span class="inline-flex items-center gap-1.5 text-sm {device.available ? 'text-status-online' : 'text-status-offline'}">
							<span class="h-2 w-2 rounded-full {device.available ? 'bg-status-online' : 'bg-status-offline'}"></span>
							{device.available
								? m.devices_online({}, locale.messageOptions())
								: m.devices_offline({}, locale.messageOptions())}
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
							<dt class="text-sm text-muted-foreground">
								{m.field_name({}, locale.messageOptions())}
							</dt>
							<dd class="min-w-0 truncate text-sm">{deviceDisplayName(device)}</dd>
						</div>
						<Separator />
						<div class="flex items-center justify-between gap-4">
							<dt class="text-sm text-muted-foreground">
								{m.device_id({}, locale.messageOptions())}
							</dt>
							<dd class="flex min-w-0 items-center gap-1.5">
								<code class="max-w-48 truncate rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{device.id}</code>
								<Tooltip>
									<TooltipTrigger>
										{#snippet child({ props })}
											<button {...props} type="button" onclick={copyDeviceId} class="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={m.device_copy_id({}, locale.messageOptions())}>
												{#if copied}<Check class="size-3.5" />{:else}<Copy class="size-3.5" />{/if}
											</button>
										{/snippet}
									</TooltipTrigger>
									<TooltipContent>
										{copied
											? m.common_copied({}, locale.messageOptions())
											: m.common_copy_id({}, locale.messageOptions())}
									</TooltipContent>
								</Tooltip>
							</dd>
						</div>
						<Separator />
						<div class="flex items-center justify-between gap-4">
							<dt class="text-sm text-muted-foreground">{m.field_enabled({}, locale.messageOptions())}</dt>
							<dd><Badge variant="outline">{device.disabled ? m.common_no({}, locale.messageOptions()) : m.common_yes({}, locale.messageOptions())}</Badge></dd>
						</div>
						<div class="flex items-center justify-between gap-4">
							<dt class="text-sm text-muted-foreground">{m.field_availability({}, locale.messageOptions())}</dt>
							<dd><Badge variant="outline">{device.available ? m.devices_online({}, locale.messageOptions()) : m.devices_offline({}, locale.messageOptions())}</Badge></dd>
						</div>
						<div class="flex items-center justify-between gap-4">
							<dt class="text-sm text-muted-foreground">{m.field_type({}, locale.messageOptions())}</dt>
							<dd><HiveChip type={device.type} contactRole={device.roles.contact} /></dd>
						</div>
						<div class="flex items-center justify-between gap-4">
							<dt class="text-sm text-muted-foreground">{m.field_source({}, locale.messageOptions())}</dt>
							<dd><Badge variant="outline">{device.source}</Badge></dd>
						</div>
						<Separator />
						<div class="flex items-center justify-between gap-4">
							<dt class="text-sm text-muted-foreground">{m.field_last_seen({}, locale.messageOptions())}</dt>
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
								alt={m.device_image_alt(
									{ name: deviceDisplayName(device) },
									locale.messageOptions(),
								)}
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
