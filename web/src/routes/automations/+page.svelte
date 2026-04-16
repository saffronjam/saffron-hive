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
	import { Plus, Workflow, X } from "@lucide/svelte";

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

	const automationsQuery = queryStore<AutomationsQueryResult>({
		client,
		query: AUTOMATIONS_QUERY,
	});

	const automations = $derived($automationsQuery.data?.automations ?? []);

	let createDialogOpen = $state(false);
	let newAutomationName = $state("");
	let createLoading = $state(false);
	let errorMessage = $state<string | null>(null);

	function clearError() {
		errorMessage = null;
	}

	function dismissErrorAfterDelay() {
		setTimeout(clearError, 5000);
	}

	async function handleCreateAutomation() {
		if (!newAutomationName.trim()) return;
		createLoading = true;
		clearError();

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
			errorMessage = result.error.message;
			dismissErrorAfterDelay();
			return;
		}

		newAutomationName = "";
		createDialogOpen = false;

		if (result.data) {
			goto(`/automations/${result.data.createAutomation.id}`);
		}
	}

	async function handleToggle(id: string, enabled: boolean) {
		clearError();

		const result = await client
			.mutation<ToggleAutomationResult>(TOGGLE_AUTOMATION, { id, enabled })
			.toPromise();

		if (result.error) {
			errorMessage = result.error.message;
			dismissErrorAfterDelay();
			return;
		}

		automationsQuery.reexecute({ requestPolicy: "network-only" });
	}

	function handleCardClick(id: string) {
		goto(`/automations/${id}`);
	}
</script>

<div>
	{#if errorMessage}
		<div
			class="mb-4 flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		>
			<span>{errorMessage}</span>
			<button type="button" onclick={clearError} class="ml-2 shrink-0">
				<X class="size-4" />
			</button>
		</div>
	{/if}

	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-semibold">Automations</h1>
		<Button onclick={() => (createDialogOpen = true)}>
			<Plus class="size-4" />
			<span>Create Automation</span>
		</Button>
	</div>

	{#if $automationsQuery.fetching}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each [1, 2, 3] as _ (_.toString())}
				<div class="h-28 animate-pulse rounded-lg border border-border bg-card"></div>
			{/each}
		</div>
	{:else if automations.length === 0}
		<div class="rounded-lg border border-border bg-card p-12 text-center">
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
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each automations as automation (automation.id)}
				<AutomationCard
					{automation}
					ontoggle={handleToggle}
					onclick={handleCardClick}
				/>
			{/each}
		</div>
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
</div>
