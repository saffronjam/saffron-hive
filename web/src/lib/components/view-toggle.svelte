<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { LayoutGrid, LayoutList } from "@lucide/svelte";
	import type { ListView } from "$lib/stores/profile.svelte";

	interface Props {
		value: ListView;
		onchange: (v: ListView) => void;
	}

	let { value, onchange }: Props = $props();
</script>

<div class="flex items-center rounded-md border border-border dark:border-input">
	<Button
		variant={value === "card" ? "secondary" : "ghost"}
		size="sm"
		class="rounded-r-none border-0"
		onclick={() => {
			if (value !== "card") onchange("card");
		}}
		aria-label="Card view"
	>
		<LayoutGrid class="size-3.5" />
		<span class="hidden sm:inline">Cards</span>
	</Button>
	<Button
		variant={value === "table" ? "secondary" : "ghost"}
		size="sm"
		class="rounded-l-none border-0"
		onclick={() => {
			if (value !== "table") onchange("table");
		}}
		aria-label="Table view"
	>
		<LayoutList class="size-3.5" />
		<span class="hidden sm:inline">Table</span>
	</Button>
</div>
