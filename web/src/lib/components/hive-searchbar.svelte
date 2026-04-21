<script lang="ts">
	import { tick, onDestroy } from "svelte";
	import { X } from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { badgeVariants } from "$lib/components/ui/badge/index.js";
	import { cn } from "$lib/utils.js";
	import HiveSearchField from "./hive-search-field.svelte";
	import {
		matchChipKeyword,
		stateToTokens,
		tokensToState,
		type ChipConfig,
		type ChipOption,
		type SearchState,
	} from "./hive-searchbar";

	interface Props {
		value: SearchState;
		onchange: (next: SearchState) => void;
		chips?: ChipConfig[];
		placeholder?: string;
		class?: string;
		/** When > 0, free-text typing is debounced by this many ms before onchange fires. Chip commits always fire immediately. */
		debounceMs?: number;
		/** When true, blurring the live input flushes any pending debounced emit. */
		commitOnBlur?: boolean;
	}

	let {
		value,
		onchange,
		chips = [],
		placeholder = "Search...",
		class: className,
		debounceMs = 0,
		commitOnBlur = false,
	}: Props = $props();

	interface Token {
		text: string;
	}

	const chipKeywords = $derived(chips.map((c) => c.keyword));

	function chipConfigForText(text: string): ChipConfig | null {
		const kw = matchChipKeyword(text, chipKeywords);
		if (!kw) return null;
		return chips.find((c) => c.keyword === kw) ?? null;
	}

	function hydrate(state: SearchState): Token[] {
		return stateToTokens(state).map((text) => ({ text }));
	}

	function stateKey(state: SearchState): string {
		return JSON.stringify(state);
	}

	let tokens = $state<Token[]>([{ text: "" }]);
	let lastEmitted = $state("");
	let liveInput = $state<HTMLInputElement | null>(null);
	let open = $state(false);

	$effect(() => {
		const key = stateKey(value);
		if (key !== lastEmitted) {
			tokens = hydrate(value);
			lastEmitted = key;
			open = false;
		}
	});

	const committed = $derived(tokens.slice(0, -1));
	const liveText = $derived(tokens[tokens.length - 1]?.text ?? "");
	const liveChip = $derived(chipConfigForText(liveText));
	const liveValue = $derived(liveChip ? liveText.slice(liveChip.keyword.length + 1) : liveText);

	const keywordQuery = $derived.by<string | null>(() => {
		if (!liveText.startsWith(":")) return null;
		const rest = liveText.slice(1);
		if (rest.includes(":")) return null;
		return rest;
	});

	type SuggestionMode = "keyword" | "value" | "none";
	const suggestionMode = $derived<SuggestionMode>(
		keywordQuery !== null ? "keyword" : liveChip ? "value" : "none",
	);

	const keywordSuggestions = $derived<ChipOption[]>(
		keywordQuery === null
			? []
			: chips
					.filter((c) => {
						const q = keywordQuery.toLowerCase();
						return (
							!q ||
							c.keyword.toLowerCase().includes(q) ||
							c.label.toLowerCase().includes(q)
						);
					})
					.map((c) => ({ value: c.keyword, label: c.label })),
	);

	const valueSuggestions = $derived<ChipOption[]>(liveChip ? liveChip.options(liveValue) : []);

	const activeSuggestions = $derived<ChipOption[]>(
		suggestionMode === "keyword"
			? keywordSuggestions
			: suggestionMode === "value"
				? valueSuggestions
				: [],
	);

	const hasContent = $derived(tokens.length > 1 || liveText !== "");

	function isIncompleteLive(text: string): boolean {
		if (text.startsWith(":")) return true;
		const kw = matchChipKeyword(text, chipKeywords);
		if (kw !== null && text.slice(kw.length + 1) === "") return true;
		return false;
	}

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	function clearDebounce() {
		if (debounceTimer !== null) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
	}

	function emitNow() {
		clearDebounce();
		const texts = tokens.map((t) => t.text);
		const lastIdx = texts.length - 1;
		const emitTexts =
			lastIdx >= 0 && isIncompleteLive(texts[lastIdx])
				? texts.slice(0, -1)
				: texts;
		const state = tokensToState(emitTexts, chipKeywords);
		lastEmitted = stateKey(state);
		onchange(state);
	}

	function emitDebounced() {
		if (debounceMs <= 0) {
			emitNow();
			return;
		}
		clearDebounce();
		debounceTimer = setTimeout(() => {
			debounceTimer = null;
			emitNow();
		}, debounceMs);
	}

	onDestroy(clearDebounce);

	function setLive(text: string, immediate: boolean = false) {
		const next = tokens.slice();
		next[next.length - 1] = { text };
		tokens = next;
		if (immediate) emitNow();
		else emitDebounced();
	}

	function commitCurrent() {
		if (liveText === "") return;
		tokens = [...tokens, { text: "" }];
		open = false;
		emitNow();
		tick().then(() => liveInput?.focus());
	}

	function reopenLastCommitted() {
		if (committed.length === 0) return;
		tokens = tokens.slice(0, -1);
		emitNow();
		tick().then(() => {
			if (liveInput) {
				const len = liveInput.value.length;
				liveInput.setSelectionRange(len, len);
				liveInput.focus();
			}
		});
	}

	function clearAll() {
		tokens = [{ text: "" }];
		open = false;
		emitNow();
		tick().then(() => liveInput?.focus());
	}

	function pickSuggestion(opt: ChipOption) {
		if (!liveChip) return;
		tokens = [...tokens.slice(0, -1), { text: `${liveChip.keyword}:${opt.value}` }, { text: "" }];
		open = false;
		emitNow();
		tick().then(() => liveInput?.focus());
	}

	function pickKeyword(opt: ChipOption) {
		setLive(`${opt.value}:`, true);
		open = true;
		tick().then(() => {
			if (liveInput) {
				const len = liveInput.value.length;
				liveInput.setSelectionRange(len, len);
				liveInput.focus();
			}
		});
	}

	function pickActive(opt: ChipOption) {
		if (suggestionMode === "keyword") pickKeyword(opt);
		else if (suggestionMode === "value") pickSuggestion(opt);
	}

	function handleQueryInput(next: string) {
		const newText = liveChip ? `${liveChip.keyword}:${next}` : next;
		setLive(newText);
	}

	function handleBackspaceEmpty() {
		if (liveChip) {
			setLive(liveChip.keyword);
			open = false;
			return;
		}
		if (committed.length > 0) {
			reopenLastCommitted();
		}
	}

	function handleBlur() {
		if (commitOnBlur) emitNow();
	}

	function focusBar(e: MouseEvent) {
		if (e.target === e.currentTarget) liveInput?.focus();
	}

	const fieldQuery = $derived(liveChip ? liveValue : liveText);
	const fieldPlaceholder = $derived(!liveChip && committed.length === 0 ? placeholder : "");
	const headerLabel = $derived(suggestionMode === "keyword" ? "Filters" : undefined);
	const fieldSize = $derived(liveChip ? Math.max(liveValue.length + 1, 3) : undefined);
	const fieldInputClass = $derived(
		cn(
			liveChip
				? "min-w-[2ch] text-inherit"
				: "min-w-[6ch] flex-1 text-foreground",
		),
	);
