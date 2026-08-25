<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { measureMount } from "$lib/perf";
	import { getContextClient } from "@urql/svelte";
	import { deviceStore, isRuntimeEnabledDevice } from "$lib/stores/devices";
	import { automationsStore, type Automation } from "$lib/stores/automations.svelte";
	import { scenesStore } from "$lib/stores/scenes.svelte";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import { graphql } from "$lib/gql";
	import { prefetchDetail } from "$lib/prefetch-detail";
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
	import { deviceDisplayName } from "$lib/utils";
	import { formatFull, formatRelative } from "$lib/time-format";
	import { nowStore } from "$lib/stores/now.svelte";
	import { me } from "$lib/stores/me.svelte";
	import TableSelectionToolbar from "$lib/components/table-selection-toolbar.svelte";
	import { createTableSelection } from "$lib/utils/table-selection.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig } from "$lib/components/hive-searchbar";
	import { createUrlSearchState } from "$lib/search-state.svelte";
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
	import { fly } from "svelte/transition";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { profile, type ListView as ListViewMode } from "$lib/stores/profile.svelte";
	import { BannerError } from "$lib/stores/banner-error.svelte";

	interface Props {
		/**
		 * Whether this is the page the user is on. The component outlives
		 * navigation — the layout keeps it mounted after the first visit — so
		 * shared surfaces (the page header) and timers gate on this.
		 */
		visible: boolean;
	}

	let { visible }: Props = $props();

	let view = $state<ListViewMode>(profile.get("view.automations", "card"));

	const client = getContextClient();

	const automations = $derived(automationsStore.items);
	const devicesRef = $derived(Object.values($deviceStore).filter(isRuntimeEnabledDevice));
	const scenesRef = $derived(scenesStore.items);

	const searchController = createUrlSearchState({
		active: () => visible && page.url.pathname === "/automations",
	});

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
		{ value: "configure_device", label: "Configure device" },
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
					.filter((d) => !q || deviceDisplayName(d).toLowerCase().includes(q))
					.map((d) => ({ value: deviceDisplayName(d), label: deviceDisplayName(d) }));
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
		const enabledValues = searchController.value.chips
			.filter((c) => c.keyword === "enabled")
			.map((c) => c.value);
		const triggerValues = searchController.value.chips
			.filter((c) => c.keyword === "trigger")
			.map((c) => c.value);
		const actionValues = searchController.value.chips.filter((c) => c.keyword === "action").map((c) => c.value);
		const deviceValues = searchController.value.chips
			.filter((c) => c.keyword === "device")
			.map((c) => c.value.toLowerCase());
		const sceneValues = searchController.value.chips
			.filter((c) => c.keyword === "scene")
			.map((c) => c.value.toLowerCase());
		const emptyValues = searchController.value.chips.filter((c) => c.keyword === "empty").map((c) => c.value);
		const query = searchController.value.freeText.toLowerCase();

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
					.map((id) => {
						const d = devicesRef.find((x) => x.id === id);
						return d ? deviceDisplayName(d).toLowerCase() : "";
					})
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

	$effect(() => {
		if (!visible) return;
		pageHeader.breadcrumbs = [{ label: "Automations" }];
		pageHeader.actions = [{ label: "Create Automation", mobileLabel: "Create", icon: Plus, onclick: () => (createDialogOpen = true) }];
	});

	// Poll the list so lastFiredAt updates reflect recent firings without
	// needing a user gesture. 5s is low enough to feel live for button-driven
	// automations, and the payload is a handful of rows.
	$effect(() => {
		if (!visible) return;
		const iv = setInterval(() => {
			void automationsStore.refresh(client);
		}, 5000);
		return () => clearInterval(iv);
	});

	$effect(() => {
		if (!visible) return;
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

		let created: Automation;
		try {
			created = await automationsStore.create(client, newAutomationName.trim());
		} catch (e) {
			createLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not create the automation."));
			return;
		}

		createLoading = false;
		newAutomationName = "";

		if (options.keepOpen) {
			newAutomationNameInput?.focus();
			return;
		}

		createDialogOpen = false;
		goto(`/automations/${created.id}`);
	}

	async function handleToggle(a: Automation, enabled: boolean) {
		errors.clear();
		try {
			await automationsStore.toggle(client, a.id, enabled);
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not toggle the automation."));
		}
	}

	function requestDelete(a: Automation) {
		deleteConfirmId = a.id;
		deleteConfirmName = a.name;
	}

	async function handleConfirmDelete() {
		if (!deleteConfirmId) return;
		deleteLoading = true;
		errors.clear();

		try {
			await automationsStore.delete(client, deleteConfirmId);
		} catch (e) {
			deleteLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not delete the automation."));
			return;
		}

		deleteLoading = false;
		deleteConfirmId = null;
	}

	async function handleBatchDelete() {
		const ids = selection.selectedIds();
		if (ids.length === 0) {
			batchDeleteConfirm = false;
			return;
		}
		batchDeleteLoading = true;
		errors.clear();
		try {
			await automationsStore.deleteMany(client, ids);
		} catch (e) {
			batchDeleteLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not delete the automations."));
			return;
		}
		batchDeleteLoading = false;
		batchDeleteConfirm = false;
		selection.clear();
	}

	async function handleRename(a: Automation, newName: string) {
		errors.clear();
		try {
			await automationsStore.update(client, a.id, { name: newName });
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not rename the automation."));
		}
	}

	async function handleIconChange(a: Automation, icon: string | null) {
		errors.clear();
		try {
			await automationsStore.update(client, a.id, { icon });
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not change the icon."));
		}
	}

	const mountTimer = measureMount("automations", { ready: () => automationsStore.hydrated, items: () => filteredAutomations.length });
	$effect(() => mountTimer.tick());
</script>

<div>
	{#if errors.message}
		<ErrorBanner class="mb-4" message={errors.message} ondismiss={() => errors.clear()} />
	{/if}


	{#if automationsStore.hydrated}
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
							controller={searchController}
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
										onpointerenter={(a) => prefetchDetail(client, "automation", a.id)}
										fallbackIcon={Workflow}
										subtitle="{automation.nodes.length} node{automation.nodes.length === 1 ? '' : 's'}"
										onrename={handleRename}
										oniconchange={handleIconChange}
										editHref={`/automations/${automation.id}`}
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
