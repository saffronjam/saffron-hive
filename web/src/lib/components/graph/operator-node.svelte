<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { GitMerge, Trash2 } from "@lucide/svelte";

	interface OperatorConfig {
		operator: string;
	}

	interface OperatorNodeData extends Record<string, unknown> {
		config: OperatorConfig;
		editable: boolean;
		activated: boolean;
		onConfigChange?: (config: OperatorConfig) => void;
		onDelete?: () => void;
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
		? 'border-automation-operator shadow-automation-operator/50 shadow-lg'
		: selected
			? 'border-automation-operator ring-2 ring-automation-operator/30'
			: 'border-automation-operator/40'}"
	data-nodeid={id}
>
	<div class="flex items-center gap-2 rounded-t-md bg-automation-operator/15 px-3 py-2">
		<GitMerge class="size-4 text-automation-operator" />
		<span class="text-sm font-medium text-automation-operator">Operator</span>
		{#if data.editable}
			<Button
				variant="ghost"
				size="icon-sm"
				class="nodrag ml-auto size-6 text-white hover:bg-destructive/15 hover:text-white transition-opacity duration-200 {selected ? 'opacity-100' : 'pointer-events-none opacity-0'}"
				onclick={(e) => {
					e.stopPropagation();
					data.onDelete?.();
				}}
				aria-label="Delete operator node"
			>
				<Trash2 class="size-3.5" />
			</Button>
		{/if}
	</div>

	<div class="p-3 nodrag">
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
			<p class="text-center text-lg font-bold text-automation-operator">
				{data.config.operator}
			</p>
		{/if}
	</div>

	<Handle type="target" position={Position.Left} class="!bg-automation-operator !border-automation-operator !w-3 !h-3 before:absolute before:inset-[-8px] before:content-['']" />
	<Handle type="source" position={Position.Right} class="!bg-automation-operator !border-automation-operator !w-3 !h-3 before:absolute before:inset-[-8px] before:content-['']" />
</div>
