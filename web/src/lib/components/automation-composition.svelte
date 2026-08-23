<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { automationNodeCounts, type AutomationNodeLike } from "$lib/list-helpers";
	import { GitMerge, Play, Zap } from "@lucide/svelte";

	interface Props {
		nodes: AutomationNodeLike[];
	}

	let { nodes }: Props = $props();
	const counts = $derived(automationNodeCounts(nodes));
</script>

{#if counts.trigger === 0 && counts.operator === 0 && counts.action === 0}
	<span class="text-muted-foreground">—</span>
{:else}
	<div class="flex flex-wrap gap-1">
		{#if counts.trigger > 0}
			<Badge variant="secondary" class="gap-1 text-xs">
				<Zap class="size-3 text-automation-trigger" />
				{counts.trigger}
			</Badge>
		{/if}
		{#if counts.operator > 0}
			<Badge variant="secondary" class="gap-1 text-xs">
				<GitMerge class="size-3 text-automation-operator" />
				{counts.operator}
			</Badge>
		{/if}
		{#if counts.action > 0}
			<Badge variant="secondary" class="gap-1 text-xs">
				<Play class="size-3 text-automation-action" />
				{counts.action}
			</Badge>
		{/if}
	</div>
{/if}
