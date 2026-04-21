<script lang="ts" generics="O">
	import type { Snippet } from "svelte";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { cn } from "$lib/utils.js";

	interface Props<O> {
		query: string;
		suggestions: O[];
		getKey: (o: O) => string;
		getLabel: (o: O) => string;
		open?: boolean;
		placeholder?: string;
		disabled?: boolean;
		inputRef?: HTMLInputElement | null;
		class?: string;
		inputClass?: string;
		size?: number;
		headerLabel?: string;
		item?: Snippet<[O, { active: boolean }]>;
		trailing?: Snippet;
		onqueryinput: (next: string) => void;
		onpick: (o: O) => void;
		oncommit?: () => void;
		onbackspaceEmpty?: () => void;
		onblur?: () => void;
	}

	let {
		query,
		suggestions,
		getKey,
		getLabel,
		open = $bindable(false),
		placeholder = "",
		disabled = false,
		inputRef = $bindable(null),
		class: className,
		inputClass,
		size,
		headerLabel,
		item,
		trailing,
		onqueryinput,
		onpick,
		oncommit,
		onbackspaceEmpty,
		onblur: onblurProp,
	}: Props<O> = $props();

	let suggestionIdx = $state(0);

	$effect(() => {
		if (suggestions.length > 0 && suggestionIdx >= suggestions.length) {
			suggestionIdx = 0;
		}
	});

	function doPick(o: O) {
		onpick(o);
		suggestionIdx = 0;
	}

	function onInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		open = true;
		suggestionIdx = 0;
		onqueryinput(input.value);
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
		const input = e.currentTarget as HTMLInputElement;

		if (e.key === "Backspace" && input.value === "") {
			if (onbackspaceEmpty) {
				e.preventDefault();
				onbackspaceEmpty();
			}
			return;
		}

		if (e.key === "Enter") {
			e.preventDefault();
			if (open && suggestions.length > 0) {
				doPick(suggestions[suggestionIdx] ?? suggestions[0]);
				return;
			}
			oncommit?.();
			return;
		}

		if (e.key === "Tab" && open && suggestions.length > 0) {
			e.preventDefault();
			if (e.shiftKey) {
				suggestionIdx = (suggestionIdx - 1 + suggestions.length) % suggestions.length;
			} else {
				suggestionIdx = (suggestionIdx + 1) % suggestions.length;
			}
			return;
		}

		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (open && suggestions.length > 0) {
				suggestionIdx = (suggestionIdx + 1) % suggestions.length;
			} else if (suggestions.length > 0) {
				open = true;
				suggestionIdx = 0;
			}
			return;
		}

		if (e.key === "ArrowUp") {
			if (open && suggestions.length > 0) {
				e.preventDefault();
				suggestionIdx = (suggestionIdx - 1 + suggestions.length) % suggestions.length;
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
				class={cn("inline-flex w-full items-center", className)}
				onclick={onTriggerClick}
			>
				<input
					type="text"
					bind:this={inputRef}
					value={query}
					{placeholder}
					{disabled}
					{size}
					class={cn(
						"w-full bg-transparent outline-none placeholder:text-muted-foreground",
						inputClass,
					)}
					autocomplete="off"
					spellcheck="false"
					oninput={onInput}
					onfocus={onFocus}
					onblur={onBlur}
					onkeydown={onKeydown}
				/>
				{#if trailing}
					{@render trailing()}
				{/if}
			</div>
		{/snippet}
	</PopoverTrigger>
	{#if suggestions.length > 0}
		<PopoverContent
			class="w-(--bits-popover-anchor-width) min-w-48 max-h-64 overflow-auto p-0 ring-0 shadow-card"
			align="start"
			sideOffset={4}
			trapFocus={false}
			onOpenAutoFocus={(e) => e.preventDefault()}
			onCloseAutoFocus={(e) => e.preventDefault()}
			onInteractOutside={handleInteractOutside}
		>
			<ul role="listbox" class="py-1">
				{#if headerLabel}
					<li class="px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						{headerLabel}
					</li>
				{/if}
				{#each suggestions as s, i (getKey(s))}
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
							doPick(s);
						}}
						onmouseenter={() => (suggestionIdx = i)}
					>
						{#if item}
							{@render item(s, { active: i === suggestionIdx })}
						{:else}
							{getLabel(s)}
						{/if}
					</li>
				{/each}
			</ul>
		</PopoverContent>
	{/if}
</Popover>
