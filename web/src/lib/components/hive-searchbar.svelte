<script lang="ts">
	import { tick } from "svelte";
	import { X } from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { badgeVariants } from "$lib/components/ui/badge/index.js";
	import { cn } from "$lib/utils.js";
	import {
		matchChipKeyword,
		parseQuery,
		serialize,
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
	}

	let {
		value,
		onchange,
		chips = [],
		placeholder = "Search...",
		class: className,
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
		const s = serialize(state);
		if (s === "") return [{ text: "" }];
		return [...s.split(" ").map((text) => ({ text })), { text: "" }];
	}

	let tokens = $state<Token[]>([{ text: "" }]);
	let lastEmitted = $state("");
	let liveInput = $state<HTMLInputElement | null>(null);
	let suggestionIdx = $state(0);
	let showSuggestions = $state(false);

	$effect(() => {
		const next = serialize(value);
		if (next !== lastEmitted) {
			tokens = hydrate(value);
			lastEmitted = next;
			suggestionIdx = 0;
			showSuggestions = false;
		}
	});

	const committed = $derived(tokens.slice(0, -1));
	const liveText = $derived(tokens[tokens.length - 1]?.text ?? "");
	const liveChip = $derived(chipConfigForText(liveText));
	const liveValue = $derived(liveChip ? liveText.slice(liveChip.keyword.length + 1) : liveText);
	const suggestions = $derived<ChipOption[]>(liveChip ? liveChip.options(liveValue) : []);
	const hasContent = $derived(tokens.length > 1 || liveText !== "");

	function emit() {
		const state = parseQuery(tokens.map((t) => t.text).join(" "), chipKeywords);
		lastEmitted = serialize(state);
		onchange(state);
	}

	function setLive(text: string) {
		const next = tokens.slice();
		next[next.length - 1] = { text };
		tokens = next;
		emit();
	}

	function commitCurrent() {
		if (liveText === "") return;
		tokens = [...tokens, { text: "" }];
		suggestionIdx = 0;
		showSuggestions = false;
		emit();
		tick().then(() => liveInput?.focus());
	}

	function reopenLastCommitted() {
		if (committed.length === 0) return;
		tokens = tokens.slice(0, -1);
		emit();
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
		suggestionIdx = 0;
		showSuggestions = false;
		emit();
		tick().then(() => liveInput?.focus());
	}

	function pickSuggestion(opt: ChipOption) {
		if (!liveChip) return;
		tokens = [...tokens.slice(0, -1), { text: `${liveChip.keyword}:${opt.value}` }, { text: "" }];
		suggestionIdx = 0;
		showSuggestions = false;
		emit();
		tick().then(() => liveInput?.focus());
	}

	function onLiveInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const newText = liveChip ? `${liveChip.keyword}:${input.value}` : input.value;
		setLive(newText);
		const fresh = chipConfigForText(tokens[tokens.length - 1].text);
		showSuggestions = fresh !== null;
		suggestionIdx = 0;
	}

	function onLiveKeydown(e: KeyboardEvent) {
		const input = e.currentTarget as HTMLInputElement;

		if (e.key === " ") {
			if (liveText !== "") {
				e.preventDefault();
				commitCurrent();
			}
			return;
		}

		if (e.key === "Backspace" && input.value === "") {
			if (liveChip) {
				e.preventDefault();
				setLive(liveChip.keyword);
				showSuggestions = false;
				return;
			}
			if (committed.length > 0) {
				e.preventDefault();
				reopenLastCommitted();
				return;
			}
			return;
		}

		if (e.key === "Enter") {
			e.preventDefault();
			if (showSuggestions && suggestions.length > 0 && liveChip) {
				pickSuggestion(suggestions[suggestionIdx] ?? suggestions[0]);
			}
			return;
		}

		if (e.key === "Tab" && showSuggestions && suggestions.length > 0) {
			e.preventDefault();
			if (e.shiftKey) {
				suggestionIdx = (suggestionIdx - 1 + suggestions.length) % suggestions.length;
			} else {
				suggestionIdx = (suggestionIdx + 1) % suggestions.length;
			}
			return;
		}

		if (e.key === "ArrowDown") {
			if (showSuggestions && suggestions.length > 0) {
				e.preventDefault();
				suggestionIdx = (suggestionIdx + 1) % suggestions.length;
			}
			return;
		}

		if (e.key === "ArrowUp") {
			if (showSuggestions && suggestions.length > 0) {
				e.preventDefault();
				suggestionIdx = (suggestionIdx - 1 + suggestions.length) % suggestions.length;
			}
			return;
		}

		if (e.key === "Escape") {
			if (showSuggestions) {
				e.preventDefault();
				showSuggestions = false;
			}
		}
	}

	function onLiveFocus() {
		if (liveChip) showSuggestions = true;
	}

	function onLiveBlur() {
		setTimeout(() => {
			showSuggestions = false;
		}, 120);
	}

	function focusBar(e: MouseEvent) {
		if (e.target === e.currentTarget) liveInput?.focus();
	}
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
				<span class={badgeVariants({ variant: cfg.variant ?? "secondary" })}>
					{cfg.label}: {token.text.slice(cfg.keyword.length + 1)}
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
			<input
				bind:this={liveInput}
				type="text"
				class={cn(
					"bg-transparent outline-none",
					liveChip
						? "min-w-[2ch] text-inherit"
						: "min-w-[6ch] flex-1 text-foreground placeholder:text-muted-foreground",
				)}
				size={liveChip ? Math.max(liveValue.length + 1, 3) : undefined}
				value={liveChip ? liveValue : liveText}
				placeholder={!liveChip && committed.length === 0 ? placeholder : ""}
				oninput={onLiveInput}
				onkeydown={onLiveKeydown}
				onfocus={onLiveFocus}
				onblur={onLiveBlur}
				autocomplete="off"
				spellcheck="false"
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

	{#if showSuggestions && liveChip && suggestions.length > 0}
		<ul
			role="listbox"
			class="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-md shadow-card bg-card py-1"
		>
			{#each suggestions as opt, i (opt.value)}
				<li
					role="option"
					aria-selected={i === suggestionIdx}
					class={cn(
						"cursor-pointer border-l-2 px-3 py-1.5 text-sm transition-colors",
						i === suggestionIdx
							? "border-primary bg-primary/10 text-foreground"
							: "border-transparent text-foreground hover:bg-muted",
					)}
					onmousedown={(e) => {
						e.preventDefault();
						pickSuggestion(opt);
					}}
					onmouseenter={() => (suggestionIdx = i)}
				>
					{opt.label}
				</li>
			{/each}
		</ul>
	{/if}
</div>
