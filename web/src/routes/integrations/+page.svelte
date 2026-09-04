<script lang="ts">
	import { onMount } from "svelte";
	import { goto, pushState, replaceState } from "$app/navigation";
	import { page } from "$app/state";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import EntityCard from "$lib/components/entity-card.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig } from "$lib/components/hive-searchbar";
	import { createUrlSearchState } from "$lib/search-state.svelte";
	import { loadSessionSnapshot, saveSessionSnapshot } from "$lib/session-cache";
	import { integrationDescription, integrationMeta } from "$lib/integrations";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import { Plus, PlugZap } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	const INTEGRATIONS_QUERY = graphql(`
		query IntegrationsPage {
			integrations {
				provider
				name
				configured
				enabled
				connected
				deviceCount
				message
			}
		}
	`);

	const DELETE_INTEGRATION = graphql(`
		mutation DeleteIntegration($provider: String!) {
			deleteIntegration(provider: $provider)
		}
	`);

	type Integration = {
		provider: string;
		name: string;
		configured: boolean;
		enabled: boolean;
		connected: boolean;
		deviceCount: number;
		message?: string | null;
	};

	const client = getContextClient();
	const messageOptions = $derived(locale.messageOptions());
	const searchChipConfigs: ChipConfig[] = [];
	const INTEGRATIONS_CACHE_VERSION = 1;
	const restoredIntegrations = loadSessionSnapshot<Integration[]>(
		typeof window === "undefined" ? null : window.sessionStorage,
		"integrations",
		INTEGRATIONS_CACHE_VERSION,
	);

	let integrations = $state<Integration[]>(restoredIntegrations ?? []);
	let hydrated = $state(restoredIntegrations !== null);
	let deleteConfirmIntegration = $state<Integration | null>(null);
	let deleteLoading = $state(false);
	const addDialogOpen = $derived(
		page.url.pathname === "/integrations" && page.url.searchParams.get("add") === "1",
	);
	const searchController = createUrlSearchState({
		active: () => addDialogOpen,
	});

	const configuredIntegrations = $derived(integrations.filter((i) => i.configured));
	const availableProviders = $derived(integrations.filter((i) => !i.configured));
	const filteredAvailable = $derived.by(() => {
		const q = searchController.value.freeText.trim().toLowerCase();
		if (!q) return availableProviders;
		return availableProviders.filter((i) => i.name.toLowerCase().includes(q));
	});
	const deleteDeviceCount = $derived(deleteConfirmIntegration?.deviceCount ?? 0);
	const deleteKeepsDevices = $derived(
		deleteConfirmIntegration ? integrationMeta(deleteConfirmIntegration.provider).keepsDevices : false,
	);

	async function loadIntegrations() {
		try {
			const result = await client.query(INTEGRATIONS_QUERY, {}, { requestPolicy: "network-only" }).toPromise();
			if (result.data) {
				integrations = result.data.integrations;
				saveSessionSnapshot(
					window.sessionStorage,
					"integrations",
					INTEGRATIONS_CACHE_VERSION,
					integrations,
				);
			}
		} finally {
			hydrated = true;
		}
	}

	function openAddDialog() {
		const url = new URL(page.url);
		url.searchParams.set("add", "1");
		pushState(url, page.state);
	}

	function closeAddDialog() {
		const url = new URL(page.url);
		url.searchParams.delete("add");
		replaceState(url, page.state);
	}

	function openProvider(provider: string) {
		void goto(`/integrations/${provider}`);
	}

	async function handleDeleteIntegration() {
		if (!deleteConfirmIntegration) return;
		deleteLoading = true;
		try {
			const result = await client
				.mutation(DELETE_INTEGRATION, { provider: deleteConfirmIntegration.provider })
				.toPromise();
			if (result.error) throw result.error;
			deleteConfirmIntegration = null;
			await loadIntegrations();
		} finally {
			deleteLoading = false;
		}
	}

	function statusLabel(integration: Integration): string {
		if (!integration.enabled) return m.integrations_status_disabled({}, messageOptions);
		if (integration.connected) return m.integrations_status_connected({}, messageOptions);
		return m.integrations_status_configured({}, messageOptions);
	}

	$effect(() => {
		pageHeader.actions = [{ label: m.integrations_add({}, messageOptions), mobileLabel: m.integrations_add_short({}, messageOptions), icon: Plus, onclick: openAddDialog }];
		pageHeader.viewToggle = null;
		pageHeader.breadcrumbs = [{ label: m.nav_integrations({}, messageOptions) }];
	});

	onMount(() => {
		void loadIntegrations();
	});

