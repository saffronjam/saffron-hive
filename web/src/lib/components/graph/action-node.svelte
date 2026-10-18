<script lang="ts">
	import { Play } from "@lucide/svelte";
	import CompactNode from "./compact-node.svelte";
	import { summarizeAction } from "./automation-summary";
	import type { NormalizedActionConfig } from "./trigger-expr";
	import { getGraphEditorContext, type GraphNodeData } from "./node-data";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	let { data, id }: { data: GraphNodeData<NormalizedActionConfig>; id: string } = $props();
	const editor = getGraphEditorContext();
	const connectionError = $derived(editor.connectionError(id));

	const summary = $derived(
		summarizeAction(data.config, editor.lookups(), {
			runtimeState: data.runtimeState,
			live: data.readOnly,
		}),
	);
</script>

<CompactNode
	{id}
	kind="action"
	icon={Play}
	title={m.automation_node_action({}, locale.messageOptions())}
	summary={connectionError ?? summary.text}
	invalid={!!connectionError || summary.invalid}
	activated={data.activated}
	active={editor.isActive(id)}
	align="left"
	hasInput
	hasOutput={false}
	onActivate={editor.activate}
/>
