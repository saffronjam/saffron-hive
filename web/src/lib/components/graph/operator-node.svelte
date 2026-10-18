<script lang="ts">
	import { GitMerge } from "@lucide/svelte";
	import CompactNode from "./compact-node.svelte";
	import { operatorLabel } from "./automation-summary";
	import type { OperatorConfig } from "./operator-editor.svelte";
	import { getGraphEditorContext, type GraphNodeData } from "./node-data";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	let { data, id }: { data: GraphNodeData<OperatorConfig>; id: string } = $props();
	const editor = getGraphEditorContext();
	const connectionError = $derived(editor.connectionError(id));
</script>

<CompactNode
	{id}
	kind="operator"
	icon={GitMerge}
	title={m.automation_operator_title({}, locale.messageOptions())}
	summary={connectionError ?? operatorLabel(data.config.operator)}
	invalid={!!connectionError}
	activated={data.activated}
	active={editor.isActive(id)}
	hasInput
	hasOutput
	onActivate={editor.activate}
/>
