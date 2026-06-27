<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import EntityCard from "$lib/components/entity-card.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig, SearchState } from "$lib/components/hive-searchbar";
	import TuyaIcon from "$lib/components/icons/tuya-icon.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import { Plus, PlugZap } from "@lucide/svelte";

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
	const searchChipConfigs: ChipConfig[] = [];

	let integrations = $state<Integration[]>([]);
	let loading = $state(true);
	let addDialogOpen = $state(false);
	let deleteConfirmIntegration = $state<Integration | null>(null);
	let deleteLoading = $state(false);
	let searchState = $state<SearchState>({ chips: [], freeText: "" });

	const configuredIntegrations = $derived(integrations.filter((i) => i.configured));
	const availableProviders = $derived(integrations.filter((i) => !i.configured));
	const filteredAvailable = $derived.by(() => {
		const q = searchState.freeText.trim().toLowerCase();
		if (!q) return availableProviders;
		return availableProviders.filter((i) => i.name.toLowerCase().includes(q));
	});
	const deleteDeviceCount = $derived(deleteConfirmIntegration?.deviceCount ?? 0);

	async function loadIntegrations() {
		loading = true;
		try {
			const result = await client.query(INTEGRATIONS_QUERY, {}, { requestPolicy: "network-only" }).toPromise();
			if (result.data) integrations = result.data.integrations;
		} finally {
			loading = false;
		}
	}

	function openAddDialog() {
		searchState = { chips: [], freeText: "" };
		addDialogOpen = true;
	}

	function openProvider(provider: string) {
		addDialogOpen = false;
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
		if (!integration.enabled) return "Disabled";
		if (integration.connected) return "Connected";
		return "Configured";
	}

	$effect(() => {
		pageHeader.actions = [{ label: "Add Integration", mobileLabel: "Add", icon: Plus, onclick: openAddDialog }];
		pageHeader.viewToggle = null;
	});

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Integrations" }];
		void loadIntegrations();
	});

	onDestroy(() => pageHeader.reset());
</script>

{#if !loading}
	{#if configuredIntegrations.length === 0}
		<div class="rounded-lg shadow-card bg-card p-12 text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<PlugZap class="size-6 text-muted-foreground" />
			</div>
			<p class="text-muted-foreground">No integrations yet.</p>
			<p class="mt-2 text-sm text-muted-foreground">
				Add an integration to bring external devices into Saffron Hive.
			</p>
			<Button class="mt-4" onclick={openAddDialog}>
				<Plus class="size-4" />
				<span>Add Integration</span>
			</Button>
		</div>
	{:else}
		<AnimatedGrid>
			{#each configuredIntegrations as integration (integration.provider)}
				<EntityCard
					entity={{ id: integration.provider, name: integration.name, icon: null }}
					fallbackIcon={TuyaIcon}
					subtitle={statusLabel(integration)}
					onedit={() => openProvider(integration.provider)}
					ondelete={() => (deleteConfirmIntegration = integration)}
					editLabel="Configure"
					deleteLabel="Delete integration"
					iconEditable={false}
					readOnly={false}
					class="min-h-32"
				/>
			{/each}
		</AnimatedGrid>
	{/if}
{/if}

<Dialog bind:open={addDialogOpen}>
	<DialogContent class="sm:max-w-lg">
		<DialogHeader>
			<DialogTitle>Add Integration</DialogTitle>
			<DialogDescription>Pick an integration to configure.</DialogDescription>
		</DialogHeader>

		<div class="space-y-3">
			<HiveSearchbar
				value={searchState}
				onchange={(v) => (searchState = v)}
				chips={searchChipConfigs}
				placeholder="Search integrations..."
			/>

			{#if availableProviders.length === 0}
				<div class="rounded-lg bg-muted/30 p-8 text-center">
					<p class="text-sm text-muted-foreground">No integrations left to add.</p>
				</div>
			{:else if filteredAvailable.length === 0}
				<div class="rounded-lg bg-muted/30 p-8 text-center">
					<p class="text-sm text-muted-foreground">No integrations match your search.</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each filteredAvailable as integration (integration.provider)}
						<button
							type="button"
							class="flex w-full items-center gap-3 rounded-lg bg-muted/30 p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							onclick={() => openProvider(integration.provider)}
						>
							<TuyaIcon class="size-8 shrink-0" />
							<div class="min-w-0">
								<div class="font-medium">{integration.name}</div>
								<div class="text-xs text-muted-foreground">Cloud API device adapter</div>
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
	title="Delete Integration"
	description="Deleting this integration removes its configuration and all devices connected through it. This cannot be undone."
	confirmLabel="Delete"
	loading={deleteLoading}
	onconfirm={handleDeleteIntegration}
	oncancel={() => (deleteConfirmIntegration = null)}
>
	<div class="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
		<span>This will delete </span>
		<strong>{deleteDeviceCount} device{deleteDeviceCount === 1 ? "" : "s"}</strong>
	</div>
</ConfirmDialog>
