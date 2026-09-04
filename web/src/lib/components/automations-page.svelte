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
	import { deviceDisplayName, entityDisplayName } from "$lib/utils";
	import { localizedNamesStore } from "$lib/stores/localized-names.svelte";
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
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

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

	const enabledOptions = $derived.by(() => [
		{ value: "yes", label: m.common_yes({}, locale.messageOptions()) },
		{ value: "no", label: m.common_no({}, locale.messageOptions()) },
	]);

	const triggerOptions = $derived.by(() => [
		{ value: "event", label: m.automations_trigger_event({}, locale.messageOptions()) },
		{ value: "schedule", label: m.automations_trigger_schedule({}, locale.messageOptions()) },
	]);

	const actionOptions = $derived.by(() => [
		{ value: "set_device_state", label: m.automation_action_set_state({}, locale.messageOptions()) },
		{ value: "configure_device", label: m.automation_action_configure_device({}, locale.messageOptions()) },
		{ value: "activate_scene", label: m.automation_action_activate_scene({}, locale.messageOptions()) },
		{ value: "raise_alarm", label: m.automation_action_raise_alarm({}, locale.messageOptions()) },
		{ value: "clear_alarm", label: m.automation_action_clear_alarm({}, locale.messageOptions()) },
	]);

	const emptyOptions = $derived(enabledOptions);

	const searchChipConfigs: ChipConfig[] = $derived.by(() => [
		{
			keyword: "enabled",
			label: m.automations_filter_enabled({}, locale.messageOptions()),
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
			label: m.automations_filter_trigger({}, locale.messageOptions()),
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
			label: m.automations_filter_action({}, locale.messageOptions()),
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
			label: m.automations_filter_device({}, locale.messageOptions()),
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return devicesRef
					.filter((d) => !q || localizedNamesStore.matches("device", d.id, q, d.name, d.friendlyName))
					.map((d) => ({ value: d.id, label: deviceDisplayName(d) }));
			},
		},
		{
			keyword: "scene",
			label: m.automations_filter_scene({}, locale.messageOptions()),
			variant: "secondary",
			options: (input: string) => {
				const q = input.toLowerCase();
				return scenesRef
					.filter((s) => localizedNamesStore.matches("scene", s.id, q, s.name))
					.map((s) => ({ value: s.id, label: entityDisplayName("scene", s) }));
			},
		},
		{
			keyword: "empty",
			label: m.automations_filter_empty({}, locale.messageOptions()),
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
			.map((c) => c.value);
		const sceneValues = searchController.value.chips
			.filter((c) => c.keyword === "scene")
			.map((c) => c.value);
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
				if (!deviceValues.some((value) => ids.has(value))) return false;
			}
			if (sceneValues.length > 0) {
				const ids = new Set(a.nodes.flatMap((n) => referencedSceneIds(n)));
				if (!sceneValues.some((value) => ids.has(value))) return false;
			}
			if (emptyValues.length > 0) {
				const isEmpty = a.nodes.length === 0;
				const wants = emptyValues.some((v) => (v === "yes" ? isEmpty : !isEmpty));
				if (!wants) return false;
			}
			if (query && !localizedNamesStore.matches("automation", a.id, query, a.name)) return false;
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
		void locale.currentLanguage;
		pageHeader.breadcrumbs = [{ label: m.automations_title({}, locale.messageOptions()) }];
		pageHeader.actions = [{ label: m.automations_create({}, locale.messageOptions()), mobileLabel: m.automations_create_short({}, locale.messageOptions()), icon: Plus, onclick: () => (createDialogOpen = true) }];
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
			errors.setWithAutoDismiss(graphqlErrorMessage(e, m.automations_error_create({}, locale.messageOptions())));
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
			errors.setWithAutoDismiss(graphqlErrorMessage(e, m.automations_error_toggle({}, locale.messageOptions())));
		}
	}

	function requestDelete(a: Automation) {
		deleteConfirmId = a.id;
		deleteConfirmName = entityDisplayName("automation", a);
	}

	async function handleConfirmDelete() {
		if (!deleteConfirmId) return;
		deleteLoading = true;
		errors.clear();

		try {
			await automationsStore.delete(client, deleteConfirmId);
		} catch (e) {
			deleteLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, m.automations_error_delete({}, locale.messageOptions())));
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
			errors.setWithAutoDismiss(graphqlErrorMessage(e, m.automations_error_delete_many({}, locale.messageOptions())));
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
			errors.setWithAutoDismiss(graphqlErrorMessage(e, m.automations_error_rename({}, locale.messageOptions())));
		}
	}

	async function handleIconChange(a: Automation, icon: string | null) {
		errors.clear();
		try {
			await automationsStore.update(client, a.id, { icon });
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, m.automations_error_icon({}, locale.messageOptions())));
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
					<p class="text-muted-foreground">{m.automations_empty({}, locale.messageOptions())}</p>
					<p class="mt-2 text-sm text-muted-foreground">
						{m.automations_empty_help({}, locale.messageOptions())}
					</p>
					<Button class="mt-4" onclick={() => (createDialogOpen = true)}>
						<Plus class="size-4" />
						<span>{m.automations_create_first({}, locale.messageOptions())}</span>
					</Button>
				</div>
			{:else}
				<div class="mb-6 flex items-stretch gap-2">
					<div class="min-w-0 flex-1">
						<HiveSearchbar
							controller={searchController}
							chips={searchChipConfigs}
							placeholder={m.automations_search({}, locale.messageOptions())}
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
									{m.common_delete({}, locale.messageOptions())}
								</Button>
							{/snippet}
						</TableSelectionToolbar>
					</div>
				</div>

				{#if filteredAutomations.length === 0}
					<div class="rounded-lg shadow-card bg-card p-12 text-center">
						<p class="text-muted-foreground">{m.automations_no_match({}, locale.messageOptions())}</p>
					</div>
				{:else}
					<ListView mode={view}>
						{#snippet card()}
							<AnimatedGrid>
								{#each filteredAutomations as automation (automation.id)}
									{@const counts = automationNodeCounts(automation.nodes)}
									<EntityCard
										entity={automation}
										entityType="automation"
										onpointerenter={(a) => prefetchDetail(client, "automation", a.id)}
										fallbackIcon={Workflow}
									subtitle={m.automations_node_count({ count: automation.nodes.length }, locale.messageOptions())}
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
												>{m.automations_fired({ time: formatRelative(new Date(automation.lastFiredAt), nowStore.current, me.user?.timeFormat ?? "24h") }, locale.messageOptions())}</span
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
											<Badge variant="secondary" class="text-xs text-muted-foreground">{m.automations_filter_empty({}, locale.messageOptions())}</Badge>
												{:else}
													{#if counts.trigger > 0}
														<Badge variant="secondary" class="gap-1 text-xs">
															<Zap class="size-3 text-automation-trigger" />
													{m.automations_trigger_count({ count: counts.trigger }, locale.messageOptions())}
														</Badge>
													{/if}
													{#if counts.operator > 0}
														<Badge variant="secondary" class="gap-1 text-xs">
															<GitMerge class="size-3 text-automation-operator" />
													{m.automations_operator_count({ count: counts.operator }, locale.messageOptions())}
														</Badge>
													{/if}
													{#if counts.action > 0}
														<Badge variant="secondary" class="gap-1 text-xs">
															<Play class="size-3 text-automation-action" />
													{m.automations_action_count({ count: counts.action }, locale.messageOptions())}
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
				<DialogTitle>{m.automations_create({}, locale.messageOptions())}</DialogTitle>
				<DialogDescription>
					{m.automations_create_description({}, locale.messageOptions())}
				</DialogDescription>
			</DialogHeader>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleCreateAutomation();
				}}
			>
				<Input bind:ref={newAutomationNameInput} bind:value={newAutomationName} placeholder={m.automations_name_placeholder({}, locale.messageOptions())} autofocus />
				<DialogFooter class="mt-4">
					<Button
						variant="outline"
						type="button"
						onclick={() => {
							createDialogOpen = false;
							newAutomationName = "";
						}}
					>
						{m.common_cancel({}, locale.messageOptions())}
					</Button>
					<Button
						variant="secondary"
						type="button"
						disabled={!newAutomationName.trim() || createLoading}
						onclick={() => handleCreateAutomation({ keepOpen: true })}
					>
						{m.automations_create_more({}, locale.messageOptions())}
					</Button>
					<Button type="submit" disabled={!newAutomationName.trim() || createLoading}>
						{createLoading ? m.automations_creating({}, locale.messageOptions()) : m.automations_create_short({}, locale.messageOptions())}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>

	<ConfirmDialog
		bind:open={() => deleteConfirmId !== null, (v) => { if (!v) deleteConfirmId = null; }}
		title={m.automations_delete_title({}, locale.messageOptions())}
		description={m.automations_delete_description({ name: deleteConfirmName }, locale.messageOptions())}
		confirmLabel={m.common_delete({}, locale.messageOptions())}
		loading={deleteLoading}
		onconfirm={handleConfirmDelete}
		oncancel={() => (deleteConfirmId = null)}
	/>

	<ConfirmDialog
		open={batchDeleteConfirm}
		title={m.automations_delete_many_title({ count: selection.count }, locale.messageOptions())}
		description={m.automations_delete_many_description({}, locale.messageOptions())}
		confirmLabel={m.common_delete({}, locale.messageOptions())}
		loading={batchDeleteLoading}
		onconfirm={handleBatchDelete}
		oncancel={() => (batchDeleteConfirm = false)}
	/>
</div>
