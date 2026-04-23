<script lang="ts" generics="Row">
	import {
		Popover,
		PopoverContent,
		PopoverTrigger,
	} from "$lib/components/ui/popover/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import { Settings2 } from "@lucide/svelte";
	import type {
		ColumnDef,
		TableState,
	} from "$lib/utils/table-state.svelte";

	interface Props {
		tableState: TableState<Row>;
		columns: ColumnDef<Row>[];
	}

	let { tableState, columns }: Props = $props();

	let open = $state(false);

	const toggleable = $derived(
		tableState
			.orderedKeys()
			.map((k) => columns.find((c) => c.key === k))
			.filter(
				(c): c is ColumnDef<Row> =>
					c !== undefined && c.label.length > 0 && c.hideable !== false,
			),
	);

	function onRestore() {
		tableState.resetDefaults();
		open = false;
	}
</script>

<Popover bind:open>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon-sm"
				aria-label="Edit columns"
			>
				<Settings2 class="size-4" />
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent class="w-56 p-1 shadow-card" align="end" sideOffset={4}>
		<div
			class="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
		>
			Columns
		</div>
		{#each toggleable as col (col.key)}
			<label
				class="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
			>
				<Checkbox
					checked={tableState.isVisible(col.key)}
					onCheckedChange={() => tableState.toggleHidden(col.key)}
				/>
				<span class="flex-1 truncate">{col.label}</span>
			</label>
		{/each}
		<div class="mt-1 border-t border-border/50 pt-1">
			<Button
				variant="ghost"
				size="sm"
				class="w-full justify-start font-normal text-muted-foreground hover:text-foreground"
				onclick={onRestore}
			>
				Restore defaults
			</Button>
		</div>
	</PopoverContent>
</Popover>
