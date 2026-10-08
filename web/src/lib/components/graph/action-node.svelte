<script lang="ts">
	import { Play } from "@lucide/svelte";
	import CompactNode from "./compact-node.svelte";
	import { summarizeAction } from "./automation-summary";
	import type { NormalizedActionConfig } from "./trigger-expr";
	import type { GraphNodeData } from "./node-data";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	let { data, id }: { data: GraphNodeData<NormalizedActionConfig>; id: string } = $props();

	const summary = $derived(
		summarizeAction(data.config, data.lookups(), {
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
	summary={summary.text}
	invalid={summary.invalid}
	activated={data.activated}
	active={data.isActive()}
	align="left"
	hasInput
	hasOutput={false}
	onActivate={data.onActivate}
/>
