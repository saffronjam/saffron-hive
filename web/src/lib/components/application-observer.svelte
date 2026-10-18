<script lang="ts">
	import { announceExternalChanges } from "$lib/external-changes";
	import { getContextClient, subscriptionStore } from "@urql/svelte";
	import { APPLICATION_CHANGED } from "$lib/assistant";
	let { onchange }: { onchange: () => void } = $props();
	const changes = subscriptionStore({ client: getContextClient(), query: APPLICATION_CHANGED });
	let revision: number | undefined;
	$effect(() => {
		const next = $changes.data?.applicationChanged;
		if (next === undefined || next === revision) return;
		const previous = revision;
		revision = next;
		if (previous !== undefined) {
			onchange();
			announceExternalChanges();
		}
	});
</script>
