<script lang="ts">
	import type { Snippet } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import { CircleCheck, CircleX, Loader2, Unplug } from "@lucide/svelte";
	import { connectionResultMessage, type ConnectionResult } from "$lib/i18n/connection";
	let {
		label,
		testing,
		disabled = false,
		result,
		ontest,
		children,
	}: {
		label: string;
		testing: boolean;
		disabled?: boolean;
		result: ConnectionResult | null;
		ontest: () => void;
		children?: Snippet;
	} = $props();
</script>

<div class="flex flex-wrap items-center gap-3 pt-2">
	<Button variant="outline" size="sm" onclick={ontest} disabled={disabled || testing}>
		{#if testing}<Loader2 class="size-4 animate-spin" />{:else}<Unplug class="size-4" />{/if}
		{label}
	</Button>
	{@render children?.()}
	{#if result}
		{#if result.success}
			<div
				class="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400"
				role="status"
			>
				<CircleCheck class="size-5" /><span>{connectionResultMessage(result)}</span>
			</div>
		{:else}
			<div class="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400" role="status">
				<CircleX class="size-5 shrink-0" /><span>{connectionResultMessage(result)}</span>
			</div>
		{/if}
	{/if}
</div>
