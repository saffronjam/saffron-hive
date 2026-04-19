<script lang="ts">
	import { goto } from "$app/navigation";
	import { queryStore, getContextClient, gql } from "@urql/svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import AutomationCard from "$lib/components/automation-card.svelte";
	import AutomationTable from "$lib/components/automation-table.svelte";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import ListView from "$lib/components/list-view.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import { Plus, Workflow, X } from "@lucide/svelte";
	import { onMount, onDestroy } from "svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { profile, type ListView as ListViewMode } from "$lib/stores/profile.svelte";
	import { ErrorBanner } from "$lib/stores/error-banner.svelte";

	let view = $state<ListViewMode>(profile.get("view.automations", "card"));

	interface AutomationNode {
		id: string;
		type: string;
		config: string;
	}

	interface AutomationEdge {
		id: string;
		fromNodeId: string;
		toNodeId: string;
	}

	interface AutomationData {
		id: string;
		name: string;
		icon?: string | null;
		enabled: boolean;
		cooldownSeconds: number;
		nodes: AutomationNode[];
		edges: AutomationEdge[];
	}

	interface AutomationsQueryResult {
		automations: AutomationData[];
	}

	interface CreateAutomationResult {
		createAutomation: AutomationData;
	}

	interface ToggleAutomationResult {
		toggleAutomation: AutomationData;
	}

	const client = getContextClient();

	const AUTOMATIONS_QUERY = gql`
		query Automations {
			automations {
				id
				name
				icon
				enabled
				cooldownSeconds
				nodes {
					id
					type
					config
				}
				edges {
					id
					fromNodeId
					toNodeId
				}
			}
		}
	`;

	const CREATE_AUTOMATION = gql`
		mutation CreateAutomation($input: CreateAutomationInput!) {
			createAutomation(input: $input) {
				id
				name
				enabled
				cooldownSeconds
				nodes {
					id
					type
					config
				}
				edges {
					id
					fromNodeId
					toNodeId
				}
			}
		}
	`;

	const TOGGLE_AUTOMATION = gql`
		mutation ToggleAutomation($id: ID!, $enabled: Boolean!) {
			toggleAutomation(id: $id, enabled: $enabled) {
				id
				enabled
			}
		}
	`;

	const DELETE_AUTOMATION = gql`
		mutation DeleteAutomation($id: ID!) {
			deleteAutomation(id: $id)
		}
	`;

	const UPDATE_AUTOMATION_NAME = gql`
		mutation UpdateAutomation($id: ID!, $input: UpdateAutomationInput!) {
			updateAutomation(id: $id, input: $input) {
				id
				name
			}
		}
	`;

	const automationsQuery = queryStore<AutomationsQueryResult>({
		client,
		query: AUTOMATIONS_QUERY,
	});

	const automations = $derived($automationsQuery.data?.automations ?? []);

	let createDialogOpen = $state(false);
	let newAutomationName = $state("");
	let createLoading = $state(false);

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Automations" }];
		pageHeader.actions = [{ label: "Create Automation", icon: Plus, onclick: () => (createDialogOpen = true) }];
	});
	onDestroy(() => pageHeader.reset());

	$effect(() => {
		pageHeader.viewToggle = {
			value: view,
			onchange: (v) => {
				view = v;
				profile.set("view.automations", v);
			},
		};
	});
	const errors = new ErrorBanner();
	let deleteConfirmId = $state<string | null>(null);
	let deleteConfirmName = $state("");
	let deleteLoading = $state(false);

	async function handleCreateAutomation() {
		if (!newAutomationName.trim()) return;
		createLoading = true;
		errors.clear();

		const result = await client
			.mutation<CreateAutomationResult>(CREATE_AUTOMATION, {
				input: {
					name: newAutomationName.trim(),
					enabled: false,
					cooldownSeconds: 60,
					nodes: [],
					edges: [],
				},
			})
			.toPromise();

		createLoading = false;

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		newAutomationName = "";
		createDialogOpen = false;

		if (result.data) {
			goto(`/automations/${result.data.createAutomation.id}`);
		}
	}

	async function handleToggle(id: string, enabled: boolean) {
		errors.clear();

		const result = await client
			.mutation<ToggleAutomationResult>(TOGGLE_AUTOMATION, { id, enabled })
			.toPromise();

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		automationsQuery.reexecute({ requestPolicy: "network-only" });
	}

	function handleCardClick(id: string) {
		goto(`/automations/${id}`);
	}

	function requestDelete(id: string, name: string) {
		deleteConfirmId = id;
		deleteConfirmName = name;
	}

	async function handleConfirmDelete() {
		if (!deleteConfirmId) return;
		deleteLoading = true;
		errors.clear();

		const result = await client
			.mutation(DELETE_AUTOMATION, { id: deleteConfirmId })
			.toPromise();

		deleteLoading = false;

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		deleteConfirmId = null;
		automationsQuery.reexecute({ requestPolicy: "network-only" });
	}

	async function handleRename(id: string, newName: string) {
		errors.clear();

		const result = await client
			.mutation(UPDATE_AUTOMATION_NAME, { id, input: { name: newName } })
			.toPromise();

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		automationsQuery.reexecute({ requestPolicy: "network-only" });
	}

	async function handleIconChange(id: string, icon: string | null) {
		errors.clear();

		const result = await client
			.mutation(UPDATE_AUTOMATION_NAME, { id, input: { icon } })
			.toPromise();

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		automationsQuery.reexecute({ requestPolicy: "network-only" });
	}
