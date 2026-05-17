<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = "grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3", children }: Props = $props();
</script>

<div class="animated-grid {className}">
	{@render children()}
</div>

<style>
	:global(.animated-grid > *) {
		animation: grid-item-in 200ms ease-out both;
	}

	@keyframes grid-item-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
