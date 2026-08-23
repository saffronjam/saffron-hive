<script lang="ts">
	import Check from "@lucide/svelte/icons/check";
	import HiveSelectAutocomplete from "$lib/components/hive-select-autocomplete.svelte";
	import type { AutomationNodeOption } from "./automation-node-options";
	import { cn } from "$lib/utils";

	interface Props {
		value: string;
		placeholder: string;
		options: readonly AutomationNodeOption[];
		disabled?: boolean;
		invalid?: boolean;
		onchange: (value: string | undefined) => void;
	}

	let { value, placeholder, options, disabled = false, invalid = false, onchange }: Props = $props();
	const items = $derived([...options]);
</script>

<HiveSelectAutocomplete
	{items}
	{value}
	getValue={(option) => option.value}
	getLabel={(option) => option.label}
	{placeholder}
	size="sm"
	{disabled}
	separatedItems
	popoverContentClass="w-[22rem]"
	class={cn("text-xs", invalid && "border-destructive ring-2 ring-destructive/40")}
	{onchange}
>
	{#snippet item(option: AutomationNodeOption)}
		<span class="relative grid min-w-0 gap-0.5 pr-7">
			<span class="text-sm text-foreground">{option.label}</span>
			<span class="text-xs font-normal text-muted-foreground">{option.description}</span>
			{#if option.value === value}
				<Check class="absolute right-0 top-1/2 size-4 -translate-y-1/2" />
			{/if}
		</span>
	{/snippet}
</HiveSelectAutocomplete>
