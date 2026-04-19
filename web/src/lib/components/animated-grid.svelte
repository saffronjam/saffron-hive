<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", children }: Props = $props();
</script>

<div class="animated-grid {className}">
	{@render children()}
</div>

<style>
	:global(.animated-grid > *) {
		animation: grid-item-in 300ms ease-out both;
	}

	:global(.animated-grid > *:nth-child(1)) { animation-delay: 0ms; }
	:global(.animated-grid > *:nth-child(2)) { animation-delay: 40ms; }
	:global(.animated-grid > *:nth-child(3)) { animation-delay: 80ms; }
	:global(.animated-grid > *:nth-child(4)) { animation-delay: 120ms; }
	:global(.animated-grid > *:nth-child(5)) { animation-delay: 160ms; }
	:global(.animated-grid > *:nth-child(6)) { animation-delay: 200ms; }
	:global(.animated-grid > *:nth-child(7)) { animation-delay: 240ms; }
	:global(.animated-grid > *:nth-child(8)) { animation-delay: 280ms; }
	:global(.animated-grid > *:nth-child(9)) { animation-delay: 320ms; }
	:global(.animated-grid > *:nth-child(10)) { animation-delay: 360ms; }
	:global(.animated-grid > *:nth-child(11)) { animation-delay: 400ms; }
	:global(.animated-grid > *:nth-child(12)) { animation-delay: 440ms; }
	:global(.animated-grid > *:nth-child(n+13)) { animation-delay: 480ms; }

	@keyframes grid-item-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
