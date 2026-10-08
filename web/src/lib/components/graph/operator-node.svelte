<script lang="ts">
	import { GitMerge } from "@lucide/svelte";
	import CompactNode from "./compact-node.svelte";
	import { operatorLabel } from "./automation-summary";
	import type { OperatorConfig } from "./operator-editor.svelte";
	import type { GraphNodeData } from "./node-data";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	let { data, id }: { data: GraphNodeData<OperatorConfig>; id: string } = $props();
</script>

<CompactNode
	{id}
	kind="operator"
	icon={GitMerge}
	title={m.automation_operator_title({}, locale.messageOptions())}
	summary={operatorLabel(data.config.operator)}
	activated={data.activated}
	active={data.isActive()}
	hasInput
	hasOutput
	onActivate={data.onActivate}
/>
