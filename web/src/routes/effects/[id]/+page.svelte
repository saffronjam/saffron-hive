<script lang="ts">
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { onMount, onDestroy } from "svelte";
	import { fly } from "svelte/transition";
	import { getContextClient } from "@urql/svelte";
	import { toast } from "svelte-sonner";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import IconPicker from "$lib/components/icons/icon-picker.svelte";
	import IconPickerTrigger from "$lib/components/icon-picker-trigger.svelte";
	import AnimatedIcon from "$lib/components/icons/animated-icon.svelte";
	import EffectTimelineEditor from "$lib/components/effect-timeline-editor.svelte";
	import EffectRunTargetDrawer from "$lib/components/effect-run-target-drawer.svelte";
	import UnsavedGuard from "$lib/components/unsaved-guard.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import { ArrowLeft, Play, Save, Sparkles, Trash2, X } from "@lucide/svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { BannerError } from "$lib/stores/banner-error.svelte";
	import {
		editableToInputTracks,
		effectToEditable,
		validateTimelineEffect,
		type EditableTrack,
	} from "$lib/effect-editable";
	import { EffectKind, type Effect, type EffectClip, type EffectTrack } from "$lib/gql/graphql";

	const effectId = $derived(page.params.id);

	const EFFECT_QUERY = graphql(`
		query EffectEdit($id: ID!) {
			effect(id: $id) {
				id
				name
				icon
				kind
				nativeName
				loop
				durationMs
				requiredCapabilities
				tracks {
					id
					index
					name
					clips {
						id
						startMs
						transitionMinMs
						transitionMaxMs
						kind
						config
					}
				}
			}
		}
	`);

	const UPDATE_EFFECT = graphql(`
		mutation EffectEditUpdate($input: UpdateEffectInput!) {
			updateEffect(input: $input) {
				id
				name
				icon
				loop
				durationMs
				requiredCapabilities
				tracks {
					id
					index
					name
					clips {
						id
						startMs
						transitionMinMs
						transitionMaxMs
						kind
						config
					}
				}
			}
		}
	`);

	const DELETE_EFFECT = graphql(`
		mutation EffectEditDelete($id: ID!) {
			deleteEffect(id: $id)
		}
	`);

	type EffectClipData = Pick<
		EffectClip,
		"id" | "startMs" | "transitionMinMs" | "transitionMaxMs" | "kind" | "config"
	>;
	type EffectTrackData = Pick<EffectTrack, "id" | "index" | "name"> & { clips: EffectClipData[] };

	type EffectData = Pick<
		Effect,
		"id" | "name" | "icon" | "kind" | "nativeName" | "loop" | "durationMs" | "requiredCapabilities"
	> & {
		tracks: EffectTrackData[];
	};

	interface EffectQueryResult {
		effect: EffectData | null;
	}

	interface UpdateEffectResult {
		updateEffect: Pick<
			Effect,
			"id" | "name" | "icon" | "loop" | "durationMs" | "requiredCapabilities"
		> & {
			tracks: EffectTrackData[];
		};
	}

	interface DeleteEffectResult {
		deleteEffect: boolean;
	}

	const clientRef = getContextClient();
	let loading = $state(true);
	let saving = $state(false);
	let deleteConfirmOpen = $state(false);
	let deleteLoading = $state(false);
	let runDrawerOpen = $state(false);
	const errors = new BannerError();

	let effectData = $state<EffectData | null>(null);
	let effectName = $state("");
	let effectIcon = $state<string | null>(null);
	let loop = $state(false);
	let durationMs = $state(0);
	let tracks = $state<EditableTrack[]>([]);
	let requiredCapabilities = $state<readonly string[]>([]);

	let savedName = $state("");
	let savedIcon = $state<string | null>(null);
	let savedLoop = $state(false);
	let savedDurationMs = $state(0);
	let savedTracksJson = $state("");

	const currentTracksJson = $derived(JSON.stringify(editableToInputTracks(tracks)));
	const isDirty = $derived(
		effectName !== savedName ||
			effectIcon !== savedIcon ||
			loop !== savedLoop ||
			durationMs !== savedDurationMs ||
			currentTracksJson !== savedTracksJson,
	);

	onMount(() => {
		pageHeader.breadcrumbs = [{ label: "Effects", href: "/effects" }, { label: "Effect" }];
		void fetchEffect();
	});

	onDestroy(() => {
		pageHeader.reset();
	});

	$effect(() => {
		if (effectData) {
			pageHeader.breadcrumbs = [
				{ label: "Effects", href: "/effects" },
				{ label: effectData.name },
			];
		}
	});

	$effect(() => {
		pageHeader.actions = [
			{
				label: "Run",
				icon: Play,
				variant: "outline" as const,
				onclick: handleRun,
				disabled: !effectData || saving || deleteLoading,
				hideLabelOnMobile: true,
			},
			{
				label: "Cancel",
				icon: X,
				variant: "outline" as const,
				onclick: handleCancel,
				hideLabelOnMobile: true,
			},
			{
				label: "Delete",
				icon: Trash2,
				variant: "destructive" as const,
				onclick: () => (deleteConfirmOpen = true),
				disabled: !effectData || saving || deleteLoading,
				hideLabelOnMobile: true,
			},
			{
				label: "Save",
				icon: Save,
				saving,
				onclick: handleSave,
				disabled: saving || !effectData || !effectName.trim() || !isDirty,
				hideLabelOnMobile: true,
			},
		];
	});

	async function fetchEffect() {
		const result = await clientRef.query<EffectQueryResult>(EFFECT_QUERY, { id: effectId }).toPromise();
		loading = false;

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		const data = result.data?.effect;
		if (!data) {
			toast.error("Effect not found");
			void goto("/effects");
			return;
		}

		if (data.kind === EffectKind.Native) {
			toast.error("Native effects can't be edited");
			void goto("/effects");
			return;
		}

		effectData = data as EffectData;
		effectName = data.name;
		effectIcon = data.icon ?? null;
		loop = data.loop;
		durationMs = data.durationMs;
		tracks = effectToEditable(data);
		requiredCapabilities = data.requiredCapabilities;

		savedName = effectName;
		savedIcon = effectIcon;
		savedLoop = loop;
		savedDurationMs = durationMs;
		savedTracksJson = JSON.stringify(editableToInputTracks(tracks));
	}

	async function handleSave() {
		if (!effectData || saving) return;
		errors.clear();

		const validation = validateTimelineEffect(effectName, durationMs, loop, tracks);
		if (validation) {
			errors.setWithAutoDismiss(validation.message);
			return;
		}

		saving = true;
		const result = await clientRef
			.mutation<UpdateEffectResult>(UPDATE_EFFECT, {
				input: {
					id: effectData.id,
					name: effectName.trim(),
					icon: effectIcon,
					loop,
					durationMs,
					tracks: editableToInputTracks(tracks),
				},
			})
			.toPromise();
		saving = false;

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		const updated = result.data?.updateEffect;
		if (!updated) return;

		effectData = { ...effectData, ...updated, tracks: updated.tracks } as EffectData;
		effectName = updated.name;
		effectIcon = updated.icon ?? null;
		loop = updated.loop;
		durationMs = updated.durationMs;
		tracks = effectToEditable(updated);
		requiredCapabilities = updated.requiredCapabilities;

		savedName = effectName;
		savedIcon = effectIcon;
		savedLoop = loop;
		savedDurationMs = durationMs;
		savedTracksJson = JSON.stringify(editableToInputTracks(tracks));

		toast.success("Effect saved");
	}

	async function handleDelete() {
		if (!effectData || deleteLoading) return;
		deleteLoading = true;
		errors.clear();

		const result = await clientRef
			.mutation<DeleteEffectResult>(DELETE_EFFECT, { id: effectData.id })
			.toPromise();
		deleteLoading = false;

		if (result.error) {
			errors.setWithAutoDismiss(result.error.message);
			return;
		}

		deleteConfirmOpen = false;
		toast.success("Effect deleted");
		void goto("/effects");
	}

	function handleCancel() {
		void goto("/effects");
	}

	function handleRun() {
		if (!effectData) return;
		if (isDirty) {
			toast.message("Running with last saved version. Save first to run current edits.");
		}
		runDrawerOpen = true;
	}
