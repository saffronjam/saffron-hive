<script lang="ts">
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { operatorOptions } from "./automation-node-options";

	export interface OperatorConfig {
		operator: string;
	}

	export interface OperatorEditorData {
		config: OperatorConfig;
		readOnly: boolean;
		onConfigChange?: (config: OperatorConfig) => void;
	}

	let { data }: { data: OperatorEditorData } = $props();

	const operators = $derived(operatorOptions());
	const selectedLabel = $derived(
		operators.find((operator) => operator.value === data.config.operator)?.label ??
			m.common_select({}, locale.messageOptions()),
	);

	function handleOperatorChange(value: string | undefined) {
		if (!value || !data.onConfigChange) return;
		data.onConfigChange({ operator: value });
	}
</script>

<Select type="single" value={data.config.operator} disabled={data.readOnly} onValueChange={handleOperatorChange}>
	<SelectTrigger size="sm" class="w-full text-xs">{selectedLabel}</SelectTrigger>
	<SelectContent>
		{#each operators as op (op.value)}
			<SelectItem value={op.value}>{op.label}</SelectItem>
		{/each}
	</SelectContent>
</Select>
