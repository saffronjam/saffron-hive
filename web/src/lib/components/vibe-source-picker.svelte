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
			presetTitle: preset.title,
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
			error = result.error?.message ?? "Could not build this vibe.";
			return false;
		}
		const built = result.data.previewVibe;
		candidate = {
			preview: built.preview,
			dynamic: {
				domain: built.domain,
				sourceKind: "photo" in source ? "photo" : "guided",
				presetId: null,
				presetTitle: null,
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
			photoError = caught instanceof Error ? caught.message : "Could not process this image.";
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
		<Button variant={kind === "gallery" ? "default" : "outline"} size="sm" onclick={() => chooseKind("gallery")}>Gallery</Button>
		<Button variant={kind === "photo" ? "default" : "outline"} size="sm" onclick={() => chooseKind("photo")}>Photo</Button>
		<Button variant={kind === "guided" ? "default" : "outline"} size="sm" onclick={() => chooseKind("guided")}>Guided</Button>
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
						label={preset.title}
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
					<Button variant={domain === "full_color" ? "default" : "outline"} size="sm" onclick={() => { domain = "full_color"; void rebuildPhoto(); }}>Colours</Button>
					<Button variant={domain === "white_ambience" ? "default" : "outline"} size="sm" onclick={() => { domain = "white_ambience"; void rebuildPhoto(); }}>Whites</Button>
				</div>
				<label class="flex min-h-40 flex-col items-center justify-center rounded-lg bg-muted p-5 text-center">
					<Camera class="mb-3 size-6 text-muted-foreground" />
					<span class="text-sm font-medium">{photo ? "Replace photo" : "Choose a photo"}</span>
					<input type="file" accept="image/*" class="sr-only" onchange={handlePhoto} />
				</label>
				<FieldError message={photoError} />
			</div>
			<div class="min-h-40 overflow-hidden rounded-lg bg-muted">
				{#if candidate}<VibePreview preview={candidate.preview} brightness={candidate.dynamic.brightness} movement={candidate.dynamic.movement} cycleSeconds={candidate.dynamic.cycleSeconds} seed={candidate.dynamic.seed} />{/if}
			</div>
		</div>
		<div class="flex justify-end"><Button disabled={!candidate || loading} onclick={() => candidate && onselect(candidate.dynamic, candidate.preview)}>{loading ? "Building..." : "Use this vibe"}</Button></div>
	{:else}
		<div class="flex gap-2">
			<Button variant={domain === "full_color" ? "default" : "outline"} size="sm" onclick={() => { domain = "full_color"; guidedSelectedIds = []; }}>Colours</Button>
			<Button variant={domain === "white_ambience" ? "default" : "outline"} size="sm" onclick={() => { domain = "white_ambience"; guidedSelectedIds = []; }}>Whites</Button>
		</div>
		<VibeGuided {domain} {seed} selectedIds={guidedSelectedIds} onchange={(ids) => (guidedSelectedIds = ids)} onuse={useGuided} />
	{/if}
</div>
