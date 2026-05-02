<script lang="ts">
	import { goto } from "$app/navigation";
	import { queryStore, getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
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
	import EntityCard from "$lib/components/entity-card.svelte";
	import AutomationTable from "$lib/components/automation-table.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";
	import { automationNodeCounts } from "$lib/list-helpers";
	import { formatFull, formatRelative } from "$lib/time-format";
	import { nowStore } from "$lib/stores/now.svelte";
	import { me } from "$lib/stores/me.svelte";
	import TableSelectionToolbar from "$lib/components/table-selection-toolbar.svelte";
	import { createTableSelection } from "$lib/utils/table-selection.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig, SearchState } from "$lib/components/hive-searchbar";
	import {
		actionKind,
		referencedDeviceIds,
		referencedSceneIds,
		triggerKind,
	} from "$lib/automation-config";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import ListView from "$lib/components/list-view.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import { Plus, Workflow, Zap, GitMerge, Play } from "@lucide/svelte";
	import { onMount, onDestroy } from "svelte";
	import { fly } from "svelte/transition";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { profile, type ListView as ListViewMode } from "$lib/stores/profile.svelte";
	import { BannerError } from "$lib/stores/banner-error.svelte";

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
		lastFiredAt?: string | null;
		nodes: AutomationNode[];
		edges: AutomationEdge[];
		createdBy?: { id: string; username: string; name: string } | null;
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

	const AUTOMATIONS_QUERY = graphql(`
		query Automations {
			automations {
				id
				name
				icon
				enabled
				lastFiredAt
				nodes {
					id
					type
					config
				}
				edges {
					fromNodeId
					toNodeId
				}
				createdBy {
					id
					username
					name
				}
			}
		}
	`);

	const CREATE_AUTOMATION = graphql(`
		mutation CreateAutomation($input: CreateAutomationInput!) {
			createAutomation(input: $input) {
				id
				name
				enabled
				nodes {
					id
					type
					config
				}
				edges {
					fromNodeId
					toNodeId
				}
				createdBy {
					id
					username
					name
				}
			}
		}
	`);

	const TOGGLE_AUTOMATION = graphql(`
		mutation ToggleAutomation($id: ID!, $enabled: Boolean!) {
			toggleAutomation(id: $id, enabled: $enabled) {
				id
				enabled
			}
		}
	`);

	const DELETE_AUTOMATION = graphql(`
		mutation DeleteAutomation($id: ID!) {
			deleteAutomation(id: $id)
		}
	`);

	const BATCH_DELETE_AUTOMATIONS = graphql(`
		mutation BatchDeleteAutomations($ids: [ID!]!) {
			batchDeleteAutomations(ids: $ids)
		}
	`);

	const UPDATE_AUTOMATION_NAME = graphql(`
		mutation AutomationListUpdate($id: ID!, $input: UpdateAutomationInput!) {
			updateAutomation(id: $id, input: $input) {
				id
				name
			}
		}
	`);

	const DEVICES_QUERY = graphql(`
		query AutomationsPageDevices {
			devices {
				id
				name
			}
		}
	`);

	const SCENES_QUERY = graphql(`
		query AutomationsPageScenes {
			scenes {
				id
				name
			}
		}
	`);

	interface DeviceRef {
		id: string;
		name: string;
	}

	interface SceneRef {
		id: string;
		name: string;
	}

	const automationsQuery = queryStore<AutomationsQueryResult>({
		client,
		query: AUTOMATIONS_QUERY,
	});
	const devicesQuery = queryStore<{ devices: DeviceRef[] }>({ client, query: DEVICES_QUERY });
	const scenesQuery = queryStore<{ scenes: SceneRef[] }>({ client, query: SCENES_QUERY });

	const automations = $derived($automationsQuery.data?.automations ?? []);
	const devicesRef = $derived($devicesQuery.data?.devices ?? []);
	const scenesRef = $derived($scenesQuery.data?.scenes ?? []);

	let hasLoadedOnce = $state(false);
	$effect(() => {
		if (!$automationsQuery.fetching && !hasLoadedOnce) {
			hasLoadedOnce = true;
		}
	});

	let searchState = $state<SearchState>({ chips: [], freeText: "" });

	const enabledOptions = [
		{ value: "yes", label: "Yes" },
		{ value: "no", label: "No" },
	];

	const triggerOptions = [
		{ value: "event", label: "Event" },
		{ value: "schedule", label: "Schedule" },
	];

	const actionOptions = [
		{ value: "set_device_state", label: "Set device state" },
		{ value: "activate_scene", label: "Activate scene" },
		{ value: "raise_alarm", label: "Raise alarm" },
		{ value: "clear_alarm", label: "Clear alarm" },
	];

	const emptyOptions = [
		{ value: "yes", label: "Yes" },
		{ value: "no", label: "No" },
	];

	const searchChipConfigs: ChipConfig[] = $derived([
		{
			keyword: "enabled",
			label: "Enabled",
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return q
					? enabledOptions.filter((o) => o.value.includes(q) || o.label.toLowerCase().includes(q))
					: enabledOptions;
			},
		},
		{
			keyword: "trigger",
			label: "Trigger",
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return q
					? triggerOptions.filter((o) => o.value.includes(q) || o.label.toLowerCase().includes(q))
					: triggerOptions;
			},
		},
		{
			keyword: "action",
			label: "Action",
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return q
					? actionOptions.filter((o) => o.value.includes(q) || o.label.toLowerCase().includes(q))
					: actionOptions;
			},
		},
		{
			keyword: "device",
			label: "Device",
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return devicesRef
					.filter((d) => !q || d.name.toLowerCase().includes(q))
					.map((d) => ({ value: d.name, label: d.name }));
			},
		},
		{
			keyword: "scene",
			label: "Scene",
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return scenesRef
					.filter((s) => !q || s.name.toLowerCase().includes(q))
					.map((s) => ({ value: s.name, label: s.name }));
			},
		},
		{
			keyword: "empty",
			label: "Empty",
			variant: "secondary",
			options: () => emptyOptions,
		},
	]);

	const filteredAutomations = $derived.by(() => {
		const enabledValues = searchState.chips
			.filter((c) => c.keyword === "enabled")
			.map((c) => c.value);
		const triggerValues = searchState.chips
			.filter((c) => c.keyword === "trigger")
			.map((c) => c.value);
		const actionValues = searchState.chips.filter((c) => c.keyword === "action").map((c) => c.value);
		const deviceValues = searchState.chips
			.filter((c) => c.keyword === "device")
			.map((c) => c.value.toLowerCase());
		const sceneValues = searchState.chips
			.filter((c) => c.keyword === "scene")
			.map((c) => c.value.toLowerCase());
		const emptyValues = searchState.chips.filter((c) => c.keyword === "empty").map((c) => c.value);
		const query = searchState.freeText.toLowerCase();

		return automations.filter((a) => {
			if (enabledValues.length > 0) {
				const flag = a.enabled ? "yes" : "no";
				if (!enabledValues.includes(flag)) return false;
			}
			if (triggerValues.length > 0) {
				const kinds = a.nodes
					.map((n) => triggerKind(n))
					.filter((k): k is "event" | "schedule" => k !== null);
				if (!triggerValues.some((v) => (kinds as string[]).includes(v))) return false;
			}
			if (actionValues.length > 0) {
				const kinds = a.nodes.map((n) => actionKind(n)).filter((k): k is string => k !== null);
				if (!actionValues.some((v) => kinds.includes(v))) return false;
			}
			if (deviceValues.length > 0) {
				const ids = new Set(a.nodes.flatMap((n) => referencedDeviceIds(n)));
				const names = [...ids]
					.map((id) => devicesRef.find((d) => d.id === id)?.name.toLowerCase() ?? "")
					.filter((n) => n !== "");
				if (!deviceValues.some((v) => names.some((n) => n.includes(v)))) return false;
			}
			if (sceneValues.length > 0) {
				const ids = new Set(a.nodes.flatMap((n) => referencedSceneIds(n)));
				const names = [...ids]
					.map((id) => scenesRef.find((s) => s.id === id)?.name.toLowerCase() ?? "")
					.filter((n) => n !== "");
				if (!sceneValues.some((v) => names.some((n) => n.includes(v)))) return false;
			}
			if (emptyValues.length > 0) {
				const isEmpty = a.nodes.length === 0;
				const wants = emptyValues.some((v) => (v === "yes" ? isEmpty : !isEmpty));
				if (!wants) return false;
			}
			if (query && !a.name.toLowerCase().includes(query)) return false;
			return true;
		});
	});

	const filteredIds = $derived(filteredAutomations.map((a) => a.id));
	$effect(() => {
		selection.pruneTo(filteredIds);
	});

	let createDialogOpen = $state(false);
	let newAutomationName = $state("");
	let createLoading = $state(false);
	let newAutomationNameInput = $state<HTMLInputElement | null>(null);

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Automations" }];
		pageHeader.actions = [{ label: "Create Automation", icon: Plus, onclick: () => (createDialogOpen = true) }];
	});
	onDestroy(() => pageHeader.reset());

	// Poll the list so lastFiredAt updates reflect recent firings without
	// needing a user gesture. 5s is low enough to feel live for button-driven
	// automations and cheap: a few rows with `cache-and-network` mostly hits
	// urql's cache unless the backend wrote.
	$effect(() => {
		const iv = setInterval(() => {
			automationsQuery.reexecute({ requestPolicy: "cache-and-network" });
		}, 5000);
		return () => clearInterval(iv);
	});

	$effect(() => {
		pageHeader.viewToggle = {
			value: view,
			onchange: (v) => {
				view = v;
				profile.set("view.automations", v);
			},
		};
	});
	const errors = new BannerError();
	let deleteConfirmId = $state<string | null>(null);
	let deleteConfirmName = $state("");
	let deleteLoading = $state(false);

	const selection = createTableSelection();
	let batchDeleteConfirm = $state(false);
	let batchDeleteLoading = $state(false);

	async function handleCreateAutomation(options: { keepOpen?: boolean } = {}) {
		if (!newAutomationName.trim()) return;
		createLoading = true;
		errors.clear();

		const result = await client
			.mutation<CreateAutomationResult>(CREATE_AUTOMATION, {
				input: {
					name: newAutomationName.trim(),
					enabled: false,
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

		if (options.keepOpen) {
			automationsQuery.reexecute({ requestPolicy: "network-only" });
			newAutomationNameInput?.focus();
			return;
		}

		createDialogOpen = false;

		if (result.data) {
			goto(`/automations/${result.data.createAutomation.id}`);
		}
	}

	async function handleToggle(a: AutomationData, enabled: boolean) {
		errors.clear();

		const result = await client
			.mutation<ToggleAutomationResult>(TOGGLE_AUTOMATION, { id: a.id, enabled })
			.toPromise();

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		automationsQuery.reexecute({ requestPolicy: "network-only" });
	}

	function handleCardClick(a: AutomationData) {
		goto(`/automations/${a.id}`);
	}

	function requestDelete(a: AutomationData) {
		deleteConfirmId = a.id;
		deleteConfirmName = a.name;
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

	async function handleBatchDelete() {
		const ids = selection.selectedIds();
		if (ids.length === 0) {
			batchDeleteConfirm = false;
			return;
		}
		batchDeleteLoading = true;
		errors.clear();
		const result = await client.mutation(BATCH_DELETE_AUTOMATIONS, { ids }).toPromise();
		batchDeleteLoading = false;
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}
		batchDeleteConfirm = false;
		selection.clear();
		automationsQuery.reexecute({ requestPolicy: "network-only" });
	}

	async function handleRename(a: AutomationData, newName: string) {
		errors.clear();

		const result = await client
			.mutation(UPDATE_AUTOMATION_NAME, { id: a.id, input: { name: newName } })
			.toPromise();

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		automationsQuery.reexecute({ requestPolicy: "network-only" });
	}

	async function handleIconChange(a: AutomationData, icon: string | null) {
		errors.clear();

		const result = await client
			.mutation(UPDATE_AUTOMATION_NAME, { id: a.id, input: { icon } })
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
		<ErrorBanner class="mb-4" message={errors.message} ondismiss={() => errors.clear()} />
	{/if}


	{#if hasLoadedOnce}
		<div in:fly={{ y: -4, duration: 150 }}>
			{#if automations.length === 0}
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
				<div class="mb-6 flex items-stretch gap-2">
					<div class="min-w-0 flex-1">
						<HiveSearchbar
							value={searchState}
							onchange={(v) => (searchState = v)}
							chips={searchChipConfigs}
							placeholder="Search automations..."
						/>
					</div>
					<div
						class="flex shrink-0 items-stretch overflow-hidden transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
						style:max-width={view === "table" && selection.count > 0 ? "32rem" : "0px"}
						style:opacity={view === "table" && selection.count > 0 ? "1" : "0"}
						aria-hidden={!(view === "table" && selection.count > 0)}
					>
						<TableSelectionToolbar count={selection.count} onclear={() => selection.clear()}>
							{#snippet actions()}
								<Button
									variant="destructive"
									size="sm"
									onclick={() => (batchDeleteConfirm = true)}
								>
									Delete
								</Button>
							{/snippet}
						</TableSelectionToolbar>
					</div>
				</div>

				{#if filteredAutomations.length === 0}
					<div class="rounded-lg shadow-card bg-card p-12 text-center">
						<p class="text-muted-foreground">No automations match your filters.</p>
					</div>
				{:else}
					<ListView mode={view}>
						{#snippet card()}
							<AnimatedGrid>
								{#each filteredAutomations as automation (automation.id)}
									{@const counts = automationNodeCounts(automation.nodes)}
									<EntityCard
										entity={automation}
										fallbackIcon={Workflow}
										subtitle="{automation.nodes.length} node{automation.nodes.length === 1 ? '' : 's'}"
										onrename={handleRename}
										oniconchange={handleIconChange}
										onedit={handleCardClick}
										ondelete={requestDelete}
									>
										{#snippet subtitleTrailing()}
											{#if automation.lastFiredAt}
												&middot;&nbsp;
												<Tooltip>
													<TooltipTrigger>
														<span
														>fired {formatRelative(
															new Date(automation.lastFiredAt),
															nowStore.current,
															me.user?.timeFormat ?? "24h",
														)}</span
													>
													</TooltipTrigger>
													<TooltipContent>{formatFull(new Date(automation.lastFiredAt))}</TooltipContent>
												</Tooltip>
											{/if}
										{/snippet}
										{#snippet leadingActions()}
											<Switch
												checked={automation.enabled}
												onCheckedChange={(checked) => handleToggle(automation, checked)}
											/>
										{/snippet}
										{#snippet footer()}
											<div class="mt-3 flex gap-2">
												{#if counts.trigger === 0 && counts.operator === 0 && counts.action === 0}
													<Badge variant="secondary" class="text-xs text-muted-foreground">Empty</Badge>
												{:else}
													{#if counts.trigger > 0}
														<Badge variant="secondary" class="gap-1 text-xs">
															<Zap class="size-3 text-automation-trigger" />
															{counts.trigger} trigger{counts.trigger === 1 ? "" : "s"}
														</Badge>
													{/if}
													{#if counts.operator > 0}
														<Badge variant="secondary" class="gap-1 text-xs">
															<GitMerge class="size-3 text-automation-operator" />
															{counts.operator} operator{counts.operator === 1 ? "" : "s"}
														</Badge>
													{/if}
													{#if counts.action > 0}
														<Badge variant="secondary" class="gap-1 text-xs">
															<Play class="size-3 text-automation-action" />
															{counts.action} action{counts.action === 1 ? "" : "s"}
														</Badge>
													{/if}
												{/if}
											</div>
										{/snippet}
									</EntityCard>
								{/each}
							</AnimatedGrid>
						{/snippet}
						{#snippet table()}
							<AutomationTable
								automations={filteredAutomations}
								{selection}
								ontoggle={handleToggle}
								ondelete={requestDelete}
								onrename={handleRename}
								oniconchange={handleIconChange}
							/>
						{/snippet}
					</ListView>
				{/if}
			{/if}
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
				<Input bind:ref={newAutomationNameInput} bind:value={newAutomationName} placeholder="Automation name" autofocus />
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
					<Button
						variant="secondary"
						type="button"
						disabled={!newAutomationName.trim() || createLoading}
						onclick={() => handleCreateAutomation({ keepOpen: true })}
					>
						Create more
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

	<ConfirmDialog
		open={batchDeleteConfirm}
		title="Delete {selection.count} automation{selection.count === 1 ? '' : 's'}?"
		description="This permanently deletes the selected automations and their nodes. This cannot be undone."
		confirmLabel="Delete"
		loading={batchDeleteLoading}
		onconfirm={handleBatchDelete}
		oncancel={() => (batchDeleteConfirm = false)}
	/>
</div>
