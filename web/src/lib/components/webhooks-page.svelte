<script lang="ts">
	import { page } from "$app/state";
	import { getContextClient } from "@urql/svelte";
	import { fly } from "svelte/transition";
	import { Button } from "$lib/components/ui/button/index.js";
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
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import HiveDataTable from "$lib/components/hive-data-table.svelte";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import TableHeaderCheckbox from "$lib/components/table-header-checkbox.svelte";
	import TableRowCheckbox from "$lib/components/table-row-checkbox.svelte";
	import TableSelectionToolbar from "$lib/components/table-selection-toolbar.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig } from "$lib/components/hive-searchbar";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import CreatedByCell from "$lib/components/table-cells/created-by-cell.svelte";
	import ActionsHead from "$lib/components/table-cells/actions-head.svelte";
	import { createUrlSearchState } from "$lib/search-state.svelte";
	import { createTableState, type ColumnDef } from "$lib/utils/table-state.svelte";
	import { createTableSelection } from "$lib/utils/table-selection.svelte";
	import { rowAttrsForSelection } from "$lib/utils/row-attrs";
	import { webhooksStore, type WebhookEndpoint } from "$lib/stores/webhooks.svelte";
	import { automationsStore } from "$lib/stores/automations.svelte";
	import { automationsByWebhookEndpoint } from "$lib/automation-config";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { BannerError } from "$lib/stores/banner-error.svelte";
	import { formatFull, formatRelative } from "$lib/time-format";
	import { nowStore } from "$lib/stores/now.svelte";
	import { me } from "$lib/stores/me.svelte";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import { Check, Copy, Pencil, Plus, Trash2, Webhook } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { localizedNamesStore } from "$lib/stores/localized-names.svelte";

	interface Props {
		visible: boolean;
	}

	let { visible }: Props = $props();
	const client = getContextClient();
	const messageOptions = $derived(locale.messageOptions());
	const endpoints = $derived(webhooksStore.items);
	const automations = $derived(automationsStore.items);
	const usageByEndpoint = $derived(automationsByWebhookEndpoint(automations));
	const errors = new BannerError();
	const searchController = createUrlSearchState({
		active: () => visible && page.url.pathname === "/webhooks",
	});

	const enabledOptions = $derived.by(() => [
		{ value: "yes", label: m.webhooks_enabled({}, messageOptions) },
		{ value: "no", label: m.webhooks_disabled({}, messageOptions) },
	]);
	const usageOptions = $derived.by(() => [
		{ value: "used", label: m.webhooks_used({}, messageOptions) },
		{ value: "unused", label: m.webhooks_unused({}, messageOptions) },
	]);
	const searchChipConfigs = $derived.by<ChipConfig[]>(() => [
		{
			keyword: "status",
			label: m.webhooks_filter_status({}, messageOptions),
			variant: "secondary",
			options: () => enabledOptions,
			resolveLabel: (value) => enabledOptions.find((option) => option.value === value)?.label ?? null,
		},
		{
			keyword: "usage",
			label: m.webhooks_filter_usage({}, messageOptions),
			variant: "secondary",
			options: () => usageOptions,
			resolveLabel: (value) => usageOptions.find((option) => option.value === value)?.label ?? null,
		},
	]);

	const filteredEndpoints = $derived.by(() => {
		const query = searchController.value.freeText.toLowerCase();
		const statuses = searchController.value.chips
			.filter((chip) => chip.keyword === "status")
			.map((chip) => chip.value);
		const usages = searchController.value.chips
			.filter((chip) => chip.keyword === "usage")
			.map((chip) => chip.value);
		return endpoints.filter((endpoint) => {
			if (query && !localizedNamesStore.matches("webhook", endpoint.id, query, endpoint.name)) return false;
			if (statuses.length > 0 && !statuses.includes(endpoint.enabled ? "yes" : "no")) return false;
			if (usages.length > 0 && !usages.includes((usageByEndpoint.get(endpoint.id)?.length ?? 0) > 0 ? "used" : "unused")) return false;
			return true;
		});
	});

	let createOpen = $state(false);
	let createName = $state("");
	let createLoading = $state(false);
	let secretUrl = $state<string | null>(null);
	let copied = $state(false);
	let deleteEndpoint = $state<WebhookEndpoint | null>(null);
	let deleteLoading = $state(false);
	const selection = createTableSelection();
	let batchDeleteConfirm = $state(false);
	let batchDeleteLoading = $state(false);

	$effect(() => {
		selection.setDisabled(endpoints.filter((endpoint) => (usageByEndpoint.get(endpoint.id)?.length ?? 0) > 0).map((endpoint) => endpoint.id));
	});

	$effect(() => {
		if (!visible) return;
		pageHeader.breadcrumbs = [{ label: m.webhooks_title({}, messageOptions) }];
		pageHeader.viewToggle = null;
		pageHeader.actions = [
			{ label: m.webhooks_create({}, messageOptions), mobileLabel: m.webhooks_create_short({}, messageOptions), icon: Plus, onclick: () => (createOpen = true) },
		];
	});

	async function createEndpoint() {
		if (!createName.trim()) return;
		createLoading = true;
		errors.clear();
		try {
			const result = await webhooksStore.create(client, {
				name: createName.trim(),
				enabled: true,
				rateLimitCount: 1,
				rateLimitWindowMs: 1000,
			});
			secretUrl = new URL(result.secretPath, window.location.origin).toString();
			createName = "";
			createOpen = false;
		} catch (error) {
			errors.setWithAutoDismiss(graphqlErrorMessage(error, m.webhooks_create_failed({}, messageOptions)));
		} finally {
			createLoading = false;
		}
	}

	async function toggleEndpoint(endpoint: WebhookEndpoint, enabled: boolean) {
		errors.clear();
		try {
			await webhooksStore.update(client, endpoint.id, {
				name: endpoint.name,
				enabled,
				rateLimitCount: endpoint.rateLimitCount,
				rateLimitWindowMs: endpoint.rateLimitWindowMs,
			});
		} catch (error) {
			errors.setWithAutoDismiss(graphqlErrorMessage(error, m.webhooks_update_failed({}, messageOptions)));
		}
	}

	async function renameEndpoint(endpoint: WebhookEndpoint, name: string) {
		errors.clear();
		try {
			await webhooksStore.update(client, endpoint.id, {
				name,
				enabled: endpoint.enabled,
				rateLimitCount: endpoint.rateLimitCount,
				rateLimitWindowMs: endpoint.rateLimitWindowMs,
			});
		} catch (error) {
			errors.setWithAutoDismiss(graphqlErrorMessage(error, m.webhooks_rename_failed({}, messageOptions)));
		}
	}

	async function confirmBatchDelete() {
		const ids = selection.selectedIds();
		if (ids.length === 0) {
			batchDeleteConfirm = false;
			return;
		}
		batchDeleteLoading = true;
		errors.clear();
		try {
			const deleted = await webhooksStore.deleteMany(client, ids);
			selection.clear();
			batchDeleteConfirm = false;
			if (deleted < ids.length) {
				errors.setWithAutoDismiss(m.webhooks_delete_used_kept({}, messageOptions));
			}
		} catch (error) {
			errors.setWithAutoDismiss(graphqlErrorMessage(error, m.webhooks_delete_many_failed({}, messageOptions)));
		} finally {
			batchDeleteLoading = false;
		}
	}

	async function confirmDelete() {
		if (!deleteEndpoint) return;
		deleteLoading = true;
		errors.clear();
		try {
			await webhooksStore.delete(client, deleteEndpoint.id);
			deleteEndpoint = null;
		} catch (error) {
			errors.setWithAutoDismiss(graphqlErrorMessage(error, m.webhooks_delete_failed({}, messageOptions)));
		} finally {
			deleteLoading = false;
		}
	}

	async function copySecret() {
		if (!secretUrl) return;
		await navigator.clipboard.writeText(secretUrl);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	const COLUMNS: ColumnDef<WebhookEndpoint>[] = $derived.by(() => [
		{ key: "select", label: "", hideable: false, headClass: "w-10", head: selectHead, cell: selectCell },
		{ key: "name", label: m.webhooks_column_name({}, messageOptions), sortValue: (endpoint) => localizedNamesStore.display("webhook", endpoint.id, endpoint.name), cell: nameCell },
		{ key: "automations", label: m.webhooks_column_automations({}, messageOptions), sortValue: (endpoint) => usageByEndpoint.get(endpoint.id)?.length ?? 0, cell: automationsCell },
		{ key: "lastDelivery", label: m.webhooks_column_last_request({}, messageOptions), sortValue: (endpoint) => endpoint.lastDeliveryAt ?? null, cell: lastDeliveryCell },
		{ key: "createdBy", label: m.webhooks_column_created_by({}, messageOptions), sortValue: (endpoint) => endpoint.createdBy?.name ?? null, cell: createdByCell },
		{ key: "actions", label: "", hideable: false, headClass: "w-28 text-right", head: actionsHead, cell: actionsCell },
	] satisfies ColumnDef<WebhookEndpoint>[]);
	const tableState = createTableState({ storageKey: "webhooks", columns: () => COLUMNS });
	const displayRows = $derived(tableState.applySort(filteredEndpoints));
	const displayIds = $derived(displayRows.map((endpoint) => endpoint.id));

	$effect(() => {
		selection.pruneTo(filteredEndpoints.map((endpoint) => endpoint.id));
	});
</script>

{#snippet selectHead()}
	<TableHeaderCheckbox {selection} orderedIds={displayIds} />
{/snippet}

{#snippet selectCell(endpoint: WebhookEndpoint)}
	<TableRowCheckbox
		id={endpoint.id}
		{selection}
		orderedIds={displayIds}
		ariaLabel={m.shared_select_item({ name: localizedNamesStore.display("webhook", endpoint.id, endpoint.name) }, messageOptions)}
		tooltip={selection.isDisabled(endpoint.id) ? m.webhooks_used_by_automation({}, messageOptions) : undefined}
	/>
{/snippet}

{#snippet nameCell(endpoint: WebhookEndpoint)}
	<div class="flex items-center gap-2">
		<Webhook class="size-4 text-muted-foreground" />
		<InlineEditName
			name={localizedNamesStore.display("webhook", endpoint.id, endpoint.name)}
			entityType="webhook"
			entityId={endpoint.id}
			onsave={(name) => renameEndpoint(endpoint, name)}
		/>
	</div>
{/snippet}

{#snippet automationsCell(endpoint: WebhookEndpoint)}
	{@const count = usageByEndpoint.get(endpoint.id)?.length ?? 0}
	<span class="text-sm text-muted-foreground">
		{count === 0 ? "—" : m.webhooks_automation_count({ count }, messageOptions)}
	</span>
{/snippet}

{#snippet lastDeliveryCell(endpoint: WebhookEndpoint)}
	{#if endpoint.lastDeliveryAt}
		<Tooltip>
			<TooltipTrigger>
				<span class="whitespace-nowrap text-sm text-muted-foreground">
					{formatRelative(new Date(endpoint.lastDeliveryAt), nowStore.current, me.user?.timeFormat ?? "24h")}
				</span>
			</TooltipTrigger>
			<TooltipContent>{formatFull(new Date(endpoint.lastDeliveryAt))}</TooltipContent>
		</Tooltip>
	{:else}
		<span class="text-muted-foreground">—</span>
	{/if}
{/snippet}

{#snippet createdByCell(endpoint: WebhookEndpoint)}
	<CreatedByCell user={endpoint.createdBy} />
{/snippet}

{#snippet actionsHead()}<ActionsHead />{/snippet}

{#snippet actionsCell(endpoint: WebhookEndpoint)}
	<div class="flex items-center justify-end gap-1">
		<Switch
			checked={endpoint.enabled}
			onCheckedChange={(enabled) => toggleEndpoint(endpoint, enabled)}
			aria-label={endpoint.enabled ? m.webhooks_disable_named({ name: localizedNamesStore.display("webhook", endpoint.id, endpoint.name) }, messageOptions) : m.webhooks_enable_named({ name: localizedNamesStore.display("webhook", endpoint.id, endpoint.name) }, messageOptions)}
		/>
		<Button variant="ghost" size="icon-sm" href={`/webhooks/${endpoint.id}`} aria-label={m.webhooks_edit_named({ name: localizedNamesStore.display("webhook", endpoint.id, endpoint.name) }, messageOptions)}>
			<Pencil class="size-4" />
		</Button>
		{#if (usageByEndpoint.get(endpoint.id)?.length ?? 0) > 0}
			<Tooltip>
				<TooltipTrigger>
					<Button variant="ghost" size="icon-sm" disabled aria-label={m.webhooks_delete_named({ name: localizedNamesStore.display("webhook", endpoint.id, endpoint.name) }, messageOptions)}>
						<Trash2 class="size-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>{m.webhooks_used_by_automation({}, messageOptions)}</TooltipContent>
			</Tooltip>
		{:else}
			<Button
				variant="ghost"
				size="icon-sm"
				class="text-destructive hover:text-destructive"
				onclick={() => (deleteEndpoint = endpoint)}
				aria-label={m.webhooks_delete_named({ name: localizedNamesStore.display("webhook", endpoint.id, endpoint.name) }, messageOptions)}
			>
				<Trash2 class="size-4" />
			</Button>
		{/if}
	</div>
{/snippet}

<div>
	{#if errors.message}
		<ErrorBanner class="mb-4" message={errors.message} ondismiss={() => errors.clear()} />
	{/if}

	{#if webhooksStore.hydrated}
		<div in:fly={{ y: -4, duration: 150 }}>
			{#if endpoints.length === 0}
				<div class="rounded-lg bg-card p-12 text-center shadow-card">
					<div class="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
						<Webhook class="size-6 text-muted-foreground" />
					</div>
					<p class="text-muted-foreground">{m.webhooks_empty({}, messageOptions)}</p>
					<p class="mt-2 text-sm text-muted-foreground">{m.webhooks_empty_help({}, messageOptions)}</p>
					<Button class="mt-4" onclick={() => (createOpen = true)}>
						<Plus class="size-4" />
						{m.webhooks_create_first({}, messageOptions)}
					</Button>
				</div>
			{:else}
				<div class="mb-6 flex items-stretch gap-2">
					<div class="min-w-0 flex-1">
						<HiveSearchbar controller={searchController} chips={searchChipConfigs} placeholder={m.webhooks_search({}, messageOptions)} />
					</div>
					{#if selection.count > 0}
						<TableSelectionToolbar count={selection.count} onclear={() => selection.clear()}>
							{#snippet actions()}
								<Button variant="destructive" size="sm" onclick={() => (batchDeleteConfirm = true)}>{m.common_delete({}, messageOptions)}</Button>
							{/snippet}
						</TableSelectionToolbar>
					{/if}
				</div>
				{#if filteredEndpoints.length === 0}
					<div class="rounded-lg bg-card p-12 text-center shadow-card">
						<p class="text-muted-foreground">{m.webhooks_no_match({}, messageOptions)}</p>
					</div>
				{:else}
					<HiveDataTable
						class="list-view-fade"
						{tableState}
						columns={COLUMNS}
						rows={displayRows}
						rowId={(endpoint) => endpoint.id}
						rowAttrs={(endpoint) => rowAttrsForSelection(selection, endpoint.id)}
					/>
				{/if}
			{/if}
		</div>
	{/if}

	<Dialog bind:open={createOpen}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{m.webhooks_create({}, messageOptions)}</DialogTitle>
				<DialogDescription>{m.webhooks_create_description({}, messageOptions)}</DialogDescription>
			</DialogHeader>
			<form onsubmit={(event) => { event.preventDefault(); void createEndpoint(); }}>
				<div class="space-y-4">
					<div class="space-y-2">
						<label for="webhook-name" class="text-sm font-medium">{m.field_name({}, messageOptions)}</label>
						<Input id="webhook-name" bind:value={createName} placeholder={m.webhooks_name_placeholder({}, messageOptions)} autofocus />
					</div>
				</div>
				<DialogFooter class="mt-4">
					<Button variant="outline" type="button" onclick={() => (createOpen = false)}>{m.common_cancel({}, messageOptions)}</Button>
					<Button type="submit" disabled={!createName.trim() || createLoading}>
						{createLoading ? m.webhooks_creating({}, messageOptions) : m.webhooks_create_short({}, messageOptions)}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>

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

	<ConfirmDialog
		bind:open={() => deleteEndpoint !== null, (open) => { if (!open) deleteEndpoint = null; }}
		title={m.webhooks_delete_title({}, messageOptions)}
		description={m.webhooks_delete_with_history({ name: deleteEndpoint ? localizedNamesStore.display("webhook", deleteEndpoint.id, deleteEndpoint.name) : "" }, messageOptions)}
		confirmLabel={m.common_delete({}, messageOptions)}
		loading={deleteLoading}
		onconfirm={confirmDelete}
		oncancel={() => (deleteEndpoint = null)}
	/>

	<ConfirmDialog
		open={batchDeleteConfirm}
		title={m.webhooks_delete_many_title({}, messageOptions)}
		description={m.webhooks_delete_many_with_history({ count: selection.count }, messageOptions)}
		confirmLabel={m.common_delete({}, messageOptions)}
		loading={batchDeleteLoading}
		onconfirm={confirmBatchDelete}
		oncancel={() => (batchDeleteConfirm = false)}
	/>
</div>
