<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Zap } from "@lucide/svelte";

	interface TriggerConfig {
		eventType: string;
		deviceFilter: string;
		condition: string;
	}

	interface TriggerNodeData extends Record<string, unknown> {
		config: TriggerConfig;
		editable: boolean;
		activated: boolean;
		onConfigChange?: (config: TriggerConfig) => void;
	}

	interface Props {
		data: TriggerNodeData;
		id: string;
	}

	let { data, id }: Props = $props();

	const eventTypes = [
		{ value: "device.state_changed", label: "State Changed" },
		{ value: "device.availability_changed", label: "Availability Changed" },
		{ value: "device.added", label: "Device Added" },
		{ value: "device.removed", label: "Device Removed" },
	];

	function handleEventTypeChange(value: string | undefined) {
		if (!value || !data.onConfigChange) return;
		data.onConfigChange({ ...data.config, eventType: value });
	}

	function handleDeviceFilterChange(e: Event) {
		if (!data.onConfigChange) return;
		const target = e.target as HTMLInputElement;
		data.onConfigChange({ ...data.config, deviceFilter: target.value });
	}

	function handleConditionChange(e: Event) {
		if (!data.onConfigChange) return;
		const target = e.target as HTMLInputElement;
		data.onConfigChange({ ...data.config, condition: target.value });
	}

	const selectedLabel = $derived(
		eventTypes.find((t) => t.value === data.config.eventType)?.label ?? "Select event"
	);
</script>

<div
	class="w-64 rounded-lg border-2 bg-card shadow-md transition-shadow {data.activated
		? 'border-blue-400 shadow-blue-400/50 shadow-lg'
		: 'border-blue-500/40'}"
	data-nodeid={id}
>
	<div class="flex items-center gap-2 rounded-t-md bg-blue-500/15 px-3 py-2">
		<Zap class="size-4 text-blue-500" />
		<span class="text-sm font-medium text-blue-600 dark:text-blue-400">Trigger</span>
	</div>

	<div class="space-y-2 p-3">
		{#if data.editable}
			<Select
				type="single"
				value={data.config.eventType}
				onValueChange={handleEventTypeChange}
			>
				<SelectTrigger class="w-full text-xs">
					{selectedLabel}
				</SelectTrigger>
				<SelectContent>
					{#each eventTypes as eventType (eventType.value)}
						<SelectItem value={eventType.value}>{eventType.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>

			<Input
				value={data.config.deviceFilter}
				oninput={handleDeviceFilterChange}
				placeholder="Device filter (optional)"
				class="text-xs"
			/>

			<Input
				value={data.config.condition}
				oninput={handleConditionChange}
				placeholder="Condition expression (optional)"
				class="text-xs"
			/>
		{:else}
			<p class="text-xs text-foreground">{selectedLabel}</p>
			{#if data.config.deviceFilter}
				<p class="truncate text-xs text-muted-foreground">
					Filter: {data.config.deviceFilter}
				</p>
			{/if}
			{#if data.config.condition}
				<p class="truncate text-xs text-muted-foreground">
					If: {data.config.condition}
				</p>
			{/if}
		{/if}
	</div>

	<Handle type="source" position={Position.Right} class="!bg-blue-500 !border-blue-300 !w-3 !h-3" />
</div>
