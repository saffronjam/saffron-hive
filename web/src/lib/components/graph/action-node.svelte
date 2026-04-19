<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { Play } from "@lucide/svelte";

	interface ActionConfig {
		actionType: string;
		targetType: string;
		targetId: string;
		targetName: string;
		payload: string;
	}

	interface ActionNodeData extends Record<string, unknown> {
		config: ActionConfig;
		editable: boolean;
		activated: boolean;
		onConfigChange?: (config: ActionConfig) => void;
		onPickTarget?: () => void;
	}

	interface Props {
		data: ActionNodeData;
		id: string;
		selected?: boolean;
	}

	let { data, id, selected = false }: Props = $props();

	const actionTypes = [
		{ value: "set_device_state", label: "Set Device State" },
		{ value: "activate_scene", label: "Activate Scene" },
	];

	function handleActionTypeChange(value: string | undefined) {
		if (!value || !data.onConfigChange) return;
		data.onConfigChange({ ...data.config, actionType: value });
	}

	function handlePayloadChange(e: Event) {
		if (!data.onConfigChange) return;
		const target = e.target as HTMLTextAreaElement;
		data.onConfigChange({ ...data.config, payload: target.value });
	}

	const selectedLabel = $derived(
		actionTypes.find((t) => t.value === data.config.actionType)?.label ?? "Select action"
	);

	const targetDisplay = $derived(
		data.config.targetName || (data.config.targetId ? `${data.config.targetType}:${data.config.targetId}` : "No target")
	);
</script>

<div
	class="w-64 rounded-lg border-2 bg-card shadow-md transition-all {data.activated
		? 'border-green-400 shadow-green-400/50 shadow-lg'
		: selected
			? 'border-green-400 ring-2 ring-green-400/30'
			: 'border-green-500/40'}"
	data-nodeid={id}
>
	<div class="flex items-center gap-2 rounded-t-md bg-green-500/15 px-3 py-2">
		<Play class="size-4 text-green-600 dark:text-green-400" />
		<span class="text-sm font-medium text-green-600 dark:text-green-400">Action</span>
	</div>

	<div class="space-y-2 p-3">
		{#if data.editable}
			<Select
				type="single"
				value={data.config.actionType}
				onValueChange={handleActionTypeChange}
			>
				<SelectTrigger class="w-full text-xs">
					{selectedLabel}
				</SelectTrigger>
				<SelectContent>
					{#each actionTypes as actionType (actionType.value)}
						<SelectItem value={actionType.value}>{actionType.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>

			<button
				type="button"
				class="w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-left text-xs shadow-xs transition-colors hover:bg-muted"
				onclick={() => data.onPickTarget?.()}
			>
				{targetDisplay}
			</button>

			{#if data.config.actionType !== "activate_scene"}
				<Textarea
					value={data.config.payload}
					oninput={handlePayloadChange}
					placeholder={'{"on": true, "brightness": 254}'}
					class="min-h-[60px] text-xs font-mono"
					rows={2}
				/>
			{/if}
		{:else}
			<p class="text-xs text-foreground">{selectedLabel}</p>
			<p class="truncate text-xs text-muted-foreground">{targetDisplay}</p>
			{#if data.config.actionType !== "activate_scene" && data.config.payload}
				<p class="truncate text-xs font-mono text-muted-foreground">{data.config.payload}</p>
			{/if}
		{/if}
	</div>

	<Handle type="target" position={Position.Left} class="!bg-green-500 !border-green-300 !w-3 !h-3 before:absolute before:inset-[-8px] before:content-['']" />
</div>
