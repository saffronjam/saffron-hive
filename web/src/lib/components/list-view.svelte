<script lang="ts">
	import type { Snippet } from "svelte";
	import type { ListView } from "$lib/stores/profile.svelte";

	interface Props {
		mode: ListView;
		card: Snippet;
		table: Snippet;
	}

	let { mode, card, table }: Props = $props();
</script>

{#key mode}
	<div class="list-view-fade">
		{#if mode === "card"}
			{@render card()}
		{:else}
			{@render table()}
		{/if}
	</div>
{/key}

<style>
	.list-view-fade {
		animation: list-view-fade-in 220ms ease-out both;
	}

	@keyframes list-view-fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
