<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount, onDestroy } from "svelte";
	import { fly } from "svelte/transition";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
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
	import EffectRunTargetDrawer from "$lib/components/effect-run-target-drawer.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig, SearchState } from "$lib/components/hive-searchbar";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import { Plus, Sparkles, Pencil, Play, Zap } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { BannerError } from "$lib/stores/banner-error.svelte";
	import { EffectKind, type Effect, type NativeEffectOption } from "$lib/gql/graphql";

	type EffectSummary = Pick<
		Effect,
		"id" | "name" | "icon" | "kind" | "nativeName" | "loop" | "requiredCapabilities"
	>;

	const EFFECTS_QUERY = graphql(`
		query Effects {
			effects {
				id
				name
				icon
				kind
				nativeName
				loop
				requiredCapabilities
				createdBy {
					id
					username
					name
				}
			}
			nativeEffectOptions {
				name
				displayName
				supportedDeviceCount
			}
		}
	`);

	const DELETE_EFFECT = graphql(`
		mutation EffectsDeleteEffect($id: ID!) {
			deleteEffect(id: $id)
		}
	`);

	const UPDATE_EFFECT_META = graphql(`
		mutation EffectsListUpdateEffect($input: UpdateEffectInput!) {
			updateEffect(input: $input) {
				id
				name
				icon
			}
		}
	`);

	const CREATE_EFFECT = graphql(`
		mutation EffectsListCreateEffect($input: CreateEffectInput!) {
			createEffect(input: $input) {
				id
				name
			}
		}
	`);

	interface CreatedBy {
		id: string;
		username: string;
		name: string;
	}

	interface EffectRow extends EffectSummary {
		createdBy?: CreatedBy | null;
	}

	type NativeOption = Pick<NativeEffectOption, "name" | "displayName" | "supportedDeviceCount">;

	interface NativeCardEntity {
		id: string;
		name: string;
		icon?: string | null;
		nativeName: string;
		supportedDeviceCount: number;
	}

	const clientRef = getContextClient();
	let effects = $state<EffectRow[]>([]);
	let nativeOptions = $state<NativeOption[]>([]);
	let loading = $state(true);
	let createDialogOpen = $state(false);
	let newEffectName = $state("");
	let createLoading = $state(false);
	let newEffectNameInput = $state<HTMLInputElement | null>(null);
	let deleteConfirm = $state<EffectRow | null>(null);
	let deleteLoading = $state(false);
	let runDrawer = $state<
		| { mode: "timeline"; effectId: string; requiredCapabilities: readonly string[] }
		| { mode: "native"; nativeName: string; requiredCapabilities: readonly string[] }
		| null
	>(null);
	const errors = new BannerError();

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Effects" }];
		pageHeader.actions = [
			{ label: "Create Effect", icon: Plus, onclick: () => (createDialogOpen = true) },
		];
		fetchEffects();
	});
	onDestroy(() => pageHeader.reset());

	async function fetchEffects() {
		if (!clientRef) return;
		const result = await clientRef.query(EFFECTS_QUERY, {}).toPromise();
		loading = false;
		if (result.data) {
			effects = result.data.effects as EffectRow[];
			nativeOptions = result.data.nativeEffectOptions;
		}
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
		}
	}

	async function handleRename(effect: EffectRow, newName: string) {
		if (!clientRef) return;
		errors.clear();
		const result = await clientRef
			.mutation(UPDATE_EFFECT_META, { input: { id: effect.id, name: newName } })
			.toPromise();
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}
		effects = effects.map((e) => (e.id === effect.id ? { ...e, name: newName } : e));
	}

	async function handleIconChange(effect: EffectRow, icon: string | null) {
		if (!clientRef) return;
		errors.clear();
		const result = await clientRef
			.mutation(UPDATE_EFFECT_META, { input: { id: effect.id, icon } })
			.toPromise();
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}
		effects = effects.map((e) => (e.id === effect.id ? { ...e, icon } : e));
	}

	async function handleDelete() {
		if (!clientRef || !deleteConfirm) return;
		deleteLoading = true;
		errors.clear();
		const result = await clientRef
			.mutation(DELETE_EFFECT, { id: deleteConfirm.id })
			.toPromise();
		deleteLoading = false;
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}
		deleteConfirm = null;
		fetchEffects();
	}

	function handleEdit(effect: EffectRow) {
		goto(`/effects/${effect.id}`);
	}

	async function handleCreate(options: { keepOpen?: boolean } = {}) {
		if (!clientRef || !newEffectName.trim()) return;
		createLoading = true;
		errors.clear();
		const result = await clientRef
			.mutation(CREATE_EFFECT, {
				input: {
					name: newEffectName.trim(),
					kind: EffectKind.Timeline,
					loop: false,
					steps: [],
					nativeName: null,
				},
			})
			.toPromise();
		createLoading = false;
		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		newEffectName = "";

		if (options.keepOpen) {
			void fetchEffects();
			newEffectNameInput?.focus();
			return;
		}

		createDialogOpen = false;

		if (result.data) {
			goto(`/effects/${result.data.createEffect.id}`);
		}
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

	let searchState = $state<SearchState>({ chips: [], freeText: "" });

	const kindOptions = [
		{ value: "timeline", label: "Timeline" },
		{ value: "native", label: "Native" },
	];

	const searchChipConfigs: ChipConfig[] = $derived([
		{
			keyword: "kind",
			label: "Kind",
			variant: "secondary",
			options: () => kindOptions,
		},
	]);

	const filteredEffects = $derived.by(() => {
		const kindValues = searchState.chips
			.filter((c) => c.keyword === "kind")
			.map((c) => c.value);
		const query = searchState.freeText.toLowerCase();
		const wantTimeline = kindValues.length === 0 || kindValues.includes("timeline");
		if (!wantTimeline) return [];
		return effects.filter((e) => {
			if (query && !e.name.toLowerCase().includes(query)) return false;
			return true;
		});
	});

	const filteredNativeOptions = $derived.by(() => {
		const kindValues = searchState.chips
			.filter((c) => c.keyword === "kind")
			.map((c) => c.value);
		const query = searchState.freeText.toLowerCase();
		const wantNative = kindValues.length === 0 || kindValues.includes("native");
		if (!wantNative) return [];
		return nativeOptions.filter((opt) => {
			if (query) {
				const hay = `${opt.displayName} ${opt.name}`.toLowerCase();
				if (!hay.includes(query)) return false;
			}
			return true;
		});
	});

	function nativeEntity(opt: NativeOption): NativeCardEntity {
		return {
			id: `native:${opt.name}`,
			name: opt.displayName,
			nativeName: opt.name,
			supportedDeviceCount: opt.supportedDeviceCount,
		};
	}

	function capLabel(cap: string): string {
		switch (cap) {
			case "on_off":
				return "On/Off";
			case "color_temp":
				return "Color temp";
			case "brightness":
				return "Brightness";
			case "color":
				return "Color";
			default:
				return cap;
		}
	}

	const hasAnyContent = $derived(effects.length > 0 || nativeOptions.length > 0);
	const hasAnyMatch = $derived(filteredEffects.length > 0 || filteredNativeOptions.length > 0);
</script>

<div>
	{#if errors.message}
		<ErrorBanner class="mb-4" message={errors.message} ondismiss={() => errors.clear()} />
	{/if}

	{#if !loading}
		<div in:fly={{ y: -4, duration: 150 }}>
			{#if !hasAnyContent}
				<div class="rounded-lg shadow-card bg-card p-12 text-center">
					<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
						<Sparkles class="size-6 text-muted-foreground" />
					</div>
					<p class="text-muted-foreground">No effects yet.</p>
					<p class="mt-2 text-sm text-muted-foreground">
						Create a timeline effect, or pair a device that exposes native effects.
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
							value={searchState}
							onchange={(v) => (searchState = v)}
							chips={searchChipConfigs}
							placeholder="Search effects..."
						/>
					</div>
				</div>

				{#if !hasAnyMatch}
					<div class="rounded-lg shadow-card bg-card p-12 text-center">
						<p class="text-muted-foreground">No effects match your filters.</p>
					</div>
				{:else}
					<AnimatedGrid>
						{#each filteredEffects as effect (effect.id)}
							<EntityCard
								entity={effect}
								fallbackIcon={Sparkles}
								subtitle={effect.loop ? "Timeline · loop" : "Timeline"}
								onrename={handleRename}
								oniconchange={handleIconChange}
								onedit={handleEdit}
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
										onclick={() => handleEdit(effect)}
										aria-label="Edit effect"
									>
										<Pencil class="size-4" />
									</Button>
								{/snippet}
								{#snippet footer()}
									<div class="mt-3 flex flex-wrap items-center gap-1.5">
										{#each effect.requiredCapabilities as cap (cap)}
											<Badge variant="outline" class="text-[10px]">{capLabel(cap)}</Badge>
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
								subtitle="Supported on {opt.supportedDeviceCount} device{opt.supportedDeviceCount === 1 ? '' : 's'}"
								readOnly
							>
								{#snippet leadingActions()}
									<Button
										variant="ghost"
										size="icon-sm"
										onclick={() => openNativeRun(opt)}
										aria-label="Run native effect"
									>
										<Play class="size-4" />
									</Button>
								{/snippet}
								{#snippet footer()}
									<div class="mt-3 flex flex-wrap items-center gap-1.5">
										<HiveChip type="native" label="Native" iconOverride="lucide:sparkles" />
									</div>
								{/snippet}
							</EntityCard>
						{/each}
					</AnimatedGrid>
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

</div>
