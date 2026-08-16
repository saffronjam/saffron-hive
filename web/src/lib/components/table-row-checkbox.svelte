<script lang="ts">
	import { Check } from "@lucide/svelte";
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
	class="inline-flex select-none align-middle"
>
	<!-- Purely decorative (the outer span carries role, state and events), so
	     this is the shadcn checkbox's exact classes on plain markup instead of
	     the bits-ui primitive — one of these mounts per table row. -->
	<span
		aria-hidden="true"
		data-slot="checkbox"
		data-state={selection.isSelected(id) ? "checked" : "unchecked"}
		class="peer border-input dark:bg-input/30 inline-flex size-4 shrink-0 items-center justify-center rounded-sm border shadow-xs outline-none transition-shadow data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:border-accent dark:data-[state=checked]:bg-accent dark:data-[state=checked]:text-accent-foreground {selection.isDisabled(
			id,
		)
			? 'pointer-events-none opacity-50'
			: ''}"
	>
		{#if selection.isSelected(id)}
			<span class="flex items-center justify-center text-current transition-none">
				<Check class="size-3.5" />
			</span>
		{/if}
	</span>
</span>
