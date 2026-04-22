<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import { Check, Minus } from "@lucide/svelte";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		checked = $bindable(false),
		indeterminate = $bindable(false),
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	bind:checked
	bind:indeterminate
	data-slot="checkbox"
	class={cn(
		"peer border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:border-primary dark:data-[state=checked]:bg-accent dark:data-[state=checked]:text-accent-foreground dark:data-[state=checked]:border-accent dark:data-[state=indeterminate]:bg-accent dark:data-[state=indeterminate]:text-accent-foreground dark:data-[state=indeterminate]:border-accent dark:bg-input/30 shrink-0 size-4 rounded-sm border shadow-xs outline-none transition-shadow focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 inline-flex items-center justify-center",
		className
	)}
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div class="flex items-center justify-center text-current transition-none">
			{#if indeterminate}
				<Minus class="size-3.5" />
			{:else if checked}
				<Check class="size-3.5" />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
