<script lang="ts">
	import type { Snippet } from "svelte";
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Search, X } from "@lucide/svelte";
	import DynamicIcon from "./dynamic-icon.svelte";

	interface IconEntry {
		n: string;
		a?: string[];
		t?: string[];
	}

	interface IconIndex {
		mdi: IconEntry[];
		lucide: IconEntry[];
	}

	interface Props {
		value: string | null | undefined;
		onselect: (icon: string | null) => void;
		children: Snippet;
	}

	let { value, onselect, children }: Props = $props();

	let open = $state(false);
	let query = $state("");
	let debouncedQuery = $state("");
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let index = $state<IconIndex | null>(null);

	$effect(() => {
		if (open && !index) {
			import("$lib/data/icon-index.json").then((m) => {
				index = m.default as IconIndex;
			});
		}
	});

	$effect(() => {
		clearTimeout(debounceTimer);
		const q = query;
		debounceTimer = setTimeout(() => {
			debouncedQuery = q;
		}, 150);
	});

	const MAX_RESULTS = 80;

	interface ScoredResult {
		ref: string;
		score: number;
	}

	const results = $derived.by((): string[] => {
		if (!index || !debouncedQuery) return [];
		const q = debouncedQuery.toLowerCase().trim();
		if (!q) return [];

		const scored: ScoredResult[] = [];

		for (const entry of index.mdi) {
			const s = scoreEntry(entry, q);
			if (s > 0) scored.push({ ref: `mdi:${entry.n}`, score: s });
		}
		for (const entry of index.lucide) {
			const s = scoreEntry(entry, q);
			if (s > 0) scored.push({ ref: `lucide:${entry.n}`, score: s });
		}

		scored.sort((a, b) => b.score - a.score);
		return scored.slice(0, MAX_RESULTS).map((r) => r.ref);
	});

	function scoreEntry(entry: IconEntry, q: string): number {
		if (entry.n === q) return 100;
		if (entry.n.startsWith(q)) return 80;
		if (entry.n.includes(q)) return 60;
		if (entry.a?.some((a) => a.includes(q))) return 40;
		if (entry.t?.some((t) => t.toLowerCase().includes(q))) return 20;
		return 0;
	}

	function handleSelect(ref: string) {
		onselect(ref);
		open = false;
		query = "";
		debouncedQuery = "";
	}

	function handleClear() {
		onselect(null);
		open = false;
		query = "";
		debouncedQuery = "";
	}
</script>

<Popover bind:open>
	<PopoverTrigger>
		{@render children()}
	</PopoverTrigger>
	<PopoverContent class="w-96 p-3" align="start">
		<div class="space-y-2">
			<div class="relative">
				<Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					bind:value={query}
					placeholder="Search icons..."
					class="pl-9 h-8 text-sm"
				/>
			</div>

			{#if value}
				<Button variant="ghost" size="sm" class="h-7 w-full text-xs text-muted-foreground" onclick={handleClear}>
					<X class="size-3" />
					Clear icon
				</Button>
			{/if}

			{#if debouncedQuery && results.length === 0}
				<p class="py-4 text-center text-xs text-muted-foreground">No icons found.</p>
			{:else if results.length > 0}
				<div class="max-h-72 overflow-y-auto">
					<div class="grid grid-cols-6 gap-1.5">
						{#each results as ref (ref)}
							<button
								type="button"
								class="flex h-12 w-12 items-center justify-center rounded-md hover:bg-muted transition-colors {ref === value ? 'bg-muted ring-1 ring-foreground/20' : ''}"
								onclick={() => handleSelect(ref)}
							>
								<DynamicIcon icon={ref} class="size-6" />
							</button>
						{/each}
					</div>
				</div>
			{:else if !debouncedQuery}
				<p class="py-4 text-center text-xs text-muted-foreground">Type to search icons.</p>
			{/if}
		</div>
	</PopoverContent>
</Popover>
