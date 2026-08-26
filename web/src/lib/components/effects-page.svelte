<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { measureMount } from "$lib/perf";
	import { fly } from "svelte/transition";
	import { getContextClient, queryStore, subscriptionStore } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { onGraphQLRecovered } from "$lib/graphql/app-recovery";
	import { prefetchDetail } from "$lib/prefetch-detail";
	import { effectsStore, type Effect as StoredEffect } from "$lib/stores/effects.svelte";
	import { matchesEffectFilter } from "$lib/effect-search";
	import { graphqlErrorMessage } from "$lib/graphql-error";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import EntityCard from "$lib/components/entity-card.svelte";
	import EffectTable from "$lib/components/effect-table.svelte";
	import EffectRunTargetDrawer from "$lib/components/effect-run-target-drawer.svelte";
	import TableSelectionToolbar from "$lib/components/table-selection-toolbar.svelte";
	import { createTableSelection } from "$lib/utils/table-selection.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig } from "$lib/components/hive-searchbar";
	import { createUrlSearchState } from "$lib/search-state.svelte";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import ListView from "$lib/components/list-view.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import { Plus, Sparkles, Pencil, Play, Zap } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { profile, type ListView as ListViewMode } from "$lib/stores/profile.svelte";
	import { BannerError } from "$lib/stores/banner-error.svelte";
	import { effectCapabilityLabel } from "$lib/effect-display";
	import { EffectKind, type Effect, type NativeEffectOption } from "$lib/gql/graphql";
	import { nativeEffectSupportSummary } from "$lib/native-effect";

	interface Props {
		/**
		 * Whether this is the page the user is on. The component outlives
		 * navigation — the layout keeps it mounted after the first visit — so
		 * shared surfaces (the page header) and timers gate on this.
		 */
		visible: boolean;
	}

	let { visible }: Props = $props();

	type EffectSummary = Pick<
		Effect,
		"id" | "name" | "source" | "icon" | "kind" | "nativeName" | "loop" | "durationMs" | "requiredCapabilities"
	> & {
		tracks: { id: string; clips: { id: string }[] }[];
	};

	interface CreatedBy {
		id: string;
		username: string;
		name: string;
	}

	interface EffectRow extends EffectSummary {
		createdBy?: CreatedBy | null;
	}

	type NativeOption = Pick<
		NativeEffectOption,
		"name" | "displayName" | "source" | "confirmedDeviceCount" | "untestedDeviceCount" | "unsupportedDeviceCount"
	>;

	interface NativeCardEntity {
		id: string;
		name: string;
		icon?: string | null;
		nativeName: string;
	}

	const NATIVE_OPTIONS_QUERY = graphql(`
		query EffectsPageNativeOptions {
			nativeEffectOptions {
				name
				displayName
				source
				confirmedDeviceCount
				untestedDeviceCount
				unsupportedDeviceCount
			}
		}
	`);
	const NATIVE_SUPPORT_CHANGED = graphql(`
		subscription EffectsPageNativeSupportChanged {
			nativeEffectSupportChanged
		}
	`);

	const clientRef = getContextClient();
	const effects = $derived(effectsStore.items);
	const nativeOptionsQuery = queryStore({ client: clientRef, query: NATIVE_OPTIONS_QUERY });
	const nativeSupportUpdates = subscriptionStore({ client: clientRef, query: NATIVE_SUPPORT_CHANGED });
	const nativeOptions = $derived<NativeOption[]>($nativeOptionsQuery.data?.nativeEffectOptions ?? []);
	$effect(() => {
		if (!$nativeSupportUpdates.data?.nativeEffectSupportChanged) return;
		nativeOptionsQuery.reexecute({ requestPolicy: "network-only" });
	});
	onGraphQLRecovered(() => {
		nativeOptionsQuery.reexecute({ requestPolicy: "network-only" });
	});
	let createDialogOpen = $state(false);
	let newEffectName = $state("");
	let createLoading = $state(false);
	let newEffectNameInput = $state<HTMLInputElement | null>(null);
	let deleteConfirm = $state<EffectRow | null>(null);
	let deleteLoading = $state(false);
	let view = $state<ListViewMode>(profile.get("view.effects", "card"));
	const selection = createTableSelection();
	let batchDeleteConfirm = $state(false);
	let batchDeleteLoading = $state(false);
	let runDrawer = $state<
		| { mode: "timeline"; effectId: string; requiredCapabilities: readonly string[] }
		| { mode: "native"; nativeName: string; requiredCapabilities: readonly string[] }
		| null
	>(null);
	const errors = new BannerError();

	$effect(() => {
		if (!visible) return;
		pageHeader.breadcrumbs = [{ label: "Effects" }];
		pageHeader.actions = [
			{ label: "Create Effect", mobileLabel: "Create", icon: Plus, onclick: () => (createDialogOpen = true) },
		];
		pageHeader.viewToggle = {
			value: view,
			onchange: (nextView) => {
				view = nextView;
				profile.set("view.effects", nextView);
			},
		};
	});

	async function handleRename(effect: EffectRow, newName: string) {
		if (!clientRef) return;
		errors.clear();
		try {
			await effectsStore.update(clientRef, { id: effect.id, name: newName });
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not rename the effect."));
		}
	}

	async function handleIconChange(effect: EffectRow, icon: string | null) {
		if (!clientRef) return;
		errors.clear();
		try {
			await effectsStore.update(clientRef, { id: effect.id, icon });
		} catch (e) {
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not change the icon."));
		}
	}

	async function handleDelete() {
		if (!clientRef || !deleteConfirm) return;
		deleteLoading = true;
		errors.clear();
		try {
			await effectsStore.delete(clientRef, deleteConfirm.id);
		} catch (e) {
			deleteLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not delete the effect."));
			return;
		}
		deleteLoading = false;
		deleteConfirm = null;
	}

	async function handleBatchDelete() {
		if (!clientRef) return;
		const ids = selection.selectedIds();
		if (ids.length === 0) {
			batchDeleteConfirm = false;
			return;
		}
		batchDeleteLoading = true;
		errors.clear();
		try {
			await effectsStore.deleteMany(clientRef, ids);
		} catch (e) {
			batchDeleteLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not delete the effects."));
			return;
		}
		batchDeleteLoading = false;
		batchDeleteConfirm = false;
		selection.clear();
	}

	async function handleCreate(options: { keepOpen?: boolean } = {}) {
		if (!clientRef || !newEffectName.trim()) return;
		createLoading = true;
		errors.clear();
		let created: StoredEffect;
		try {
			created = await effectsStore.create(clientRef, {
				name: newEffectName.trim(),
				kind: EffectKind.Timeline,
				loop: false,
				durationMs: 0,
				tracks: [],
				nativeName: null,
			});
		} catch (e) {
			createLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, "Could not create the effect."));
			return;
		}

		createLoading = false;
		newEffectName = "";

		if (options.keepOpen) {
			newEffectNameInput?.focus();
			return;
		}

		createDialogOpen = false;
		goto(`/effects/${created.id}`);
	}

	function openTimelineRun(effect: EffectRow) {
		runDrawer = {
			mode: "timeline",
			effectId: effect.id,
			requiredCapabilities: effect.requiredCapabilities,
		};
	}

	function openNativeRun(opt: NativeOption) {
		runDrawer = {
			mode: "native",
			nativeName: opt.name,
			requiredCapabilities: [],
		};
	}

	const searchController = createUrlSearchState({
		active: () => visible && page.url.pathname === "/effects",
	});

	const sourceOptions = [
		{ value: "hive", label: "Hive" },
		{ value: "zigbee2mqtt", label: "Zigbee" },
	];
	const kindOptions = [
		{ value: "timeline", label: "Timeline" },
		{ value: "native", label: "Zigbee effect" },
	];

	const searchChipConfigs: ChipConfig[] = $derived([
		{
			keyword: "kind",
			label: "Kind",
			variant: "secondary",
			options: () => kindOptions,
			resolveLabel: (value: string) => kindOptions.find((option) => option.value === value)?.label ?? null,
		},
		{
			keyword: "source",
			label: "Source",
			variant: "secondary",
			options: () => sourceOptions,
			resolveLabel: (value: string) => sourceOptions.find((option) => option.value === value)?.label ?? null,
		},
	]);

	const filteredEffects = $derived.by(() => {
		const kindValues = searchController.value.chips
			.filter((c) => c.keyword === "kind")
			.map((c) => c.value);
		if (kindValues.length > 0 && !kindValues.includes("timeline")) return [];
		const sourceValues = searchController.value.chips
			.filter((c) => c.keyword === "source")
			.map((c) => c.value);
		const query = searchController.value.freeText;
		return effects.filter((e) => matchesEffectFilter(e.source, [e.name], sourceValues, query));
	});

	const filteredNativeOptions = $derived.by(() => {
		const kindValues = searchController.value.chips
			.filter((c) => c.keyword === "kind")
			.map((c) => c.value);
		if (kindValues.length > 0 && !kindValues.includes("native")) return [];
		const sourceValues = searchController.value.chips
			.filter((c) => c.keyword === "source")
			.map((c) => c.value);
		const query = searchController.value.freeText;
		return nativeOptions.filter((opt) =>
			matchesEffectFilter(opt.source, [opt.displayName, opt.name], sourceValues, query)
		);
	});

	function nativeEntity(opt: NativeOption): NativeCardEntity {
		return {
			id: `native:${opt.name}`,
			name: opt.displayName,
			nativeName: opt.name,
		};
	}


	const filteredIds = $derived([
		...filteredEffects.map((effect) => effect.id),
		...filteredNativeOptions.map((option) => `native:${option.name}`),
	]);
	$effect(() => {
		selection.setDisabled(nativeOptions.map((option) => `native:${option.name}`));
		selection.pruneTo(filteredIds);
	});

	const hasAnyContent = $derived(effects.length > 0 || nativeOptions.length > 0);
	const hasAnyMatch = $derived(filteredEffects.length > 0 || filteredNativeOptions.length > 0);

	const mountTimer = measureMount("effects", { ready: () => effectsStore.hydrated, items: () => filteredEffects.length });
	$effect(() => mountTimer.tick());
