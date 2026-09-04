<script lang="ts">
	import { page } from "$app/state";
	import FieldError from "$lib/components/field-error.svelte";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { fly } from "svelte/transition";
	import { getContextClient } from "@urql/svelte";
	import { toast } from "svelte-sonner";
	import { graphql } from "$lib/gql";
	import { EFFECT_DETAIL_QUERY as EFFECT_QUERY } from "$lib/graphql/details";
	import { effectsStore } from "$lib/stores/effects.svelte";
	import { graphqlErrorMessage } from "$lib/graphql-error";
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
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { effectValidationMessage } from "$lib/i18n/effect-validation";
	import { entityDisplayName } from "$lib/utils";

	const effectId = $derived(page.params.id);

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

	const clientRef = getContextClient();
	let loading = $state(true);
	let saving = $state(false);
	let nameError = $state<string | null>(null);
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
		void fetchEffect();
	});

	$effect(() => {
		void locale.currentLanguage;
		pageHeader.breadcrumbs = [
			{ label: m.effects_title({}, locale.messageOptions()), href: "/effects" },
			{ label: effectData ? entityDisplayName("effect", effectData) : m.effect_fallback({}, locale.messageOptions()) },
		];
	});

	$effect(() => {
		void locale.currentLanguage;
		pageHeader.actions = [
			{
				label: m.effect_action_run({}, locale.messageOptions()),
				icon: Play,
				variant: "outline" as const,
				onclick: handleRun,
				disabled: !effectData || saving || deleteLoading,
				hideLabelOnMobile: true,
			},
			{
				label: m.common_cancel({}, locale.messageOptions()),
				icon: X,
				variant: "outline" as const,
				onclick: handleCancel,
				hideLabelOnMobile: true,
			},
			{
				label: m.common_delete({}, locale.messageOptions()),
				icon: Trash2,
				variant: "destructive" as const,
				onclick: () => (deleteConfirmOpen = true),
				disabled: !effectData || saving || deleteLoading,
				hideLabelOnMobile: true,
			},
			{
				label: m.common_save({}, locale.messageOptions()),
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
			console.error(result.error);
			errors.setWithAutoDismiss(m.effect_load_failed({}, locale.messageOptions()));
			return;
		}

		const data = result.data?.effect;
		if (!data) {
			toast.error(m.effect_not_found({}, locale.messageOptions()));
			void goto("/effects");
			return;
		}

		if (data.kind === EffectKind.Native) {
			toast.error(m.effect_native_read_only({}, locale.messageOptions()));
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

		// The editor's own query carries the full track detail the list does not,
		// so the shared summary is re-read rather than patched from this result.
		void effectsStore.refresh(clientRef);
	}

	async function handleSave() {
		if (!effectData || saving) return;
		errors.clear();

		nameError = null;
		const validation = validateTimelineEffect(effectName, durationMs, loop, tracks);
		if (validation) {
			// A clip error belongs to no single input, so it keeps the banner; the
			// name error goes on the field it is about.
			if (validation.field === "name") nameError = effectValidationMessage(validation.code);
			else errors.setWithAutoDismiss(effectValidationMessage(validation.code));
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
			console.error(result.error);
			errors.setWithAutoDismiss(m.effect_save_failed({}, locale.messageOptions()));
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
	}

	async function handleDelete() {
		if (!effectData || deleteLoading) return;
		deleteLoading = true;
		errors.clear();

		try {
			await effectsStore.delete(clientRef, effectData.id);
		} catch (e) {
			deleteLoading = false;
			errors.setWithAutoDismiss(graphqlErrorMessage(e, m.effects_error_delete({}, locale.messageOptions())));
			return;
		}
		deleteLoading = false;

		deleteConfirmOpen = false;
		toast.success(m.effect_deleted({}, locale.messageOptions()));
		void goto("/effects");
	}

	function handleCancel() {
		void goto("/effects");
	}

	function handleRun() {
		if (!effectData) return;
		if (isDirty) {
			toast.message(m.effect_running_saved({}, locale.messageOptions()));
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
					{m.effect_name_label({}, locale.messageOptions())}
				</label>
				<div class="flex items-center gap-3">
					<IconPicker value={effectIcon} onselect={(icon) => (effectIcon = icon)}>
						<IconPickerTrigger size="lg" ariaLabel={m.effect_change_icon({}, locale.messageOptions())}>
							<AnimatedIcon icon={effectIcon} class="size-5 text-muted-foreground">
								{#snippet fallback()}
									<Sparkles class="size-5 text-muted-foreground" />
								{/snippet}
							</AnimatedIcon>
						</IconPickerTrigger>
					</IconPicker>
					<Input
						id="effect-name"
						bind:value={effectName}
						placeholder={m.effects_name_placeholder({}, locale.messageOptions())}
						aria-invalid={!!nameError}
						aria-describedby={nameError ? "effect-name-error" : undefined}
						oninput={() => (nameError = null)}
					/>
				</div>
				<FieldError id="effect-name-error" message={nameError} />
			</div>

			<EffectTimelineEditor bind:tracks bind:loop bind:durationMs disabled={saving} />
		</div>
	{:else}
		<div class="rounded-lg shadow-card bg-card p-12 text-center">
			<p class="text-lg font-medium text-foreground">{m.effect_not_found({}, locale.messageOptions())}</p>
			<p class="mt-2 text-sm text-muted-foreground">
				{m.effect_not_found_help({}, locale.messageOptions())}
			</p>
			<Button variant="outline" class="mt-4" href="/effects">
				<ArrowLeft class="size-4" />
				{m.effect_back({}, locale.messageOptions())}
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
		title={m.effects_delete_title({}, locale.messageOptions())}
		description={m.effects_delete_description({ name: effectData ? entityDisplayName("effect", effectData) : "" }, locale.messageOptions())}
		confirmLabel={m.common_delete({}, locale.messageOptions())}
		loading={deleteLoading}
		onconfirm={handleDelete}
		oncancel={() => (deleteConfirmOpen = false)}
	/>
</div>
