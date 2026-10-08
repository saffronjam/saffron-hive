<script lang="ts" module>
	export type CompactNodeKind = "trigger" | "condition" | "operator" | "action";
</script>

<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import type { Component, Snippet } from "svelte";

	interface Props {
		id: string;
		kind: CompactNodeKind;
		icon: Component;
		title: string;
		summary: string;
		invalid?: boolean;
		activated?: boolean;
		active?: boolean;
		/** Which side the summary text leans toward: the handle it describes. */
		align?: "left" | "center" | "right";
		hasInput: boolean;
		hasOutput: boolean;
		badge?: Snippet;
		onActivate?: (id: string) => void;
	}

	let {
		id,
		kind,
		icon: Icon,
		title,
		summary,
		invalid = false,
		activated = false,
		active = false,
		align = "left",
		hasInput,
		hasOutput,
		badge,
		onActivate,
	}: Props = $props();

	const KIND_CLASSES: Record<CompactNodeKind, { border: string; glow: string; text: string; handle: string; tint: string }> = {
		trigger: {
			border: "border-automation-trigger/40",
			glow: "border-automation-trigger shadow-automation-trigger/50 shadow-lg",
			text: "text-automation-trigger",
			handle: "!bg-automation-trigger !border-automation-trigger",
			tint: "bg-automation-trigger/10",
		},
		condition: {
			border: "border-automation-condition/40",
			glow: "border-automation-condition shadow-automation-condition/50 shadow-lg",
			text: "text-automation-condition",
			handle: "!bg-automation-condition !border-automation-condition",
			tint: "bg-automation-condition/10",
		},
		operator: {
			border: "border-automation-operator/40",
			glow: "border-automation-operator shadow-automation-operator/50 shadow-lg",
			text: "text-automation-operator",
			handle: "!bg-automation-operator !border-automation-operator",
			tint: "bg-automation-operator/10",
		},
		action: {
			border: "border-automation-action/40",
			glow: "border-automation-action shadow-automation-action/50 shadow-lg",
			text: "text-automation-action",
			handle: "!bg-automation-action !border-automation-action",
			tint: "bg-automation-action/10",
		},
	};

	const classes = $derived(KIND_CLASSES[kind]);
	const isOperator = $derived(kind === "operator");
	const borderClass = $derived(
		invalid ? "border-destructive" : activated ? classes.glow : classes.border,
	);
	const alignClass = $derived(
		align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
	);
	const handleClass =
		"!w-3 !h-3 before:absolute before:inset-[-8px] before:content-['']";
	/**
	 * Handles sit level with the summary line, which is centered in the body
	 * below the fixed 24px header, so they shift half a header below center.
	 */
	const handleStyle = $derived(isOperator ? undefined : "top: calc(50% + 12px)");
</script>

<div
	class="rounded-lg border-2 bg-card shadow-md transition-[border-color,box-shadow] duration-200 {borderClass} {active
		? 'outline-2 outline-offset-2 outline-primary'
		: ''} {isOperator ? 'h-10 w-28' : 'h-[72px] w-60'}"
	data-nodeid={id}
	role="button"
	tabindex="-1"
	ondblclick={() => onActivate?.(id)}
>
	{#if hasInput}
		<Handle type="target" position={Position.Left} class="{classes.handle} {handleClass}" style={handleStyle} />
	{/if}

	{#if isOperator}
		<div class="flex h-full items-center justify-center gap-1.5 rounded-md px-2 {classes.tint}">
			<Icon class="size-3.5 shrink-0 {classes.text}" />
			<span class="truncate text-xs font-semibold {invalid ? 'text-destructive' : classes.text}" title={summary}>
				{summary}
			</span>
		</div>
	{:else}
		<div class="flex h-full flex-col">
			<div class="flex h-6 shrink-0 items-center gap-1.5 rounded-t-md px-3 {classes.tint}">
				<Icon class="size-3.5 shrink-0 {classes.text}" />
				<span class="truncate text-xs font-medium {classes.text}">{title}</span>
				{#if badge}
					<span class="ml-auto shrink-0">{@render badge()}</span>
				{/if}
			</div>
			<div class="flex min-h-0 flex-1 items-center px-3">
				<p
					class="line-clamp-2 w-full text-xs leading-snug {alignClass} {invalid
						? 'text-destructive'
						: 'text-foreground'}"
					title={summary}
				>
					{summary}
				</p>
			</div>
		</div>
	{/if}

	{#if hasOutput}
		<Handle type="source" position={Position.Right} class="{classes.handle} {handleClass}" style={handleStyle} />
	{/if}
</div>