</script>

<div class={cn("relative", className)}>
	<div
		role="presentation"
		class="flex min-h-9 flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-sm focus-within:border-ring focus-within:ring-ring/30 focus-within:ring-2"
		onclick={focusBar}
	>
		{#each committed as token, i (i)}
			{@const cfg = chipConfigForText(token.text)}
			{#if cfg}
				{@const raw = token.text.slice(cfg.keyword.length + 1)}
				{@const shown = cfg.resolveLabel?.(raw) ?? raw}
				<span class={badgeVariants({ variant: cfg.variant ?? "secondary" })}>
					{cfg.label}: {shown}
				</span>
			{:else}
				<span class="text-foreground">{token.text}</span>
			{/if}
		{/each}

		<span
			class={cn(
				"inline-flex items-center",
				liveChip
					? cn(badgeVariants({ variant: liveChip.variant ?? "secondary" }), "gap-0 px-2 py-0.5")
					: "flex-1",
			)}
		>
			{#if liveChip}
				<span class="mr-1">{liveChip.label}:</span>
			{/if}
			<HiveSearchField
				bind:open
				bind:inputRef={liveInput}
				query={fieldQuery}
				onqueryinput={handleQueryInput}
				suggestions={activeSuggestions}
				getKey={(o) => o.value}
				getLabel={(o) => o.label}
				placeholder={fieldPlaceholder}
				class={liveChip ? "w-auto" : "flex-1"}
				inputClass={fieldInputClass}
				size={fieldSize}
				headerLabel={headerLabel}
				onpick={pickActive}
				oncommit={commitCurrent}
				onbackspaceEmpty={handleBackspaceEmpty}
				onblur={handleBlur}
			/>
		</span>

		{#if hasContent}
			<Button
				type="button"
				variant="ghost"
				size="icon"
				class="ml-auto h-6 w-6 shrink-0"
				onclick={clearAll}
				aria-label="Clear search"
			>
				<X class="size-4" />
			</Button>
		{/if}
	</div>
</div>
