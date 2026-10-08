<script lang="ts">
	import { Zap } from "@lucide/svelte";
	import CompactNode from "./compact-node.svelte";
	import { summarizeTrigger } from "./automation-summary";
	import type { TriggerConfig } from "./trigger-expr";
	import type { GraphNodeData } from "./node-data";
	import { formatShortDuration } from "$lib/i18n/format";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	let { data, id }: { data: GraphNodeData<TriggerConfig>; id: string } = $props();

	const summary = $derived(summarizeTrigger(data.config, data.lookups()));

	let clock = $state(Date.now());
	const pendingMs = $derived(
		data.pendingUntil ? new Date(data.pendingUntil).getTime() - clock : null,
	);
	$effect(() => {
		if (!data.pendingUntil) return;
		clock = Date.now();
		const interval = setInterval(() => (clock = Date.now()), 250);
		return () => clearInterval(interval);
	});

	/** Countdown text: "42 s" under a minute, "1:42" above it. */
	function formatCountdown(ms: number): string {
		const total = Math.ceil(ms / 1000);
		if (total < 60) return formatShortDuration(total, "second", locale.currentLanguage);
		const hours = Math.floor(total / 3600);
		const minutes = Math.floor((total % 3600) / 60);
		const seconds = String(total % 60).padStart(2, "0");
		return hours > 0
			? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
			: `${minutes}:${seconds}`;
	}
</script>

<CompactNode
	{id}
	kind="trigger"
	icon={Zap}
	title={m.automation_node_trigger({}, locale.messageOptions())}
	summary={summary.text}
	invalid={summary.invalid}
	activated={data.activated}
	active={data.isActive()}
	align="right"
	hasInput={false}
	hasOutput
	onActivate={data.onActivate}
>
	{#snippet badge()}
		{#if pendingMs !== null && pendingMs > 0}
			<span class="flex items-center gap-1 text-[10px] font-medium text-automation-trigger tabular-nums">
				<span class="size-1.5 animate-pulse rounded-full bg-automation-trigger"></span>
				{m.automation_node_hold_pending({ duration: formatCountdown(pendingMs) }, locale.messageOptions())}
			</span>
		{/if}
	{/snippet}
</CompactNode>