</script>

<div>
	{#if errors.message}
		<div
			class="mb-4 flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		>
			<span>{errors.message}</span>
			<button type="button" onclick={() => errors.clear()} class="ml-2 shrink-0">
				<X class="size-4" />
			</button>
		</div>
	{/if}


	{#if !$automationsQuery.fetching && automations.length === 0}
		<div class="rounded-lg shadow-card bg-card p-12 text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<Workflow class="size-6 text-muted-foreground" />
			</div>
			<p class="text-muted-foreground">No automations yet.</p>
			<p class="mt-2 text-sm text-muted-foreground">
				Create event-driven rules with triggers, conditions, and actions.
			</p>
			<Button class="mt-4" onclick={() => (createDialogOpen = true)}>
				<Plus class="size-4" />
				<span>Create your first automation</span>
			</Button>
		</div>
	{:else}
		<ListView mode={view}>
			{#snippet card()}
				<AnimatedGrid>
					{#each automations as automation (automation.id)}
						<AutomationCard
							{automation}
							ontoggle={handleToggle}
							onedit={handleCardClick}
							ondelete={(id) => requestDelete(id, automations.find((a) => a.id === id)?.name ?? "this automation")}
							onrename={handleRename}
							oniconchange={handleIconChange}
						/>
					{/each}
				</AnimatedGrid>
			{/snippet}
			{#snippet table()}
				<AutomationTable
					{automations}
					ontoggle={handleToggle}
					ondelete={(id) => requestDelete(id, automations.find((a) => a.id === id)?.name ?? "this automation")}
					onrename={handleRename}
					oniconchange={handleIconChange}
				/>
			{/snippet}
		</ListView>
	{/if}

	<Dialog bind:open={createDialogOpen}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Create Automation</DialogTitle>
				<DialogDescription>
					Give your new automation a name. You can add triggers and actions in the graph editor.
				</DialogDescription>
			</DialogHeader>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleCreateAutomation();
				}}
			>
				<Input bind:value={newAutomationName} placeholder="Automation name" autofocus />
				<DialogFooter class="mt-4">
					<Button
						variant="outline"
						type="button"
						onclick={() => {
							createDialogOpen = false;
							newAutomationName = "";
						}}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={!newAutomationName.trim() || createLoading}>
						{createLoading ? "Creating..." : "Create"}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>

	<ConfirmDialog
		bind:open={() => deleteConfirmId !== null, (v) => { if (!v) deleteConfirmId = null; }}
		title="Delete Automation"
		description='Are you sure you want to delete "{deleteConfirmName}"? This action cannot be undone.'
		confirmLabel="Delete"
		loading={deleteLoading}
		onconfirm={handleConfirmDelete}
		oncancel={() => (deleteConfirmId = null)}
	/>
</div>
