<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import HiveSearchField from "./hive-search-field.svelte";
	import { cn } from "$lib/utils.js";
	import {
		tokensToState,
		type ChipConfig,
		type SearchChip,
		type Token,
	} from "./hive-searchbar";

	interface Props<T> {
		items: T[];
		value?: string | null;
		getValue: (t: T) => string;
		getLabel: (t: T) => string;
		placeholder?: string;
		disabled?: boolean;
		filter?: (t: T, query: string, chips: SearchChip[]) => boolean;
		chipConfigs?: ChipConfig[];
		chipMatchers?: Record<string, (t: T, value: string) => boolean>;
		class?: string;
		size?: "sm" | "default";
		item?: Snippet<[T]>;
		renderSelected?: Snippet<[T]>;
		onchange?: (value: string) => void;
	}

	let {
		items,
		value = $bindable(null),
		getValue,
		getLabel,
		placeholder = "Select...",
		disabled = false,
		filter,
		chipConfigs,
		chipMatchers,
		class: className,
		size = "default",
		item,
		renderSelected,
		onchange,
	}: Props<T> = $props();

	const MAX_SUGGESTIONS = 100;

	let open = $state(false);
	let tokens = $state<Token[]>([{ text: "" }]);
	let inputRef = $state<HTMLInputElement | null>(null);

	const chipKeywords = $derived(chipConfigs?.map((c) => c.keyword) ?? []);
	const parsed = $derived(tokensToState(tokens.map((t) => t.text), chipKeywords));
	const chips = $derived(parsed.chips);
	const freeText = $derived(parsed.freeText);

	const selectedItem = $derived<T | null>(
		value == null ? null : items.find((i) => getValue(i) === value) ?? null,
	);

	function defaultChipMatch(t: T, chip: SearchChip): boolean {
		const m = chipMatchers?.[chip.keyword];
		if (m) return m(t, chip.value);
		return getLabel(t).toLowerCase().includes(chip.value.toLowerCase());
	}

	function defaultFreeTextMatch(t: T, q: string): boolean {
		return getLabel(t).toLowerCase().includes(q.toLowerCase());
	}

	const filtered = $derived.by(() => {
		let result = items;
		if (chips.length > 0) {
			result = result.filter((t) => chips.every((c) => defaultChipMatch(t, c)));
		}
		if (freeText) {
			if (filter) {
				result = result.filter((t) => filter(t, freeText, chips));
			} else {
				result = result.filter((t) => defaultFreeTextMatch(t, freeText));
			}
		}
		return result.slice(0, MAX_SUGGESTIONS);
	});

	$effect(() => {
		if (!open) {
			tokens = [{ text: "" }];
		}
	});

	function handlePick(t: T) {
		const v = getValue(t);
		value = v;
		onchange?.(v);
		open = false;
		tokens = [{ text: "" }];
		inputRef?.blur();
	}

	const showSelectedOverlay = $derived(!open && selectedItem != null);

	const triggerClass = $derived(
		cn(
			"border-input dark:bg-input/30 dark:hover:bg-input/50 focus-within:border-ring focus-within:ring-ring/50",
			"flex w-full items-stretch rounded-md border bg-transparent pl-2.5 text-sm shadow-xs transition-[color,box-shadow] focus-within:ring-3",
			size === "sm" ? "min-h-8" : "min-h-9",
			disabled && "opacity-50",
			!open && !selectedItem && "text-muted-foreground",
			className,
		),
	);

	// When a selected item is shown via renderSelected, hide the input visually
	// so the overlay doesn't paint on top of the input's label text.
	const inputClass = $derived(showSelectedOverlay ? "text-transparent" : undefined);
	const fieldPlaceholder = $derived(showSelectedOverlay ? "" : placeholder);
</script>

<div class="relative">
	<HiveSearchField
		bind:open
		bind:tokens
		bind:inputRef
		{chipConfigs}
		items={filtered}
		getKey={getValue}
		getLabel={getLabel}
		placeholder={fieldPlaceholder}
		{disabled}
		class={triggerClass}
		{inputClass}
		{item}
		onpick={handlePick}
	>
		{#snippet trailing()}
			<button
				type="button"
				tabindex={-1}
				aria-label={open ? "Close options" : "Open options"}
				class="text-muted-foreground ml-1 flex shrink-0 items-center self-stretch px-2 hover:text-foreground"
				onclick={(e) => {
					e.stopPropagation();
					if (open) {
						open = false;
						inputRef?.blur();
					} else {
						open = true;
						inputRef?.focus();
					}
				}}
			>
				<ChevronDownIcon class="size-4" />
			</button>
		{/snippet}
	</HiveSearchField>
	{#if showSelectedOverlay && selectedItem}
		<div
			class={cn(
				"pointer-events-none absolute inset-0 flex items-center gap-1.5 rounded-md pl-2.5 text-sm",
				size === "sm" ? "h-8 pr-7" : "h-9 pr-7",
			)}
		>
			{#if renderSelected}
				{@render renderSelected(selectedItem)}
			{:else}
				<span class="truncate">{getLabel(selectedItem)}</span>
			{/if}
		</div>
	{/if}
</div>