</script>

{#if hydrated}
	{#if configuredIntegrations.length === 0}
		<div class="rounded-lg shadow-card bg-card p-12 text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<PlugZap class="size-6 text-muted-foreground" />
			</div>
			<p class="text-muted-foreground">{m.integrations_empty({}, messageOptions)}</p>
			<p class="mt-2 text-sm text-muted-foreground">
				{m.integrations_empty_help({}, messageOptions)}
			</p>
			<Button class="mt-4" onclick={openAddDialog}>
				<Plus class="size-4" />
				<span>{m.integrations_add({}, messageOptions)}</span>
			</Button>
		</div>
	{:else}
		<AnimatedGrid>
			{#each configuredIntegrations as integration (integration.provider)}
				{@const meta = integrationMeta(integration.provider)}
				<EntityCard
					entity={{ id: integration.provider, name: integration.name, icon: null }}
					fallbackIcon={meta.icon}
					subtitle={statusLabel(integration)}
					editHref={`/integrations/${integration.provider}`}
					ondelete={() => (deleteConfirmIntegration = integration)}
					editLabel={m.integrations_configure({}, messageOptions)}
					deleteLabel={m.integrations_delete({}, messageOptions)}
					iconEditable={false}
					readOnly={false}
					class="min-h-32 justify-center"
				>
					{#snippet iconArea()}
						<meta.icon class="size-10 shrink-0" />
					{/snippet}
				</EntityCard>
			{/each}
		</AnimatedGrid>
	{/if}
{/if}

<Dialog open={addDialogOpen} onOpenChange={(open) => { if (!open && addDialogOpen) closeAddDialog(); }}>
	<DialogContent class="sm:max-w-lg">
		<DialogHeader>
			<DialogTitle>{m.integrations_add({}, messageOptions)}</DialogTitle>
			<DialogDescription>{m.integrations_add_description({}, messageOptions)}</DialogDescription>
		</DialogHeader>

		<div class="space-y-3">
			<HiveSearchbar
				controller={searchController}
				chips={searchChipConfigs}
				placeholder={m.integrations_search({}, messageOptions)}
			/>

			{#if availableProviders.length === 0}
				<div class="rounded-lg bg-muted/30 p-8 text-center">
					<p class="text-sm text-muted-foreground">{m.integrations_none_available({}, messageOptions)}</p>
				</div>
			{:else if filteredAvailable.length === 0}
				<div class="rounded-lg bg-muted/30 p-8 text-center">
					<p class="text-sm text-muted-foreground">{m.integrations_no_match({}, messageOptions)}</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each filteredAvailable as integration (integration.provider)}
						{@const meta = integrationMeta(integration.provider)}
						<button
							type="button"
							class="flex w-full items-center gap-3 rounded-lg bg-muted/30 p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							onclick={() => openProvider(integration.provider)}
						>
							<meta.icon class="size-8 shrink-0" />
							<div class="min-w-0">
								<div class="font-medium">{integration.name}</div>
								<div class="text-xs text-muted-foreground">{integrationDescription(integration.provider)}</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</DialogContent>
</Dialog>

<ConfirmDialog
	bind:open={() => deleteConfirmIntegration !== null, (v) => { if (!v) deleteConfirmIntegration = null; }}
	title={m.integrations_delete_title({}, messageOptions)}
	description={deleteKeepsDevices
		? m.integrations_delete_keep_description({}, messageOptions)
		: m.integrations_delete_purge_description({}, messageOptions)}
	confirmLabel={m.common_delete({}, messageOptions)}
	loading={deleteLoading}
	onconfirm={handleDeleteIntegration}
	oncancel={() => (deleteConfirmIntegration = null)}
>
	{#if deleteKeepsDevices}
		<div class="rounded-lg bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
			<strong>{m.integrations_devices_kept({ count: deleteDeviceCount }, messageOptions)}</strong>
		</div>
	{:else}
		<div class="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
			<strong>{m.integrations_devices_deleted({ count: deleteDeviceCount }, messageOptions)}</strong>
		</div>
	{/if}
</ConfirmDialog>