</script>

<UnsavedGuard dirty={isDirty} />

<div>
	{#if errors.message}
		<ErrorBanner class="mb-4" message={errors.message} ondismiss={() => errors.clear()} />
	{/if}

	{#if loading}
		<div class="space-y-4">
			<div class="h-16 animate-pulse rounded-lg shadow-card bg-card"></div>
			<div class="h-64 animate-pulse rounded-lg shadow-card bg-card"></div>
		</div>
	{:else if effectData}
		<div class="flex flex-col gap-4" in:fly={{ y: -4, duration: 150 }}>
			<div class="rounded-lg shadow-card bg-card p-4">
				<label class="mb-2 block text-sm font-medium text-foreground" for="effect-name">
					Effect Name
				</label>
				<div class="flex items-center gap-3">
					<IconPicker value={effectIcon} onselect={(icon) => (effectIcon = icon)}>
						<IconPickerTrigger size="lg" ariaLabel="Change icon">
							<AnimatedIcon icon={effectIcon} class="size-5 text-muted-foreground">
								{#snippet fallback()}
									<Sparkles class="size-5 text-muted-foreground" />
								{/snippet}
							</AnimatedIcon>
						</IconPickerTrigger>
					</IconPicker>
					<Input id="effect-name" bind:value={effectName} placeholder="Effect name" />
				</div>
			</div>

			<EffectTimelineEditor bind:tracks bind:loop bind:durationMs disabled={saving} />
		</div>
	{:else}
		<div class="rounded-lg shadow-card bg-card p-12 text-center">
			<p class="text-lg font-medium text-foreground">Effect not found</p>
			<p class="mt-2 text-sm text-muted-foreground">
				The effect you're looking for doesn't exist or has been removed.
			</p>
			<Button variant="outline" class="mt-4" href="/effects">
				<ArrowLeft class="size-4" />
				Back to Effects
			</Button>
		</div>
	{/if}

	{#if effectData && runDrawerOpen}
		<EffectRunTargetDrawer
			open={true}
			mode="timeline"
			effectId={effectData.id}
			{requiredCapabilities}
			onclose={() => (runDrawerOpen = false)}
		/>
	{/if}

	<ConfirmDialog
		bind:open={deleteConfirmOpen}
		title="Delete Effect"
		description='Delete "{effectData?.name ?? ""}"? This cannot be undone. Scenes and automations referencing this effect will need to be updated.'
		confirmLabel="Delete"
		loading={deleteLoading}
		onconfirm={handleDelete}
		oncancel={() => (deleteConfirmOpen = false)}
	/>
</div>
