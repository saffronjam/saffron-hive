<script lang="ts">
	import type { Snippet } from "svelte";
	import { scale } from "svelte/transition";
	import { cubicOut } from "svelte/easing";
	import DynamicIcon from "./dynamic-icon.svelte";

	interface Props {
		icon: string | null | undefined;
		class?: string;
		fallback?: Snippet;
	}

	let { icon, class: className, fallback }: Props = $props();
</script>

{#key icon}
	<div
		class="flex items-center justify-center"
		in:scale={{ duration: 180, start: 0.7, easing: cubicOut }}
	>
		<DynamicIcon {icon} class={className} {fallback} />
	</div>
{/key}
