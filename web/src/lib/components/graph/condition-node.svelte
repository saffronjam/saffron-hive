<script lang="ts">
	import { ShieldCheck } from "@lucide/svelte";
	import CompactNode from "./compact-node.svelte";
	import { summarizeCondition } from "./automation-summary";
	import type { ConditionConfig } from "./condition-expr";
	import type { GraphNodeData } from "./node-data";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	let { data, id }: { data: GraphNodeData<ConditionConfig>; id: string } = $props();

	const summary = $derived(summarizeCondition(data.config, data.lookups()));
</script>

<CompactNode
	{id}
	kind="condition"
	icon={ShieldCheck}
	title={m.automation_node_condition({}, locale.messageOptions())}
	summary={summary.text}
	invalid={summary.invalid}
	activated={data.activated}
	active={data.isActive()}
	align="center"
	hasInput
	hasOutput
	onActivate={data.onActivate}
/>
