<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
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
	import { Check, Copy, KeyRound, RotateCw, Save, Search, Trash2, Webhook } from "@lucide/svelte";

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
				durationMs
				requestId
				queryKeys
				headerNames
			}
		}
	`);

	const endpointID = $derived(page.params.id ?? "");
	const client = getContextClient();
	const endpoint = $derived(webhooksStore.byId.get(endpointID));
	const usageByEndpoint = $derived(automationsByWebhookEndpoint(automationsStore.items));
	const usedBy = $derived(usageByEndpoint.get(endpointID) ?? []);
	let liveDeliveries = $state.raw<WebhookDetailDeliveriesQuery["webhookDeliveries"]>([]);

	$effect(() => {
		const id = endpointID;
		let active = true;
		liveDeliveries = [];
		void client
			.query(DELIVERIES_QUERY, { endpointId: id, limit: 100 }, { requestPolicy: "network-only" })
			.toPromise()
			.then((result) => {
				if (active && result.data) liveDeliveries = result.data.webhookDeliveries;
			});
		const subscription = client.subscription(DELIVERY_SUBSCRIPTION, { endpointId: id }).subscribe((result) => {
			const delivery = result.data?.webhookDeliveryRecorded;
			if (!active || !delivery || liveDeliveries.some((item) => item.id === delivery.id)) return;
			liveDeliveries = [delivery, ...liveDeliveries].slice(0, 100);
		});
		return () => {
			active = false;
			subscription.unsubscribe();
		};
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
	const nameError = $derived(draftReady && name.trim() === "" ? "Enter a name" : null);
	const rateCountError = $derived(draftReady && (rateLimitCount === null || rateLimitCount < 1) ? "Use at least 1 request" : null);
	const rateWindowError = $derived(draftReady && (rateLimitWindowMs === null || rateLimitWindowMs < 1) ? "Use at least 1 millisecond" : null);
	const isValid = $derived(!nameError && !rateCountError && !rateWindowError);
	const isDirty = $derived(draftReady && snapshot() !== original);
	const filteredUsedBy = $derived.by(() => {
		const query = automationSearch.trim().toLowerCase();
		return [...usedBy]
			.filter((automation) => !query || automation.name.toLowerCase().includes(query))
			.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
	});

	$effect(() => {
		pageHeader.breadcrumbs = [
			{ label: "Webhooks", href: "/webhooks" },
			{ label: endpoint?.name ?? "Webhook" },
		];
		pageHeader.viewToggle = null;
		pageHeader.actions = [
			{ label: "Rotate URL", mobileLabel: "Rotate", icon: RotateCw, variant: "outline", disabled: !draftReady, onclick: () => (rotateConfirm = true) },
			{ label: "Save", icon: Save, saving, disabled: !isDirty || !isValid, onclick: save },
			{ label: "Delete", icon: Trash2, variant: "destructive", disabled: !draftReady || usedBy.length > 0, onclick: () => (deleteConfirm = true) },
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
			errors.setWithAutoDismiss(graphqlErrorMessage(error, "Could not save the webhook."));
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
			errors.setWithAutoDismiss(graphqlErrorMessage(error, "Could not rotate the webhook URL."));
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
			errors.setWithAutoDismiss(graphqlErrorMessage(error, "Could not delete the webhook."));
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

	function outcomeVariant(outcome: string): "secondary" | "destructive" | "outline" {
		if (outcome === "accepted") return "secondary";
		if (outcome === "rate_limited" || outcome === "disabled") return "outline";
		return "destructive";
	}

	function outcomeLabel(outcome: string): string {
		return outcome.replaceAll("_", " ");
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		return `${(bytes / 1024).toFixed(1)} KiB`;
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
				<label for="webhook-name" class="text-sm font-medium">Webhook name</label>
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
					<div class="text-sm font-medium">Enabled</div>
					<Switch bind:checked={enabled} aria-label="Accept incoming requests" />
				</div>
				<div class="space-y-2">
					<label for="webhook-rate-count" class="text-sm font-medium">Requests</label>
					<NumberInput id="webhook-rate-count" class="w-28" min={1} bind:value={rateLimitCount} ariaInvalid={rateCountError ? "true" : undefined} />
					<FieldError id="webhook-rate-count-error" message={rateCountError} />
				</div>
				<div class="space-y-2">
					<label for="webhook-rate-window" class="text-sm font-medium">Window (ms)</label>
					<NumberInput id="webhook-rate-window" class="w-32" min={1} bind:value={rateLimitWindowMs} ariaInvalid={rateWindowError ? "true" : undefined} />
					<FieldError id="webhook-rate-window-error" message={rateWindowError} />
				</div>
			</div>
		</section>

		<div class="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)]">
			<section class="flex min-h-0 flex-col overflow-hidden rounded-lg bg-card p-6 shadow-card">
				<div class="mb-4 flex shrink-0 items-center justify-between gap-4">
					<h2 class="text-base font-semibold">Recent requests</h2>
					<span class="text-xs text-muted-foreground">Latest 100</span>
				</div>
				{#if liveDeliveries.length === 0}
					<p class="text-sm text-muted-foreground">No requests received yet.</p>
				{:else}
					<div class="min-h-0 flex-1 overflow-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Received</TableHead>
									<TableHead>Result</TableHead>
									<TableHead>Source IP</TableHead>
									<TableHead>User agent</TableHead>
									<TableHead>Content</TableHead>
									<TableHead>Size</TableHead>
									<TableHead>Duration</TableHead>
									<TableHead>Request ID</TableHead>
									<TableHead>Query keys</TableHead>
									<TableHead>Headers</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each liveDeliveries as delivery (delivery.id)}
									<TableRow>
										<TableCell class="whitespace-nowrap">{formatTooltip(new Date(delivery.receivedAt), me.user?.timeFormat ?? "24h")}</TableCell>
										<TableCell class="whitespace-nowrap">
											<Badge variant={outcomeVariant(delivery.outcome)} class="capitalize">{outcomeLabel(delivery.outcome)}</Badge>
											<span class="ml-2 text-xs text-muted-foreground">{delivery.httpStatus}</span>
										</TableCell>
										<TableCell class="whitespace-nowrap font-mono text-xs">{delivery.clientIp || "—"}</TableCell>
										<TableCell class="max-w-72 truncate text-xs text-muted-foreground">{delivery.userAgent || "—"}</TableCell>
										<TableCell class="whitespace-nowrap text-xs">{delivery.contentType || "—"}</TableCell>
										<TableCell class="whitespace-nowrap text-xs">{formatBytes(delivery.bodySize)}</TableCell>
										<TableCell class="whitespace-nowrap text-xs">{delivery.durationMs} ms</TableCell>
										<TableCell class="whitespace-nowrap font-mono text-xs">{delivery.requestId || "—"}</TableCell>
										<TableCell class="whitespace-nowrap text-xs text-muted-foreground">{delivery.queryKeys.join(", ") || "—"}</TableCell>
										<TableCell class="max-w-96 truncate text-xs text-muted-foreground">{delivery.headerNames.join(", ") || "—"}</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				{/if}
			</section>

			<section class="flex min-h-0 flex-col overflow-hidden rounded-lg bg-card p-6 shadow-card">
				<h2 class="mb-4 shrink-0 text-base font-semibold">Used by</h2>
				<div class="relative mb-3 shrink-0">
					<Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input bind:value={automationSearch} placeholder="Search automations..." class="pl-9" />
				</div>
				{#if usedBy.length === 0}
					<p class="py-6 text-center text-sm text-muted-foreground">No automations use this webhook.</p>
				{:else if filteredUsedBy.length === 0}
					<p class="py-6 text-center text-sm text-muted-foreground">No matches.</p>
				{:else}
					<div class="min-h-0 flex-1 overflow-y-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Composition</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each filteredUsedBy as automation (automation.id)}
									<TableRow>
										<TableCell>
											<a href={`/automations/${automation.id}`} class="font-medium hover:underline">{automation.name}</a>
										</TableCell>
										<TableCell>
											<Badge variant={automation.enabled ? "secondary" : "outline"}>{automation.enabled ? "Enabled" : "Disabled"}</Badge>
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
	<div class="rounded-lg bg-card p-12 text-center text-muted-foreground shadow-card">Webhook not found.</div>
{/if}

<ConfirmDialog
	open={rotateConfirm}
	title="Rotate webhook URL"
	description="The current URL stops working immediately. The replacement is shown once."
	confirmLabel="Rotate"
	loading={rotating}
	onconfirm={rotateSecret}
	oncancel={() => (rotateConfirm = false)}
/>

<ConfirmDialog
	open={deleteConfirm}
	title="Delete webhook"
	description={`Delete “${endpoint?.name ?? ""}” and its delivery history? This cannot be undone.`}
	confirmLabel="Delete"
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
			<DialogTitle>Webhook URL</DialogTitle>
			<DialogDescription>This URL is shown once. Store it in the calling system before closing.</DialogDescription>
		</DialogHeader>
		<div class="flex items-center gap-2">
			<KeyRound class="size-4 shrink-0 text-muted-foreground" />
			<Input value={secretUrl ?? ""} readonly class="font-mono text-xs" />
			<Button variant="outline" size="icon" onclick={copySecret} aria-label="Copy webhook URL">
				{#if copied}<Check class="size-4" />{:else}<Copy class="size-4" />{/if}
			</Button>
		</div>
		<DialogFooter>
			<Button onclick={() => { secretUrl = null; copied = false; }}>Done</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
