<script lang="ts">
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import type { TableSelection } from "$lib/utils/table-selection.svelte";

	interface Props {
		selection: TableSelection;
		orderedIds: readonly string[];
	}

	let { selection, orderedIds }: Props = $props();

	const state = $derived(selection.headerState(orderedIds));
	const checked = $derived(state === "all");
	const indeterminate = $derived(state === "some");

	function toggleAll(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (state === "all") selection.clear();
		else selection.setAll(orderedIds);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key !== " " && event.key !== "Enter") return;
		event.preventDefault();
		if (state === "all") selection.clear();
		else selection.setAll(orderedIds);
	}
</script>

<span
	role="checkbox"
	tabindex="0"
	aria-checked={indeterminate ? "mixed" : checked}
	aria-label="Select all rows"
	onclick={toggleAll}
	{onkeydown}
	class="inline-flex select-none align-middle"
>
	<Checkbox {checked} {indeterminate} tabindex={-1} aria-hidden="true" />
</span>
