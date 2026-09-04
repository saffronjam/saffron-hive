<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import { Camera } from "@lucide/svelte";
	import { graphql } from "$lib/gql";
	import { VibeFieldDomain, type VibeSourceInput } from "$lib/gql/graphql";
	import { Button } from "$lib/components/ui/button/index.js";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import FieldError from "$lib/components/field-error.svelte";
	import VibeChoiceCard from "$lib/components/vibe-choice-card.svelte";
	import VibeGuided from "$lib/components/vibe-guided.svelte";
	import VibePreview from "$lib/components/vibe-preview.svelte";
	import { normalizePhoto, type NormalizedPhotoSample } from "$lib/photo-sample";
	import type { DynamicLighting, ScenePreview, VibeDomain } from "$lib/scene-editable";
	import { vibeCatalog, type VibePreset } from "$lib/stores/vibe-catalog.svelte";
	import { randomVibeSeed } from "$lib/vibe-seed";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { vibePresetLabel } from "$lib/i18n/vibe";

	type SourceKind = "gallery" | "photo" | "guided";
	type Source =
		| { preset: { presetId: string; seed: string } }
		| { photo: { domain: VibeDomain; seed: string; width: number; height: number; rgbBase64: string } }
		| { guided: { domain: VibeDomain; seed: string; selectedIds: string[] } };

	interface Props {
		onselect: (dynamic: DynamicLighting, preview: ScenePreview) => void;
	}

	let { onselect }: Props = $props();
	const client = getContextClient();
	const presets = $derived(vibeCatalog.items);
	let kind = $state<SourceKind>("gallery");
	let domain = $state<VibeDomain>("full_color");
	let seed = $state(randomVibeSeed());
	let photo = $state<NormalizedPhotoSample | null>(null);
	let guidedSelectedIds = $state<string[]>([]);
	let candidate = $state<{ dynamic: DynamicLighting; preview: ScenePreview } | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let photoError = $state<string | null>(null);

	const PREVIEW = graphql(`
		query SceneEditorVibePreview($input: PreviewVibeInput!) {
			previewVibe(input: $input) {
				preview { width height pixels { r g b } swatches { x y color { r g b } } }
				domain seed brightness movement cycleSeconds
			}
		}
	`);

	$effect(() => {
		void vibeCatalog.load(client);
	});

	function sourceInput(source: Source): VibeSourceInput {
		if ("photo" in source) return { photo: { ...source.photo, domain: source.photo.domain as VibeFieldDomain } };
		if ("guided" in source) return { guided: { ...source.guided, domain: source.guided.domain as VibeFieldDomain } };
		return source;
	}

	function selectPreset(preset: VibePreset) {
		const source = { preset: { presetId: preset.id, seed: preset.seed } } satisfies Source;
		onselect({
			domain: preset.domain,
			sourceKind: "preset",
			presetId: preset.id,
			guidedSelectedIds: [],
			seed: preset.seed,
			brightness: preset.brightness,
			movement: preset.movement,
			cycleSeconds: preset.cycleSeconds,
			gridWidth: 0,
			gridHeight: 0,
			samples: [],
			sourceInput: source,
		}, preset.preview);
	}

	async function compile(source: Source): Promise<boolean> {
		loading = true;
		error = null;
		const result = await client.query(PREVIEW, {
			input: {
				source: sourceInput(source),
				brightness: 0.82,
				movement: 0.45,
				cycleSeconds: 720,
			},
		}, { requestPolicy: "network-only" }).toPromise();
		loading = false;
		if (result.error || !result.data) {
			console.error(result.error);
			error = m.vibe_build_failed({}, locale.messageOptions());
			return false;
		}
		const built = result.data.previewVibe;
		candidate = {
			preview: built.preview,
			dynamic: {
				domain: built.domain,
				sourceKind: "photo" in source ? "photo" : "guided",
				presetId: null,
				guidedSelectedIds: "guided" in source ? source.guided.selectedIds : [],
				seed: built.seed,
				brightness: built.brightness,
				movement: built.movement,
				cycleSeconds: built.cycleSeconds,
				gridWidth: 0,
				gridHeight: 0,
				samples: [],
				sourceInput: sourceInput(source) as DynamicLighting["sourceInput"],
			},
		};
		return true;
	}

	async function handlePhoto(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		photoError = null;
		candidate = null;
		try {
			photo = await normalizePhoto(file);
			seed = randomVibeSeed();
			await compile({ photo: { domain, seed, ...photo } });
		} catch (caught) {
			console.error(caught);
			photoError = m.vibe_photo_failed({}, locale.messageOptions());
		}
		input.value = "";
	}

	async function rebuildPhoto() {
		if (!photo) return;
		candidate = null;
		await compile({ photo: { domain, seed, ...photo } });
	}

	async function useGuided(selectedIds = guidedSelectedIds) {
		if (selectedIds.length < 3) return;
		const source = { guided: { domain, seed, selectedIds } } satisfies Source;
		if (await compile(source) && candidate) onselect(candidate.dynamic, candidate.preview);
	}

	function chooseKind(next: SourceKind) {
		kind = next;
		candidate = null;
		error = null;
	}
