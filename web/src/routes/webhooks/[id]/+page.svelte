<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { onGraphQLRecovered } from "$lib/graphql/app-recovery";
	import type { WebhookDetailDeliveriesQuery } from "$lib/gql/graphql";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from "$lib/components/ui/table/index.js";
	import NumberInput from "$lib/components/number-input.svelte";
	import ActionsHead from "$lib/components/table-cells/actions-head.svelte";
	import JsonInline from "$lib/components/json-inline.svelte";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import FieldError from "$lib/components/field-error.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { webhooksStore } from "$lib/stores/webhooks.svelte";
	import { automationsStore } from "$lib/stores/automations.svelte";
	import { automationsByWebhookEndpoint } from "$lib/automation-config";
	import AutomationComposition from "$lib/components/automation-composition.svelte";
	import { BannerError } from "$lib/stores/banner-error.svelte";
	import { me } from "$lib/stores/me.svelte";
	import { formatTooltip } from "$lib/time-format";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { compareLocalized, formatMeasurement, formatShortDuration } from "$lib/i18n/format";
	import { localizedNamesStore } from "$lib/stores/localized-names.svelte";
	import { entityDisplayName } from "$lib/utils";
	import {
		Braces,
		Check,
		Copy,
		KeyRound,
		RotateCw,
		Save,
		Search,
		Trash2,
		Webhook,
	} from "@lucide/svelte";

	const DELIVERIES_QUERY = graphql(`
		query WebhookDetailDeliveries($endpointId: ID!, $limit: Int) {
			webhookDeliveries(endpointId: $endpointId, limit: $limit) {
				id
				endpointId
				receivedAt
				outcome
				httpStatus
				clientIp
				userAgent
				contentType
				bodySize
				body
				durationMs
				requestId
				queryKeys
				headerNames
			}
		}
	`);

	const DELIVERY_SUBSCRIPTION = graphql(`
		subscription WebhookDetailDeliveryRecorded($endpointId: ID) {
			webhookDeliveryRecorded(endpointId: $endpointId) {
				id
				endpointId
				receivedAt
				outcome
				httpStatus
				clientIp
				userAgent
				contentType
				bodySize
				body
				durationMs
				requestId
				queryKeys
				headerNames
			}
		}
	`);

	const endpointID = $derived(page.params.id ?? "");
	const client = getContextClient();
	const messageOptions = $derived(locale.messageOptions());
	const endpoint = $derived(webhooksStore.byId.get(endpointID));
	const usageByEndpoint = $derived(automationsByWebhookEndpoint(automationsStore.items));
	const usedBy = $derived(usageByEndpoint.get(endpointID) ?? []);
	type WebhookDelivery = WebhookDetailDeliveriesQuery["webhookDeliveries"][number];
	let liveDeliveries = $state.raw<WebhookDetailDeliveriesQuery["webhookDeliveries"]>([]);
	let deliveriesRequest = 0;

	async function loadDeliveries(id: string) {
		const request = ++deliveriesRequest;
		const result = await client
			.query(DELIVERIES_QUERY, { endpointId: id, limit: 100 }, { requestPolicy: "network-only" })
			.toPromise();
		if (request === deliveriesRequest && endpointID === id && result.data) {
			liveDeliveries = [
				...new Map(
					[...result.data.webhookDeliveries, ...liveDeliveries].map((delivery) => [delivery.id, delivery]),
				).values(),
			]
				.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
				.slice(0, 100);
		}
	}

	$effect(() => {
		const id = endpointID;
		liveDeliveries = [];
		void loadDeliveries(id);
		const subscription = client.subscription(DELIVERY_SUBSCRIPTION, { endpointId: id }).subscribe((result) => {
			const delivery = result.data?.webhookDeliveryRecorded;
			if (endpointID !== id || !delivery || liveDeliveries.some((item) => item.id === delivery.id)) return;
			liveDeliveries = [delivery, ...liveDeliveries].slice(0, 100);
		});
		return () => {
			deliveriesRequest++;
			subscription.unsubscribe();
		};
	});

	onGraphQLRecovered(() => {
		void loadDeliveries(endpointID);
	});

	let loadedID = $state<string | null>(null);
	let name = $state("");
	let enabled = $state(false);
	let rateLimitCount = $state<number | null>(1);
	let rateLimitWindowMs = $state<number | null>(1000);
	let original = $state("");
	let saving = $state(false);
	let rotateConfirm = $state(false);
	let rotating = $state(false);
	let deleteConfirm = $state(false);
	let deleting = $state(false);
	let secretUrl = $state<string | null>(null);
	let copied = $state(false);
	let automationSearch = $state("");
	let selectedDelivery = $state<WebhookDelivery | null>(null);
	let bodyCopied = $state(false);
	const errors = new BannerError();

	function snapshot() {
		return JSON.stringify({ name, enabled, rateLimitCount, rateLimitWindowMs });
	}

	$effect(() => {
		if (!endpoint || loadedID === endpoint.id) return;
		name = endpoint.name;
		enabled = endpoint.enabled;
		rateLimitCount = endpoint.rateLimitCount;
		rateLimitWindowMs = endpoint.rateLimitWindowMs;
		original = snapshot();
		loadedID = endpoint.id;
	});

	const draftReady = $derived(endpoint !== undefined && loadedID === endpoint.id);
	const nameError = $derived(draftReady && name.trim() === "" ? m.webhooks_validation_name({}, messageOptions) : null);
	const rateCountError = $derived(draftReady && (rateLimitCount === null || rateLimitCount < 1) ? m.webhooks_validation_request_count({}, messageOptions) : null);
	const rateWindowError = $derived(draftReady && (rateLimitWindowMs === null || rateLimitWindowMs < 1) ? m.webhooks_validation_window({}, messageOptions) : null);
	const isValid = $derived(!nameError && !rateCountError && !rateWindowError);
	const isDirty = $derived(draftReady && snapshot() !== original);
	const filteredUsedBy = $derived.by(() => {
		const query = automationSearch.trim().toLowerCase();
		return [...usedBy]
			.filter(
				(automation) =>
					!query ||
					localizedNamesStore.matches("automation", automation.id, query, automation.name),
			)
			.sort((a, b) =>
				compareLocalized(
					entityDisplayName("automation", a),
					entityDisplayName("automation", b),
				),
			);
	});

	$effect(() => {
		pageHeader.breadcrumbs = [
			{ label: m.webhooks_title({}, messageOptions), href: "/webhooks" },
			{ label: endpoint ? localizedNamesStore.display("webhook", endpoint.id, endpoint.name) : m.webhooks_detail_fallback({}, messageOptions) },
		];
		pageHeader.viewToggle = null;
		pageHeader.actions = [
			{ label: m.webhooks_rotate_url({}, messageOptions), mobileLabel: m.webhooks_rotate_short({}, messageOptions), icon: RotateCw, variant: "outline", disabled: !draftReady, onclick: () => (rotateConfirm = true) },
			{ label: m.common_save({}, messageOptions), icon: Save, saving, disabled: !isDirty || !isValid, onclick: save },
			{ label: m.common_delete({}, messageOptions), icon: Trash2, variant: "destructive", disabled: !draftReady || usedBy.length > 0, onclick: () => (deleteConfirm = true) },
		];
	});

	async function save() {
		if (!endpoint || !isValid || rateLimitCount === null || rateLimitWindowMs === null) return;
		saving = true;
		errors.clear();
		try {
			await webhooksStore.update(client, endpoint.id, {
				name: name.trim(),
				enabled,
				rateLimitCount,
				rateLimitWindowMs,
			});
			original = snapshot();
		} catch (error) {
			errors.setWithAutoDismiss(graphqlErrorMessage(error, m.webhooks_save_failed({}, messageOptions)));
		} finally {
			saving = false;
		}
	}

	async function rotateSecret() {
		if (!endpoint) return;
		rotating = true;
		errors.clear();
		try {
			const result = await webhooksStore.rotate(client, endpoint.id);
			secretUrl = new URL(result.secretPath, window.location.origin).toString();
			rotateConfirm = false;
		} catch (error) {
			errors.setWithAutoDismiss(graphqlErrorMessage(error, m.webhooks_rotate_failed({}, messageOptions)));
		} finally {
			rotating = false;
		}
	}

	async function deleteEndpoint() {
		if (!endpoint) return;
		deleting = true;
		errors.clear();
		try {
			await webhooksStore.delete(client, endpoint.id);
			await goto("/webhooks");
		} catch (error) {
			errors.setWithAutoDismiss(graphqlErrorMessage(error, m.webhooks_delete_failed({}, messageOptions)));
		} finally {
			deleting = false;
		}
	}

	async function copySecret() {
		if (!secretUrl) return;
		await navigator.clipboard.writeText(secretUrl);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	async function copyBody() {
		if (selectedDelivery?.body === null || selectedDelivery?.body === undefined) return;
		await navigator.clipboard.writeText(formatBody(selectedDelivery.body));
		bodyCopied = true;
		setTimeout(() => (bodyCopied = false), 1500);
	}

	function outcomeVariant(outcome: string): "secondary" | "destructive" | "outline" {
		if (outcome === "accepted") return "secondary";
		if (outcome === "rate_limited" || outcome === "disabled") return "outline";
		return "destructive";
	}

	function outcomeLabel(outcome: string): string {
		switch (outcome) {
			case "accepted":
				return m.webhooks_outcome_accepted({}, messageOptions);
			case "disabled":
				return m.webhooks_outcome_disabled({}, messageOptions);
			case "invalid_json":
				return m.webhooks_outcome_invalid_json({}, messageOptions);
			case "rate_limited":
				return m.webhooks_outcome_rate_limited({}, messageOptions);
			case "too_large":
				return m.webhooks_outcome_too_large({}, messageOptions);
			default:
				return m.webhooks_outcome_unknown({ outcome }, messageOptions);
		}
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return formatMeasurement(bytes, "B", { maximumFractionDigits: 0 });
		return formatMeasurement(bytes / 1024, "KiB", { maximumFractionDigits: 1 });
	}

	function formatBody(body: string): string {
		try {
			return JSON.stringify(JSON.parse(body), null, 2);
		} catch {
			return body;
		}
	}
</script>

<UnsavedGuard dirty={isDirty} />

{#if errors.message}
	<ErrorBanner class="mb-4" message={errors.message} ondismiss={() => errors.clear()} />
{/if}

{#if endpoint && draftReady}
	<div class="flex flex-col gap-6 lg:h-[calc(100dvh-7rem)] lg:min-h-[32rem]">
		<section class="shrink-0 rounded-lg bg-card p-6 shadow-card">
			<div class="space-y-2">
				<label for="webhook-name" class="text-sm font-medium">{m.webhooks_name({}, messageOptions)}</label>
				<div class="flex items-start gap-3">
					<div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
						<Webhook class="size-5 text-muted-foreground" />
					</div>
					<div class="min-w-0 flex-1">
						<Input id="webhook-name" bind:value={name} aria-invalid={!!nameError} />
						<FieldError id="webhook-name-error" message={nameError} />
					</div>
				</div>
			</div>
			<div class="mt-5 flex flex-wrap items-start gap-x-8 gap-y-4">
				<div class="flex h-9 items-center gap-3">
					<div class="text-sm font-medium">{m.webhooks_enabled({}, messageOptions)}</div>
					<Switch bind:checked={enabled} aria-label={m.webhooks_accept_requests({}, messageOptions)} />
				</div>
				<div class="space-y-2">
					<label for="webhook-rate-count" class="text-sm font-medium">{m.webhooks_requests({}, messageOptions)}</label>
					<NumberInput id="webhook-rate-count" class="w-28" min={1} bind:value={rateLimitCount} ariaInvalid={rateCountError ? "true" : undefined} />
					<FieldError id="webhook-rate-count-error" message={rateCountError} />
				</div>
				<div class="space-y-2">
					<label for="webhook-rate-window" class="text-sm font-medium">{m.webhooks_window_ms({}, messageOptions)}</label>
					<NumberInput id="webhook-rate-window" class="w-32" min={1} bind:value={rateLimitWindowMs} ariaInvalid={rateWindowError ? "true" : undefined} />
					<FieldError id="webhook-rate-window-error" message={rateWindowError} />
				</div>
			</div>
		</section>

		<div class="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)]">
			<section class="flex min-h-0 flex-col overflow-hidden rounded-lg bg-card p-6 shadow-card">
				<div class="mb-4 flex shrink-0 items-center justify-between gap-4">
					<h2 class="text-base font-semibold">{m.webhooks_recent_requests({}, messageOptions)}</h2>
					<span class="text-xs text-muted-foreground">{m.webhooks_latest_count({ count: 100 }, messageOptions)}</span>
				</div>
				{#if liveDeliveries.length === 0}
					<p class="text-sm text-muted-foreground">{m.webhooks_no_requests({}, messageOptions)}</p>
				{:else}
					<div class="min-h-0 flex-1 overflow-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{m.webhooks_received({}, messageOptions)}</TableHead>
									<TableHead>{m.webhooks_result({}, messageOptions)}</TableHead>
									<TableHead>{m.webhooks_source_ip({}, messageOptions)}</TableHead>
									<TableHead>{m.webhooks_user_agent({}, messageOptions)}</TableHead>
									<TableHead>{m.webhooks_content({}, messageOptions)}</TableHead>
									<TableHead>{m.webhooks_size({}, messageOptions)}</TableHead>
									<TableHead>{m.webhooks_duration({}, messageOptions)}</TableHead>
									<TableHead>{m.webhooks_request_id({}, messageOptions)}</TableHead>
									<TableHead>{m.webhooks_query_keys({}, messageOptions)}</TableHead>
									<TableHead>{m.webhooks_headers({}, messageOptions)}</TableHead>
									<ActionsHead />
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each liveDeliveries as delivery (delivery.id)}
									<TableRow>
										<TableCell class="whitespace-nowrap">{formatTooltip(new Date(delivery.receivedAt), me.user?.timeFormat ?? "24h")}</TableCell>
										<TableCell class="whitespace-nowrap">
											<Badge variant={outcomeVariant(delivery.outcome)}>{outcomeLabel(delivery.outcome)}</Badge>
											<span class="ml-2 text-xs text-muted-foreground">{delivery.httpStatus}</span>
										</TableCell>
										<TableCell class="whitespace-nowrap font-mono text-xs">{delivery.clientIp || "—"}</TableCell>
										<TableCell class="max-w-72 truncate text-xs text-muted-foreground">{delivery.userAgent || "—"}</TableCell>
										<TableCell class="whitespace-nowrap text-xs">{delivery.contentType || "—"}</TableCell>
										<TableCell class="whitespace-nowrap text-xs">{formatBytes(delivery.bodySize)}</TableCell>
									<TableCell class="whitespace-nowrap text-xs">{formatShortDuration(delivery.durationMs, "millisecond")}</TableCell>
										<TableCell class="whitespace-nowrap font-mono text-xs">{delivery.requestId || "—"}</TableCell>
										<TableCell class="whitespace-nowrap text-xs text-muted-foreground">{delivery.queryKeys.join(", ") || "—"}</TableCell>
										<TableCell class="max-w-96 truncate text-xs text-muted-foreground">{delivery.headerNames.join(", ") || "—"}</TableCell>
										<TableCell>
											<div class="flex items-center justify-end">
												<Button
													variant="ghost"
													size="icon-sm"
													onclick={() => (selectedDelivery = delivery)}
											aria-label={m.webhooks_view_body({}, messageOptions)}
											title={m.webhooks_view_body({}, messageOptions)}
												>
													<Braces class="size-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				{/if}
			</section>

			<section class="flex min-h-0 flex-col overflow-hidden rounded-lg bg-card p-6 shadow-card">
				<h2 class="mb-4 shrink-0 text-base font-semibold">{m.webhooks_used_by({}, messageOptions)}</h2>
				<div class="relative mb-3 shrink-0">
					<Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input bind:value={automationSearch} placeholder={m.webhooks_search_automations({}, messageOptions)} class="pl-9" />
				</div>
				{#if usedBy.length === 0}
					<p class="py-6 text-center text-sm text-muted-foreground">{m.webhooks_no_automations({}, messageOptions)}</p>
				{:else if filteredUsedBy.length === 0}
					<p class="py-6 text-center text-sm text-muted-foreground">{m.shared_no_matches({}, messageOptions)}</p>
				{:else}
					<div class="min-h-0 flex-1 overflow-y-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{m.webhooks_column_name({}, messageOptions)}</TableHead>
									<TableHead>{m.webhooks_filter_status({}, messageOptions)}</TableHead>
									<TableHead>{m.automations_column_composition({}, messageOptions)}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each filteredUsedBy as automation (automation.id)}
									<TableRow>
										<TableCell>
											<a href={`/automations/${automation.id}`} class="font-medium hover:underline">{entityDisplayName("automation", automation)}</a>
										</TableCell>
										<TableCell>
											<Badge variant={automation.enabled ? "secondary" : "outline"}>{automation.enabled ? m.webhooks_enabled({}, messageOptions) : m.webhooks_disabled({}, messageOptions)}</Badge>
										</TableCell>
										<TableCell><AutomationComposition nodes={automation.nodes} /></TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				{/if}
			</section>
		</div>
	</div>
{:else if webhooksStore.hydrated}
	<div class="rounded-lg bg-card p-12 text-center text-muted-foreground shadow-card">{m.webhooks_not_found({}, messageOptions)}</div>
{/if}

<ConfirmDialog
	open={rotateConfirm}
	title={m.webhooks_rotate_title({}, messageOptions)}
	description={m.webhooks_rotate_description({}, messageOptions)}
	confirmLabel={m.webhooks_rotate_short({}, messageOptions)}
	loading={rotating}
	onconfirm={rotateSecret}
	oncancel={() => (rotateConfirm = false)}
/>

<ConfirmDialog
	open={deleteConfirm}
	title={m.webhooks_delete_title({}, messageOptions)}
	description={m.webhooks_delete_with_history({ name: endpoint ? localizedNamesStore.display("webhook", endpoint.id, endpoint.name) : "" }, messageOptions)}
	confirmLabel={m.common_delete({}, messageOptions)}
	loading={deleting}
	onconfirm={deleteEndpoint}
	oncancel={() => (deleteConfirm = false)}
/>

<Dialog
	open={secretUrl !== null}
	onOpenChange={(open) => {
		if (!open) {
			secretUrl = null;
			copied = false;
		}
	}}
>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>{m.webhooks_url_title({}, messageOptions)}</DialogTitle>
			<DialogDescription>{m.webhooks_url_once({}, messageOptions)}</DialogDescription>
		</DialogHeader>
		<div class="flex items-center gap-2">
			<KeyRound class="size-4 shrink-0 text-muted-foreground" />
			<Input value={secretUrl ?? ""} readonly class="font-mono text-xs" />
			<Button variant="outline" size="icon" onclick={copySecret} aria-label={m.webhooks_copy_url({}, messageOptions)}>
				{#if copied}<Check class="size-4" />{:else}<Copy class="size-4" />{/if}
			</Button>
		</div>
		<DialogFooter>
			<Button onclick={() => { secretUrl = null; copied = false; }}>{m.webhooks_done({}, messageOptions)}</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<Dialog
	open={selectedDelivery !== null}
	onOpenChange={(open) => {
		if (!open) {
			selectedDelivery = null;
			bodyCopied = false;
		}
	}}
>
	<DialogContent class="h-[min(44rem,calc(100dvh-2rem))] grid-rows-[auto_minmax(0,1fr)] sm:max-w-3xl">
		<DialogHeader>
			<DialogTitle>{m.webhooks_request_body({}, messageOptions)}</DialogTitle>
			{#if selectedDelivery}
				<DialogDescription>
					{formatTooltip(new Date(selectedDelivery.receivedAt), me.user?.timeFormat ?? "24h")} ·
					{selectedDelivery.contentType || m.webhooks_no_content_type({}, messageOptions)} ·
					{formatBytes(selectedDelivery.bodySize)}
				</DialogDescription>
			{/if}
		</DialogHeader>
		<div class="relative min-h-0 overflow-hidden rounded-md bg-background shadow-card">
			{#if selectedDelivery?.body !== null && selectedDelivery?.body !== undefined}
				<div class="h-full overflow-auto p-4 pr-12">
					<JsonInline value={formatBody(selectedDelivery.body)} class="block min-w-max" />
				</div>
				<Button
					variant="ghost"
					size="icon-sm"
					class="absolute right-2 top-2 z-10 bg-background"
					onclick={copyBody}
					aria-label={bodyCopied ? m.webhooks_body_copied({}, messageOptions) : m.webhooks_copy_body({}, messageOptions)}
					title={bodyCopied ? m.webhooks_copied({}, messageOptions) : m.webhooks_copy_body({}, messageOptions)}
				>
					{#if bodyCopied}<Check class="size-4" />{:else}<Copy class="size-4" />{/if}
				</Button>
			{:else}
				<p class="p-4 text-sm text-muted-foreground">{m.webhooks_body_unavailable({}, messageOptions)}</p>
			{/if}
		</div>
	</DialogContent>
</Dialog>
