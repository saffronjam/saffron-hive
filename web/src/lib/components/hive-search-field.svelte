<script lang="ts" generics="O">
	import { tick, type Snippet } from "svelte";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { badgeVariants } from "$lib/components/ui/badge/index.js";
	import { cn } from "$lib/utils.js";
	import {
		matchChipKeyword,
		type ChipConfig,
		type ChipOption,
		type Token,
	} from "./hive-searchbar";

	interface Props<O> {
		tokens?: Token[];
		open?: boolean;
		chipConfigs?: ChipConfig[];
		items?: O[];
		getKey?: (o: O) => string;
		getLabel?: (o: O) => string;
		placeholder?: string;
		disabled?: boolean;
		inputRef?: HTMLInputElement | null;
		class?: string;
		inputClass?: string;
		size?: number;
		item?: Snippet<[O, { active: boolean }]>;
		trailing?: Snippet;
		onpick?: (o: O) => void;
		onchipcommit?: (tokens: Token[]) => void;
		onfreetextcommit?: (tokens: Token[]) => void;
		onblur?: () => void;
	}

	let {
		tokens = $bindable([{ text: "" }]),
		open = $bindable(false),
		chipConfigs = [],
		items = [],
		getKey,
		getLabel,
		placeholder = "",
		disabled = false,
		inputRef = $bindable(null),
		class: className,
		inputClass,
		size,
		item,
		trailing,
		onpick,
		onchipcommit,
		onfreetextcommit,
		onblur: onblurProp,
	}: Props<O> = $props();

	let suggestionIdx = $state(0);

	const chipKeywords = $derived(chipConfigs.map((c) => c.keyword));

	function chipConfigForText(text: string): ChipConfig | null {
		const kw = matchChipKeyword(text, chipKeywords);
		if (!kw) return null;
		return chipConfigs.find((c) => c.keyword === kw) ?? null;
	}

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

	type SuggestionMode = "keyword" | "value" | "item" | "none";
	const suggestionMode = $derived<SuggestionMode>(
		keywordQuery !== null
			? "keyword"
			: liveChip
				? "value"
				: items.length > 0
					? "item"
					: "none",
	);

	const keywordSuggestions = $derived<ChipOption[]>(
		keywordQuery === null
			? []
			: chipConfigs
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

	const valueSuggestions = $derived<ChipOption[]>(
		liveChip ? liveChip.options(liveValue) : [],
	);

	$effect(() => {
		suggestionIdx = 0;
	});

	function setLive(text: string) {
		const next = tokens.slice();
		next[next.length - 1] = { text };
		tokens = next;
	}

	function pickKeyword(opt: ChipOption) {
		setLive(`${opt.value}:`);
		open = true;
		tick().then(() => {
			if (inputRef) {
				const len = inputRef.value.length;
				inputRef.setSelectionRange(len, len);
				inputRef.focus();
			}
		});
	}

	function pickValue(opt: ChipOption) {
		if (!liveChip) return;
		const next = [
			...tokens.slice(0, -1),
			{ text: `${liveChip.keyword}:${opt.value}` },
			{ text: "" },
		];
		tokens = next;
		suggestionIdx = 0;
		onchipcommit?.(next);
		tick().then(() => inputRef?.focus());
	}

	function pickItem(o: O) {
		onpick?.(o);
		suggestionIdx = 0;
	}

	function commitFreeText() {
		if (liveText === "") return;
		const next = [...tokens, { text: "" }];
		tokens = next;
		open = false;
		onfreetextcommit?.(next);
		tick().then(() => inputRef?.focus());
	}

	function reopenLastCommitted() {
		if (committed.length === 0) return;
		tokens = tokens.slice(0, -1);
		tick().then(() => {
			if (inputRef) {
				const len = inputRef.value.length;
				inputRef.setSelectionRange(len, len);
				inputRef.focus();
			}
		});
	}

	function onInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const newText = liveChip ? `${liveChip.keyword}:${input.value}` : input.value;
		setLive(newText);
		open = true;
		suggestionIdx = 0;
	}

	function onFocus() {
		open = true;
	}

	function onBlur() {
		onblurProp?.();
	}

	function onTriggerClick() {
		open = true;
		inputRef?.focus();
	}

	function onKeydown(e: KeyboardEvent) {
		// Keep keystrokes from bubbling to the PopoverTrigger wrapper, whose
		// bits-ui handler preventDefaults Space/Enter to toggle the popover —
		// that would swallow spaces before they land in the input.
		e.stopPropagation();

		const input = e.currentTarget as HTMLInputElement;

		if (e.key === "Backspace" && input.value === "") {
			if (liveChip) {
				e.preventDefault();
				setLive(liveChip.keyword);
				open = false;
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
			if (open) {
				if (suggestionMode === "keyword" && keywordSuggestions.length > 0) {
					pickKeyword(keywordSuggestions[suggestionIdx] ?? keywordSuggestions[0]);
					return;
				}
				if (suggestionMode === "value" && valueSuggestions.length > 0) {
					pickValue(valueSuggestions[suggestionIdx] ?? valueSuggestions[0]);
					return;
				}
				if (suggestionMode === "item" && items.length > 0) {
					pickItem(items[suggestionIdx] ?? items[0]);
					return;
				}
			}
			if (liveText !== "") {
				commitFreeText();
			}
			return;
		}

		if (e.key === "Tab" && open) {
			const len = suggestionMode === "item" ? items.length : suggestionMode === "keyword" ? keywordSuggestions.length : suggestionMode === "value" ? valueSuggestions.length : 0;
			if (len > 0) {
				e.preventDefault();
				if (e.shiftKey) {
					suggestionIdx = (suggestionIdx - 1 + len) % len;
				} else {
					suggestionIdx = (suggestionIdx + 1) % len;
				}
			}
			return;
		}

		if (e.key === "ArrowDown") {
			const len = suggestionMode === "item" ? items.length : suggestionMode === "keyword" ? keywordSuggestions.length : suggestionMode === "value" ? valueSuggestions.length : 0;
			e.preventDefault();
			if (open && len > 0) {
				suggestionIdx = (suggestionIdx + 1) % len;
			} else if (len > 0) {
				open = true;
				suggestionIdx = 0;
			}
			return;
		}

		if (e.key === "ArrowUp") {
			const len = suggestionMode === "item" ? items.length : suggestionMode === "keyword" ? keywordSuggestions.length : suggestionMode === "value" ? valueSuggestions.length : 0;
			if (open && len > 0) {
				e.preventDefault();
				suggestionIdx = (suggestionIdx - 1 + len) % len;
			}
			return;
		}

		if (e.key === "Escape") {
			if (open) {
				e.preventDefault();
				open = false;
				inputRef?.blur();
			}
			return;
		}
	}

	function handleInteractOutside(e: PointerEvent) {
		const target = e.target as Node | null;
		if (target && inputRef) {
			const wrapper = inputRef.closest("[data-hive-search-trigger]");
			if (wrapper && wrapper.contains(target)) {
				e.preventDefault();
			}
		}
	}
</script>

<Popover bind:open>
	<PopoverTrigger>
		{#snippet child({ props })}
			<div
				{...props}
				data-hive-search-trigger
				class={cn("inline-flex w-full flex-wrap items-stretch gap-1", className)}
				onclick={onTriggerClick}
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
						<span class="whitespace-pre text-foreground">{token.text}</span>
					{/if}
				{/each}

				<span
					class={cn(
						"inline-flex items-center",
						liveChip
							? cn(badgeVariants({ variant: liveChip.variant ?? "secondary" }), "gap-0 px-2 py-0.5")
							: "flex-1 min-w-[6ch]",
					)}
				>
					{#if liveChip}
						<span class="mr-1">{liveChip.label}:</span>
					{/if}
					<input
						type="text"
						bind:this={inputRef}
						value={liveChip ? liveValue : liveText}
						{placeholder}
						{disabled}
						size={liveChip ? Math.max(liveValue.length + 1, 3) : size}
						class={cn(
							"w-full bg-transparent outline-none placeholder:text-muted-foreground",
							liveChip ? "min-w-[2ch] text-inherit" : undefined,
							inputClass,
						)}
						autocomplete="off"
						spellcheck="false"
						oninput={onInput}
						onfocus={onFocus}
						onblur={onBlur}
						onkeydown={onKeydown}
					/>
				</span>

				{#if trailing}
					{@render trailing()}
				{/if}
			</div>
		{/snippet}
	</PopoverTrigger>
	{#if open}
		{#if suggestionMode === "keyword" && keywordSuggestions.length > 0}
			<PopoverContent
				class="min-w-(--bits-popover-anchor-width) max-w-md max-h-64 overflow-auto p-0 ring-0 shadow-card"
				align="start"
				sideOffset={4}
				trapFocus={false}
				onOpenAutoFocus={(e) => e.preventDefault()}
				onCloseAutoFocus={(e) => e.preventDefault()}
				onInteractOutside={handleInteractOutside}
			>
				<ul role="listbox" class="py-1">
					<li class="px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						Filters
					</li>
					{#each keywordSuggestions as opt, i (opt.value)}
						<li
							role="option"
							aria-selected={i === suggestionIdx}
							class={cn(
								"border-l-2 px-3 py-1.5 text-sm transition-colors",
								i === suggestionIdx
									? "border-primary bg-primary/10 text-foreground"
									: "border-transparent text-foreground hover:bg-muted",
							)}
							onmousedown={(e) => {
								e.preventDefault();
								pickKeyword(opt);
							}}
							onmouseenter={() => (suggestionIdx = i)}
						>
							{opt.label}
						</li>
					{/each}
				</ul>
			</PopoverContent>
		{:else if suggestionMode === "value" && valueSuggestions.length > 0}
			<PopoverContent
				class="min-w-(--bits-popover-anchor-width) max-w-md max-h-64 overflow-auto p-0 ring-0 shadow-card"
				align="start"
				sideOffset={4}
				trapFocus={false}
				onOpenAutoFocus={(e) => e.preventDefault()}
				onCloseAutoFocus={(e) => e.preventDefault()}
				onInteractOutside={handleInteractOutside}
			>
				<ul role="listbox" class="py-1">
					{#each valueSuggestions as opt, i (opt.value)}
						<li
							role="option"
							aria-selected={i === suggestionIdx}
							class={cn(
								"border-l-2 px-3 py-1.5 text-sm transition-colors",
								i === suggestionIdx
									? "border-primary bg-primary/10 text-foreground"
									: "border-transparent text-foreground hover:bg-muted",
							)}
							onmousedown={(e) => {
								e.preventDefault();
								pickValue(opt);
							}}
							onmouseenter={() => (suggestionIdx = i)}
						>
							{opt.label}
						</li>
					{/each}
				</ul>
			</PopoverContent>
		{:else if suggestionMode === "item" && items.length > 0 && getKey && getLabel}
			<PopoverContent
				class="min-w-(--bits-popover-anchor-width) max-w-md max-h-64 overflow-auto p-0 ring-0 shadow-card"
				align="start"
				sideOffset={4}
				trapFocus={false}
				onOpenAutoFocus={(e) => e.preventDefault()}
				onCloseAutoFocus={(e) => e.preventDefault()}
				onInteractOutside={handleInteractOutside}
			>
				<ul role="listbox" class="py-1">
					{#each items as o, i (getKey(o))}
						<li
							role="option"
							aria-selected={i === suggestionIdx}
							class={cn(
								"border-l-2 px-3 py-1.5 text-sm transition-colors",
								i === suggestionIdx
									? "border-primary bg-primary/10 text-foreground"
									: "border-transparent text-foreground hover:bg-muted",
							)}
							onmousedown={(e) => {
								e.preventDefault();
								pickItem(o);
							}}
							onmouseenter={() => (suggestionIdx = i)}
						>
							{#if item}
								{@render item(o, { active: i === suggestionIdx })}
							{:else}
								{getLabel(o)}
							{/if}
						</li>
					{/each}
				</ul>
			</PopoverContent>
		{/if}
	{/if}
</Popover>
