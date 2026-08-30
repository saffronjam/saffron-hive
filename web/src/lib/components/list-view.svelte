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
