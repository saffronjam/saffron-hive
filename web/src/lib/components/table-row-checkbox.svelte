<script lang="ts">
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import type { TableSelection } from "$lib/utils/table-selection.svelte";

	interface Props {
		id: string;
		selection: TableSelection;
		orderedIds: readonly string[];
		tooltip?: string;
		ariaLabel?: string;
	}

	let { id, selection, orderedIds, tooltip, ariaLabel = "Select row" }: Props = $props();

	function onclick(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		selection.handleRowClick(id, event, orderedIds);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key !== " " && event.key !== "Enter") return;
		event.preventDefault();
		selection.handleRowClick(id, event, orderedIds);
	}
</script>

<span
	role="checkbox"
	tabindex="0"
	aria-checked={selection.isSelected(id)}
	aria-label={ariaLabel}
	aria-disabled={selection.isDisabled(id) ? true : undefined}
	title={tooltip ?? undefined}
	{onclick}
	{onkeydown}
	class="inline-flex select-none"
>
	<Checkbox
		checked={selection.isSelected(id)}
		disabled={selection.isDisabled(id)}
		tabindex={-1}
		aria-hidden="true"
	/>
</span>
