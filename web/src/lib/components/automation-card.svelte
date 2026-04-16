<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import { Workflow, Zap, GitMerge, Play, Pencil, Trash2 } from "@lucide/svelte";

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
		onedit: (id: string) => void;
		ondelete: (id: string) => void;
		onrename: (id: string, newName: string) => void;
	}

	let { automation, ontoggle, onedit, ondelete, onrename }: Props = $props();

	const triggerCount = $derived(automation.nodes.filter((n) => n.type === "trigger").length);
	const operatorCount = $derived(automation.nodes.filter((n) => n.type === "operator").length);
	const actionCount = $derived(automation.nodes.filter((n) => n.type === "action").length);
</script>

<div class="rounded-lg shadow-card bg-card p-4">
	<div class="flex items-center justify-between">
		<div class="flex flex-1 items-center gap-3">
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
				<Workflow class="size-5 text-muted-foreground" />
			</div>
			<div class="min-w-0">
				<InlineEditName name={automation.name} onsave={(newName) => onrename(automation.id, newName)} />
				<p class="text-xs text-muted-foreground">
					{automation.nodes.length} node{automation.nodes.length === 1 ? "" : "s"}
					&middot;
					{automation.cooldownSeconds}s cooldown
				</p>
			</div>
		</div>

		<div class="flex items-center gap-1">
			<Switch
				checked={automation.enabled}
				onCheckedChange={(checked) => ontoggle(automation.id, checked)}
			/>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => onedit(automation.id)}
				aria-label="Edit automation"
			>
				<Pencil class="size-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				class="text-destructive hover:text-destructive"
				onclick={() => ondelete(automation.id)}
				aria-label="Delete automation"
			>
				<Trash2 class="size-4" />
			</Button>
		</div>
	</div>

	{#if triggerCount > 0 || operatorCount > 0 || actionCount > 0}
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
	{/if}
</div>
