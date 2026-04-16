<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { GitMerge } from "@lucide/svelte";

	interface OperatorConfig {
		operator: string;
	}

	interface OperatorNodeData extends Record<string, unknown> {
		config: OperatorConfig;
		editable: boolean;
		activated: boolean;
		onConfigChange?: (config: OperatorConfig) => void;
	}

	interface Props {
		data: OperatorNodeData;
		id: string;
		selected?: boolean;
	}

	let { data, id, selected = false }: Props = $props();

	const operators = [
		{ value: "AND", label: "AND" },
		{ value: "OR", label: "OR" },
		{ value: "NOT", label: "NOT" },
	];

	function handleOperatorChange(value: string | undefined) {
		if (!value || !data.onConfigChange) return;
		data.onConfigChange({ operator: value });
	}
</script>

<div
	class="w-44 rounded-lg border-2 bg-card shadow-md transition-all {data.activated
		? 'border-yellow-400 shadow-yellow-400/50 shadow-lg'
		: selected
			? 'border-yellow-400 ring-2 ring-yellow-400/30'
			: 'border-yellow-500/40'}"
	data-nodeid={id}
>
	<div class="flex items-center gap-2 rounded-t-md bg-yellow-500/15 px-3 py-2">
		<GitMerge class="size-4 text-yellow-600 dark:text-yellow-400" />
		<span class="text-sm font-medium text-yellow-600 dark:text-yellow-400">Operator</span>
	</div>

	<div class="p-3">
		{#if data.editable}
			<Select
				type="single"
				value={data.config.operator}
				onValueChange={handleOperatorChange}
			>
				<SelectTrigger class="w-full text-xs">
					{data.config.operator || "Select"}
				</SelectTrigger>
				<SelectContent>
					{#each operators as op (op.value)}
						<SelectItem value={op.value}>{op.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>
		{:else}
			<p class="text-center text-lg font-bold text-yellow-600 dark:text-yellow-400">
				{data.config.operator}
			</p>
		{/if}
	</div>

	<Handle type="target" position={Position.Left} class="!bg-yellow-500 !border-yellow-300 !w-3 !h-3 before:absolute before:inset-[-8px] before:content-['']" />
	<Handle type="source" position={Position.Right} class="!bg-yellow-500 !border-yellow-300 !w-3 !h-3 before:absolute before:inset-[-8px] before:content-['']" />
</div>
