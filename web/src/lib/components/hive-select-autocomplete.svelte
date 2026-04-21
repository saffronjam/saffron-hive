<script lang="ts" generics="T">
	import type { Snippet } from "svelte";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import HiveSearchField from "./hive-search-field.svelte";
	import { cn } from "$lib/utils.js";

	interface Props<T> {
		items: T[];
		value?: string | null;
		getValue: (t: T) => string;
		getLabel: (t: T) => string;
		placeholder?: string;
		disabled?: boolean;
		filter?: (t: T, query: string) => boolean;
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
		class: className,
		size = "default",
		item,
		renderSelected,
		onchange,
	}: Props<T> = $props();

	const MAX_SUGGESTIONS = 100;

	let open = $state(false);
	let query = $state("");
	let inputRef = $state<HTMLInputElement | null>(null);

	const selectedItem = $derived<T | null>(
		value == null ? null : items.find((i) => getValue(i) === value) ?? null,
	);

	const defaultFilter = (t: T, q: string) => getLabel(t).toLowerCase().includes(q.toLowerCase());

	const filtered = $derived.by(() => {
		if (query === "") return items.slice(0, MAX_SUGGESTIONS);
		const f = filter ?? defaultFilter;
		return items.filter((t) => f(t, query)).slice(0, MAX_SUGGESTIONS);
	});

	const displayQuery = $derived(
		open ? query : selectedItem ? (renderSelected ? "" : getLabel(selectedItem)) : "",
	);
	const fieldPlaceholder = $derived(!selectedItem || open ? placeholder : "");

	$effect(() => {
		if (!open) {
			query = "";
		}
	});

	function handlePick(t: T) {
		const v = getValue(t);
		value = v;
		onchange?.(v);
		open = false;
		inputRef?.blur();
	}

	function handleQueryInput(next: string) {
		query = next;
	}

	const triggerClass = $derived(
		cn(
			"border-input dark:bg-input/30 dark:hover:bg-input/50 focus-within:border-ring focus-within:ring-ring/50",
			"flex w-full items-center gap-1.5 rounded-md border bg-transparent pr-2 pl-2.5 text-sm shadow-xs transition-[color,box-shadow] focus-within:ring-3 cursor-text",
			size === "sm" ? "h-8 py-1" : "h-9 py-2",
			disabled && "opacity-50 cursor-not-allowed",
			!open && !selectedItem && "text-muted-foreground",
			className,
		),
	);
</script>

<div class="relative">
	<HiveSearchField
		bind:open
		bind:inputRef
		query={displayQuery}
		onqueryinput={handleQueryInput}
		suggestions={filtered}
		getKey={getValue}
		getLabel={getLabel}
		placeholder={fieldPlaceholder}
		{disabled}
		class={triggerClass}
		{item}
		onpick={handlePick}
	>
		{#snippet trailing()}
			<button
				type="button"
				tabindex={-1}
				aria-label={open ? "Close options" : "Open options"}
				class="text-muted-foreground ml-1 shrink-0 cursor-pointer"
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
	{#if !open && selectedItem && renderSelected}
		<div
			class={cn(
				"pointer-events-none absolute inset-0 flex items-center gap-1.5 rounded-md pl-2.5 text-sm",
				size === "sm" ? "h-8 pr-7" : "h-9 pr-7",
			)}
		>
			{@render renderSelected(selectedItem)}
		</div>
	{/if}
</div>
