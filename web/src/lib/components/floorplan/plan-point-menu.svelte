<script lang="ts">
	import type { Snippet } from "svelte";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";

	interface Props {
		open: boolean;
		/** Where on screen the menu opens, in client pixels. */
		at: { x: number; y: number } | null;
		/** Fired when the menu closes, so the caller can drop what it was about. */
		/**
		 * Fired when the menu closes, so the caller can drop what it was about.
		 * A caller whose menu text is derived from that state leaves it in place
		 * instead — the content has to hold still while the menu fades out.
		 */
		onclose?: () => void;
		children: Snippet;
	}

	let { open = $bindable(), at, onclose, children }: Props = $props();
</script>

<!--
	A menu for a point on the plan rather than for a control. The trigger is an
	invisible, unfocusable anchor moved to the click, which is what lets the
	shadcn menu open in place.

-->
<DropdownMenu
	bind:open
	onOpenChange={(next) => {
		if (!next) onclose?.();
	}}
>
	<DropdownMenuTrigger
		class="pointer-events-none fixed size-0 opacity-0"
		style="left: {at?.x ?? 0}px; top: {at?.y ?? 0}px;"
		aria-hidden="true"
		tabindex={-1}
	></DropdownMenuTrigger>
	<DropdownMenuContent align="start" class="min-w-[12rem]">
		{@render children()}
	</DropdownMenuContent>
</DropdownMenu>