</script>

<div class="space-y-5">
	<div class="flex flex-wrap gap-2">
		<Button variant={kind === "gallery" ? "default" : "outline"} size="sm" onclick={() => chooseKind("gallery")}>{m.vibe_gallery({}, locale.messageOptions())}</Button>
		<Button variant={kind === "photo" ? "default" : "outline"} size="sm" onclick={() => chooseKind("photo")}>{m.vibe_photo({}, locale.messageOptions())}</Button>
		<Button variant={kind === "guided" ? "default" : "outline"} size="sm" onclick={() => chooseKind("guided")}>{m.vibe_guided({}, locale.messageOptions())}</Button>
	</div>

	{#if error}<ErrorBanner message={error} ondismiss={() => (error = null)} />{/if}

	{#if kind === "gallery"}
		{#if vibeCatalog.loading && presets.length === 0}
			<div class="grid gap-3 sm:grid-cols-2">{#each [0, 1] as placeholder}<div class="h-36 animate-pulse rounded-lg bg-muted" aria-hidden="true"></div>{/each}</div>
		{:else if vibeCatalog.error}
			<ErrorBanner message={vibeCatalog.error} />
		{:else}
			<div class="grid max-h-[60vh] gap-3 overflow-y-auto p-2 sm:grid-cols-3 lg:grid-cols-5">
				{#each presets as preset (preset.id)}
					<VibeChoiceCard
						class="min-h-32"
						previewClass="min-h-32"
						preview={preset.preview}
						label={vibePresetLabel(preset.id)}
						overlayLabel
						animateOnHover
						frameless
						showGlow={false}
						movement={preset.movement}
						cycleSeconds={preset.cycleSeconds}
						seed={preset.seed}
						onclick={() => selectPreset(preset)}
					/>
				{/each}
			</div>
		{/if}
	{:else if kind === "photo"}
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="space-y-4">
				<div class="flex gap-2">
					<Button variant={domain === "full_color" ? "default" : "outline"} size="sm" onclick={() => { domain = "full_color"; void rebuildPhoto(); }}>{m.vibe_colors({}, locale.messageOptions())}</Button>
					<Button variant={domain === "white_ambience" ? "default" : "outline"} size="sm" onclick={() => { domain = "white_ambience"; void rebuildPhoto(); }}>{m.vibe_whites({}, locale.messageOptions())}</Button>
				</div>
				<label class="flex min-h-40 flex-col items-center justify-center rounded-lg bg-muted p-5 text-center">
					<Camera class="mb-3 size-6 text-muted-foreground" />
					<span class="text-sm font-medium">{photo ? m.vibe_replace_photo({}, locale.messageOptions()) : m.vibe_choose_photo({}, locale.messageOptions())}</span>
					<input type="file" accept="image/*" class="sr-only" onchange={handlePhoto} />
				</label>
				<FieldError message={photoError} />
			</div>
			<div class="min-h-40 overflow-hidden rounded-lg bg-muted">
				{#if candidate}<VibePreview preview={candidate.preview} brightness={candidate.dynamic.brightness} movement={candidate.dynamic.movement} cycleSeconds={candidate.dynamic.cycleSeconds} seed={candidate.dynamic.seed} />{/if}
			</div>
		</div>
		<div class="flex justify-end"><Button disabled={!candidate || loading} onclick={() => candidate && onselect(candidate.dynamic, candidate.preview)}>{loading ? m.vibe_building({}, locale.messageOptions()) : m.vibe_use({}, locale.messageOptions())}</Button></div>
	{:else}
		<div class="flex gap-2">
			<Button variant={domain === "full_color" ? "default" : "outline"} size="sm" onclick={() => { domain = "full_color"; guidedSelectedIds = []; }}>{m.vibe_colors({}, locale.messageOptions())}</Button>
			<Button variant={domain === "white_ambience" ? "default" : "outline"} size="sm" onclick={() => { domain = "white_ambience"; guidedSelectedIds = []; }}>{m.vibe_whites({}, locale.messageOptions())}</Button>
		</div>
		<VibeGuided {domain} {seed} selectedIds={guidedSelectedIds} onchange={(ids) => (guidedSelectedIds = ids)} onuse={useGuided} />
	{/if}
</div>
