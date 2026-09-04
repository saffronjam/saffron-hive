<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import ErrorBanner from "$lib/components/error-banner.svelte";
	import VibeChoiceCard from "$lib/components/vibe-choice-card.svelte";
	import { Loader2 } from "@lucide/svelte";
	import { fade } from "svelte/transition";
	import type { ScenePreview, VibeDomain } from "$lib/scene-editable";
	import { VibeFieldDomain } from "$lib/gql/graphql";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { guidedVibeLabel } from "$lib/i18n/vibe";

	interface Option {
		id: string;
		labelId: string;
		preview: ScenePreview;
	}

	interface Round {
		round: number;
		canFinish: boolean;
		complete: boolean;
		options: Option[];
	}

	interface Props {
		domain: VibeDomain;
		seed: string;
		selectedIds: string[];
		onchange: (selectedIds: string[]) => void;
		onuse: (selectedIds: string[]) => void;
	}

	let { domain, seed, selectedIds, onchange, onuse }: Props = $props();
	const client = getContextClient();
	let round = $state<Round | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let selectedOptionId = $state<string | null>(null);
	let autoFinishing = false;
	let request = 0;

	const GUIDED_ROUND = graphql(`
		query GuidedVibeChoices($input: GuidedVibeRoundInput!) {
			guidedVibeRound(input: $input) {
				round
				canFinish
				complete
				options {
					id
					labelId
					preview {
						width height
						pixels { r g b }
						swatches { x y color { r g b } }
					}
				}
			}
		}
	`);

	async function load(ids: string[], requestedDomain: VibeDomain, requestedSeed: string) {
		const current = ++request;
		loading = true;
		error = null;
		const result = await client.query(GUIDED_ROUND, {
			input: {
				domain: requestedDomain as VibeFieldDomain,
				seed: requestedSeed,
				selectedIds: ids,
			},
		}, { requestPolicy: "network-only" }).toPromise();
		if (current !== request) return;
		loading = false;
		if (result.error || !result.data) {
			console.error(result.error);
			error = m.vibe_choices_failed({}, locale.messageOptions());
			selectedOptionId = null;
			return;
		}
		round = result.data.guidedVibeRound;
		selectedOptionId = null;
	}

	$effect(() => {
		if (selectedIds.length < 5) autoFinishing = false;
		if (autoFinishing) return;
		void load(selectedIds, domain, seed);
	});

	function choose(id: string) {
		if (loading || selectedIds.length >= 5) return;
		selectedOptionId = id;
		const next = [...selectedIds, id];
		if (next.length === 5) autoFinishing = true;
		onchange(next);
		if (next.length === 5) onuse(next);
	}
</script>

<div class="space-y-4">
	<p class="font-medium">{m.vibe_choose_closest({}, locale.messageOptions())}</p>

	{#if error}
		<ErrorBanner message={error} ondismiss={() => (error = null)} />
	{/if}

	{#if loading && !round}
		<div class="flex h-40 items-center justify-center rounded-lg bg-muted">
			<Loader2 class="size-5 animate-spin text-muted-foreground" aria-label={m.vibe_loading_choices({}, locale.messageOptions())} />
		</div>
	{:else if round}
		<div class="guided-round-stack grid">
			{#key round.round}
				<div class="col-start-1 row-start-1 grid gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label={m.vibe_choices_round({ round: round.round }, locale.messageOptions())} in:fade={{ duration: 180 }} out:fade={{ duration: 240 }}>
					{#each round.options as option (option.id)}
						<VibeChoiceCard
							class="min-h-36"
							previewClass="min-h-36"
							preview={option.preview}
							label={guidedVibeLabel(option.labelId)}
							overlayLabel
							animateOnHover
							frameless
							showGlow={false}
							selected={selectedOptionId === option.id}
							disabled={loading}
							onclick={() => choose(option.id)}
						/>
					{/each}
				</div>
			{/key}
		</div>
	{/if}

	<div class="flex justify-end">
		<Button onclick={() => onuse(selectedIds)} disabled={loading || selectedIds.length < 3}>{m.vibe_use({}, locale.messageOptions())}</Button>
	</div>
</div>
