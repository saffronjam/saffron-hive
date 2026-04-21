<script lang="ts">
	import { tick, onDestroy } from "svelte";
	import { X } from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import HiveSearchField from "./hive-search-field.svelte";
	import {
		stateToTokens,
		tokensToState,
		type ChipConfig,
		type SearchState,
		type Token,
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

	const chipKeywords = $derived(chips.map((c) => c.keyword));

	function hydrate(state: SearchState): Token[] {
		return stateToTokens(state).map((text) => ({ text }));
	}

	function stateKey(state: SearchState): string {
		return JSON.stringify(state);
	}

	let tokens = $state<Token[]>([{ text: "" }]);
	let lastEmitted = $state("");
	let liveInput = $state<HTMLInputElement | null>(null);

	$effect(() => {
		const key = stateKey(value);
		if (key !== lastEmitted) {
			tokens = hydrate(value);
			lastEmitted = key;
		}
	});

	const liveText = $derived(tokens[tokens.length - 1]?.text ?? "");
	const committed = $derived(tokens.slice(0, -1));
	const hasContent = $derived(tokens.length > 1 || liveText !== "");

	function isIncompleteLive(text: string): boolean {
		if (text.startsWith(":")) return true;
		if (text === "") return false;
		// matchChipKeyword result is handled by the field; here we just check if text ends with a bare "keyword:"
		for (const kw of chipKeywords) {
			if (text === `${kw}:`) return true;
		}
		return false;
	}

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	function clearDebounce() {
		if (debounceTimer !== null) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
	}

	function emitFromTokens(nextTokens: Token[]) {
		const texts = nextTokens.map((t) => t.text);
		const lastIdx = texts.length - 1;
		const emitTexts =
			lastIdx >= 0 && isIncompleteLive(texts[lastIdx])
				? texts.slice(0, -1)
				: texts;
		const state = tokensToState(emitTexts, chipKeywords);
		const key = stateKey(state);
		if (key === lastEmitted) return;
		lastEmitted = key;
		onchange(state);
	}

	function emitNow() {
		clearDebounce();
		emitFromTokens(tokens);
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

	function handleChipCommit(_next: Token[]) {
		emitNow();
	}

	function handleFreeTextCommit(_next: Token[]) {
		emitNow();
	}

	function handleBlur() {
		if (commitOnBlur) emitNow();
	}

	function clearAll() {
		tokens = [{ text: "" }];
		emitNow();
		tick().then(() => liveInput?.focus());
	}

	function focusBar(e: MouseEvent) {
		if (e.target === e.currentTarget) liveInput?.focus();
	}

	// Debounced emit for live-text edits (typing without committing).
	$effect(() => {
		// depend on live text
		void liveText;
		// ignore during hydration — emit only when diff from last
		emitDebounced();
	});
</script>

<div class={cn("relative", className)}>
	<div
		role="presentation"
		class="flex min-h-9 flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-sm focus-within:border-ring focus-within:ring-ring/30 focus-within:ring-2"
		onclick={focusBar}
	>
		<HiveSearchField
			bind:tokens
			bind:inputRef={liveInput}
			chipConfigs={chips}
			placeholder={committed.length === 0 ? placeholder : ""}
			class="flex-1"
			onchipcommit={handleChipCommit}
			onfreetextcommit={handleFreeTextCommit}
			onblur={handleBlur}
		/>

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
