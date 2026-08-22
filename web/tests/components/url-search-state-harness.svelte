<script lang="ts">
	import { createUrlSearchState } from "$lib/search-state.svelte";
	import type { SearchState } from "$lib/components/hive-searchbar";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";

	let active = $state(true);
	const controller = createUrlSearchState({ active: () => active });

	export function value(): SearchState {
		return controller.value;
	}

	export function set(next: SearchState): void {
		controller.set(next);
	}

	export function setActive(next: boolean): void {
		active = next;
	}
</script>

<HiveSearchbar
	{controller}
	chips={[
		{
			keyword: "room",
			label: "Room",
			options: () => [],
		},
	]}
	placeholder="Search test rows..."
/>
