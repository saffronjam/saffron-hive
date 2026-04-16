<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Workflow, Zap, GitMerge, Play } from "@lucide/svelte";

	interface AutomationNode {
		id: string;
		type: string;
		config: string;
	}

	interface AutomationEdge {
		id: string;
		fromNodeId: string;
		toNodeId: string;
	}

	interface AutomationData {
		id: string;
		name: string;
		enabled: boolean;
		cooldownSeconds: number;
		nodes: AutomationNode[];
		edges: AutomationEdge[];
	}

	interface Props {
		automation: AutomationData;
		ontoggle: (id: string, enabled: boolean) => void;
		onclick: (id: string) => void;
	}

	let { automation, ontoggle, onclick }: Props = $props();

	const triggerCount = $derived(automation.nodes.filter((n) => n.type === "trigger").length);
	const operatorCount = $derived(automation.nodes.filter((n) => n.type === "operator").length);
	const actionCount = $derived(automation.nodes.filter((n) => n.type === "action").length);

	function handleToggleClick(e: Event) {
		e.stopPropagation();
	}
</script>

<button
	type="button"
	class="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50"
	onclick={() => onclick(automation.id)}
>
	<div class="flex items-start justify-between">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
				<Workflow class="size-5 text-muted-foreground" />
			</div>
			<div class="min-w-0">
				<h3 class="truncate font-medium text-card-foreground">{automation.name}</h3>
				<p class="text-xs text-muted-foreground">
					{automation.nodes.length} node{automation.nodes.length === 1 ? "" : "s"}
					&middot;
					{automation.cooldownSeconds}s cooldown
				</p>
			</div>
		</div>

		<div onclick={handleToggleClick} onkeydown={handleToggleClick} role="presentation">
			<Switch
				checked={automation.enabled}
				onCheckedChange={(checked) => ontoggle(automation.id, checked)}
				size="sm"
			/>
		</div>
	</div>

	<div class="mt-3 flex gap-2">
		{#if triggerCount > 0}
			<Badge variant="secondary" class="gap-1 text-xs">
				<Zap class="size-3 text-blue-500" />
				{triggerCount} trigger{triggerCount === 1 ? "" : "s"}
			</Badge>
		{/if}
		{#if operatorCount > 0}
			<Badge variant="secondary" class="gap-1 text-xs">
				<GitMerge class="size-3 text-yellow-500" />
				{operatorCount} operator{operatorCount === 1 ? "" : "s"}
			</Badge>
		{/if}
		{#if actionCount > 0}
			<Badge variant="secondary" class="gap-1 text-xs">
				<Play class="size-3 text-green-500" />
				{actionCount} action{actionCount === 1 ? "" : "s"}
			</Badge>
		{/if}
	</div>
</button>
