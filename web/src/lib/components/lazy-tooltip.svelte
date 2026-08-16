<script lang="ts">
	import type { Snippet } from "svelte";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip/index.js";

	type TriggerProps = Record<string, unknown>;

	interface Props {
		/** Tooltip text. */
		content: string;
		side?: "top" | "right" | "bottom" | "left";
		/**
		 * The thing being hovered. Receives props to spread onto its root
		 * element — the dormant hover listeners before the tooltip exists, and
		 * bits-ui's own trigger props afterwards.
		 */
		children: Snippet<[TriggerProps]>;
	}

	let { content, side, children }: Props = $props();

	// A closed bits-ui Tooltip is not free: its content is portalled, and the
	// portal calls Svelte's `mount()` as soon as it is created rather than when
	// the tooltip opens. That is ~11 components and a fresh component root on
	// `document.body` per tooltip — trivial once, but a list row carries several
	// and a table carries dozens of rows.
	//
	// So the stack is built on first hover or focus instead. Arming must NOT
	// force the tooltip open: bits-ui closes on the pointer-leave of an enter it
	// tracked itself, so a tooltip opened from the outside never closes. The
	// mounted trigger picks the hover up from the very next pointer movement,
	// which every real hover produces.
	let armed = $state(false);

	function arm() {
		armed = true;
	}

	const dormantProps: TriggerProps = {
		onpointerenter: arm,
		onfocusin: arm,
	};
</script>

{#if armed}
	<Tooltip>
		<TooltipTrigger>
			{#snippet child({ props })}
				{@render children(props)}
			{/snippet}
		</TooltipTrigger>
		<TooltipContent {side}>{content}</TooltipContent>
	</Tooltip>
{:else}
	{@render children(dormantProps)}
{/if}
