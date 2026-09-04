<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { GitMerge } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface OperatorConfig {
		operator: string;
	}

	interface OperatorNodeData extends Record<string, unknown> {
		config: OperatorConfig;
		readOnly: boolean;
		activated: boolean;
		onConfigChange?: (config: OperatorConfig) => void;
	}

	interface Props {
		data: OperatorNodeData;
		id: string;
	}

	let { data, id }: Props = $props();

	const messageOptions = $derived(locale.messageOptions());
	const operators = $derived.by(() => [
		{ value: "AND", label: m.automation_operator_and({}, messageOptions) },
		{ value: "OR", label: m.automation_operator_or({}, messageOptions) },
		{ value: "NOT", label: m.automation_operator_not({}, messageOptions) },
	]);
	const selectedOperatorLabel = $derived(
		operators.find((operator) => operator.value === data.config.operator)?.label ??
			m.common_select({}, messageOptions),
	);

	function handleOperatorChange(value: string | undefined) {
		if (!value || !data.onConfigChange) return;
		data.onConfigChange({ operator: value });
	}
</script>

<div
	class="w-44 rounded-lg border-2 bg-card shadow-md transition-all {data.activated
		? 'border-automation-operator shadow-automation-operator/50 shadow-lg'
		: 'border-automation-operator/40'}"
	data-nodeid={id}
>
	<div class="flex items-center gap-2 rounded-t-md bg-automation-operator/15 px-3 py-2">
		<GitMerge class="size-4 text-automation-operator" />
		<span class="text-sm font-medium text-automation-operator">{m.automation_operator_title({}, messageOptions)}</span>
	</div>

	<fieldset disabled={data.readOnly} class="min-w-0 border-0 p-3 nodrag">
			<Select
				type="single"
				value={data.config.operator}
				disabled={data.readOnly}
				onValueChange={handleOperatorChange}
			>
				<SelectTrigger size="sm" class="w-full text-xs">
					{selectedOperatorLabel}
				</SelectTrigger>
				<SelectContent>
					{#each operators as op (op.value)}
						<SelectItem value={op.value}>{op.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>
	</fieldset>

	<Handle type="target" position={Position.Left} class="!bg-automation-operator !border-automation-operator !w-3 !h-3 before:absolute before:inset-[-8px] before:content-['']" />
	<Handle type="source" position={Position.Right} class="!bg-automation-operator !border-automation-operator !w-3 !h-3 before:absolute before:inset-[-8px] before:content-['']" />
</div>