</script>

<div>
	{#if errors.message}
		<ErrorBanner class="mb-4" message={errors.message} ondismiss={() => errors.clear()} />
	{/if}

	{#if effectsStore.hydrated}
		<div in:fly={{ y: -4, duration: 150 }}>
			{#if !hasAnyContent}
				<div class="rounded-lg shadow-card bg-card p-12 text-center">
					<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<Sparkles class="size-6 text-muted-foreground" />
					</div>
					<p class="text-muted-foreground">No effects yet.</p>
					<p class="mt-2 text-sm text-muted-foreground">
						Create a Hive effect, or pair a device that exposes Zigbee effects.
					</p>
					<Button class="mt-4" onclick={() => (createDialogOpen = true)}>
						<Plus class="size-4" />
						<span>Create your first effect</span>
					</Button>
				</div>
			{:else}
				<div class="mb-6 flex items-stretch gap-2">
					<div class="min-w-0 flex-1">
						<HiveSearchbar
							controller={searchController}
							chips={searchChipConfigs}
							placeholder="Search effects..."
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

				{#if !hasAnyMatch}
					<div class="rounded-lg shadow-card bg-card p-12 text-center">
						<p class="text-muted-foreground">No effects match your filters.</p>
					</div>
				{:else}
					<ListView mode={view}>
						{#snippet card()}
							<AnimatedGrid>
								{#each filteredEffects as effect (effect.id)}
									{@const trackCount = effect.tracks.length}
									{@const clipCount = effect.tracks.reduce((s, t) => s + t.clips.length, 0)}
									<EntityCard
										entity={effect}
										onpointerenter={(e) => prefetchDetail(clientRef, "effect", e.id)}
										fallbackIcon={Sparkles}
										subtitle={`${effect.loop ? "Loop" : "Once"} · ${trackCount} track${trackCount === 1 ? "" : "s"} · ${clipCount} clip${clipCount === 1 ? "" : "s"}`}
										onrename={handleRename}
										oniconchange={handleIconChange}
										editHref={`/effects/${effect.id}`}
										ondelete={(e) => (deleteConfirm = e)}
									>
										{#snippet leadingActions()}
											<Button
												variant="ghost"
												size="icon-sm"
												onclick={() => openTimelineRun(effect)}
												aria-label="Run effect"
											>
												<Play class="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												href={`/effects/${effect.id}`}
												aria-label="Edit effect"
											>
												<Pencil class="size-4" />
											</Button>
										{/snippet}
										{#snippet footer()}
											<div class="mt-3 flex flex-wrap items-center gap-1.5">
												<HiveChip type="group" label="Hive" />
												{#each effect.requiredCapabilities as cap (cap)}
													<Badge variant="outline" class="text-[10px]">
														{effectCapabilityLabel(cap)}
													</Badge>
												{/each}
												{#if effect.requiredCapabilities.length === 0}
													<span class="text-[11px] text-muted-foreground">No required caps</span>
												{/if}
											</div>
										{/snippet}
									</EntityCard>
								{/each}
								{#each filteredNativeOptions as opt (opt.name)}
									{@const entity = nativeEntity(opt)}
									<EntityCard
										{entity}
										fallbackIcon={Zap}
										subtitle={nativeEffectSupportSummary(opt)}
										readOnly
									>
										{#snippet leadingActions()}
											<Button
												variant="ghost"
												size="icon-sm"
												onclick={() => openNativeRun(opt)}
												aria-label="Run Zigbee effect"
											>
												<Play class="size-4" />
											</Button>
										{/snippet}
										{#snippet footer()}
											<div class="mt-3 flex flex-wrap items-center gap-1.5">
												<HiveChip type="hub" label="Zigbee" />
											</div>
										{/snippet}
									</EntityCard>
								{/each}
							</AnimatedGrid>
						{/snippet}
						{#snippet table()}
							<EffectTable
								effects={filteredEffects}
								nativeOptions={filteredNativeOptions}
								{selection}
								onrun={openTimelineRun}
								onrunnative={openNativeRun}
								ondelete={(effect) => (deleteConfirm = effect)}
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
				<DialogTitle>Create Effect</DialogTitle>
				<DialogDescription>
					Give your new effect a name. You can add steps in the editor.
				</DialogDescription>
			</DialogHeader>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleCreate();
				}}
			>
				<Input
					bind:ref={newEffectNameInput}
					bind:value={newEffectName}
					placeholder="Effect name"
					autofocus
				/>
				<DialogFooter class="mt-4">
					<Button
						variant="outline"
						type="button"
						onclick={() => {
							createDialogOpen = false;
							newEffectName = "";
						}}
					>
						Cancel
					</Button>
					<Button
						variant="secondary"
						type="button"
						disabled={!newEffectName.trim() || createLoading}
						onclick={() => handleCreate({ keepOpen: true })}
					>
						Create more
					</Button>
					<Button type="submit" disabled={!newEffectName.trim() || createLoading}>
						{createLoading ? "Creating..." : "Create"}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>

	{#if runDrawer}
		{#if runDrawer.mode === "timeline"}
			<EffectRunTargetDrawer
				open={true}
				mode="timeline"
				effectId={runDrawer.effectId}
				requiredCapabilities={runDrawer.requiredCapabilities}
				onclose={() => (runDrawer = null)}
			/>
		{:else}
			<EffectRunTargetDrawer
				open={true}
				mode="native"
				nativeName={runDrawer.nativeName}
				requiredCapabilities={runDrawer.requiredCapabilities}
				onclose={() => (runDrawer = null)}
				onstarted={() => nativeOptionsQuery.reexecute({ requestPolicy: "network-only" })}
			/>
		{/if}
	{/if}

	<ConfirmDialog
		bind:open={() => deleteConfirm !== null, (v) => { if (!v) deleteConfirm = null; }}
		title="Delete Effect"
		description='Delete "{deleteConfirm?.name ?? ""}"? This cannot be undone. Scenes and automations referencing this effect will need to be updated.'
		confirmLabel="Delete"
		loading={deleteLoading}
		onconfirm={handleDelete}
		oncancel={() => (deleteConfirm = null)}
	/>

	<ConfirmDialog
		open={batchDeleteConfirm}
		title="Delete {selection.count} effect{selection.count === 1 ? '' : 's'}?"
		description="This permanently deletes the selected effects. Scenes and automations referencing them will need to be updated."
		confirmLabel="Delete"
		loading={batchDeleteLoading}
		onconfirm={handleBatchDelete}
		oncancel={() => (batchDeleteConfirm = false)}
	/>

</div>
