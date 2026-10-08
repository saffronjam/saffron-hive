<script lang="ts">
	import type { Node } from "@xyflow/svelte";
	import { fly } from "svelte/transition";
	import { cubicIn, cubicOut } from "svelte/easing";
	import { GitMerge, Play, ShieldCheck, X, Zap } from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import TriggerEditor from "./trigger-editor.svelte";
	import ConditionEditor from "./condition-editor.svelte";
	import OperatorEditor from "./operator-editor.svelte";
	import ActionEditor from "./action-editor.svelte";
	import type { SummaryLookups } from "./automation-summary";
	import type { GraphNodeData } from "./node-data";
	import type { TriggerConfig } from "./trigger-expr";
	import type { ConditionConfig } from "./condition-expr";
	import type { OperatorConfig } from "./operator-editor.svelte";
	import { actionMacroCall, type NormalizedActionConfig } from "./trigger-expr";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	type AnyConfig = TriggerConfig | ConditionConfig | OperatorConfig | NormalizedActionConfig;

	interface Props {
		node: Node;
		readOnly: boolean;
		lookups: SummaryLookups;
		/** Docked to the bottom of the canvas instead of the right side. */
		docked: boolean;
		onConfigChange: (nodeId: string, config: AnyConfig) => void;
		onClose: () => void;
	}

	let { node, readOnly, lookups, docked, onConfigChange, onClose }: Props = $props();

	const data = $derived(node.data as GraphNodeData<AnyConfig>);
	const messageOptions = $derived(locale.messageOptions());
	const header = $derived.by(() => {
		switch (node.type) {
			case "trigger":
				return { icon: Zap, title: m.automation_node_trigger({}, messageOptions), color: "text-automation-trigger" };
			case "condition":
				return { icon: ShieldCheck, title: m.automation_node_condition({}, messageOptions), color: "text-automation-condition" };
			case "operator":
				return { icon: GitMerge, title: m.automation_operator_title({}, messageOptions), color: "text-automation-operator" };
			default:
				return { icon: Play, title: m.automation_node_action({}, messageOptions), color: "text-automation-action" };
		}
	});
	const HeaderIcon = $derived(header.icon);
	const reducedMotion =
		typeof window === "undefined" ||
		typeof Element.prototype.animate !== "function" ||
		(typeof window.matchMedia === "function" &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches);
	const duration = reducedMotion ? 0 : 200;

	/** A node whose behaviour comes from a definition is edited in the Code view. */
	const usesDefinition = $derived.by(() => {
		if (node.type === "condition") return (data.config as ConditionConfig).mode === "macro";
		if (node.type !== "action") return false;
		const action = data.config as NormalizedActionConfig;
		return actionMacroCall(action) !== null || action.targetType === "macro";
	});

	function change(config: AnyConfig) {
		onConfigChange(node.id, config);
	}
</script>

<div
	class="nokey absolute z-20 flex flex-col overflow-hidden rounded-lg bg-card/95 shadow-card backdrop-blur-sm {docked
		? 'inset-x-2 bottom-2 max-h-[60%]'
		: 'top-16 right-3 max-h-[calc(100%-5rem)] w-96 max-w-[calc(100%-1.5rem)]'}"
	data-node-panel
	in:fly={docked ? { y: 24, duration, easing: cubicOut } : { x: 24, duration, easing: cubicOut }}
	out:fly={docked ? { y: 24, duration: duration * 0.75, easing: cubicIn } : { x: 24, duration: duration * 0.75, easing: cubicIn }}
>
	<div class="flex items-center gap-2 border-b border-border px-4 py-2.5">
		<HeaderIcon class="size-4 shrink-0 {header.color}" />
		<span class="text-sm font-medium {header.color}">{header.title}</span>
		<Button
			variant="ghost"
			size="icon-sm"
			class="ml-auto"
			onclick={onClose}
			aria-label={m.automation_panel_close({}, messageOptions)}
		>
			<X class="size-4" />
		</Button>
	</div>
	<div class="min-h-0 overflow-y-auto p-4">
		{#key node.id}
			{#if usesDefinition}
				<p class="text-xs text-muted-foreground">{m.automation_panel_macro_hint({}, messageOptions)}</p>
			{:else if node.type === "trigger"}
				<TriggerEditor
					id={node.id}
					data={{
						config: data.config as TriggerConfig,
						readOnly,
						devices: lookups.devices,
						rooms: lookups.rooms,
						onConfigChange: change,
					}}
				/>
			{:else if node.type === "condition"}
				<ConditionEditor
					id={node.id}
					data={{
						config: data.config as ConditionConfig,
						readOnly,
						devices: lookups.devices,
						groups: lookups.groups,
						rooms: lookups.rooms,
						onConfigChange: change,
					}}
				/>
			{:else if node.type === "operator"}
				<OperatorEditor data={{ config: data.config as OperatorConfig, readOnly, onConfigChange: change }} />
			{:else}
				<ActionEditor
					id={node.id}
					data={{
						config: data.config as NormalizedActionConfig,
						readOnly,
						devices: lookups.devices,
						groups: lookups.groups,
						rooms: lookups.rooms,
						scenes: lookups.scenes,
						effects: lookups.effects,
						runtimeState: data.runtimeState,
						onConfigChange: change,
					}}
				/>
			{/if}
		{/key}
	</div>
</div>
